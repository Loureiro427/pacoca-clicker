import { SkillTreeNodes } from './SkillTreeData.js';

export class SkillTreeManager {
  constructor(game) {
    this.game = game;
    // 'origin' vem desbloqueado por padrão
    this.unlockedSkills = ['origin'];
  }

  hasSkill(skillId) {
    return this.unlockedSkills.includes(skillId);
  }

  // Verifica se o jogador pode desbloquear este nó
  canUnlock(skillId) {
    if (this.hasSkill(skillId)) return false;

    const node = SkillTreeNodes.find(n => n.id === skillId);
    if (!node) return false;

    // Precisa ter Paçocas de Ouro suficientes
    if (this.game.prestigeChips < node.cost) return false;

    // Precisa ter pelo menos um dos nós requisitos desbloqueados
    if (node.requires.length > 0) {
      const hasReq = node.requires.some(reqId => this.hasSkill(reqId));
      if (!hasReq) return false;
    }

    return true;
  }

  unlockSkill(skillId) {
    if (!this.canUnlock(skillId)) return false;

    const node = SkillTreeNodes.find(n => n.id === skillId);
    
    // Gasta as Paçocas de Ouro
    this.game.prestigeChips -= node.cost;
    this.unlockedSkills.push(skillId);

    // Recalcula os atributos do jogo
    this.game.recalculateStats();
    this.game.saveGame();
    this.game.refreshUI();
    return true;
  }

  // Respec: Reseta os pontos para o jogador reconfigurar a build
  resetTree() {
    let refundedChips = 0;
    
    this.unlockedSkills.forEach(skillId => {
      const node = SkillTreeNodes.find(n => n.id === skillId);
      if (node && node.id !== 'origin') {
        refundedChips += node.cost;
      }
    });

    this.game.prestigeChips += refundedChips;
    this.unlockedSkills = ['origin'];
    
    this.game.recalculateStats();
    this.game.saveGame();
    this.game.refreshUI();
  }
}