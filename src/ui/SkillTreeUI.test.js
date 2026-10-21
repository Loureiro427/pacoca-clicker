import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillTreeUI } from './SkillTreeUI.js';
import { SkillTreeManager } from '../game/SkillTree.js';
import { SkillTreeNodes } from '../game/SkillTreeData.js';

class Element {
  children = [];
  events = {};
  attributes = {};
  style = {};
  dataset = {};
  open = false;
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, callback) { this.events[key] = callback; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.(); }
  focus() { this.focused = true; }
}

function setup(t) {
  const previous = globalThis.document;
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  globalThis.document = { getElementById: get, querySelectorAll: () => [], querySelector: () => null,
    createElement: () => new Element(), createElementNS: () => new Element() };
  t.after(() => { globalThis.document = previous; });
  const game = { prestigeChips: 5, recalculateStats() {}, saveGame() {}, refreshUI() {} };
  game.skillTree = new SkillTreeManager(game);
  const ui = new SkillTreeUI(game);
  game.refreshUI = () => ui.render();
  return { ui, game, get };
}

test('renderização não recria nós a cada tick e troca de ramo atualiza o mapa', t => {
  const { ui, get } = setup(t);
  ui.render();
  const first = ui.nodeElements.get('act_1').button;
  ui.render();
  assert.equal(ui.nodeElements.get('act_1').button, first);
  ui.activeBranch = 'alchemy';
  ui.render();
  assert.equal(ui.nodeElements.has('act_1'), false);
  assert.equal(ui.nodeElements.has('alc_1'), true);
  assert.equal(get('talents-branch-title').textContent, 'Alquimia Dourada');
});

test('detalhes explicam bloqueio, permitem aprender e atualizam ouro e caminhos', t => {
  const { ui, game, get } = setup(t);
  ui.render();
  ui.openModal(SkillTreeNodes.find(node => node.id === 'act_2'));
  assert.equal(get('btn-learn-skill').disabled, true);
  assert.match(get('skill-modal-hint').textContent, /talentos indicados/);
  ui.openModal(SkillTreeNodes.find(node => node.id === 'act_1'));
  assert.equal(get('btn-learn-skill').disabled, false);
  get('btn-learn-skill').events.click();
  assert.equal(game.prestigeChips, 4);
  assert.equal(ui.nodeElements.get('act_1').button.dataset.state, 'learned');
  assert.equal(ui.nodeElements.get('act_2').button.dataset.state, 'available');
  assert.equal(get('btn-learn-skill').disabled, true);
  get('skill-modal').close();
  assert.equal(ui.selectedSkill, null);
  assert.equal(ui.nodeElements.get('act_1').button.focused, true);
});

test('cancelar redistribuição mantém ouro e talentos e reabilita o botão', async t => {
  const { ui, game, get } = setup(t);
  game.skillTree.unlockedSkills.push('act_1');
  game.ui = { showDialog: async () => false };
  ui.render();
  await get('talents-reset').events.click();
  assert.equal(game.prestigeChips, 5);
  assert.equal(game.skillTree.hasSkill('act_1'), true);
  assert.equal(get('talents-reset').disabled, false);
});
