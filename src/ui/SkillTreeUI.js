import { trackDialog } from '../systems/AppNavigation.js';
import { SkillTreeNodes, SkillTreeBranches } from '../game/SkillTreeData.js';
import { buildTalentLayout, getTalentState } from './TalentTreeLayout.js';
import { formatNumber } from '../utils/format.js';

const BRANCH_LABELS = { active: 'CAMINHO DO TOQUE', passive: 'CAMINHO DA PRODUÇÃO', alchemy: 'CAMINHO DA ALQUIMIA' };
const STATE_LABELS = { learned: 'Aprendido', available: 'Disponível', unaffordable: 'Falta ouro', locked: 'Bloqueado' };
const STATE_ICONS = { learned: '✓', available: '+', unaffordable: '✦', locked: '·' };
const el = id => document.getElementById(id);

export class SkillTreeUI {
  constructor(game) {
    this.game = game;
    this.activeBranch = 'active';
    this.selectedSkill = null;
    this.initialized = false;
    this.snapshot = '';
    this.builtBranch = null;
    this.nodeElements = new Map();
    this.connections = [];
  }

  initListeners() {
    if (this.initialized) return;
    this.initialized = true;
    document.querySelectorAll('[data-talent-branch]').forEach(button => {
      button.addEventListener('click', () => {
        this.activeBranch = button.dataset.talentBranch;
        this.render();
        requestAnimationFrame(() => this.centerMap());
      });
    });
    document.querySelector('[data-target="skills-area"]')?.addEventListener('click', () => {
      this.render();
      requestAnimationFrame(() => this.centerMap());
    });
    el('btn-close-skill-modal').addEventListener('click', () => el('skill-modal').close());
    el('skill-modal').addEventListener('close', () => {
      this.nodeElements.get(this.selectedSkill?.id)?.button.focus();
      this.selectedSkill = null;
    });
    el('btn-learn-skill').addEventListener('click', () => {
      const node = this.selectedSkill;
      if (!node || !this.game.skillTree.unlockSkill(node.id)) return;
      this.game.audio?.playSkillLearn();
      el('talents-status').textContent = `${node.name} aprendido. Seu império ganhou um novo poder.`;
      this.render();
      this.updateModal();
    });
    el('talents-reset').addEventListener('click', async () => {
      const button = el('talents-reset');
      if (button.disabled) return;
      button.disabled = true;
      const refund = SkillTreeNodes.reduce((sum, node) => sum + (this.game.skillTree.hasSkill(node.id) ? node.cost : 0), 0);
      try {
        const accepted = await this.game.ui.showDialog({
          icon: '↺', title: 'Traçar um novo caminho?',
          message: 'Todos os talentos voltam ao início. Seu ouro investido retorna ao saldo e seu progresso no jogo é mantido.',
          reward: { label: 'OURO DEVOLVIDO', value: `+${formatNumber(refund)} ✦` },
          confirmText: 'Redistribuir talentos', cancelText: 'Manter meus talentos',
        });
        if (accepted) {
          this.game.skillTree.resetTree();
          this.game.audio?.playBuy();
          el('talents-status').textContent = `Talentos redistribuídos. ${formatNumber(refund)} de ouro retornaram ao saldo.`;
        }
      } finally {
        this.snapshot = '';
        this.render();
      }
    });
  }

