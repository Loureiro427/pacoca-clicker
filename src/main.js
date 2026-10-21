import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { bindClickExperience } from './ui/ClickExperience.js';
import { createPacocaParticles } from './ui/PacocaParticles.js';
import { PacocaApi } from './api/PacocaApi.js';
import { AuthManager } from './systems/AuthManager.js';
import { SaveManager } from './storage/SaveManager.js';
import { RankingUI } from './ui/RankingUI.js';
import { updateAccountProfile, updateAccountSyncStatus } from './ui/ProfileAccount.js';

const api = new PacocaApi();

document.addEventListener('DOMContentLoaded', () => {
  const auth = new AuthManager(api, async ({ user, bootstrap }) => {
    updateAccountProfile(user, { isDemo: api.isMocked });

    await SaveManager.configure({
      userId: user.id,
      remoteState: bootstrap.profile?.state || null,
      remoteRevision: bootstrap.profile?.revision || 0,
      saveRemote: (state, revision) => api.saveProgress(state, revision),
      resetRemote: () => api.resetProgress(),
      onSyncStatus: updateAccountSyncStatus,
    });

    const ranking = new RankingUI(api);
    ranking.init(bootstrap.ranking);
    initGame();
  });

  auth.init();
});

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

  bindClickExperience(game, { particles: createPacocaParticles(game) });

  const persistBeforeLeaving = () => {
    game.saveGame();
    SaveManager.flush().catch(() => {});
  };
  window.addEventListener('pacoca:before-logout', persistBeforeLeaving);
  window.addEventListener('pagehide', persistBeforeLeaving);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistBeforeLeaving();
  });

}
