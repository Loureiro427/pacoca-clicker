import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTalentLayout, getTalentState } from './TalentTreeLayout.js';
import { SkillTreeNodes } from '../game/SkillTreeData.js';
import { SkillTreeManager } from '../game/SkillTree.js';

test('todos os ramos posicionam nós sem sobreposição e conectam os pré-requisitos reais', () => {
  for (const branch of ['active', 'passive', 'alchemy']) {
    const graph = buildTalentLayout(branch);
    const expected = SkillTreeNodes.filter(node => node.branch === branch || node.id === 'origin');
    assert.equal(graph.nodes.length, expected.length);
    assert.equal(graph.edges.length, expected.reduce((sum, node) => sum + node.requires.length, 0));
    for (const position of graph.nodes) {
      assert.ok(position.x - 46 >= 0 && position.x + 46 <= graph.width);
      assert.ok(position.y >= 0 && position.y + 112 <= graph.height);
      const peers = graph.nodes.filter(peer => peer !== position && peer.level === position.level);
      for (const peer of peers) assert.ok(Math.abs(peer.x - position.x) >= 92);
    }
    for (const edge of graph.edges) {
      assert.ok(edge.to.node.requires.includes(edge.from.node.id));
      assert.ok(edge.to.y > edge.from.y + 112);
    }
  }
});

test('a árvore distingue caminho bloqueado, falta de ouro, disponível e aprendido', () => {
  const node = SkillTreeNodes.find(item => item.id === 'act_2');
  const skills = new Set(['origin']);
  const manager = { hasSkill: id => skills.has(id) };
  assert.equal(getTalentState(node, manager, 100), 'locked');
  skills.add('act_1');
  assert.equal(getTalentState(node, manager, 0), 'unaffordable');
  assert.equal(getTalentState(node, manager, 3), 'available');
  skills.add(node.id);
  assert.equal(getTalentState(node, manager, 0), 'learned');
});

test('caminhos convergentes respeitam a regra de um pré-requisito e compras duplicadas são rejeitadas', () => {
  const game = { prestigeChips: 200, recalculateStats() {}, saveGame() {}, refreshUI() {} };
  const manager = new SkillTreeManager(game);
  manager.unlockedSkills.push('act_6');
  const node = SkillTreeNodes.find(item => item.id === 'act_7');
  assert.equal(getTalentState(node, manager, game.prestigeChips), 'available');
  assert.equal(manager.unlockSkill(node.id), true);
  assert.equal(game.prestigeChips, 50);
  assert.equal(manager.unlockSkill(node.id), false);
  assert.equal(game.prestigeChips, 50);
  manager.resetTree();
  assert.equal(game.prestigeChips, 250); // Devolve também os 50 investidos em act_6.
  assert.deepEqual(manager.unlockedSkills, ['origin']);
});
