import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { formatNumber } from './utils/format.js';
import { PacocaApi } from './api/PacocaApi.js';
import { AuthManager } from './systems/AuthManager.js';
import { SaveManager } from './storage/SaveManager.js';
import { RankingUI } from './ui/RankingUI.js';

const CDN_URL = (import.meta.env.VITE_PACOCA_CDN_URL || 'https://cdn.pacoca.net/pacoca-prod-files').replace(/\/+$/, '');

const api = new PacocaApi();

document.addEventListener('DOMContentLoaded', () => {
  const auth = new AuthManager(api, async ({ user, bootstrap }) => {
    hydrateUserProfile(user);

    await SaveManager.configure({
      userId: user.id,
      remoteState: bootstrap.profile?.state || null,
      remoteRevision: bootstrap.profile?.revision || 0,
      saveRemote: (state, revision) => api.saveProgress(state, revision),
      resetRemote: () => api.resetProgress(),
      onSyncStatus: updateSyncStatus,
    });

    const ranking = new RankingUI(api);
    ranking.init(bootstrap.ranking);
    initGame();
  });

  auth.init();
});

function hydrateUserProfile(user) {
  const name = document.getElementById('clicker-profile-name');
  const username = document.getElementById('clicker-profile-username');
  const avatar = document.getElementById('clicker-profile-avatar');

  if (name) name.textContent = user?.name || 'Jogador';
  if (username) username.textContent = user?.user_name ? `@${user.user_name}` : '';
  if (avatar) {
    avatar.src = avatarUrl(user?.img_account);
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = '/pacoca.png';
    };
  }
}

function avatarUrl(path) {
  if (!path) return '/pacoca.png';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${CDN_URL}/${String(path).replace(/^\/+/, '')}`;
}

function updateSyncStatus(status) {
  const element = document.getElementById('clicker-sync-status');
  if (!element) return;

  const labels = {
    syncing: 'Sincronizando...',
    synced: 'Progresso salvo na nuvem',
    offline: 'Sem conexão — progresso salvo neste dispositivo',
    conflict: 'Progresso mais recente encontrado na nuvem',
  };
  element.textContent = labels[status] || '';
  element.dataset.status = status;
}

/**
 * Inicialização dos sistemas do jogo Paçoca Clicker
 */
function initGame() {
  const ui = new UIManager();
  const game = new Game(ui);

  ui.init(game);

  // O login é assíncrono; libera o áudio na próxima interação real com o jogo.
  // Mantém o listener para retomar o contexto após voltar de outra aba/app.
  document.addEventListener('pointerdown', () => game.audio.init(), { capture: true });
  document.addEventListener('keydown', () => game.audio.init(), { capture: true });

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

  const persistBeforeLeaving = () => {
    game.saveGame();
    SaveManager.flush().catch(() => {});
  };
  window.addEventListener('pacoca:before-logout', persistBeforeLeaving);
  window.addEventListener('pagehide', persistBeforeLeaving);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistBeforeLeaving();
  });

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
