import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager } from './SaveManager.js';

function setup(t) {
  const storage = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  Object.assign(SaveManager, { saveKey: `${SaveManager.BASE_KEY}:test`, pendingState: null,
    syncPromise: null, remoteSave: null, remoteReset: null, onSyncStatus: null,
    resetting: false, revision: 0 });
  t.after(() => {
    clearTimeout(SaveManager.syncTimer);
    globalThis.localStorage = previousStorage;
  });
  return storage;
}

test('falha de envio preserva o progresso mais recente na fila', async t => {
  setup(t);
  let rejectSend;
  SaveManager.remoteSave = () => new Promise((_resolve, reject) => { rejectSend = reject; });
  SaveManager.save({ score: 10 });
  const sending = SaveManager.flush();
  SaveManager.save({ score: 20 });
  rejectSend(new Error('offline'));
  await assert.rejects(sending, /offline/);
  assert.equal(SaveManager.pendingState.score, 20);
  assert.equal(SaveManager.load().score, 20);
});

test('validação e backup usam a chave do usuário sem afetar outra conta', t => {
  const storage = setup(t);
  storage.set(`${SaveManager.BASE_KEY}:other`, JSON.stringify({ score: 99 }));
  storage.set(SaveManager.saveKey, JSON.stringify({ score: 5, unlockedSkills: 'inválido' }));
  const warn = console.warn;
  console.warn = () => {};
  try { assert.equal(SaveManager.load(), null); } finally { console.warn = warn; }
  assert.ok(storage.has(`${SaveManager.saveKey}_backup`));
  assert.equal(JSON.parse(storage.get(`${SaveManager.BASE_KEY}:other`)).score, 99);
});
