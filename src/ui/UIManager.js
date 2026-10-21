import { formatNumber } from '../utils/format.js';
import { GeneratorsData } from '../game/Generators.js';
import { UpgradesData } from '../game/Upgrades.js';
import { AchievementsData } from '../game/Achievements.js';
import { calculateCost } from '../game/Economy.js';
import { Prestige } from '../game/Prestige.js';
import { AppDialog } from './AppDialog.js';
import { formatJourneyDuration } from './ProfileAccount.js';
import { getUpgradeState, matchesUpgradeView } from './CommerceData.js';
import { updateClickStats } from './ClickExperience.js';

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
    this.updateClickStats(this.game);
    this.game.skillTreeUI?.render();
  }

  updateScore(score, pps) {
    if (this.scoreDisplay) this.scoreDisplay.innerText = formatNumber(Math.floor(score));
    if (this.ppsDisplay) this.ppsDisplay.innerText = `${formatNumber(pps)} p/s`;
  }

  initShop() {
    if (!this.shopArea) return;
    this.shopArea.innerHTML = `
      <div class="commerce-shell">
        <header class="commerce-hero"><span class="commerce-eyebrow">PAÇOCA CLICKER / CONSTRUA SEU IMPÉRIO</span><h2 id="shop-title">Da primeira paçoca<br><em>à próxima fábrica.</em></h2><p>Mais estruturas. Mais produção. Mais possibilidades.</p><div class="commerce-summary"><div><span>SEU SALDO</span><strong id="shop-balance">0</strong></div><div><span>PRODUÇÃO ATUAL</span><strong id="shop-production">0 /s</strong></div></div></header>
        <div class="commerce-catalog">
          <div class="commerce-section-heading"><div><span class="commerce-eyebrow">O PRÓXIMO PASSO É SEU</span><h3>Expanda sua produção</h3></div><span id="shop-owned-count" class="commerce-count">0 estruturas</span></div>
          <div class="commerce-buy-panel"><div><strong>Quantidade por compra</strong><span id="shop-discount-note">Preço total do lote</span></div><div class="buy-modes" role="group" aria-label="Quantidade por compra"><button type="button" class="mode-btn active" data-amount="1" aria-pressed="true">×1</button><button type="button" class="mode-btn" data-amount="10" aria-pressed="false">×10</button><button type="button" class="mode-btn" data-amount="100" aria-pressed="false">×100</button></div></div>
          <div class="commerce-list-caption"><span>ESTRUTURAS & CLIQUES</span><span id="shop-lot-label">Lotes de 1 unidade</span></div>
          <div id="generators-list" class="commerce-list" role="list" aria-label="Estruturas à venda"></div>
          <p class="commerce-footnote">Produção base por unidade. Melhorias, talentos e bônus são aplicados ao total do seu império.</p>
          <p id="shop-feedback" class="commerce-feedback" role="status"></p>
        </div>
      </div>
    `;
    this.shopArea.setAttribute('aria-labelledby', 'shop-title');

    const modeBtns = this.shopArea.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => { b.classList.toggle('active', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); });
        const amount = parseInt(e.currentTarget.dataset.amount, 10);
        if (this.game) this.game.setBuyAmount(amount);
      });
    });

    const list = document.getElementById('generators-list');
    if (!list) return;

    GeneratorsData.forEach(gen => {
      const el = document.createElement('div');
      el.className = 'commerce-card';
      el.setAttribute('role', 'listitem');
      el.id = `gen-${gen.id}`;
      el.innerHTML = `
        <div class="commerce-icon" aria-hidden="true">
          ${gen.iconSvg}
        </div>
        <div class="commerce-info">
          <div class="commerce-card-heading">
            <h3>${gen.name}</h3>
            <span class="commerce-owned"><span class="owned-count">0</span> em uso</span>
          </div>
          <p class="desc-display">${gen.id === 'cursor' ? `Base: +${gen.clickBonus} por toque` : `Base: +${formatNumber(gen.basePPS)} /s por unidade`}</p>
          <div class="commerce-purchase">
          <div class="cost-display">Custo: ${formatNumber(gen.baseCost)}</div>
          <button type="button" class="commerce-buy" id="buy-${gen.id}">Comprar</button></div>
          <span class="commerce-card-hint"></span>
        </div>
      `;
      list.appendChild(el);

      const buyBtn = document.getElementById(`buy-${gen.id}`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.game) {
            const before = this.game.inventory[gen.id];
            this.game.buy(gen.id, gen.baseCost);
            if (this.game.inventory[gen.id] > before) document.getElementById('shop-feedback').textContent = `${this.game.buyAmount} × ${gen.name} adquiridos.`;
          }
        });
      }
    });
  }

  updateShop(score, inventory, buyAmount) {
    const setText = (id, value) => { const element = document.getElementById(id); if (element) element.innerText = value; };
    setText('shop-balance', formatNumber(score));
    setText('shop-production', `${formatNumber(this.game?.pps || 0)} /s`);
    setText('shop-owned-count', `${formatNumber(Object.values(inventory).reduce((sum, count) => sum + count, 0))} em uso`);
    setText('shop-lot-label', `Lotes de ${buyAmount} ${buyAmount === 1 ? 'unidade' : 'unidades'}`);
    const hasSkill = id => this.game?.skillTree?.hasSkill(id);
    const discount = (hasSkill('pas_2') ? 5 : 0) + (hasSkill('pas_2a') && [10, 100].includes(buyAmount) ? 5 : 0);
    setText('shop-discount-note', discount ? `${discount}% de desconto aplicado ao lote` : 'Preço total do lote');

    GeneratorsData.forEach(gen => {
      const owned = inventory[gen.id] || 0;
      const cost = this.game
        ? this.game.getPurchaseCost(gen.baseCost, owned, buyAmount)
        : calculateCost(gen.baseCost, owned, buyAmount);
      
      const card = document.getElementById(`gen-${gen.id}`);
      if (card) {
        const countEl = card.querySelector('.owned-count');
        const costEl = card.querySelector('.cost-display');
        const btn = document.getElementById(`buy-${gen.id}`);

        if (countEl) countEl.innerText = owned;
        if (costEl) costEl.innerText = `Custo (${buyAmount}x): ${formatNumber(cost)}`;
        
        card.dataset.state = score >= cost ? 'available' : 'unaffordable';
        const hint = card.querySelector('.commerce-card-hint');
        if (hint) hint.innerText = score >= cost ? 'Pronto para expandir seu império' : 'Faltam ' + formatNumber(Math.ceil(cost - score)) + ' paçocas para este lote';
        if (btn) {
          btn.disabled = score < cost;
          btn.innerText = 'Comprar ×' + buyAmount;
          btn.setAttribute('aria-label', 'Comprar ' + buyAmount + ' de ' + gen.name + ' por ' + formatNumber(cost) + ' paçocas');
        }
      }
    });
  }

  initUpgrades() {
    this.currentUpgFilter = 'all';
    this.currentUpgradeView = 'pending';
    document.querySelectorAll('[data-upgrade-view]').forEach(button => {
      button.addEventListener('click', () => {
        this.currentUpgradeView = button.dataset.upgradeView;
        document.querySelectorAll('[data-upgrade-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        if (this.game) this.updateUpgrades(this.game.score, this.game.inventory, this.game.boughtUpgrades);
      });
    });
    
    const filterBtns = document.querySelectorAll('.upg-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => { b.classList.toggle('active', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); });
        this.currentUpgFilter = e.currentTarget.dataset.filter;
        if (this.game) this.updateUpgrades(this.game.score, this.game.inventory, this.game.boughtUpgrades);
      });
    });

    if (!this.upgradesList) return;
    this.upgradesList.innerHTML = '';

    UpgradesData.forEach(upg => {
      const el = document.createElement('div');
      el.className = 'commerce-card commerce-upgrade';
      el.setAttribute('role', 'listitem');
      el.dataset.tier = upg.tier;
      el.id = `upg-${upg.id}`;
      el.dataset.type = upg.type;
      
      const tagTier = upg.tier === 'epic' ? 'Épica' : `Nível ${upg.tier}`;
      
      el.innerHTML = `
        <div class="commerce-icon" aria-hidden="true">
          ${upg.iconSvg}
        </div>
        <div class="commerce-info">
          <div class="commerce-card-heading">
            <h3>${upg.name}</h3>
            <span class="commerce-tier">${tagTier}</span>
          </div>
          <p class="desc-display">${upg.desc}</p>
          <div class="commerce-requirement" id="req-upg-${upg.id}"></div>
          <div class="commerce-requirement-track" aria-hidden="true"><span></span></div>
          <div class="commerce-purchase">
          <div class="cost-display">Custo: ${formatNumber(upg.cost)}</div>
          <button type="button" class="commerce-buy" id="buy-upg-${upg.id}">Melhorar</button></div>
          <span class="commerce-card-hint"></span>
        </div>
      `;
      this.upgradesList.appendChild(el);

      const buyBtn = document.getElementById(`buy-upg-${upg.id}`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.game) {
            const before = this.game.boughtUpgrades.length;
            this.game.buyUpgrade(upg.id);
            if (this.game.boughtUpgrades.length > before) document.getElementById('upgrades-feedback').textContent = `${upg.name} adquirida. O bônus já está ativo.`;
          }
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
    let availableCount = 0;
    const setText = (id, value) => { const element = document.getElementById(id); if (element) element.innerText = value; };
    const category = this.currentUpgFilter || 'all';
    const view = this.currentUpgradeView || 'pending';
    UpgradesData.forEach(upg => {
      const state = getUpgradeState(upg, score, inventory, boughtUpgrades);
      if (state === 'available' && (category === 'all' || category === upg.type)) availableCount++;
      const card = document.getElementById('upg-' + upg.id);
      if (!card) return;
      card.hidden = !matchesUpgradeView(upg, state, category, view);
      card.dataset.state = state;
      if (card.hidden) return;
      visibleCount++;
      const owned = inventory[upg.reqGen] || 0;
      const generator = GeneratorsData.find(item => item.id === upg.reqGen);
      const req = document.getElementById('req-upg-' + upg.id);
      if (req) req.innerText = state === 'locked'
        ? 'Requer ' + upg.reqCount + ' × ' + generator.name + ' · Você tem ' + owned
        : state === 'bought' ? '✓ Melhoria adquirida' : '✓ Requisito de estruturas concluído';
      const progress = card.querySelector('.commerce-requirement-track');
      if (progress) {
        progress.hidden = state !== 'locked';
        progress.firstElementChild.style.width = Math.min(100, owned / upg.reqCount * 100) + '%';
      }
      const hint = card.querySelector('.commerce-card-hint');
      if (hint) hint.innerText = state === 'unaffordable' ? 'Faltam ' + formatNumber(Math.ceil(upg.cost - score)) + ' paçocas'
        : state === 'available' ? 'Pronta para fortalecer seu império'
        : state === 'bought' ? 'Bônus aplicado ao seu império' : 'Expanda suas estruturas para desbloquear';
      const button = document.getElementById('buy-upg-' + upg.id);
      if (button) {
        button.disabled = state !== 'available';
        button.innerText = state === 'bought' ? '✓ Adquirida' : state === 'locked' ? 'Bloqueada' : 'Melhorar';
        button.setAttribute('aria-label', 'Adquirir ' + upg.name + ' por ' + formatNumber(upg.cost) + ' paçocas');
      }
    });
    setText('upgrades-balance', formatNumber(score));
    setText('upgrades-owned', UpgradesData.filter(upg => boughtUpgrades.includes(upg.id)).length + ' / ' + UpgradesData.length);
    setText('upgrades-available-count', availableCount + ' disponíveis');
    setText('upgrades-result-count', visibleCount + (visibleCount === 1 ? ' melhoria' : ' melhorias'));
    const empty = document.getElementById('upgrades-empty-state');
    if (empty) {
      empty.hidden = visibleCount > 0;
      if (!visibleCount) {
        setText('upgrades-empty-title', view === 'bought' ? 'Sua coleção começa aqui' : view === 'available' ? 'Seu próximo avanço está a caminho' : 'Tudo conquistado nesta categoria!');
        setText('upgrades-empty-description', view === 'bought' ? 'As melhorias que você adquirir vão aparecer aqui.' : view === 'available'
          ? 'Continue produzindo e construindo. As melhorias com requisitos e saldo suficientes aparecerão nesta lista.'
          : 'Veja seus bônus na aba Adquiridas ou explore outra categoria.');
      }
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

  updateClickStats(game) {
    updateClickStats(game);
  }

  updateFrenzy(timeLeft, multiplier = 1, duration = timeLeft) {
    const banner = document.getElementById('frenzy-banner');
    const timer = document.getElementById('frenzy-timer');
    
    if (banner && timer) {
      if (timeLeft > 0) {
        banner.hidden = false;
        timer.innerText = Math.ceil(timeLeft);
      } else {
        banner.hidden = true;
      }
    }
    const label = document.getElementById('frenzy-multiplier');
    if (label) label.innerText = `${multiplier}×`;
    const fill = document.getElementById('frenzy-time-fill');
    if (fill) fill.style.width = `${duration > 0 ? Math.min(100, Math.max(0, timeLeft / duration * 100)) : 0}%`;
    const area = document.getElementById('click-area');
    if (area) area.dataset.frenzy = String(timeLeft > 0);
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
