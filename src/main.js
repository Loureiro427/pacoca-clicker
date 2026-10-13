import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { formatNumber } from './utils/format.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  const game = new Game(ui);
  
  ui.init(game);

  // Selecionar o botão do mascote Paçoca
  const pacocaBtn = document.getElementById('pacoca-button');

  if (pacocaBtn) {
    // Bloqueios definitivos contra arrastar ou selecionar a imagem no navegador
    pacocaBtn.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });

    pacocaBtn.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Evento de toque instantâneo para mobile e desktop
    pacocaBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); // Previne gestos de zoom e arrasto nativos
      
      game.click();
      
      // Criar o número flutuante no ponto exato do toque/clique
      createFloatingNumber(e.clientX, e.clientY, game.clickValue);

      // Liberta o foco do elemento para evitar seleções indesejadas
      if (typeof pacocaBtn.blur === 'function') {
        pacocaBtn.blur();
      }
    });
  }

  // Inicializa a chuva de partículas de fundo
  initBackgroundRain();
});

/**
 * Gera partículas de números a flutuar no ecrã na posição do toque.
 * @param {number} x - Coordenada X do toque
 * @param {number} y - Coordenada Y do toque
 * @param {number} value - Valor ganho no clique
 */
function createFloatingNumber(x, y, value) {
  const floater = document.createElement('div');
  floater.classList.add('floating-number');
  
  // Arredonda e formata para garantir números inteiros limpos
  const cleanValue = Math.round(value);
  floater.innerText = `+${formatNumber(cleanValue)}`;
  
  const randomOffsetX = (Math.random() - 0.5) * 40;
  
  const posX = x || window.innerWidth / 2;
  const posY = y || window.innerHeight / 2;

  floater.style.left = `${posX + randomOffsetX}px`;
  floater.style.top = `${posY}px`;
  
  document.body.appendChild(floater);
  
  // Remover o elemento do DOM após o término da animação
  setTimeout(() => {
    floater.remove();
  }, 800);
}

/**
 * Gerar chuva de mini paçocas ao fundo (Background Particle Rain)
 */
function initBackgroundRain() {
  const container = document.getElementById('bg-rain-container');
  if (!container) return;

  container.innerHTML = ''; // Limpa elementos anteriores

  const count = 12; // Quantidade de paçocas a cair ao fundo

  for (let i = 0; i < count; i++) {
    const el = document.createElement('img');
    el.src = '/pacoca.png';
    el.className = 'falling-pacoca';
    
    // Posição X aleatória
    el.style.left = `${Math.random() * 100}%`;
    
    // Duração e desvio aleatórios
    const duration = 6 + Math.random() * 8; // 6s a 14s
    const delay = Math.random() * 8;
    const size = 24 + Math.random() * 20; // Tamanhos variados

    el.style.width = `${size}px`;
    el.style.height = 'auto';
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;

    container.appendChild(el);
  }
}