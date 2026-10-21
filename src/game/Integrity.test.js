import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './Game.js';
import { SkillTreeManager } from './SkillTree.js';
import { SaveManager } from '../storage/SaveManager.js';

function state() {
  const game = Object.assign(Object.create(Game.prototype), {
    score: 1000, totalEarned: 8000000, inventory: {}, boughtUpgrades: [],
    prestigeChips: 0, claimedPrestigeChips: 0, buyAmount: 1,
    audio: { playBuy() {} }, recalculateStats() {}, checkAchievements() {}, saveGame() {}, refreshUI() {},
  });
  game.skillTree = new SkillTreeManager(game);
  return game;
}

test('compra ignora preço adulterado e rejeita lotes e IDs inválidos', () => {
  const game = state();
  game.buy('ajudante', -100000);
  assert.equal(game.score, 900);
  assert.equal(game.inventory.ajudante, 1);
  game.buyAmount = -10;
  game.buy('ajudante', 0);
  game.buyAmount = 1;
  game.buy('__proto__', -1);
  assert.equal(game.score, 900);
  assert.equal(game.inventory.ajudante, 1);
  assert.equal(game.getPurchaseCost(100, 0, -10), Infinity);
  game.score = Infinity;
  game.buy('ajudante', 100);
  assert.equal(game.inventory.ajudante, 1);
});

test('callbacks antigos de prestígio não duplicam ouro', () => {
  const game = state();
  const callbacks = [];
  game.ui = { showPrestigeModal: (_gain, _percent, confirm) => callbacks.push(confirm) };
  game.doPrestige();
  game.doPrestige();
  callbacks[0]();
  callbacks[0]();
  callbacks[1]();
  assert.equal(game.prestigeChips, 2);
  assert.equal(game.claimedPrestigeChips, 2);
});

test('respec não reembolsa talentos duplicados e ouro inválido não desbloqueia', () => {
  const game = state();
  game.skillTree.unlockedSkills = ['origin', 'act_1', 'act_1'];
  game.skillTree.resetTree();
  assert.equal(game.prestigeChips, 1);
  game.prestigeChips = NaN;
  assert.equal(game.skillTree.canUnlock('act_1'), false);
});

test('rejeita saves com caminhos impossíveis, duplicatas, saldo incoerente e timestamps futuros', () => {
  assert.equal(SaveManager.validate({ score: 1, totalEarned: 0 }), null);
  assert.equal(SaveManager.validate({ score: 0, unlockedSkills: ['origin', 'act_7'] }), null);
  assert.equal(SaveManager.validate({ score: 0, unlockedSkills: ['origin', 'act_1', 'act_1'] }), null);
  assert.equal(SaveManager.validate({ score: 0, inventory: { cheat: 100 } }), null);
  assert.equal(SaveManager.validate({ score: 0, boughtUpgrades: ['click_power_1'] }), null);
  assert.equal(SaveManager.validate({ score: 0, totalEarned: 1, claimedPrestigeChips: 999 }), null);
  assert.equal(SaveManager.validate({ score: 0, lastSaveTime: Date.now() + 86400000 }), null);
  const normalized = SaveManager.validate({ score: 0, admin: true, verified: true, user_id: 'outro' });
  assert.equal('admin' in normalized, false);
  assert.equal('verified' in normalized, false);
  assert.equal('user_id' in normalized, false);
});

test('mudar o relógio do dispositivo não concede dias de PPS em um tick', () => {
  const game = state();
  Object.assign(game, { pps: 10, lastTick: performance.now() - 100, maoDePedraTime: 0,
    autoclickTimer: 0, frenzyTimeLeft: 0, ui: { updateFrenzy() {} } });
  const previousInterval = globalThis.setInterval;
  const previousNow = Date.now;
  const before = game.score;
  globalThis.setInterval = callback => callback();
  Date.now = () => previousNow() + 864000000;
  try { game.startGameLoop(); } finally { globalThis.setInterval = previousInterval; Date.now = previousNow; }
  assert.ok(game.score - before < 5);
});

test('recompensa offline só pode ser coletada uma vez, mesmo por callbacks diferentes', () => {
  const originalLoad = SaveManager.load;
  const originalTimeout = globalThis.setTimeout;
  let normal;
  let double;
  SaveManager.load = () => SaveManager.validate({ score: 0, totalEarned: 1000, lastSaveTime: Date.now() - 120000 });
  globalThis.setTimeout = callback => callback();
  const game = state();
  game.pps = 1;
  game.ui = { showOfflineModal: (_time, _amount, first, second) => { normal = first; double = second; } };
  try { game.loadGame(); } finally { SaveManager.load = originalLoad; globalThis.setTimeout = originalTimeout; }
  double();
  const collected = game.score;
  normal();
  double();
  assert.equal(game.score, collected);
  assert.ok(collected >= 240 && collected < 242);
});
