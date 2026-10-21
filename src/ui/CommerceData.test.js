import test from 'node:test';
import assert from 'node:assert/strict';
import { getUpgradeState, matchesUpgradeView } from './CommerceData.js';
import { UpgradesData } from '../game/Upgrades.js';
import { Game } from '../game/Game.js';
import { UIManager } from './UIManager.js';

test('melhorias exigem estruturas e saldo e distinguem as já adquiridas', () => {
  const upgrade = UpgradesData[0];
  assert.equal(getUpgradeState(upgrade, upgrade.cost, {}, []), 'locked');
  assert.equal(getUpgradeState(upgrade, upgrade.cost - 1, { cursor: upgrade.reqCount }, []), 'unaffordable');
  assert.equal(getUpgradeState(upgrade, upgrade.cost, { cursor: upgrade.reqCount }, []), 'available');
  assert.equal(getUpgradeState(upgrade, 0, {}, [upgrade.id]), 'bought');
});

test('filtros de categoria e situação combinam sem misturar adquiridas e disponíveis', () => {
  const upgrade = UpgradesData[0];
  assert.equal(matchesUpgradeView(upgrade, 'available', 'click', 'available'), true);
  assert.equal(matchesUpgradeView(upgrade, 'available', 'structure', 'available'), false);
  assert.equal(matchesUpgradeView(upgrade, 'bought', 'all', 'pending'), false);
  assert.equal(matchesUpgradeView(upgrade, 'bought', 'click', 'bought'), true);
  assert.equal(matchesUpgradeView(upgrade, 'locked', 'all', 'available'), false);
});

test('comprar melhoria rejeita requisitos ausentes e compras duplicadas', () => {
  const upgrade = UpgradesData[0];
  const game = { score: upgrade.cost * 3, inventory: {}, boughtUpgrades: [], audio: { playBuy() {} },
    recalculateStats() {}, checkAchievements() {}, refreshUI() {} };
  Game.prototype.buyUpgrade.call(game, upgrade.id);
  assert.equal(game.score, upgrade.cost * 3);
  assert.deepEqual(game.boughtUpgrades, []);
  game.inventory[upgrade.reqGen] = upgrade.reqCount;
  Game.prototype.buyUpgrade.call(game, upgrade.id);
  Game.prototype.buyUpgrade.call(game, upgrade.id);
  assert.equal(game.score, upgrade.cost * 2);
  assert.deepEqual(game.boughtUpgrades, [upgrade.id]);
});

test('lista atualiza requisitos, falta de saldo e coleção adquirida', t => {
  const originalDocument = globalThis.document;
  const elements = new Map();
  const make = () => ({ style: {}, dataset: {}, hidden: false, attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    fields: { '.commerce-card-hint': {}, '.commerce-requirement-track': { firstElementChild: { style: {} } } },
    querySelector(selector) { return this.fields[selector] ?? null; } });
  const get = id => { if (!elements.has(id)) elements.set(id, make()); return elements.get(id); };
  globalThis.document = { getElementById: get };
  t.after(() => { globalThis.document = originalDocument; });
  const ui = { upgradesList: {}, currentUpgFilter: 'all', currentUpgradeView: 'pending' };
  const upgrade = UpgradesData[0];
  UIManager.prototype.updateUpgrades.call(ui, upgrade.cost, {}, []);
  assert.equal(get(`buy-upg-${upgrade.id}`).disabled, true);
  assert.match(get(`req-upg-${upgrade.id}`).innerText, /Você tem 0/);
  UIManager.prototype.updateUpgrades.call(ui, upgrade.cost, { cursor: upgrade.reqCount }, []);
  assert.equal(get(`buy-upg-${upgrade.id}`).disabled, false);
  UIManager.prototype.updateUpgrades.call(ui, 0, { cursor: upgrade.reqCount }, []);
  assert.match(get(`upg-${upgrade.id}`).fields['.commerce-card-hint'].innerText, /Faltam/);
  ui.currentUpgradeView = 'bought';
  UIManager.prototype.updateUpgrades.call(ui, 0, {}, [upgrade.id]);
  assert.equal(get(`upg-${upgrade.id}`).hidden, false);
  assert.equal(get(`upg-${UpgradesData[1].id}`).hidden, true);
  assert.equal(get(`buy-upg-${upgrade.id}`).innerText, '✓ Adquirida');
  assert.equal(get('upgrades-empty-state').hidden, true);
});

test('lista sem melhorias compráveis informa o próximo passo', t => {
  const originalDocument = globalThis.document;
  const elements = new Map();
  globalThis.document = { getElementById: id => {
    if (id.startsWith('upg-')) return null;
    if (!elements.has(id)) elements.set(id, {});
    return elements.get(id);
  } };
  t.after(() => { globalThis.document = originalDocument; });
  UIManager.prototype.updateUpgrades.call({ upgradesList: {}, currentUpgFilter: 'all', currentUpgradeView: 'available' }, 0, {}, []);
  assert.equal(elements.get('upgrades-empty-state').hidden, false);
  assert.match(elements.get('upgrades-empty-description').innerText, /Continue produzindo/);
});
