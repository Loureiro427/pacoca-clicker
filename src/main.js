import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';

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
      e.preventDefault(); // Previne gestos de zoom e arrasto nativos do navegador
      
      game.click();
      
      // Criar o número flutuante no ponto exato do toque/clique
      createFloatingNumber(e.clientX, e.clientY, game.clickValue);

      // Liberta o foco do elemento para evitar seleções indesejadas
      if (typeof pacocaBtn.blur === 'function') {
        pacocaBtn.blur();
      }
    });
  }
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
  floater.innerText = `+${value}`;
  
  // Ligeiro desvio aleatório para evitar sobreposição total em cliques rápidos
  const randomOffsetX = (Math.random() - 0.5) * 40;
  
  // Posição de reserva caso as coordenadas não venham preenchidas
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