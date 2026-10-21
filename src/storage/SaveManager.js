import { GeneratorsData } from '../game/Generators.js';
import { UpgradesData } from '../game/Upgrades.js';
import { AchievementsData } from '../game/Achievements.js';
import { SkillTreeNodes } from '../game/SkillTreeData.js';
import { Prestige } from '../game/Prestige.js';

export class SaveManager {
  static BASE_KEY = 'pacoca_clicker_save';
  static saveKey = this.BASE_KEY;
  static remoteSave = null;
  static remoteReset = null;
  static pendingState = null;
  static syncTimer = null;
  static syncPromise = null;
  static onSyncStatus = null;
  static resetting = false;
  static revision = 0;

  static async configure({ userId, remoteState, remoteRevision = 0, saveRemote, resetRemote, onSyncStatus }) {
    this.saveKey = `${this.BASE_KEY}:${userId}`;
    this.remoteSave = saveRemote;
    this.remoteReset = resetRemote;
    this.onSyncStatus = onSyncStatus;
    this.revision = Number(remoteRevision) || 0;

    const userLocalState = this.read(this.saveKey);
    const legacyState = this.read(this.BASE_KEY);

    const validatedRemote = remoteState ? this.validate(remoteState) : null;
    if (remoteState && !validatedRemote) throw new Error('Progresso da nuvem inválido');
    remoteState = validatedRemote;

    if (remoteState) {
      const localIsNewer = userLocalState
        && Number(userLocalState.lastSaveTime || 0) > Number(remoteState.lastSaveTime || 0);
      const initialState = localIsNewer ? userLocalState : remoteState;
      localStorage.setItem(this.saveKey, JSON.stringify(initialState));
      if (localIsNewer) {
        this.pendingState = initialState;
        await this.flush().catch(() => {});
      }
    } else if (userLocalState || legacyState) {
      const stateToMigrate = userLocalState || legacyState;
      localStorage.setItem(this.saveKey, JSON.stringify(stateToMigrate));
      if (legacyState) localStorage.removeItem(this.BASE_KEY);
      this.pendingState = stateToMigrate;
      await this.flush().catch(() => {});
    }

    window.addEventListener('pagehide', () => this.flush().catch(() => {}));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush().catch(() => {});
    });
  }

  static save(state) {
    if (this.resetting) return false;

    const validated = this.validate(state);
    if (!validated) {
      this.onSyncStatus?.('invalid');
      console.warn('Estado inconsistente: salvamento e envio suspensos.');
      return false;
    }
    const stateWithTimestamp = { ...validated, lastSaveTime: Date.now() };
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.warn('Não foi possível salvar o progresso.', error);
      return false;
    }
    this.pendingState = stateWithTimestamp;
    this.scheduleSync();
    return stateWithTimestamp;
  }

  static load() {
    return this.read(this.saveKey);
  }

  static async reset() {
    this.resetting = true;
    clearTimeout(this.syncTimer);
    this.pendingState = null;

    try {
      await this.syncPromise?.catch(() => {});
      clearTimeout(this.syncTimer);
      this.pendingState = null;
      if (this.remoteReset) await this.remoteReset();
      localStorage.removeItem(this.saveKey);
    } catch (error) {
      this.resetting = false;
      throw error;
    }
  }

  static scheduleSync(delay = 800) {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.flush().catch(() => {}), delay);
  }

  static async flush() {
    clearTimeout(this.syncTimer);
    if (!this.pendingState || !this.remoteSave) return this.syncPromise;
    if (this.syncPromise) return this.syncPromise;

    const state = this.validate(this.pendingState);
    if (!state) {
      this.pendingState = null;
      this.onSyncStatus?.('invalid');
      throw new Error('Progresso inconsistente: envio suspenso');
    }
    this.pendingState = null;
    this.onSyncStatus?.('syncing');

    let failed = false;
    this.syncPromise = this.remoteSave(state, this.revision)
      .then(response => {
        if (!response?.saved && response?.profile?.state) {
          const remoteState = this.validate(response.profile.state);
          if (!remoteState) throw new Error('Progresso da nuvem inválido');
          localStorage.setItem(this.saveKey, JSON.stringify(remoteState));
          this.revision = Number(response.profile.revision) || this.revision;
          this.resetting = true;
          this.pendingState = null;
          this.onSyncStatus?.('conflict');
          setTimeout(() => window.location.reload(), 300);
          return response;
        }
        if (response?.saved !== true) throw new Error('O servidor não confirmou o salvamento');
        this.revision = Number(response?.profile?.revision) || this.revision;
        this.onSyncStatus?.('synced');
        return response;
      })
      .catch(error => {
        failed = true;
        this.pendingState ??= state;
        this.onSyncStatus?.('offline');
        throw error;
      })
      .finally(() => {
        this.syncPromise = null;
        if (this.pendingState) this.scheduleSync(failed ? 15000 : 800);
      });

    return this.syncPromise;
  }

  static read(key) {
    let raw;
    try {
      raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = this.validate(JSON.parse(raw));
      if (!data) throw new Error('Save inválido');
      return data;
    } catch (error) {
      if (raw) {
        try { localStorage.setItem(key + '_backup', raw); } catch { /* Sem espaço. */ }
      }
      console.warn('Não foi possível carregar o progresso.', error);
      return null;
    }
  }

  static validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
    if (!validNumber(data.score)) return null;
    // Envia apenas campos de progresso conhecidos, nunca flags/identidade recebidas no save.
    const result = { score: data.score };
    for (const key of ['totalClicks', 'totalEarned', 'startTime', 'prestigeChips', 'claimedPrestigeChips', 'lastSaveTime']) {
      if (data[key] !== undefined && !validNumber(data[key])) return null;
      if (data[key] !== undefined) result[key] = data[key];
    }
    for (const key of ['totalClicks', 'prestigeChips', 'claimedPrestigeChips']) {
      if (data[key] !== undefined && !Number.isSafeInteger(data[key])) return null;
    }
    if (result.totalEarned === undefined) result.totalEarned = result.score;
    result.inventory = {};
    if (data.inventory !== undefined && (!data.inventory || typeof data.inventory !== 'object' || Array.isArray(data.inventory))) return null;
    if (data.inventory && Object.keys(data.inventory).some(id => !GeneratorsData.some(generator => generator.id === id))) return null;
    for (const generator of GeneratorsData) {
      const count = data.inventory?.[generator.id] ?? 0;
      if (!Number.isSafeInteger(count) || count < 0) return null;
      result.inventory[generator.id] = count;
    }
    for (const [key, definitions] of [
      ['boughtUpgrades', UpgradesData],
      ['unlockedAchievements', AchievementsData],
      ['unlockedSkills', SkillTreeNodes]
    ]) {
      const values = data[key] ?? [];
      if (!Array.isArray(values) || values.some(id => typeof id !== 'string' || !definitions.some(item => item.id === id))) return null;
      if (new Set(values).size !== values.length) return null;
      result[key] = [...new Set(values)];
    }
    if (!result.unlockedSkills.includes('origin')) result.unlockedSkills.unshift('origin');
    // Cada talento deve ter um caminho válido até a origem (pré-requisitos são OR).
    const reachable = new Set(['origin']);
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of SkillTreeNodes) {
        if (result.unlockedSkills.includes(node.id) && !reachable.has(node.id)
          && node.requires.some(id => reachable.has(id))) {
          reachable.add(node.id);
          changed = true;
        }
      }
    }
    if (result.unlockedSkills.some(id => !reachable.has(id))) return null;
    if (result.boughtUpgrades.some(id => {
      const upgrade = UpgradesData.find(item => item.id === id);
      return (result.inventory[upgrade.reqGen] || 0) < upgrade.reqCount;
    })) return null;
    if (data.totalEarned !== undefined && data.score > data.totalEarned + Math.max(1e-9, data.totalEarned * 1e-12)) return null;
    if (data.lastSaveTime > Date.now() + 300000 || data.startTime > Date.now() + 300000) return null;
    if (data.claimedPrestigeChips !== undefined && data.totalEarned !== undefined
      && data.claimedPrestigeChips > Prestige.calculatePrestigeChips(data.totalEarned)) return null;
    if (result.claimedPrestigeChips === undefined) {
      // Saves antigos não distinguem ouro recebido, gasto e bônus dourados.
      // Estima o histórico pelo saldo e talentos, limitado aos marcos alcançados.
      const spent = SkillTreeNodes.reduce((sum, node) => sum + (result.unlockedSkills.includes(node.id) ? node.cost : 0), 0);
      result.claimedPrestigeChips = Math.min(
        Prestige.calculatePrestigeChips(result.totalEarned ?? 0),
        (result.prestigeChips ?? 0) + spent
      );
    }
    return result;
  }
}
