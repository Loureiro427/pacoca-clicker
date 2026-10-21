import test from 'node:test';
import assert from 'node:assert/strict';
import { AppDialog } from './AppDialog.js';
import { UIManager } from './UIManager.js';
import { Game } from '../game/Game.js';
import { SaveManager } from '../storage/SaveManager.js';

class Element {
  children = [];
  listeners = {};
  attributes = {};
  style = {};
  setAttribute(key, value) { this.attributes[key] = value; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  showModal() { this.open = true; }
  close() { this.open = false; this.listeners.close?.(); }
  remove() { this.removed = true; }
  cloneNode() { return new Element(); }
}

function setup(t) {
  const previous = globalThis.document;
  const body = new Element();
  let focusCount = 0;
  globalThis.document = { body, createElement: () => new Element(),
    activeElement: { isConnected: true, focus: () => focusCount++ } };
  t.after(() => { globalThis.document = previous; });
  return { body, focusCount: () => focusCount };
}

test('confirmação personalizada cancela com Escape e devolve o foco', async t => {
  const { body, focusCount } = setup(t);
  const pending = AppDialog.show({ title: 'Apagar?', message: 'Teste', cancelText: 'Manter', danger: true });
  const dialog = body.children[0];
  assert.equal(dialog.open, true);
  assert.equal(dialog.attributes['aria-labelledby'], 'app-dialog-title');
  const actions = dialog.children[0].children.at(-1);
  assert.equal(actions.children[0].autofocus, true);
  let prevented = false;
  dialog.listeners.cancel({ preventDefault() { prevented = true; } });
  assert.equal(await pending, false);
  assert.equal(prevented, true);
  assert.equal(dialog.removed, true);
  assert.equal(focusCount(), 1);
});

test('avisos em fila abrem um por vez e exibem conteúdo como texto', async t => {
  const { body } = setup(t);
  const first = AppDialog.open({ title: '<img onerror=teste>', message: 'Primeiro' });
  const second = AppDialog.open({ title: 'Segundo', message: 'Mensagem' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(body.children.length, 1);
  const dialog = body.children[0];
  assert.equal(dialog.children[0].children[2].textContent, '<img onerror=teste>');
  dialog.children[0].children.at(-1).children[0].listeners.click();
  assert.equal(await first, true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(body.children.length, 2);
  body.children[1].children[0].children.at(-1).children[0].listeners.click();
  assert.equal(await second, true);
});

test('cancelar a confirmação de reset não apaga o progresso', async () => {
  const originalReset = SaveManager.reset;
  let resets = 0;
  SaveManager.reset = async () => { resets++; };
  try {
    await Game.prototype.resetProgress.call({ ui: { showDialog: async () => false } });
    assert.equal(resets, 0);
  } finally { SaveManager.reset = originalReset; }
});

test('coleta offline bloqueia cliques repetidos e credita a recompensa uma vez', t => {
  setup(t);
  const elements = new Map(['offline-modal', 'offline-time-val', 'offline-amount-val', 'btn-collect-normal', 'btn-collect-ad'].map(id => [id, new Element()]));
  globalThis.document.getElementById = id => elements.get(id);
  for (const id of ['btn-collect-normal', 'btn-collect-ad']) {
    elements.get(id).parentNode = { replaceChild(replacement) { elements.set(id, replacement); } };
  }
  const originalTimeout = globalThis.setTimeout;
  let finish;
  globalThis.setTimeout = callback => { finish = callback; };
  t.after(() => { globalThis.setTimeout = originalTimeout; });
  let normal = 0;
  let doubled = 0;
  let dialog;
  UIManager.prototype.showOfflineModal.call({ showDialog(options) { dialog = options; } },
    60, 100, () => normal++, () => doubled++);
  const ad = elements.get('btn-collect-ad');
  ad.listeners.click();
  ad.listeners.click();
  elements.get('btn-collect-normal').listeners.click();
  assert.equal(ad.disabled, true);
  finish();
  assert.equal(normal, 0);
  assert.equal(doubled, 1);
  assert.equal(dialog.reward.value, '+200');
  assert.equal(elements.get('offline-modal').style.display, 'none');
});
