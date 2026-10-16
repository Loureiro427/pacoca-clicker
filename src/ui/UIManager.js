import { formatNumber } from '../utils/format.js';
import { GeneratorsData } from '../game/Generators.js';
import { UpgradesData } from '../game/Upgrades.js';
import { AchievementsData } from '../game/Achievements.js';
import { calculateCost } from '../game/Economy.js';
import { Prestige } from '../game/Prestige.js';

export class UIManager {
  constructor() {
    this.scoreDisplay = document.getElementById('score-display');
    this.ppsDisplay = document.getElementById('pps-display');
    this.shopArea = document.getElementById('shop-area');
    this.upgradesList = document.getElementById('upgrades-list');
    this.achievementsList = document.getElementById('achievements-list');
    this.game = null;
  }

  init(gameInstance) {
    this.game = gameInstance;
    this.initShop();
    this.initUpgrades();
    this.initAchievements();
    this.initSaveActions();
    this.initTabs();
    
    this.updateScore(this.game.score, this.game.pps);
    this.updateShop(this.game.score, this.game.inventory, this.game.buyAmount);
    this.updateUpgrades(this.game.score, this.game.inventory, this.game.boughtUpgrades);
    this.updateProfile(this.game);
  }

  updateScore(score, pps) {
    if (this.scoreDisplay) this.scoreDisplay.innerText = formatNumber(Math.floor(score));
    if (this.ppsDisplay) this.ppsDisplay.innerText = `${formatNumber(pps)} p/s`;
  }

