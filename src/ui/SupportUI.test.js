import test from 'node:test';
import assert from 'node:assert/strict';
import { initSupportUI } from './SupportUI.js';
import { AppDialog } from './AppDialog.js';

function setup(t, client) {
  const previous = globalThis.document;
  const open = AppDialog.open;
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { events: {}, value: '', children: [],
      addEventListener(name, callback) { this.events[name] = callback; },
      appendChild(child) { this.children.push(child); }, append(...children) { this.children.push(...children); },
      showModal() { this.open = true; }, close() { this.open = false; this.events.close?.(); },
      reset() { get('report-message').value = ''; } });
    return elements.get(id);
  };
  let success = 0;
  AppDialog.open = async () => { success++; };
  globalThis.document = { getElementById: get, createElement: () => ({}) };
  t.after(() => { globalThis.document = previous; AppDialog.open = open; });
  get('report-type').value = 'problem';
  get('report-category').value = 'save';
  initSupportUI({ user: { id: 1 }, client });
  return { get, success: () => success };
}

test('formulário preserva texto em erro e nunca exibe falso sucesso', async t => {
  const { get, success } = setup(t, { send: async () => { throw new Error('Sem conexão'); } });
  get('report-message').value = 'Meu progresso sumiu.';
  await get('report-form').events.submit({ preventDefault() {} });
  assert.equal(get('report-message').value, 'Meu progresso sumiu.');
  assert.equal(get('report-error').textContent, 'Sem conexão');
  assert.equal(get('report-cancel').disabled, false);
  assert.equal(success(), 0);
});

test('contador respeita 500 caracteres e sucesso limpa o formulário', async t => {
  let sends = 0;
  const { get, success } = setup(t, { send: async () => { sends++; return { sent: true }; } });
  get('report-message').value = 'a'.repeat(501);
  get('report-message').events.input();
  assert.equal(get('report-submit').disabled, true);
  await get('report-form').events.submit({ preventDefault() {} });
  assert.equal(sends, 0);
  get('report-message').value = 'a'.repeat(500);
  get('report-message').events.input();
  assert.equal(get('report-count').textContent, '500/500');
  await get('report-form').events.submit({ preventDefault() {} });
  assert.equal(sends, 1);
  assert.equal(success(), 1);
  assert.equal(get('report-message').value, '');
});
