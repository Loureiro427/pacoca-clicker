export class Prestige {
  // 1 Paçoca de Ouro para cada 1.000.000 (escala por raiz quadrada)
  static calculatePrestigeChips(totalEarnedHistory) {
    if (totalEarnedHistory < 1000000) return 0;
    return Math.floor(Math.sqrt(totalEarnedHistory / 1000000));
  }

  // Cada Paçoca de Ouro concede +2% de bônus global permanente
  static getMultiplier(prestigeChips) {
    return 1 + (prestigeChips * 0.02);
  }

  // Calcula o progresso e quantas Paçocas faltam para a PRÓXIMA Paçoca de Ouro
  static getNextChipRequirement(totalEarnedHistory) {
    const currentChips = this.calculatePrestigeChips(totalEarnedHistory);
    const nextChipTarget = currentChips + 1;
    const requiredEarned = Math.pow(nextChipTarget, 2) * 1000000;
    const missing = Math.max(0, requiredEarned - totalEarnedHistory);
    
    // Percentagem de progresso do chip atual até ao próximo
    const prevEarned = Math.pow(currentChips, 2) * 1000000;
    const progressRange = requiredEarned - prevEarned;
    const currentProgress = totalEarnedHistory - prevEarned;
    const progressPercent = Math.min(100, Math.max(0, (currentProgress / progressRange) * 100));

    return {
      requiredEarned,
      missing,
      progressPercent
    };
  }
}