  render() {
    if (!el('talents-map')) return;
    this.initListeners();
    const snapshot = JSON.stringify([this.activeBranch, this.game.prestigeChips, this.game.skillTree.unlockedSkills]);
    if (snapshot === this.snapshot) return;
    this.snapshot = snapshot;
    const all = SkillTreeNodes.filter(node => node.id !== 'origin');
    const branch = all.filter(node => node.branch === this.activeBranch);
    const learned = nodes => nodes.filter(node => this.game.skillTree.hasSkill(node.id)).length;
    const branchLearned = learned(branch);
    el('talents-gold').textContent = `${formatNumber(this.game.prestigeChips)} ✦`;
    el('talents-learned').textContent = `${learned(all)} / ${all.length}`;
    el('talents-branch-title').textContent = SkillTreeBranches[this.activeBranch].name;
    el('talents-branch-kicker').textContent = BRANCH_LABELS[this.activeBranch];
    el('talents-branch-description').textContent = SkillTreeBranches[this.activeBranch].desc;
    el('talents-branch-count').textContent = `${branchLearned}/${branch.length}`;
    const percent = Math.round(branchLearned / branch.length * 100);
    el('talents-branch-progress').setAttribute('aria-valuenow', String(percent));
    el('talents-branch-fill').style.width = `${percent}%`;
    el('talents-reset').disabled = learned(all) === 0;
    document.querySelectorAll('[data-talent-branch]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.talentBranch === this.activeBranch));
    });
    if (this.builtBranch !== this.activeBranch) this.buildGraph();
    this.updateNodeStates();
    if (this.selectedSkill) this.updateModal();
  }

  centerMap() {
    const viewport = el('talents-map-scroll');
    if (viewport?.clientWidth) viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
  }

  buildGraph() {
    const map = el('talents-map');
    map.replaceChildren();
    this.nodeElements.clear();
    this.connections = [];
    const layout = buildTalentLayout(this.activeBranch);
    map.style.width = `${layout.width}px`;
    map.style.height = `${layout.height}px`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    svg.setAttribute('width', String(layout.width));
    svg.setAttribute('height', String(layout.height));
    svg.setAttribute('class', 'talent-connections');
    svg.setAttribute('aria-hidden', 'true');
    layout.edges.forEach(({ from, to }) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const y1 = from.y + 112;
      const midY = (y1 + to.y) / 2;
      path.setAttribute('d', `M ${from.x} ${y1} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`);
      svg.appendChild(path);
      this.connections.push({ path, parent: from.node.id, child: to.node.id });
    });
    map.appendChild(svg);
    layout.nodes.forEach(({ node, x, y }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'talent-node';
      button.style.left = `${x - 46}px`;
      button.style.top = `${y}px`;
      button.setAttribute('aria-haspopup', 'dialog');
      const icon = document.createElement('span');
      icon.className = 'talent-node-icon';
      // SVGs vêm apenas das definições locais do jogo.
      icon.innerHTML = node.iconSvg;
      icon.setAttribute('aria-hidden', 'true');
      const name = document.createElement('strong');
      name.textContent = node.id === 'origin' ? 'A origem' : node.name;
      const cost = document.createElement('span');
      cost.className = 'talent-node-cost';
      const badge = document.createElement('span');
      badge.className = 'talent-node-badge';
      badge.setAttribute('aria-hidden', 'true');
      button.append(icon, name, cost, badge);
      button.addEventListener('click', () => this.openModal(node));
      map.appendChild(button);
      this.nodeElements.set(node.id, { button, cost, badge });
    });
    this.builtBranch = this.activeBranch;
  }

  updateNodeStates() {
    this.nodeElements.forEach(({ button, cost, badge }, id) => {
      const node = SkillTreeNodes.find(item => item.id === id);
      const state = getTalentState(node, this.game.skillTree, this.game.prestigeChips);
      button.dataset.state = state;
      cost.textContent = state === 'learned' ? 'Aprendido' : `${node.cost} ✦`;
      badge.textContent = STATE_ICONS[state];
      button.setAttribute('aria-label', `${node.name}. ${STATE_LABELS[state]}. ${node.cost} de ouro. Ver detalhes.`);
    });
    this.connections.forEach(({ path, parent, child }) => {
      path.dataset.state = this.game.skillTree.hasSkill(child) ? 'learned'
        : this.game.skillTree.hasSkill(parent) ? 'available' : 'locked';
    });
  }

  openModal(node) {
    this.selectedSkill = node;
    this.updateModal();
    const dialog = el('skill-modal');
    if (!dialog.open) { dialog.showModal(); trackDialog(dialog); }
  }

  updateModal() {
    const node = this.selectedSkill;
    if (!node) return;
    const state = getTalentState(node, this.game.skillTree, this.game.prestigeChips);
    el('skill-modal').dataset.state = state;
    el('skill-modal-icon').innerHTML = node.iconSvg;
    el('skill-modal-name').textContent = node.name;
    el('skill-modal-branch').textContent = SkillTreeBranches[node.branch].name;
    el('skill-modal-lore').textContent = `“${node.lore}”`;
    el('skill-modal-desc').textContent = node.desc;
    el('skill-modal-state').textContent = STATE_LABELS[state];
    el('skill-modal-cost').textContent = `${formatNumber(node.cost)} ✦`;
    el('skill-modal-balance').textContent = `${formatNumber(this.game.prestigeChips)} ✦`;
    el('skill-modal-requirement-label').textContent = node.requires.length > 1 ? 'REQUER UM DESTES TALENTOS' : node.requires.length ? 'CAMINHO NECESSÁRIO' : 'O INÍCIO DE TODOS OS CAMINHOS';
    const requirements = el('skill-modal-requirements');
    requirements.replaceChildren();
    node.requires.forEach(id => {
      const parent = SkillTreeNodes.find(item => item.id === id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'talent-requirement';
      button.dataset.learned = String(this.game.skillTree.hasSkill(id));
      button.textContent = `${this.game.skillTree.hasSkill(id) ? '✓' : '↗'} ${parent.name}`;
      button.addEventListener('click', () => this.openModal(parent));
      requirements.appendChild(button);
    });
    el('skill-modal-hint').textContent = state === 'learned' ? 'Esse talento já faz parte do seu império.'
      : state === 'locked' ? 'Aprenda um dos talentos indicados acima para abrir este caminho.'
      : state === 'unaffordable' ? `O caminho está aberto. Faltam ${formatNumber(node.cost - this.game.prestigeChips)} de ouro para aprender.`
      : 'Tudo pronto. Invista seu ouro e fortaleça seu império.';
    const learn = el('btn-learn-skill');
    learn.disabled = state !== 'available';
    learn.textContent = state === 'learned' ? '✓ Talento aprendido'
      : state === 'available' ? `Aprender por ${node.cost} de ouro ✦`
      : state === 'unaffordable' ? 'Ouro insuficiente' : 'Desbloqueie o caminho primeiro';
  }
}
