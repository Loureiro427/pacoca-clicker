import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SaveManager } from '../storage/SaveManager.js';
import { AppDialog } from '../ui/AppDialog.js';

let navigation = null;
let pendingBack = Promise.resolve();
let finishBack = null;

export function waitForAppNavigation() { return pendingBack; }

export function trackDialog(dialog) {
  if (!navigation) return;
  const remove = navigation.layer(dialog, () => {
    const accepted = dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (!accepted && dialog.open) return false;
    if (dialog.open) dialog.close();
    return true;
  });
  dialog.addEventListener('close', remove, { once: true });
  return remove;
}

export function trackOverlay(element, close) {
  return navigation?.layer(element, close) || (() => {});
}

export function initAppNavigation() {
  if (navigation) return navigation;
  const session = crypto.randomUUID();
  let page = 'click-area';
  let depth = 0;
  let layers = [];
  let processingBack = false;
  let exitPending = false;
  const scroll = new Map();
  const state = (extra = {}) => ({ session, page, depth, ...extra });
  const push = extra => { depth++; history.pushState({ pacoca: state(extra) }, ''); };
  const show = target => {
    const element = document.getElementById(target);
    if (!element?.classList.contains('tab-content')) return;
    scroll.set(page, document.getElementById(page)?.scrollTop || 0);
    page = target;
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.toggle('active', tab.id === page));
    document.querySelectorAll('.nav-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.target === page);
      button.setAttribute('aria-current', button.dataset.target === page ? 'page' : 'false');
    });
    requestAnimationFrame(() => { element.scrollTop = scroll.get(page) || 0; });
  };
  history.replaceState({ ...history.state, pacoca: state() }, '');
  navigation = {
    navigate(target) {
      if (target === page || !document.getElementById(target)?.classList.contains('tab-content')) return;
      show(target);
      push();
    },
    layer(element, close) {
      const existing = layers.find(layer => layer.element === element);
      if (existing) return existing.remove;
      const key = crypto.randomUUID();
      const remove = () => {
        if (!layers.some(layer => layer.key === key)) return;
        layers = layers.filter(layer => layer.key !== key);
        if (!processingBack && history.state?.pacoca?.layer === key) {
          pendingBack = new Promise(resolve => { finishBack = resolve; });
          history.back();
        }
      };
      layers.push({ key, element, close, remove });
      push({ layer: key });
      return remove;
    },
  };
  window.addEventListener('popstate', event => {
    finishBack?.();
    finishBack = null;
    const destination = event.state?.pacoca;
    const top = layers.at(-1);
    if (top && top.key !== destination?.layer) {
      processingBack = true;
      const closed = top.close();
      processingBack = false;
      if (closed === false) { depth = destination?.depth ?? depth; push({ layer: top.key }); return; }
      layers = layers.filter(layer => layer !== top);
    }
    if (destination?.session === session) {
      depth = destination.depth;
      show(destination.page);
    }
  });
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => navigation.navigate(button.dataset.target));
  });
  if (Capacitor.getPlatform() === 'android') {
    App.addListener('backButton', async () => {
      const top = layers.at(-1);
      if (top) { top.close(); return; }
      if (depth > 0) { history.back(); return; }
      if (exitPending) return;
      exitPending = true;
      try {
        const accepted = await AppDialog.open({
          icon: '↗', title: 'Encerrar por agora?', message: 'Vamos tentar salvar antes de sair. Sem conexão, a sincronização pode ficar pendente.',
          confirmText: 'Fechar o jogo', cancelText: 'Continuar jogando',
        });
        if (accepted) {
          window.dispatchEvent(new Event('pacoca:before-exit'));
          await Promise.race([SaveManager.flush().catch(() => {}), new Promise(resolve => setTimeout(resolve, 2000))]);
          await App.exitApp();
        }
      } finally { exitPending = false; }
    }).catch(() => console.warn('Não foi possível configurar o botão Voltar do Android.'));
  }
  return navigation;
}

export function initMobileTextProtection() {
  const isMobile = () => Capacitor.isNativePlatform() || window.matchMedia?.('(pointer: coarse)').matches;
  const preventOutsideFields = event => {
    if (isMobile() && !event.target.closest?.('input, textarea, [contenteditable="true"]')) event.preventDefault();
  };
  for (const name of ['copy', 'cut', 'contextmenu', 'selectstart']) document.addEventListener(name, preventOutsideFields);
}
