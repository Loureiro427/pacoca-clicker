import test from 'node:test';
import assert from 'node:assert/strict';
import { initAppNavigation, trackOverlay, waitForAppNavigation, initMobileTextProtection } from './AppNavigation.js';

test('voltar fecha camada primeiro, retorna à aba anterior e respeita bloqueio de fechamento', async t => {
  const previous = { document: globalThis.document, window: globalThis.window, history: globalThis.history, requestAnimationFrame: globalThis.requestAnimationFrame };
  const listeners = {};
  const pages = ['click-area', 'shop-area', 'profile-area'].map(id => {
    const classes = new Set(['tab-content', ...(id === 'click-area' ? ['active'] : [])]);
    return { id, scrollTop: 0, classList: { contains: value => classes.has(value), toggle: (value, on) => on ? classes.add(value) : classes.delete(value) } };
  });
  globalThis.document = {
    getElementById: id => pages.find(page => page.id === id),
    querySelectorAll: selector => selector === '.tab-content' ? pages : [],
    addEventListener() {},
  };
  globalThis.window = { addEventListener: (name, handler) => { listeners[name] = handler; } };
  globalThis.requestAnimationFrame = callback => callback();
  const states = [];
  let index = 0;
  globalThis.history = {
    state: null,
    replaceState(state) { this.state = state; states[index] = state; },
    pushState(state) { states.splice(index + 1); states[++index] = state; this.state = state; },
    back() { if (!index) return; this.state = states[--index]; queueMicrotask(() => listeners.popstate({ state: this.state })); },
  };
  t.after(() => Object.assign(globalThis, previous));
  const navigation = initAppNavigation();
  navigation.navigate('shop-area');
  navigation.navigate('profile-area');
  let closes = 0;
  trackOverlay({}, () => { closes++; return true; });
  history.back();
  await Promise.resolve();
  assert.equal(closes, 1);
  assert.equal(pages[2].classList.contains('active'), true);
  history.back();
  await Promise.resolve();
  assert.equal(pages[1].classList.contains('active'), true);
  const element = {};
  const remove = trackOverlay(element, () => false);
  history.back();
  await Promise.resolve();
  assert.equal(history.state.pacoca.layer !== undefined, true);
  remove();
  await waitForAppNavigation();
  assert.equal(pages[1].classList.contains('active'), true);
});

test('bloqueio de cópia no mobile preserva edição e colagem em campos', t => {
  const previous = { document: globalThis.document, window: globalThis.window };
  const handlers = {};
  globalThis.document = { addEventListener: (name, handler) => { handlers[name] = handler; } };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  t.after(() => Object.assign(globalThis, previous));
  initMobileTextProtection();
  let prevented = 0;
  handlers.copy({ target: { closest: () => null }, preventDefault: () => prevented++ });
  assert.equal(prevented, 1);
  handlers.copy({ target: { closest: () => ({ tagName: 'TEXTAREA' }) }, preventDefault: () => prevented++ });
  assert.equal(prevented, 1);
  assert.equal(handlers.paste, undefined);
});
