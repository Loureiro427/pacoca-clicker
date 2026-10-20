import { formatNumber } from '../utils/format.js';

export class GoldenPacoca {
  constructor(game) {
    this.game = game;
    this.element = null;
    this.spawnTimer = null;
    this.despawnTimer = null;
    this.scheduleNextSpawn();
  }

  scheduleNextSpawn() {
    let minDelay = 60000;
    let maxDelay = 120000;

    if (this.game && this.game.skillTree && this.game.skillTree.hasSkill('alc_1')) {
      minDelay *= 0.8;
      maxDelay *= 0.8;
    }

    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    this.spawnTimer = setTimeout(() => {
      this.spawn();
    }, delay);
  }

  spawn() {
    if (this.element) return; 

    const el = document.createElement('div');
    el.className = 'golden-pacoca';
    
    if (this.game && this.game.skillTree && this.game.skillTree.hasSkill('alc_3')) {
      el.classList.add('celestial-size');
    }

    const maxX = window.innerWidth - 90;
    const maxY = window.innerHeight - 220;
    const posX = Math.max(20, Math.floor(Math.random() * maxX));
    const posY = Math.max(120, Math.floor(Math.random() * maxY));

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    el.innerHTML = `<img src="/pacoca.png" alt="Paçoca Dourada" draggable="false">`;

    el.addEventListener('dragstart', (e) => e.preventDefault());
    
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.collect();
    });

    document.body.appendChild(el);
    this.element = el;

    let despawnTime = 10000;
    if (this.game && this.game.skillTree && this.game.skillTree.hasSkill('alc_3')) {
      despawnTime = 15000;
    }

    this.despawnTimer = setTimeout(() => {
      this.remove();
      this.scheduleNextSpawn();
    }, despawnTime);
  }

  collect() {
    if (!this.element) return;

    let gotFreeChip = false;
    if (this.game.skillTree && this.game.skillTree.hasSkill('alc_8') && Math.random() < 0.03) {
      this.game.prestigeChips += 1;
      this.game.recalculateStats();
      gotFreeChip = true;
    }

    let multiplierReward = 1;
    if (this.game.skillTree && this.game.skillTree.hasSkill('alc_6') && Math.random() < 0.15) {
      multiplierReward = 2;
    }

    const isFrenzy = Math.random() > 0.5;

    if (isFrenzy || this.game.pps === 0) {
      let frenzyDuration = 20;
      if (this.game.skillTree && this.game.skillTree.hasSkill('alc_2')) frenzyDuration += 10;
      
      let frenzyMult = 7;
      if (this.game.skillTree && this.game.skillTree.hasSkill('alc_2a')) frenzyMult = 10;

      this.game.startFrenzy(frenzyMult, frenzyDuration);
      
      let msg = `Ativado por ${frenzyDuration} segundos!`;
      if (gotFreeChip) msg += ` ✨ Sorte: +1 Ouro!`;
      
      // Chamando a notificação UI bonitinha em vez do alert
      if (this.game.ui && this.game.ui.showNotification) {
        this.game.ui.showNotification(`🔥 Frenesi ${frenzyMult}x!`, msg);
      }

    } else {
      const bonus = Math.max(this.game.pps * 240, this.game.clickValue * 10) * multiplierReward;
      this.game.score += bonus;
      this.game.totalEarned += bonus;
      
      let msg = `+${formatNumber(Math.floor(bonus))} instantâneas!`;
      if (gotFreeChip) msg += ` 🌟 Sorte: +1 Ouro!`;
      
      // Chamando a notificação UI bonitinha em vez do alert
      if (this.game.ui && this.game.ui.showNotification) {
        this.game.ui.showNotification("✨ Prêmio Dourado!", msg);
      }
    }

    this.remove();
    this.scheduleNextSpawn();
  }

  remove() {
    if (this.despawnTimer) clearTimeout(this.despawnTimer);
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}