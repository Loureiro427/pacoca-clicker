import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/Game.js';
import { SkillTreeManager } from '../src/game/SkillTree.js';
import { SaveManager } from '../src/storage/SaveManager.js';
import { GoldenPacoca } from '../src/systems/GoldenPacoca.js';
import { UIManager } from '../src/ui/UIManager.js';
import { formatNumber } from '../src/utils/format.js';

function gameState() {
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    score: 0, totalEarned: 8000000, prestigeChips: 0, claimedPrestigeChips: 0,
    inventory: {}, boughtUpgrades: [], buyAmount: 1, startTime: Date.now(),
    frenzyMultiplier: 1, frenzyTimeLeft: 0,
    ui: { showPrestigeModal: (_chips, _mult, confirm) => confirm(), updateFrenzy() {} },
    saveGame() {}, refreshUI() {},
  });
  game.skillTree = new SkillTreeManager(game);
  return game;
}

test('gastar ouro, renascer e reembolsar talentos não recria recompensas', () => {
  const game = gameState();
  game.doPrestige();
  assert.equal(game.prestigeChips, 2);
  assert.equal(game.claimedPrestigeChips, 2);
  assert.equal(game.skillTree.unlockSkill('act_1'), true);
  const balance = game.prestigeChips;
  game.doPrestige();
  assert.equal(game.prestigeChips, balance);
  game.prestigeChips += 1; // Ouro de evento deve ser preservado.
  game.totalEarned = 27000000;
  game.doPrestige();
  assert.equal(game.prestigeChips, balance + 2);
  game.skillTree.resetTree();
  assert.equal(game.prestigeChips, 4);
  game.doPrestige();
  assert.equal(game.prestigeChips, 4);
});

test('loja mostra e permite comprar pelo mesmo preço com desconto', () => {
  const game = gameState();
  game.skillTree.unlockedSkills.push('pas_2', 'pas_2a');
  game.buyAmount = 10;
  const cost = game.getPurchaseCost(100, 0, 10);
  const fields = { '.owned-count': {}, '.cost-display': {} };
  const button = { setAttribute() {} };
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: id => id === 'gen-ajudante'
    ? { dataset: {}, querySelector: selector => fields[selector] }
    : id === 'buy-ajudante' ? button : null };
  try {
    UIManager.prototype.updateShop.call({ game }, cost, {}, 10);
    assert.equal(button.disabled, false);
    assert.equal(fields['.cost-display'].innerText, `Custo (10x): ${formatNumber(cost)}`);
    game.audio = { playBuy() {} };
    game.checkAchievements = () => {};
    game.score = cost;
    game.buy('ajudante', 100);
    assert.equal(game.score, 0);
    assert.equal(game.inventory.ajudante, 10);
  } finally { globalThis.document = previousDocument; }
});

test('paçoca dourada aplica apenas uma extensão de frenesi', () => {
  const game = gameState();
  game.skillTree.unlockedSkills.push('alc_2');
  game.pps = 0;
  const golden = Object.create(GoldenPacoca.prototype);
  Object.assign(golden, { game, element: {}, remove() {}, scheduleNextSpawn() {} });
  golden.collect();
  assert.equal(game.frenzyTimeLeft, 30);
  assert.equal(game.clickValue, 7);
});

test('automação aplica o multiplicador do frenesi uma vez', () => {
  const game = gameState();
  game.skillTree.unlockedSkills.push('pas_8');
  Object.assign(game, { clickValue: 7, frenzyMultiplier: 7, frenzyTimeLeft: 20,
    autoclickTimer: 10, lastTick: performance.now(), pps: 0, maoDePedraTime: 0 });
  const previousInterval = globalThis.setInterval;
  globalThis.setInterval = callback => callback();
  try { game.startGameLoop(); } finally { globalThis.setInterval = previousInterval; }
  assert.equal(game.score, 420);
});

test('valida saves e migra o histórico de prestígio antigo', () => {
  assert.equal(SaveManager.validate({ score: -1 }), null);
  assert.equal(SaveManager.validate({ score: Infinity }), null);
  assert.equal(SaveManager.validate({ score: 0, inventory: { cursor: '10' } }), null);
  assert.equal(SaveManager.validate({ score: 0, unlockedSkills: 'origin' }), null);
  const migrated = SaveManager.validate({ score: 10, totalEarned: 8000000,
    prestigeChips: 1, unlockedSkills: ['origin', 'act_1'] });
  assert.equal(migrated.claimedPrestigeChips, 2);
  const restored = SaveManager.validate({ ...migrated, claimedPrestigeChips: 1 });
  assert.equal(restored.claimedPrestigeChips, 1);
});

test('save corrompido fica em backup e falha de armazenamento não lança erro', () => {
  const previousStorage = globalThis.localStorage;
  const previousWarn = console.warn;
  const storage = new Map([[SaveManager.saveKey, '{quebrado']]);
  globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
  console.warn = () => {};
  try {
    assert.equal(SaveManager.load(), null);
    assert.equal(storage.get(`${SaveManager.saveKey}_backup`), '{quebrado');
    globalThis.localStorage.setItem = () => { throw new Error('Sem espaço'); };
    assert.equal(SaveManager.save({ score: 10 }), false);
  } finally { globalThis.localStorage = previousStorage; console.warn = previousWarn; }
});
