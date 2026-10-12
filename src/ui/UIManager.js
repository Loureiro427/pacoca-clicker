import { formatNumber } from '../utils/format.js';
import { GeneratorsData } from '../game/Generators.js';
import { UpgradesData } from '../game/Upgrades.js';
import { calculateCost } from '../game/Economy.js';

export class UIManager {
  constructor() {
    this.scoreDisplay = document.getElementById('score-display');
    this.ppsDisplay = document.getElementById('pps-display');
    this.shopArea = document.getElementById('shop-area');
    this.upgradesList = document.getElementById('upgrades-list');
    this.game = null;
  }

  init(gameInstance) {
    this.game = gameInstance;
    this.initShop();
    this.initUpgrades();
    this.initTabs();
    this.updateScore(this.game.score, this.game.pps);
    this.updateShop(this.game.score, this.game.inventory, this.game.buyAmount);
    this.updateUpgrades(this.game.score, this.game.inventory, this.game.boughtUpgrades);
  }

  updateScore(score, pps) {
    this.scoreDisplay.innerText = formatNumber(Math.floor(score));
    this.ppsDisplay.innerText = `${formatNumber(pps)} p/s`;
  }

  initShop() {
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
        this.game.setBuyAmount(amount);
      });
    });

    const list = document.getElementById('generators-list');
    GeneratorsData.forEach(gen => {
      const el = document.createElement('div');
      el.className = 'generator-card';
      el.id = `gen-${gen.id}`;
      el.innerHTML = `
        <div class="generator-icon-wrapper">
          ${gen.iconSvg}
        </div>
        <div class="generator-info">
          <h3>${gen.name} <span class="owned-count">(0)</span></h3>
          <small class="desc-display">${gen.desc}</small>
          <div class="cost-display">Custo: ${formatNumber(gen.baseCost)}</div>
        </div>
        <button class="buy-btn" id="buy-${gen.id}">Comprar</button>
      `;
      list.appendChild(el);

      document.getElementById(`buy-${gen.id}`).addEventListener('click', () => {
        this.game.buy(gen.id, gen.baseCost);
      });
    });
  }

  updateShop(score, inventory, buyAmount) {
    GeneratorsData.forEach(gen => {
      const owned = inventory[gen.id] || 0;
      const cost = calculateCost(gen.baseCost, owned, buyAmount);
      
      const card = document.getElementById(`gen-${gen.id}`);
      if (card) {
        card.querySelector('.owned-count').innerText = `(${owned})`;
        card.querySelector('.cost-display').innerText = `Custo (${buyAmount}x): ${formatNumber(cost)}`;
        
        const btn = document.getElementById(`buy-${gen.id}`);
        btn.disabled = score < cost;
      }
    });
  }

  initUpgrades() {
    this.upgradesList.innerHTML = '';
    UpgradesData.forEach(upg => {
      const el = document.createElement('div');
      el.className = 'generator-card';
      el.id = `upg-${upg.id}`;
      el.style.display = 'none'; // Fica oculto até atingir os pré-requisitos
      el.innerHTML = `
        <div class="generator-icon-wrapper">
          ${upg.iconSvg}
        </div>
        <div class="generator-info">
          <h3>${upg.name}</h3>
          <small class="desc-display">${upg.desc}</small>
          <div class="cost-display">Custo: ${formatNumber(upg.cost)}</div>
        </div>
        <button class="buy-btn" id="buy-upg-${upg.id}">Melhorar</button>
      `;
      this.upgradesList.appendChild(el);

      document.getElementById(`buy-upg-${upg.id}`).addEventListener('click', () => {
        this.game.buyUpgrade(upg.id);
      });
    });
  }

  updateUpgrades(score, inventory, boughtUpgrades) {
    let visibleCount = 0;

    UpgradesData.forEach(upg => {
      const card = document.getElementById(`upg-${upg.id}`);
      if (!card) return;

      const isBought = boughtUpgrades.includes(upg.id);
      const reqOwned = inventory[upg.reqGen] || 0;
      const isUnlocked = reqOwned >= upg.reqCount;

      if (isBought) {
        card.style.display = 'none';
      } else if (isUnlocked) {
        card.style.display = 'flex';
        visibleCount++;
        const btn = document.getElementById(`buy-upg-${upg.id}`);
        btn.disabled = score < upg.cost;
      } else {
        card.style.display = 'none';
      }
    });

    // Mensagem de estado caso nenhuma melhoria esteja visível
    let emptyEl = document.getElementById('upgrades-empty-state');
    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'upgrades-empty-state';
        emptyEl.className = 'empty-state';
        this.upgradesList.appendChild(emptyEl);
      }
      
      const allBought = UpgradesData.every(u => boughtUpgrades.includes(u.id));
      if (allBought) {
        emptyEl.innerHTML = `
          <div class="empty-state-icon">🎉</div>
          <h3>Todas as melhorias adquiridas!</h3>
          <p>Você já comprou todos os upgrades disponíveis até o momento.</p>
        `;
      } else {
        emptyEl.innerHTML = `
          <div class="empty-state-icon">🔒</div>
          <h3>Nenhuma melhoria disponível</h3>
          <p>Compre mais estruturas na <strong>Loja</strong> para desbloquear novos upgrades!</p>
        `;
      }
      emptyEl.style.display = 'block';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  initTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        
        btns.forEach(b => b.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        
        targetBtn.classList.add('active');
        document.getElementById(targetBtn.dataset.target).classList.add('active');
      });
    });
  }
}