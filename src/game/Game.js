import { calculateCost, calculateTotalPPS, calculateClickValue } from './Economy.js';
import { UpgradesData } from './Upgrades.js';
import { SaveManager } from '../storage/SaveManager.js';

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.score = 0;
    this.pps = 0;
    this.clickValue = 1;
    this.buyAmount = 1;
    this.inventory = {
      cursor: 0, ajudante: 0, bancada: 0, carrinho: 0,
      loja: 0, fabrica: 0, centro: 0, imperio: 0
    };
    this.boughtUpgrades = [];
    this.lastTick = Date.now();
    
    this.loadGame();
    this.startGameLoop();
    this.startSaveLoop();
  }

  click() {
    this.score += this.clickValue;
    this.ui.updateScore(this.score, this.pps);
    this.ui.updateShop(this.score, this.inventory, this.buyAmount);
    this.ui.updateUpgrades(this.score, this.inventory, this.boughtUpgrades);
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
      this.refreshUI();
    }
  }

  buyUpgrade(upgId) {
    const upg = UpgradesData.find(u => u.id === upgId);
    if (upg && !this.boughtUpgrades.includes(upgId) && this.score >= upg.cost) {
      this.score -= upg.cost;
      this.boughtUpgrades.push(upgId);
      this.recalculateStats();
      this.refreshUI();
    }
  }

  recalculateStats() {
    this.pps = calculateTotalPPS(this.inventory, this.boughtUpgrades);
    this.clickValue = calculateClickValue(this.inventory, this.boughtUpgrades);
  }

  refreshUI() {
    this.ui.updateScore(this.score, this.pps);
    this.ui.updateShop(this.score, this.inventory, this.buyAmount);
    this.ui.updateUpgrades(this.score, this.inventory, this.boughtUpgrades);
  }

  startGameLoop() {
    setInterval(() => {
      const now = Date.now();
      const delta = (now - this.lastTick) / 1000;
      this.lastTick = now;

      if (this.pps > 0) {
        this.score += this.pps * delta;
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
      inventory: this.inventory,
      boughtUpgrades: this.boughtUpgrades
    });
  }

  loadGame() {
    const saved = SaveManager.load();
    if (saved) {
      this.score = saved.score || 0;
      this.inventory = { ...this.inventory, ...saved.inventory };
      this.boughtUpgrades = saved.boughtUpgrades || [];
      this.recalculateStats();
      
      if (saved.lastSaveTime) {
        const secondsOffline = (Date.now() - saved.lastSaveTime) / 1000;
        if (secondsOffline > 60 && this.pps > 0) {
           const maxOffline = 24 * 60 * 60;
           const effectiveTime = Math.min(secondsOffline, maxOffline);
           this.score += effectiveTime * this.pps;
           alert('Bem-vindo de volta! As suas fábricas continuaram a produzir Paçocas enquanto esteve fora.');
        }
      }
    } else {
      this.recalculateStats();
    }
  }
}