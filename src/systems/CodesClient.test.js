import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCode, validateCampaign, isTeamAccount, redeemCode } from './CodesClient.js';
import { SaveManager } from '../storage/SaveManager.js';

test('códigos normalizam caixa e recusam conteúdo inválido', () => {
  assert.equal(normalizeCode('  pacoca_2026 '), 'PACOCA_2026');
  for (const value of ['', 'ab', 'a'.repeat(41), '<script>', 'paçoca']) assert.throws(() => normalizeCode(value));
});
test('campanhas validam quantidade, validade e limite antes de enviar', () => {
  const base = { code: 'PACOCA', reward_type: 'coins', amount: '100', active: true };
  assert.deepEqual(validateCampaign(base), { code: 'PACOCA', reward_type: 'coins', amount: 100, active: true, expires_at: null, max_redemptions: null });
  for (const change of [{ amount: -1 }, { amount: 1.5 }, { amount: Infinity }, { reward_type: 'admin' }, { expires_at: 'inválida' }, { expires_at: '2020-01-01' }, { max_redemptions: 0 }]) {
    assert.throws(() => validateCampaign({ ...base, ...change }));
  }
});
test('entrada da equipe considera somente os nomes solicitados', () => {
  for (const user_name of ['joao', '@Bochecha', 'BOCHECHA']) assert.equal(isTeamAccount({ user_name }), true);
  for (const user_name of ['joao2', 'bochecha_admin', '', undefined]) assert.equal(isTeamAccount({ user_name }), false);
});
test('resgate aplica apenas estado confirmado com revisão posterior e bloqueia snapshot antigo', async () => {
  const original = { flush: SaveManager.flush, validate: SaveManager.validate, resetting: SaveManager.resetting, revision: SaveManager.revision, pendingState: SaveManager.pendingState, syncPromise: SaveManager.syncPromise };
  const oldStorage = globalThis.localStorage;
  let written;
  globalThis.localStorage = { setItem: (key, state) => { written = JSON.parse(state); } };
  SaveManager.flush = async () => {};
  SaveManager.pendingState = null;
  SaveManager.syncPromise = null;
  SaveManager.revision = 4;
  const game = { saveGame() {} };
  try {
    for (const response of [{ redeemed: false }, { redeemed: true, profile: { state: { score: 200, totalEarned: 200 }, revision: 4 } }, { redeemed: true, profile: { state: { score: -1 }, revision: 5 } }]) {
      await assert.rejects(redeemCode({ api: { codesRequest: async () => response }, game, code: 'PACOCA', requestId: 'same-request' }));
      assert.equal(SaveManager.resetting, false);
      assert.equal(written, undefined);
    }
    const api = { codesRequest: async (path, request) => {
      assert.equal(path, '/redeem');
      assert.deepEqual(request.body, { code: 'PACOCA', request_id: 'same-request', revision: 4 });
      assert.equal(SaveManager.resetting, true);
      return { redeemed: true, profile: { state: { score: 200, totalEarned: 200 }, revision: 5 } };
    } };
    await redeemCode({ api, game, code: 'pacoca', requestId: 'same-request' });
    assert.equal(written.score, 200);
    assert.equal(SaveManager.revision, 5);
    assert.equal(SaveManager.resetting, true);
  } finally { Object.assign(SaveManager, original); globalThis.localStorage = oldStorage; }
});
