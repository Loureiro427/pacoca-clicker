import test from 'node:test';
import assert from 'node:assert/strict';
import { bindClickExperience, updateClickStats, formatClickGain } from './ClickExperience.js';
import { Game } from '../game/Game.js';

function gameState(skills = []) {
  const owned = new Set(skills);
  return Object.assign(Object.create(Game.prototype), {
    score: 1000, totalEarned: 0, totalClicks: 9, clickValue: 10, pps: 100,
    comboCount: 0, lastClickTime: 0, maoDePedraTime: 0, frenzyTimeLeft: 20,
    skillTree: { hasSkill: id => owned.has(id) },
    audio: { init() {}, playClick() {} }, checkAchievements() {}, refreshUI() {},
  });
}

test('feedback de clique inclui crítico, bônus de produção, saldo e eco realmente creditados', () => {
  const game = gameState(['act_3', 'act_6', 'act_2', 'act_7', 'alc_7']);
  const random = Math.random;
  Math.random = () => 0;
  try {
    const before = game.score;
    const result = game.click();
    assert.equal(result.gained, 81);
    assert.equal(game.score - before, result.gained);
    assert.equal(game.totalEarned, result.gained);
    assert.equal(result.echo, 10);
    assert.equal(result.isCrit, true);
    assert.equal(result.critMultiplier, 5);
  } finally { Math.random = random; }
});

test('combo e poder triplo aparecem no ganho retornado sem alterar a economia', () => {
  const game = gameState(['act_4']);
  game.lastClickTime = Date.now();
  game.maoDePedraTime = 2;
  const result = game.click();
  assert.equal(result.gained, 10 * 1.01 * 3);
  assert.equal(result.empowered, true);
  assert.equal(formatClickGain(result.gained), '30,3');
});

function setup(t) {
  const original = { document: globalThis.document, window: globalThis.window };
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { events: {}, style: {},
      addEventListener(name, callback) { this.events[name] = callback; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; } });
    return elements.get(id);
  };
  globalThis.document = { getElementById: get, querySelectorAll: () => [] };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  t.after(() => Object.assign(globalThis, original));
  return get;
}

test('toque não duplica no click sintético e teclado também produz paçocas', t => {
  const get = setup(t);
  let clicks = 0;
  bindClickExperience({ click() { clicks++; return { gained: 1.15, isCrit: false, echo: 0 }; } });
  const button = get('pacoca-button');
  button.events.pointerdown({ button: 0, clientX: 10, clientY: 20, preventDefault() {} });
  button.events.click({ detail: 1 });
  assert.equal(clicks, 1);
  assert.equal(get('click-result').textContent, '+1,15 paçocas');
  button.events.click({ detail: 0 });
  assert.equal(clicks, 2);
  button.events.pointerdown({ button: 2 });
  assert.equal(clicks, 2);
});

test('indicador de combo expira visualmente e respeita talentos desbloqueados', t => {
  const get = setup(t);
  const game = gameState(['act_4']);
  game.lastClickTime = 1000;
  game.comboCount = 20;
  updateClickStats(game, 1100);
  assert.equal(get('click-combo').hidden, false);
  assert.equal(get('click-combo-fill').style.width, '40%');
  updateClickStats(game, 2000);
  assert.equal(get('click-combo-fill').style.width, '0%');
  game.skillTree.hasSkill = () => false;
  updateClickStats(game, 2000);
  assert.equal(get('click-combo').hidden, true);
});

test('frenesi expira na interface mesmo sem estruturas de produção', () => {
  const game = gameState();
  Object.assign(game, { pps: 0, inventory: {}, boughtUpgrades: [], prestigeChips: 0,
    startTime: Date.now(), lastTick: Date.now() - 200, frenzyTimeLeft: .1,
    frenzyMultiplier: 7, autoclickTimer: 0 });
  let remaining;
  game.ui = { updateFrenzy: (time, multiplier) => { remaining = [time, multiplier]; } };
  const previous = globalThis.setInterval;
  globalThis.setInterval = callback => callback();
  try { game.startGameLoop(); } finally { globalThis.setInterval = previous; }
  assert.deepEqual(remaining, [0, 1]);
});
