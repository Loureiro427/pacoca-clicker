import { formatNumber } from '../utils/format.js';
import { GeneratorsData } from '../game/Generators.js';
import { UpgradesData } from '../game/Upgrades.js';
import { AchievementsData } from '../game/Achievements.js';
import { calculateCost } from '../game/Economy.js';
import { Prestige } from '../game/Prestige.js';
import { AppDialog } from './AppDialog.js';
import { formatJourneyDuration } from './ProfileAccount.js';

export class UIManager {
  showDialog(options) {
    return AppDialog.open(options);
  }

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
    this.initSettings();
    
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
    const boughtUpgrades = this.game ? this.game.boughtUpgrades : [];

    GeneratorsData.forEach(gen => {
      const owned = inventory[gen.id] || 0;
      const cost = this.game
        ? this.game.getPurchaseCost(gen.baseCost, owned, buyAmount)
        : calculateCost(gen.baseCost, owned, buyAmount);
      
      const card = document.getElementById(`gen-${gen.id}`);
      if (card) {
        const countEl = card.querySelector('.owned-count');
        const costEl = card.querySelector('.cost-display');
        const descEl = card.querySelector('.desc-display');
        const btn = document.getElementById(`buy-${gen.id}`);

        if (countEl) countEl.innerText = owned;
        if (costEl) costEl.innerText = `Custo (${buyAmount}x): ${formatNumber(cost)}`;
        
        if (descEl) {
          let multi = 1;
          
          UpgradesData.forEach(upg => {
            if (boughtUpgrades.includes(upg.id)) {
              if (gen.id === 'cursor') {
                if (upg.effect === 'clickMultiplier') multi *= upg.value;
                if (upg.effect === 'synergyClick') {
                  const countGen = inventory[upg.targetGen] || 0;
                  multi *= (1 + (countGen * upg.synergyMultiplier));
                }
              } else {
                if (upg.effect === 'genMultiplier' && upg.targetGen === gen.id) multi *= upg.value;
                if (upg.effect === 'synergyPPS' && upg.targetGen === gen.id) {
                  const countBase = inventory[upg.baseGen] || 0;
                  multi *= (1 + (countBase * upg.synergyMultiplier));
                }
              }
            }
          });

          let globalMult = prestigeMult;
          if (this.game && this.game.skillTree) {
            if (gen.id === 'cursor' && this.game.skillTree.hasSkill('act_1')) globalMult *= 1.15;
            if (gen.id !== 'cursor' && this.game.skillTree.hasSkill('pas_1')) globalMult *= 1.10;
          }

          if (gen.id === 'cursor') {
            const effClick = Math.round((gen.clickBonus || 1) * multi * globalMult);
            descEl.innerText = `+${formatNumber(effClick)} por toque`;
          } else {
            const effPPS = gen.basePPS * multi * globalMult;
            descEl.innerText = `+${formatNumber(effPPS)} p/s cada`;
          }
        }

        if (btn) btn.disabled = score < cost;
      }
    });
  }

  initUpgrades() {
    this.currentUpgFilter = 'all';
    
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

  showNotification(title, subtitle = '') {
    let container = document.getElementById('floating-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'floating-notifications';
      container.className = 'floating-notifications-container';
      document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    notif.className = 'game-notification';
    notif.innerHTML = `
      <span>${title}</span>
      ${subtitle ? `<small>${subtitle}</small>` : ''}
    `;
    
    container.appendChild(notif);
    
    setTimeout(() => {
      notif.remove();
    }, 2500);
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

      if (isBought || !matchesFilter) {
        card.style.display = 'none';
      } else {
        card.style.display = 'flex';
        visibleCount++;
        
        const btn = document.getElementById(`buy-upg-${upg.id}`);
        const reqText = document.getElementById(`req-upg-${upg.id}`);
        
        if (!isUnlocked) {
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
          card.classList.remove('locked-upgrade');
          if (reqText) reqText.style.display = 'none';
          if (btn) {
            btn.disabled = score < upg.cost;
            btn.innerText = 'Melhorar';
          }
        }
      }
    });

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
    this.achievementFilter = 'all';
    document.querySelectorAll('[data-achievement-filter]').forEach(button => {
      button.addEventListener('click', () => {
        this.achievementFilter = button.dataset.achievementFilter;
        document.querySelectorAll('[data-achievement-filter]').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        if (this.game) this.updateProfile(this.game);
      });
    });
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
          <span class="achievement-status">A conquistar</span>
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
    
    setTxt('stat-time', formatJourneyDuration(game.startTime));
    setTxt('stat-pps', formatNumber(game.pps));
    setTxt('stat-click-value', formatNumber(game.clickValue));
    const unlockedCount = AchievementsData.filter(achievement => game.unlockedAchievements.includes(achievement.id)).length;
    setTxt('profile-achievement-count', `${unlockedCount}/${AchievementsData.length}`);
    const achievementPercent = AchievementsData.length ? Math.round(unlockedCount / AchievementsData.length * 100) : 0;
    document.getElementById('achievement-progress')?.setAttribute('aria-valuenow', String(achievementPercent));
    const achievementFill = document.getElementById('achievement-progress-fill');
    if (achievementFill) achievementFill.style.width = `${achievementPercent}%`;

    const req = Prestige.getNextChipRequirement(game.totalEarned);
    const pendingChips = Prestige.calculatePrestigeChips(game.totalEarned);
    const newChips = Math.max(0, pendingChips - game.claimedPrestigeChips);

    setTxt('prestige-count', formatNumber(game.prestigeChips));
    setTxt('prestige-mult', `${Number(game.prestigeMultiplier.toFixed(2)).toLocaleString('pt-BR')}×`);
    setTxt('prestige-next-gain', `Ganho ao renascer: +${formatNumber(newChips)} 🌟`);
    setTxt('prestige-progress-pct', `${Math.floor(req.progressPercent)}%`);

    const fillBar = document.getElementById('prestige-bar-fill');
    if (fillBar) fillBar.style.width = `${req.progressPercent}%`;
    document.getElementById('prestige-progress')?.setAttribute('aria-valuenow', String(Math.floor(req.progressPercent)));

    const missingEl = document.getElementById('prestige-missing-text');
    if (missingEl) {
      if (newChips > 0) {
        missingEl.innerText = `Seu próximo começo já tem +${formatNumber(newChips)} de ouro esperando por você.`;
      } else if (req.missing > 0) {
        missingEl.innerText = `Faltam ${formatNumber(Math.ceil(req.missing))} Paçocas acumuladas para a próxima!`;
      } else {
        missingEl.innerText = `✨ Você já pode renascer para ganhar nova Paçoca de Ouro!`;
      }
    }

    const prestigeBtn = document.getElementById('btn-prestige');
    if (prestigeBtn) {
      prestigeBtn.disabled = newChips <= 0;
      if (newChips > 0) {
        prestigeBtn.innerText = `Renascer e receber +${formatNumber(newChips)} de ouro ✦`;
      } else {
        prestigeBtn.innerText = 'Continue produzindo para renascer';
      }
    }

    let visibleAchievements = 0;
    AchievementsData.forEach(ach => {
      const card = document.getElementById(`ach-${ach.id}`);
      if (card) {
        const unlocked = game.unlockedAchievements.includes(ach.id);
        const visible = !this.achievementFilter || this.achievementFilter === 'all'
          || (this.achievementFilter === 'unlocked' && unlocked)
          || (this.achievementFilter === 'locked' && !unlocked);
        card.hidden = !visible;
        if (visible) visibleAchievements++;
        const status = card.querySelector('.achievement-status');
        if (status) status.textContent = unlocked ? '✓ Conquistada' : 'A conquistar';
        if (game.unlockedAchievements.includes(ach.id)) {
          card.classList.add('unlocked');
        } else {
          card.classList.remove('unlocked');
        }
      }
    });
    const empty = document.getElementById('achievement-empty');
    if (empty) {
      empty.hidden = visibleAchievements > 0;
      empty.textContent = this.achievementFilter === 'locked'
        ? 'Você conquistou todos os marcos. Que império!'
        : 'Nenhuma conquista por aqui ainda. Seu próximo clique pode mudar isso.';
    }
  }

  initSettings() {
    const btnPrestige = document.getElementById('btn-prestige');
    const btnReset = document.getElementById('btn-reset-save');
    const toggleSfx = document.getElementById('toggle-sfx');
    const toggleMusic = document.getElementById('toggle-music');

    if (btnPrestige) {
      btnPrestige.addEventListener('click', () => {
        if (this.game) {
          this.game.doPrestige();
        }
      });
    }

    const sfxEnabled = localStorage.getItem('pacoca_sfx') !== 'false';
    const musicEnabled = localStorage.getItem('pacoca_music') !== 'false';

    if (toggleSfx) {
      toggleSfx.checked = sfxEnabled;
      toggleSfx.addEventListener('change', (e) => {
        localStorage.setItem('pacoca_sfx', e.target.checked);
        if (this.game && this.game.audio) {
          this.game.audio.setSfx(e.target.checked);
          if (e.target.checked) this.game.audio.playBuy();
        }
      });
    }

    if (toggleMusic) {
      toggleMusic.checked = musicEnabled;
      toggleMusic.addEventListener('change', (e) => {
        localStorage.setItem('pacoca_music', e.target.checked);
        if (this.game && this.game.audio) {
          this.game.audio.setMusic(e.target.checked);
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        if (!this.game || btnReset.disabled) return;
        btnReset.disabled = true;
        try { await this.game.resetProgress(); }
        finally { btnReset.disabled = false; }
      });
    }
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

      let collecting = false;
      newNormal.disabled = false;
      newAd.disabled = false;
      newAd.innerText = '🎬 Dobrar Recompensa (2x)';

      newNormal.addEventListener('click', () => {
        if (collecting) return;
        collecting = true;
        newNormal.disabled = true;
        newAd.disabled = true;
        modal.style.display = 'none';
        if (onCollectNormal) onCollectNormal();
      });

      newAd.addEventListener('click', () => {
        if (collecting) return;
        collecting = true;
        newNormal.disabled = true;
        newAd.disabled = true;
        newAd.innerText = '⏳ Carregando...';
        setTimeout(() => {
          modal.style.display = 'none';
          newAd.innerText = '🎬 Dobrar Recompensa (2x)';
          if (onCollectDouble) onCollectDouble();
          this.showDialog({
            icon: '🎁', title: 'Uma volta em grande estilo!',
            message: 'Sua recompensa offline foi dobrada e já está no seu saldo.',
            confirmText: 'Continuar meu império',
            reward: { label: 'PAÇOCAS COLETADAS · 2×', value: `+${formatNumber(Math.floor(amount * 2))}` },
          });
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

        // Renderiza o ranking imediatamente quando a aba for ativada
      });
    });
  }
}
