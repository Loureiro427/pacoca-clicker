import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { formatNumber } from './utils/format.js';

// Função global para alternar visualização de senha nos inputs
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

/**
 * Gerenciador das Telas de Loading e Autenticação (Paçoca Social)
 */
class AuthManager {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.init();
  }

  init() {
    this.startLoadingScreen();
    this.bindEvents();
  }

  startLoadingScreen() {
    const bar = document.getElementById('loading-bar-fill');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 12;
      if (bar) bar.style.width = `${Math.min(100, progress)}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) loadingScreen.style.display = 'none';

          // Se já marcou "Manter logado" anteriormente, entra direto
          const isLogged = localStorage.getItem('pacoca_logged_in') === 'true';
          if (isLogged) {
            this.finishAuth();
          } else {
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) authScreen.style.display = 'flex';
          }
        }, 300);
      }
    }, 100);
  }

  bindEvents() {
    const linkGoRegister = document.getElementById('link-go-register');
    const linkGoLogin = document.getElementById('link-go-login');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    if (linkGoRegister) {
      linkGoRegister.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginView) loginView.classList.remove('active');
        if (registerView) registerView.classList.add('active');
      });
    }

    if (linkGoLogin) {
      linkGoLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerView) registerView.classList.remove('active');
        if (loginView) loginView.classList.add('active');
      });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', () => {
        const remember = document.getElementById('remember-me')?.checked;
        if (remember) {
          localStorage.setItem('pacoca_logged_in', 'true');
        }
        this.finishAuth();
      });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', () => {
        localStorage.setItem('pacoca_logged_in', 'true');
        this.finishAuth();
      });
    }
  }

  finishAuth() {
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.style.display = 'none';

    if (this.onAuthSuccess) {
      this.onAuthSuccess();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o gerenciador de autenticação antes do loop principal do jogo
  new AuthManager(() => {
    initGame();
  });
});

/**
 * Inicialização dos sistemas do jogo Paçoca Clicker
 */
function initGame() {
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
}

/**
 * Gera partículas de números a flutuar na tela na posição do toque.
 * @param {number} x Coordenada X do toque
 * @param {number} y Coordenada Y do toque
 * @param {number} value Valor ganho no clique
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