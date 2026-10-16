import { SkillTreeNodes, SkillTreeBranches } from '../game/SkillTreeData.js';

export class SkillTreeUI {
  constructor(game) {
    this.game = game;
    this.selectedSkill = null;
    this.activeBranch = 'active'; // Começa mostrando o ramo Ativo
    this.listenersAdded = false; // Controle para não duplicar cliques no modal

    setTimeout(() => {
      const talentosBtn = document.querySelector('[data-target="skills-area"]');
      if (talentosBtn) {
        talentosBtn.addEventListener('click', () => {
          this.forceRebuild();
        });
      }
    }, 500);
  }

  render() {
    const container = document.getElementById('skill-nodes-container');
    const treeContainer = document.querySelector('.skill-tree-container'); // Contentor pai principal
    if (!container || !treeContainer) return;

    // 1. Cria o menu no topo absoluto do contêiner (Resolve o bug da tela cortada)
    let nav = document.getElementById('skill-branch-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'skill-branch-nav';
      nav.className = 'skill-branch-nav';
      nav.innerHTML = `
        <button class="branch-filter-btn active" data-branch="active">⚔️ Ativo</button>
        <button class="branch-filter-btn" data-branch="passive">🏭 Passivo</button>
        <button class="branch-filter-btn" data-branch="alchemy">✨ Alquimia</button>
      `;
      // Insere logo no topo da tela de fundo creme
      treeContainer.insertBefore(nav, treeContainer.firstChild);

      nav.querySelectorAll('.branch-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          nav.querySelectorAll('.branch-filter-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.activeBranch = e.currentTarget.dataset.branch;
          this.forceRebuild();
        });
      });
    }

    if (container.children.length === 0) {
      this.buildGrafo(container);
    }

    this.updateNodeStates();
    this.initModalListeners(); // Inicia os botões do modal
  }

  forceRebuild() {
    const container = document.getElementById('skill-nodes-container');
    if (container) {
      container.innerHTML = ''; 
      this.render();
      setTimeout(() => this.drawLines(), 50);
    }
  }

  buildGrafo(container) {
    const currentNodes = SkillTreeNodes.filter(node => 
      node.branch === this.activeBranch || node.id === 'origin'
    );

    const tiers = this.groupNodesByTier(currentNodes);

    const graphWrapper = document.createElement('div');
    graphWrapper.className = 'tree-graph-wrapper';
    graphWrapper.id = 'tree-graph-wrapper';

    const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.setAttribute('class', 'tree-svg-lines');
    svgOverlay.id = 'tree-svg-lines';
    graphWrapper.appendChild(svgOverlay);

    // Renderiza em LINHAS HORIZONTAIS (Tiers Verticais)
    tiers.forEach(tierNodes => {
      const row = document.createElement('div');
      row.className = 'tree-tier-row';

      tierNodes.forEach(node => {
        const box = document.createElement('div');
        box.className = `tree-node-box branch-${node.branch}`;
        box.id = `node-${node.id}`;
        box.innerHTML = `
          <div class="tree-node-icon">${node.iconSvg}</div>
          <div class="tree-node-badge" id="badge-${node.id}">0</div>
        `;
        box.onclick = () => this.openModal(node);
        row.appendChild(box);
      });

      graphWrapper.appendChild(row);
    });

    container.appendChild(graphWrapper);
  }

  updateNodeStates() {
    SkillTreeNodes.forEach(node => {
      const el = document.getElementById(`node-${node.id}`);
      if (!el) return;

      const isMastered = this.game.skillTree ? this.game.skillTree.hasSkill(node.id) : false;
      const canUnlock = this.game.skillTree ? this.game.skillTree.canUnlock(node.id) : false;

      el.classList.remove('locked', 'available', 'mastered');
      
      if (isMastered) el.classList.add('mastered');
      else if (canUnlock) el.classList.add('available');
      else el.classList.add('locked');

      const badge = document.getElementById(`badge-${node.id}`);
      if (badge) {
        badge.innerText = isMastered ? '1' : '0';
        if (isMastered) badge.classList.add('active');
        else badge.classList.remove('active');
      }
    });

    this.drawLines();
  }

  drawLines() {
    const svg = document.getElementById('tree-svg-lines');
    const wrapper = document.getElementById('tree-graph-wrapper');
    if (!svg || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    if (wrapperRect.width === 0) return;

    svg.innerHTML = '';
    svg.setAttribute('width', wrapperRect.scrollWidth);
    svg.setAttribute('height', wrapperRect.scrollHeight);

    const currentNodes = SkillTreeNodes.filter(n => n.branch === this.activeBranch || n.id === 'origin');

    currentNodes.forEach(node => {
      const childEl = document.getElementById(`node-${node.id}`);
      if (!childEl) return;

      node.requires.forEach(reqId => {
        const parentEl = document.getElementById(`node-${reqId}`);
        if (!parentEl) return;

        const parentRect = parentEl.getBoundingClientRect();
        const childRect = childEl.getBoundingClientRect();

        const scrollLeft = wrapper.scrollLeft;
        const scrollTop = wrapper.scrollTop;

        const x1 = (parentRect.left + parentRect.width / 2) - wrapperRect.left + scrollLeft;
        const y1 = parentRect.bottom - wrapperRect.top + scrollTop;
        const x2 = (childRect.left + childRect.width / 2) - wrapperRect.left + scrollLeft;
        const y2 = childRect.top - wrapperRect.top + scrollTop;

        const isParentMastered = this.game.skillTree ? this.game.skillTree.hasSkill(reqId) : false;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midY = (y1 + y2) / 2;
        const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        line.setAttribute('d', pathData);
        line.setAttribute('class', `tree-connection-line ${isParentMastered ? 'active' : 'locked'}`);

        svg.appendChild(line);
      });
    });
  }

  groupNodesByTier(nodes) {
    const tiers = [];
    const nodeTierMap = new Map();
    nodeTierMap.set('origin', 0);

    let changed = true;
    let loops = 0;
    while (changed && loops < 50) {
      changed = false;
      loops++;
      nodes.forEach(node => {
        if (nodeTierMap.has(node.id)) return;
        let maxReqTier = -1;
        let allReqsFound = true;
        node.requires.forEach(reqId => {
          if (nodeTierMap.has(reqId)) {
            maxReqTier = Math.max(maxReqTier, nodeTierMap.get(reqId));
          } else {
            allReqsFound = false;
          }
        });
        if (allReqsFound) {
          nodeTierMap.set(node.id, maxReqTier + 1);
          changed = true;
        }
      });
    }

    nodes.forEach(node => {
      const tierIdx = nodeTierMap.get(node.id) || 0;
      if (!tiers[tierIdx]) tiers[tierIdx] = [];
      tiers[tierIdx].push(node);
    });

    return tiers.filter(t => t && t.length > 0);
  }

  openModal(node) {
    this.selectedSkill = node;
    const modal = document.getElementById('skill-modal');
    if (!modal) return;

    const iconEl = document.getElementById('skill-modal-icon');
    const nameEl = document.getElementById('skill-modal-name');
    const loreEl = document.getElementById('skill-modal-lore');
    const descEl = document.getElementById('skill-modal-desc');
    const branchTag = document.getElementById('skill-modal-branch');

    if (iconEl) iconEl.innerHTML = node.iconSvg;
    if (nameEl) nameEl.innerText = node.name;
    if (loreEl) loreEl.innerText = `"${node.lore}"`;
    if (descEl) descEl.innerText = node.desc;

    const branchInfo = SkillTreeBranches[node.branch] || { name: 'Gênesis', color: '#FFD700' };
    if (branchTag) {
      branchTag.innerText = branchInfo.name;
      branchTag.style.background = branchInfo.color;
    }

    const btnLearn = document.getElementById('btn-learn-skill');
    const isMastered = this.game.skillTree ? this.game.skillTree.hasSkill(node.id) : false;
    const canUnlock = this.game.skillTree ? this.game.skillTree.canUnlock(node.id) : false;

    if (btnLearn) {
      if (isMastered) {
        btnLearn.disabled = true;
        btnLearn.innerText = '✨ Dominado';
      } else if (canUnlock) {
        btnLearn.disabled = false;
        btnLearn.innerText = `Aprender (${node.cost} 🌟)`;
      } else {
        btnLearn.disabled = true;
        btnLearn.innerText = `Bloqueado (${node.cost} 🌟)`;
      }
    }

    modal.style.display = 'flex';
  }

  // Corrigido para anexar os eventos de clique APENAS UMA VEZ de forma segura
  initModalListeners() {
    if (this.listenersAdded) return;
    this.listenersAdded = true;

    const btnLearn = document.getElementById('btn-learn-skill');
    const btnClose = document.getElementById('btn-close-skill-modal');
    const modal = document.getElementById('skill-modal');

    if (btnLearn) {
      btnLearn.addEventListener('click', () => {
        if (this.selectedSkill && this.game.skillTree && this.game.skillTree.unlockSkill(this.selectedSkill.id)) {
          if (modal) modal.style.display = 'none';
          this.forceRebuild(); // Atualiza a tela após a compra
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }
  }
}