import { calculateCost, calculateTotalPPS, calculateClickValue } from './Economy.js';
import { UpgradesData } from './Upgrades.js';
import { AchievementsData } from './Achievements.js';
import { SaveManager } from '../storage/SaveManager.js';
import { GoldenPacoca } from '../systems/GoldenPacoca.js';
import { Prestige } from './Prestige.js';
import { SkillTreeManager } from './SkillTree.js';
import { SkillTreeUI } from '../ui/SkillTreeUI.js';
import { formatNumber } from '../utils/format.js';
import { AudioManager } from '../audio/AudioManager.js';

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.score = 0;
    this.pps = 0;
    this.clickValue = 1;
    this.buyAmount = 1;
    
    // Variáveis de Talentos e Combos
    this.comboCount = 0;
    this.lastClickTime = 0;
    this.maoDePedraTime = 0;
    this.autoclickTimer = 0;
    
    // Prestígio
    this.prestigeChips = 0;
    this.claimedPrestigeChips = 0;
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
    
    // Árvore de Talentos RPG
    this.skillTree = new SkillTreeManager(this);
    this.skillTreeUI = new SkillTreeUI(this);

    
    // Inicia o sistema de áudio
    this.audio = new AudioManager();

    this.loadGame();
    this.goldenSystem = new GoldenPacoca(this);
    this.startGameLoop();
    this.startSaveLoop();
  }

  click() {
    this.audio.init(); // Inicializa o contexto no primeiro clique do usuário
    this.audio.playClick(); // Toca o "Pop" viciante
    const now = Date.now();
    
    // TALENTO ACT_4: Sistema de Combo de Cliques
    if (now - this.lastClickTime < 800) {
      this.comboCount = Math.min(50, this.comboCount + 1);
    } else {
      this.comboCount = 0;
    }
    this.lastClickTime = now;

    // TALENTO ACT_4a: Overclock Manual (Mão de Pedra)
    if (this.comboCount === 50 && this.skillTree.hasSkill('act_4a')) {
      this.maoDePedraTime = 3; // 3 Segundos de poder triplo
      this.comboCount = 0;
    }

    // Aplicação dos Multiplicadores de Combo e Mão de Pedra
    let comboMult = 1 + (this.skillTree.hasSkill('act_4') ? (this.comboCount * 0.01) : 0);
    let maoDePedraMult = this.maoDePedraTime > 0 ? 3 : 1;

    // TALENTO ACT_3: Impacto Crítico (5% de chance)
    let isCrit = this.skillTree.hasSkill('act_3') && Math.random() < 0.05;
    let critMult = 1;
    if (isCrit) {
      // TALENTO ACT_3a: Precisão Cirúrgica sobe crit para 12x
      critMult = this.skillTree.hasSkill('act_3a') ? 12 : 5;
      
      // TALENTO ACT_3b: Faísca Frenética (+0.5s no Frenesi por crit)
      if (this.skillTree.hasSkill('act_3b') && this.frenzyTimeLeft > 0) {
        this.frenzyTimeLeft += 0.5;
      }
    }

    // Bônus Brutos Adicionais
    let extraVal = 0;
    // TALENTO ACT_2: Toque Sincronizado (+1% do PPS por clique)
    if (this.skillTree.hasSkill('act_2')) extraVal += (this.pps * 0.01);
    // TALENTO ACT_7: Dedo de Midas (+10% do PPS por clique)
    if (this.skillTree.hasSkill('act_7')) extraVal += (this.pps * 0.10);
    // TALENTO ALC_7: Transmutação Sincronizada (Ganha 1% do saldo atual por clique no Frenesi)
    if (this.skillTree.hasSkill('alc_7') && this.frenzyTimeLeft > 0) extraVal += (this.score * 0.01);

    // CÁLCULO FINAL DO CLIQUE (this.clickValue já possui o Frenesi em tempo real!)
    const val = (this.clickValue * comboMult * critMult * maoDePedraMult) + extraVal;

    this.score += val;
    this.totalEarned += val;
    this.totalClicks += 1;

    // TALENTO ACT_6: Eco Clicável (1 clique grátis a cada 10 cliques)
    if (this.skillTree.hasSkill('act_6') && this.totalClicks % 10 === 0) {
      const ecoVal = this.clickValue;
      this.score += ecoVal;
      this.totalEarned += ecoVal;
    }
    
    this.checkAchievements();
    this.refreshUI();
  }

  startFrenzy(multiplier, durationSeconds) {
    // TALENTO ALC_2a: Mega Frenesi
    if (this.skillTree.hasSkill('alc_2a')) multiplier = Math.max(multiplier, 10);
    // TALENTO ALC_2: Frenesi Prolongado (+10s)
    if (this.skillTree.hasSkill('alc_2')) durationSeconds += 10;

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
    
    const cost = this.getPurchaseCost(baseCost, owned, this.buyAmount);
    
    if (this.score >= cost) {
      this.score -= cost;
      this.inventory[genId] = owned + this.buyAmount;
      this.audio.playBuy();
      this.recalculateStats();
      this.checkAchievements();
      this.refreshUI();
    }
  }

  getPurchaseCost(baseCost, owned, amount = this.buyAmount) {
    let discount = 1;
    if (this.skillTree.hasSkill('pas_2')) discount -= 0.05;
    if (this.skillTree.hasSkill('pas_2a') && (amount === 10 || amount === 100)) discount -= 0.05;
    return Math.floor(calculateCost(baseCost, owned, amount) * discount);
  }

  buyUpgrade(upgId) {
    const upg = UpgradesData.find(u => u.id === upgId);
    if (upg && !this.boughtUpgrades.includes(upgId) && this.score >= upg.cost) {
      this.score -= upg.cost;
      this.boughtUpgrades.push(upgId);
      this.audio.playBuy(); // Toca o som de compra
      this.recalculateStats();
      this.checkAchievements();
      this.refreshUI();
    }
  }

  // Executa o Prestígio
  doPrestige() {
    const pendingChips = Prestige.calculatePrestigeChips(this.totalEarned);
    const newChips = Math.max(0, pendingChips - this.claimedPrestigeChips);

    if (newChips <= 0) return;

    const totalChipsAfter = this.prestigeChips + newChips;
    const extraMultiplier = this.skillTree.hasSkill('alc_5') ? totalChipsAfter * 0.01 : 0;
    const newMultiplierPercent = Math.round((Prestige.getMultiplier(totalChipsAfter) + extraMultiplier - 1) * 100);

    // Abre o Modal 3D e aguarda a confirmação do jogador
    this.ui.showPrestigeModal(
      newChips,
      newMultiplierPercent,
      () => {
        // Callback executado somente se o jogador clicar em "Confirmar Renascimento"
        this.prestigeChips += newChips;
        this.claimedPrestigeChips = pendingChips;
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
    // TALENTO ALC_5: Essência de Ouro (+1% por paçoca dourada não gasta)
    let extraPrestigeMult = this.skillTree.hasSkill('alc_5') ? (this.prestigeChips * 0.01) : 0;
    this.prestigeMultiplier = Prestige.getMultiplier(this.prestigeChips) + extraPrestigeMult;

    let basePPS = calculateTotalPPS(this.inventory, this.boughtUpgrades);
    let baseClick = calculateClickValue(this.inventory, this.boughtUpgrades);

    // TALENTO ACT_1: +15% no clique base
    if (this.skillTree.hasSkill('act_1')) baseClick *= 1.15;
    
    // TALENTO PAS_1: +10% no PPS Global
    if (this.skillTree.hasSkill('pas_1')) basePPS *= 1.10;
    
    // TALENTO PAS_5: +2% de PPS por TIPO de estrutura construída
    if (this.skillTree.hasSkill('pas_5')) {
      const typesOwned = Object.values(this.inventory).filter(v => v > 0).length;
      basePPS *= (1 + (typesOwned * 0.02));
    }
    
    // TALENTO PAS_7: Sobrecarga (+0.5% por min jogado, até 30%)
    if (this.skillTree.hasSkill('pas_7')) {
      const minsPlayed = Math.floor((Date.now() - this.startTime) / 60000);
      basePPS *= (1 + Math.min(0.30, minsPlayed * 0.005));
    }

    // Multiplicador de renascer e frenesi aplicados diretamente no PPS
    this.pps = basePPS * this.frenzyMultiplier * this.prestigeMultiplier;
    
    // O valor do clique agora REFLETE o Frenesi em tempo real na interface!
    this.clickValue = Math.round(baseClick * this.prestigeMultiplier * this.frenzyMultiplier);
  }

  refreshUI() {
    this.ui.updateScore(this.score, this.pps);
    this.ui.updateShop(this.score, this.inventory, this.buyAmount);
    this.ui.updateUpgrades(this.score, this.inventory, this.boughtUpgrades);
    this.ui.updateProfile(this);
    this.ui.updateFrenzy(this.frenzyTimeLeft);
    if (this.skillTreeUI) {
      this.skillTreeUI.render();
    }
  }

  startGameLoop() {
    setInterval(() => {
      const now = Date.now();
      const delta = (now - this.lastTick) / 1000;
      this.lastTick = now;

      // Desconto de tempo do Mão de Pedra (Talento)
      if (this.maoDePedraTime > 0) {
        this.maoDePedraTime -= delta;
        if (this.maoDePedraTime < 0) this.maoDePedraTime = 0;
      }

      // TALENTO PAS_8: Automação Suprema (60x o clique a cada 10s)
      this.autoclickTimer += delta;
      if (this.skillTree.hasSkill('pas_8') && this.autoclickTimer >= 10) {
        this.autoclickTimer = 0;
        const autoVal = this.clickValue * 60;
        this.score += autoVal;
        this.totalEarned += autoVal;
        
        // Dispara mensagem bonitinha na tela
        if (this.ui && this.ui.showNotification) {
          this.ui.showNotification("🤖 Automação Suprema!", `+${formatNumber(Math.floor(autoVal))} Paçocas automáticas!`);
        }
      }

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
      prestigeChips: this.prestigeChips,
      claimedPrestigeChips: this.claimedPrestigeChips,
      unlockedSkills: this.skillTree ? this.skillTree.unlockedSkills : ['origin']
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
      this.claimedPrestigeChips = saved.claimedPrestigeChips;
      if (saved.unlockedSkills && this.skillTree) {
        this.skillTree.unlockedSkills = saved.unlockedSkills;
      }
      
      this.recalculateStats();
      
      if (saved.lastSaveTime) {
        const secondsOffline = (Date.now() - saved.lastSaveTime) / 1000;
        if (secondsOffline > 60 && this.pps > 0) {
           const maxOffline = 24 * 60 * 60; // Limite máximo de 24h
           let effectiveTime = Math.min(secondsOffline, maxOffline);
           
           // TALENTO PAS_4: Turno da Madrugada (+50% tempo offline contabilizado)
           if (this.skillTree.hasSkill('pas_4')) effectiveTime *= 1.5;

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
                 // TALENTO PAS_4a: Frenesi de Boas-vindas
                 if (this.skillTree.hasSkill('pas_4a')) this.startFrenzy(2, 30);
               },
               () => {
                 // Dobrar Recompensa (2x - Simulação de Anúncio)
                 const doubled = offlineEarned * 2;
                 this.score += doubled;
                 this.totalEarned += doubled;
                 this.refreshUI();
                 this.saveGame();
                 if (this.skillTree.hasSkill('pas_4a')) this.startFrenzy(2, 30);
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
      claimedPrestigeChips: this.claimedPrestigeChips,
      unlockedSkills: this.skillTree ? this.skillTree.unlockedSkills : ['origin'],
      lastSaveTime: Date.now()
    });
    return btoa(data);
  }

  importSaveCode(code) {
    try {
      const decoded = atob(code);
      const data = SaveManager.validate(JSON.parse(decoded));
      if (data) {
        SaveManager.replace(data)
          .then(() => window.location.reload())
          .catch(() => this.ui.showNotification('Não foi possível importar o save', 'Verifique sua conexão e tente novamente.'));
      } else {
        this.ui.showDialog({ icon: '📦', title: 'Não encontramos seu progresso', message: 'Esse código de save é inválido. Copie o código completo e tente novamente.', confirmText: 'Voltar e tentar' });
      }
    } catch (e) {
      this.ui.showDialog({ icon: '📦', title: 'Não encontramos seu progresso', message: 'Esse código de save é inválido. Copie o código completo e tente novamente.', confirmText: 'Voltar e tentar' });
    }
  }

  async resetProgress() {
    const accepted = await this.ui.showDialog({
      icon: '↺', title: 'Recomeçar do zero?',
      message: 'Seu saldo, estruturas, talentos e conquistas serão apagados desta conta, incluindo o progresso salvo na nuvem. Essa ação não pode ser desfeita.',
      confirmText: 'Apagar meu progresso', cancelText: 'Manter meu império', danger: true,
    });
    if (accepted) {
      try {
        await SaveManager.reset();
        window.location.reload();
      } catch (_) {
        this.ui.showNotification('Não foi possível apagar o progresso', 'Verifique sua conexão e tente novamente.');
      }
    }
  }
}
