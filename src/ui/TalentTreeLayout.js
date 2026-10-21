import { SkillTreeNodes } from '../game/SkillTreeData.js';

export function buildTalentLayout(branch) {
  const nodes = SkillTreeNodes.filter(node => node.branch === branch || node.id === 'origin');
  const depths = new Map([['origin', 0]]);
  const depth = node => {
    if (!depths.has(node.id)) {
      depths.set(node.id, 1 + Math.max(...node.requires.map(id => depth(nodes.find(parent => parent.id === id)))));
    }
    return depths.get(node.id);
  };
  const rows = [];
  nodes.forEach(node => { const level = depth(node); (rows[level] ??= []).push(node); });
  const width = Math.max(340, Math.max(...rows.map(row => row.length)) * 108 + 24);
  const positions = new Map();
  rows.forEach((row, level) => {
    // Mantém irmãos próximos do caminho de seus pais.
    const parentCenter = node => node.requires.reduce((sum, id) => sum + positions.get(id).x, 0) / (node.requires.length || 1);
    row.sort((a, b) => parentCenter(a) - parentCenter(b));
    row.forEach((node, index) => positions.set(node.id, {
      node, level, x: width / 2 + (index - (row.length - 1) / 2) * 108, y: 24 + level * 160,
    }));
  });
  const edges = nodes.flatMap(node => node.requires.map(parent => ({ from: positions.get(parent), to: positions.get(node.id) })));
  return { width, height: rows.length * 160, nodes: [...positions.values()], edges };
}

export function getTalentState(node, manager, gold) {
  if (manager.hasSkill(node.id)) return 'learned';
  if (node.requires.length && !node.requires.some(id => manager.hasSkill(id))) return 'locked';
  return gold >= node.cost ? 'available' : 'unaffordable';
}
