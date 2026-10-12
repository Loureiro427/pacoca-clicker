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
    // Intervalo aleatório entre 60 e 120 segundos
    const delay = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
    
    this.spawnTimer = setTimeout(() => {
      this.spawn();
    }, delay);
  }

  spawn() {
    if (this.element) return; // Garante que só existe uma por vez

    const el = document.createElement('div');
    el.className = 'golden-pacoca';
    
    // Posição aleatória na tela (evitando as bordas e barras)
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 200;
    const posX = Math.max(20, Math.floor(Math.random() * maxX));
    const posY = Math.max(100, Math.floor(Math.random() * maxY));

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    el.innerHTML = `<img src="/pacoca.png" alt="Paçoca Dourada" draggable="false">`;

    // Previne arrastos e capta o clique
    el.addEventListener('dragstart', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.collect();
    });

    document.body.appendChild(el);
    this.element = el;

    // Desaparece após 10 segundos se não for clicada
    this.despawnTimer = setTimeout(() => {
      this.remove();
      this.scheduleNextSpawn();
    }, 10000);
  }

  collect() {
    if (!this.element) return;

    // Sorteia o tipo de bônus (50% chance para cada)
    const isFrenzy = Math.random() > 0.5;

    if (isFrenzy || this.game.pps === 0) {
      // Ativa Frenesi de 7x por 20 segundos
      this.game.startFrenzy(7, 20);
    } else {
      // Recompensa Instantânea: 15 minutos de produção atual (mínimo de 15 x valor do clique)
      const bonus = Math.max(this.game.pps * 900, this.game.clickValue * 15);
      this.game.score += bonus;
      this.game.totalEarned += bonus;
      alert(`✨ Paçoca Dourada! Você ganhou +${formatNumber(Math.floor(bonus))} Paçocas instantâneas!`);
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