  initShop() {
    if (!this.shopArea) return;
    this.shopArea.innerHTML = `
      <div class="shop-header">
        <h2>Loja</h2>
        <div class="buy-modes">
          <button class="mode-btn active" data-amount="1">x1</button>
          <button class="mode-btn" data-amount="10">x10</button>
          <button class="mode-btn" data-amount="100">x100</button>
        </div>
      </div>
      <div id="generators-list" class="shop-list"></div>
    `;

    const modeBtns = this.shopArea.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const amount = parseInt(e.target.dataset.amount, 10);
        if (this.game) this.game.setBuyAmount(amount);
      });
    });

    const list = document.getElementById('generators-list');
    if (!list) return;

    GeneratorsData.forEach(gen => {
      const el = document.createElement('div');
      el.className = 'generator-card';
      el.id = `gen-${gen.id}`;
      el.innerHTML = `
        <div class="generator-icon-wrapper">
          ${gen.iconSvg}
        </div>
        <div class="generator-info">
          <div class="generator-header-line">
            <h3>${gen.name}</h3>
            <span class="level-badge">Nível <span class="owned-count">0</span></span>
          </div>
          <small class="desc-display">${gen.desc}</small>
          <div class="cost-display">Custo: ${formatNumber(gen.baseCost)}</div>
        </div>
        <button class="buy-btn" id="buy-${gen.id}">Comprar</button>
      `;
      list.appendChild(el);

      const buyBtn = document.getElementById(`buy-${gen.id}`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.game) this.game.buy(gen.id, gen.baseCost);
        });
      }
    });
  }

  updateShop(score, inventory, buyAmount) {
    const prestigeMult = this.game ? this.game.prestigeMultiplier : 1;

    GeneratorsData.forEach(gen => {
      const owned = inventory[gen.id] || 0;
      const cost = calculateCost(gen.baseCost, owned, buyAmount);
      
      const card = document.getElementById(`gen-${gen.id}`);
      if (card) {
        const countEl = card.querySelector('.owned-count');
        const costEl = card.querySelector('.cost-display');
        const descEl = card.querySelector('.desc-display');
        const btn = document.getElementById(`buy-${gen.id}`);

        if (countEl) countEl.innerText = owned;
        if (costEl) costEl.innerText = `Custo (${buyAmount}x): ${formatNumber(cost)}`;
        
        if (descEl) {
          if (gen.id === 'cursor') {
            const effClick = Math.round((gen.clickBonus || 1) * prestigeMult);
            descEl.innerText = `+${formatNumber(effClick)} por toque`;
          } else {
            const effPPS = gen.basePPS * prestigeMult;
            descEl.innerText = `+${formatNumber(effPPS)} p/s cada`;
          }
        }

        if (btn) btn.disabled = score < cost;
      }
    });
  }

  initUpgrades() {
    this.currentUpgFilter = 'all';
    
    // Configura Botões de Filtro
    const filterBtns = document.querySelectorAll('.upg-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentUpgFilter = e.target.dataset.filter;
        if (this.game) this.updateUpgrades(this.game.score, this.game.inventory, this.game.boughtUpgrades);
      });
    });

    if (!this.upgradesList) return;
    this.upgradesList.innerHTML = '';

    UpgradesData.forEach(upg => {
      const el = document.createElement('div');
      el.className = `generator-card upgrade-card tier-${upg.tier}`; 
      el.id = `upg-${upg.id}`;
      el.dataset.type = upg.type;
      
      let tagTier = upg.tier === 'epic' ? 'ÉPICO' : `Tier ${upg.tier}`;
      
      el.innerHTML = `
        <div class="generator-icon-wrapper upg-icon">
          ${upg.iconSvg}
        </div>
        <div class="generator-info">
          <div class="generator-header-line">
            <h3>${upg.name}</h3>
            <span class="level-badge tier-badge ${upg.tier === 'epic' ? 'epic' : ''}">${tagTier}</span>
          </div>
          <small class="desc-display">${upg.desc}</small>
          <div class="cost-display">Custo: ${formatNumber(upg.cost)}</div>
          <!-- Nova linha que mostrará o requisito quando estiver bloqueado -->
          <div class="req-display" id="req-upg-${upg.id}" style="display: none;"></div>
        </div>
        <button class="buy-btn" id="buy-upg-${upg.id}">Melhorar</button>
      `;
      this.upgradesList.appendChild(el);

      const buyBtn = document.getElementById(`buy-upg-${upg.id}`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.game) this.game.buyUpgrade(upg.id);
        });
      }
    });
  }

  updateUpgrades(score, inventory, boughtUpgrades) {
    if (!this.upgradesList) return;
    let visibleCount = 0;

    UpgradesData.forEach(upg => {
      const card = document.getElementById(`upg-${upg.id}`);
      if (!card) return;

      const isBought = boughtUpgrades.includes(upg.id);
      const reqOwned = inventory[upg.reqGen] || 0;
      const isUnlocked = reqOwned >= upg.reqCount;
      const matchesFilter = this.currentUpgFilter === 'all' || this.currentUpgFilter === upg.type;

      // Oculta apenas se já foi comprado ou se o filtro não bater
      if (isBought || !matchesFilter) {
        card.style.display = 'none';
      } else {
        card.style.display = 'flex';
        visibleCount++;
        
        const btn = document.getElementById(`buy-upg-${upg.id}`);
        const reqText = document.getElementById(`req-upg-${upg.id}`);
        
        if (!isUnlocked) {
          // ESTADO BLOQUEADO (Cinza)
          card.classList.add('locked-upgrade');
          if (reqText) {
            const genData = GeneratorsData.find(g => g.id === upg.reqGen);
            const genName = genData ? genData.name : upg.reqGen;
            reqText.innerText = `Requer: ${upg.reqCount}x ${genName} (Você tem ${reqOwned})`;
            reqText.style.display = 'block';
          }
          if (btn) {
            btn.disabled = true;
            btn.innerText = 'Bloqueado';
          }
        } else {
          // ESTADO DESBLOQUEADO (Colorido e Brilhante)
          card.classList.remove('locked-upgrade');
          if (reqText) reqText.style.display = 'none';
          if (btn) {
            btn.disabled = score < upg.cost;
            btn.innerText = 'Melhorar';
          }
        }
      }
    });

    // Atualiza a mensagem de lista vazia
    let emptyEl = document.getElementById('upgrades-empty-state');
    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'upgrades-empty-state';
        emptyEl.className = 'empty-state';
        this.upgradesList.appendChild(emptyEl);
      }
      
      const allBought = UpgradesData.every(u => boughtUpgrades.includes(u.id));
      if (allBought && this.currentUpgFilter === 'all') {
        emptyEl.innerHTML = `
          <div class="empty-state-icon">🎉</div>
          <h3>Todas as melhorias adquiridas!</h3>
        `;
      } else {
        emptyEl.innerHTML = `
          <div class="empty-state-icon">🔍</div>
          <h3>Nenhuma melhoria nesta categoria</h3>
        `;
      }
      emptyEl.style.display = 'block';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }
  
  initAchievements() {
    if (!this.achievementsList) return;
    this.achievementsList.innerHTML = '';
    AchievementsData.forEach(ach => {
      const el = document.createElement('div');
      el.className = 'achievement-card';
      el.id = `ach-${ach.id}`;
      el.innerHTML = `
        <div class="achievement-icon">
          ${ach.iconSvg}
        </div>
        <div class="achievement-info">
          <h3>${ach.name}</h3>
          <p>${ach.desc}</p>
        </div>
      `;
      this.achievementsList.appendChild(el);
    });
  }

  updateProfile(game) {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setTxt('stat-clicks', formatNumber(game.totalClicks));
    setTxt('stat-earned', formatNumber(Math.floor(game.totalEarned)));
    setTxt('stat-structures', formatNumber(game.getTotalStructures()));
    
    const minutes = Math.floor((Date.now() - game.startTime) / 60000);
    setTxt('stat-time', `${minutes}m`);

    const req = Prestige.getNextChipRequirement(game.totalEarned);
    const pendingChips = Prestige.calculatePrestigeChips(game.totalEarned);
    const newChips = Math.max(0, pendingChips - game.prestigeChips);

    setTxt('prestige-count', formatNumber(game.prestigeChips));
    setTxt('prestige-mult', `${game.prestigeMultiplier}x`);
    setTxt('prestige-next-gain', `Ganho ao renascer: +${formatNumber(newChips)} 🌟`);
    setTxt('prestige-progress-pct', `${Math.floor(req.progressPercent)}%`);

    const fillBar = document.getElementById('prestige-bar-fill');
    if (fillBar) fillBar.style.width = `${req.progressPercent}%`;

    const missingEl = document.getElementById('prestige-missing-text');
    if (missingEl) {
      if (req.missing > 0) {
        missingEl.innerText = `Faltam ${formatNumber(Math.ceil(req.missing))} Paçocas acumuladas para a próxima!`;
      } else {
        missingEl.innerText = `✨ Você já pode renascer para ganhar nova Paçoca de Ouro!`;
      }
    }

    const prestigeBtn = document.getElementById('btn-prestige');
    if (prestigeBtn) {
      prestigeBtn.disabled = newChips <= 0;
      if (newChips > 0) {
        prestigeBtn.innerText = `Renascer Agora (+${formatNumber(newChips)} 🌟)`;
      } else {
        prestigeBtn.innerText = `Renascer (Sem novas Paçocas de Ouro)`;
      }
    }

    AchievementsData.forEach(ach => {
      const card = document.getElementById(`ach-${ach.id}`);
      if (card) {
        if (game.unlockedAchievements.includes(ach.id)) {
          card.classList.add('unlocked');
        } else {
          card.classList.remove('unlocked');
        }
      }
    });
  }

  initSaveActions() {
    const btnPrestige = document.getElementById('btn-prestige');
    const btnExport = document.getElementById('btn-export-save');
    const btnImport = document.getElementById('btn-import-save');
    const btnReset = document.getElementById('btn-reset-save');

    if (btnPrestige) btnPrestige.addEventListener('click', () => this.game && this.game.doPrestige());
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (!this.game) return;
        const code = this.game.exportSaveCode();
        navigator.clipboard.writeText(code).then(() => {
          alert('Código de Save copiado para a área de transferência!');
        }).catch(() => {
          prompt('Copie o seu código de Save:', code);
        });
      });
    }
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        const code = prompt('Cole o seu código de Save aqui:');
        if (code && this.game) this.game.importSaveCode(code.trim());
      });
    }
    if (btnReset) btnReset.addEventListener('click', () => this.game && this.game.resetProgress());
  }

  updateFrenzy(timeLeft) {
    const banner = document.getElementById('frenzy-banner');
    const timer = document.getElementById('frenzy-timer');
    
    if (banner && timer) {
      if (timeLeft > 0) {
        banner.style.display = 'block';
        timer.innerText = Math.ceil(timeLeft);
      } else {
        banner.style.display = 'none';
      }
    }
  }

  showOfflineModal(seconds, amount, onCollectNormal, onCollectDouble) {
    const modal = document.getElementById('offline-modal');
    if (!modal) return;

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let timeStr = '';
    if (hours > 0) timeStr += `${hours}h `;
    if (mins > 0 || hours > 0) timeStr += `${mins}m `;
    if (hours === 0 && mins === 0) timeStr += `${secs}s`;

    const timeVal = document.getElementById('offline-time-val');
    const amountVal = document.getElementById('offline-amount-val');

    if (timeVal) timeVal.innerText = timeStr.trim();
    if (amountVal) amountVal.innerText = `+${formatNumber(Math.floor(amount))}`;

    const btnNormal = document.getElementById('btn-collect-normal');
    const btnAd = document.getElementById('btn-collect-ad');

    if (btnNormal && btnAd) {
      const newNormal = btnNormal.cloneNode(true);
      const newAd = btnAd.cloneNode(true);
      btnNormal.parentNode.replaceChild(newNormal, btnNormal);
      btnAd.parentNode.replaceChild(newAd, btnAd);

      newNormal.addEventListener('click', () => {
        modal.style.display = 'none';
        if (onCollectNormal) onCollectNormal();
      });

      newAd.addEventListener('click', () => {
        newAd.innerText = '⏳ Carregando...';
        setTimeout(() => {
          modal.style.display = 'none';
          newAd.innerText = '🎬 Dobrar Recompensa (2x)';
          alert('🎉 Anúncio assistido! Sua recompensa foi dobrada!');
          if (onCollectDouble) onCollectDouble();
        }, 800);
      });
    }

    modal.style.display = 'flex';
  }

  showPrestigeModal(newChips, newMultiplierPercent, onConfirm) {
    const modal = document.getElementById('prestige-modal');
    if (!modal) return;

    const gainEl = document.getElementById('prestige-modal-gain');
    const multEl = document.getElementById('prestige-modal-mult');

    if (gainEl) gainEl.innerText = `+${formatNumber(newChips)} 🌟`;
    if (multEl) multEl.innerText = `Bônus total subirá para: +${newMultiplierPercent}%`;

    const btnConfirm = document.getElementById('btn-prestige-confirm');
    const btnCancel = document.getElementById('btn-prestige-cancel');

    if (btnConfirm && btnCancel) {
      const newConfirm = btnConfirm.cloneNode(true);
      const newCancel = btnCancel.cloneNode(true);
      btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
      btnCancel.parentNode.replaceChild(newCancel, btnCancel);

      newConfirm.addEventListener('click', () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
      });

      newCancel.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    modal.style.display = 'flex';
  }

  initTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const targetId = targetBtn.dataset.target;
        const targetTab = document.getElementById(targetId);

        if (!targetTab) return;

        btns.forEach(b => b.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        
        targetBtn.classList.add('active');
        targetTab.classList.add('active');
      });
    });
  }
}