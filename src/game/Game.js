import { calculateCost, calculateTotalPPS, calculateClickValue } from './Economy.js';
import { UpgradesData } from './Upgrades.js';
import { AchievementsData } from './Achievements.js';
import { SaveManager } from '../storage/SaveManager.js';
import { GoldenPacoca } from '../systems/GoldenPacoca.js';
import { Prestige } from './Prestige.js';

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.score = 0;
    this.pps = 0;
    this.clickValue = 1;
    this.buyAmount = 1;
    
    // Prestígio
    this.prestigeChips = 0;
    this.prestigeMultiplier = 1;

    // Frenesi Dourado
    this.frenzyMultiplier = 1;
    this.frenzyTimeLeft = 0;
    
    // Estatísticas
    this.totalClicks = 0;
    this.totalEarned = 0;
    this.startTime = Date.now();
    
    this.inventory = {
      cursor: 0, ajudante: 0, bancada: 0, carrinho: 0,
      loja: 0, fabrica: 0, centro: 0, imperio: 0
    };
    this.boughtUpgrades = [];
    this.unlockedAchievements = [];
    this.lastTick = Date.now();
    
    this.loadGame();
    this.goldenSystem = new GoldenPacoca(this);
    this.startGameLoop();
    this.startSaveLoop();
  }

  click() {
    const val = this.clickValue * this.frenzyMultiplier;
    this.score += val;
    this.totalEarned += val;
    this.totalClicks += 1;
    
    this.checkAchievements();
    this.refreshUI();
  }

  startFrenzy(multiplier, durationSeconds) {
    this.frenzyMultiplier = multiplier;
    this.frenzyTimeLeft = durationSeconds;
    this.recalculateStats();
    this.refreshUI();
  }

  setBuyAmount(amount) {
    this.buyAmount = amount;
    this.ui.updateShop(this.score, this.inventory, this.buyAmount);
  }

  buy(genId, baseCost) {
    const owned = this.inventory[genId] || 0;
    const cost = calculateCost(baseCost, owned, this.buyAmount);
    
    if (this.score >= cost) {
      this.score -= cost;
      this.inventory[genId] = owned + this.buyAmount;
      this.recalculateStats();
      this.checkAchievements();
      this.refreshUI();
    }
  }

  buyUpgrade(upgId) {
    const upg = UpgradesData.find(u => u.id === upgId);
    if (upg && !this.boughtUpgrades.includes(upgId) && this.score >= upg.cost) {
      this.score -= upg.cost;
      this.boughtUpgrades.push(upgId);
      this.recalculateStats();
      this.checkAchievements();
      this.refreshUI();
    }
  }

  // Executa o Prestígio
  doPrestige() {
    const pendingChips = Prestige.calculatePrestigeChips(this.totalEarned);
    const newChips = Math.max(0, pendingChips - this.prestigeChips);

    if (newChips <= 0) return;

    const totalChipsAfter = pendingChips;
    const newMultiplierPercent = Math.round((Prestige.getMultiplier(totalChipsAfter) - 1) * 100);

    // Abre o Modal 3D e aguarda a confirmação do jogador
    this.ui.showPrestigeModal(
      newChips,
      newMultiplierPercent,
      () => {
        // Callback executado somente se o jogador clicar em "Confirmar Renascimento"
        this.prestigeChips = pendingChips;
        this.score = 0;
        this.inventory = {
          cursor: 0, ajudante: 0, bancada: 0, carrinho: 0,
          loja: 0, fabrica: 0, centro: 0, imperio: 0
        };
        this.boughtUpgrades = [];
        this.recalculateStats();
        this.saveGame();
        this.refreshUI();
      }
    );
  }

  getTotalStructures() {
    return Object.values(this.inventory).reduce((acc, curr) => acc + curr, 0);
  }

  checkAchievements() {
    AchievementsData.forEach(ach => {
      if (this.unlockedAchievements.includes(ach.id)) return;

      let conditionMet = false;
      if (ach.reqType === 'totalClicks' && this.totalClicks >= ach.reqValue) conditionMet = true;
      if (ach.reqType === 'totalEarned' && this.totalEarned >= ach.reqValue) conditionMet = true;
      if (ach.reqType === 'totalStructures' && this.getTotalStructures() >= ach.reqValue) conditionMet = true;

      if (conditionMet) {
        this.unlockedAchievements.push(ach.id);
      }
    });
  }

  recalculateStats() {
    this.prestigeMultiplier = Prestige.getMultiplier(this.prestigeChips);

    const basePPS = calculateTotalPPS(this.inventory, this.boughtUpgrades);
    const baseClick = calculateClickValue(this.inventory, this.boughtUpgrades);

    // Multiplicador de renascer aplicado diretamente
    this.pps = basePPS * this.frenzyMultiplier * this.prestigeMultiplier;
    
    // O valor do clique é SEMPRE um número inteiro exato!
    this.clickValue = Math.round(baseClick * this.prestigeMultiplier);
  }

  refreshUI() {
    this.ui.updateScore(this.score, this.pps);
    this.ui.updateShop(this.score, this.inventory, this.buyAmount);
    this.ui.updateUpgrades(this.score, this.inventory, this.boughtUpgrades);
    this.ui.updateProfile(this);
    this.ui.updateFrenzy(this.frenzyTimeLeft);
  }

  startGameLoop() {
    setInterval(() => {
      const now = Date.now();
      const delta = (now - this.lastTick) / 1000;
      this.lastTick = now;

      if (this.frenzyTimeLeft > 0) {
        this.frenzyTimeLeft -= delta;
        if (this.frenzyTimeLeft <= 0) {
          this.frenzyTimeLeft = 0;
          this.frenzyMultiplier = 1;
          this.recalculateStats();
        }
      }

      if (this.pps > 0) {
        const earned = this.pps * delta;
        this.score += earned;
        this.totalEarned += earned;
        this.checkAchievements();
        this.refreshUI();
      }
    }, 100);
  }

  startSaveLoop() {
    setInterval(() => this.saveGame(), 10000);
  }

  saveGame() {
    SaveManager.save({
      score: this.score,
      totalClicks: this.totalClicks,
      totalEarned: this.totalEarned,
      startTime: this.startTime,
      inventory: this.inventory,
      boughtUpgrades: this.boughtUpgrades,
      unlockedAchievements: this.unlockedAchievements,
      prestigeChips: this.prestigeChips
    });
  }

  loadGame() {
    const saved = SaveManager.load();
    if (saved) {
      this.score = saved.score || 0;
      this.totalClicks = saved.totalClicks || 0;
      this.totalEarned = saved.totalEarned || 0;
      this.startTime = saved.startTime || Date.now();
      this.inventory = { ...this.inventory, ...saved.inventory };
      this.boughtUpgrades = saved.boughtUpgrades || [];
      this.unlockedAchievements = saved.unlockedAchievements || [];
      this.prestigeChips = saved.prestigeChips || 0;
      
      this.recalculateStats();
      
      if (saved.lastSaveTime) {
        const secondsOffline = (Date.now() - saved.lastSaveTime) / 1000;
        if (secondsOffline > 60 && this.pps > 0) {
           const maxOffline = 24 * 60 * 60; // Limite máximo de 24h
           const effectiveTime = Math.min(secondsOffline, maxOffline);
           const offlineEarned = effectiveTime * this.pps;

           // Exibir o Modal de Boas-vindas Personalizado
           setTimeout(() => {
             this.ui.showOfflineModal(
               effectiveTime,
               offlineEarned,
               () => {
                 // Coletar Normal (1x)
                 this.score += offlineEarned;
                 this.totalEarned += offlineEarned;
                 this.refreshUI();
                 this.saveGame();
               },
               () => {
                 // Dobrar Recompensa (2x - Simulação de Anúncio)
                 const doubled = offlineEarned * 2;
                 this.score += doubled;
                 this.totalEarned += doubled;
                 this.refreshUI();
                 this.saveGame();
               }
             );
           }, 400);
        }
      }
    } else {
      this.recalculateStats();
    }
  }

  exportSaveCode() {
    const data = JSON.stringify({
      score: this.score,
      totalClicks: this.totalClicks,
      totalEarned: this.totalEarned,
      startTime: this.startTime,
      inventory: this.inventory,
      boughtUpgrades: this.boughtUpgrades,
      unlockedAchievements: this.unlockedAchievements,
      prestigeChips: this.prestigeChips,
      lastSaveTime: Date.now()
    });
    return btoa(data);
  }

  importSaveCode(code) {
    try {
      const decoded = atob(code);
      const data = JSON.parse(decoded);
      if (data && typeof data.score === 'number') {
        localStorage.setItem('pacoca_clicker_save', JSON.stringify(data));
        window.location.reload();
      } else {
        alert('Código de save inválido.');
      }
    } catch (e) {
      alert('Código de save inválido.');
    }
  }

  resetProgress() {
    if (confirm('Tem certeza de que deseja reiniciar todo o progresso? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('pacoca_clicker_save');
      window.location.reload();
    }
  }
}