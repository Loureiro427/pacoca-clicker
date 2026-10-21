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
    if (this.resetting) return state;

    const stateWithTimestamp = { ...state, lastSaveTime: Date.now() };
    localStorage.setItem(this.saveKey, JSON.stringify(stateWithTimestamp));
    this.pendingState = stateWithTimestamp;
    this.scheduleSync();
    return stateWithTimestamp;
  }

  static load() {
    return this.read(this.saveKey);
  }

  static async replace(state) {
    this.save(state);
    await this.flush();
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

    const state = this.pendingState;
    this.pendingState = null;
    this.onSyncStatus?.('syncing');

    let failed = false;
    this.syncPromise = this.remoteSave(state, this.revision)
      .then(response => {
        if (!response?.saved && response?.profile?.state) {
          localStorage.setItem(this.saveKey, JSON.stringify(response.profile.state));
          this.revision = Number(response.profile.revision) || this.revision;
          this.resetting = true;
          this.pendingState = null;
          this.onSyncStatus?.('conflict');
          setTimeout(() => window.location.reload(), 300);
          return response;
        }
        this.revision = Number(response?.profile?.revision) || this.revision;
        this.onSyncStatus?.('synced');
        return response;
      })
      .catch(error => {
        failed = true;
        this.pendingState = state;
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
    const data = localStorage.getItem(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (_) {
      localStorage.removeItem(key);
      return null;
    }
  }
}
