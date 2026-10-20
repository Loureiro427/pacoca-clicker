export class Prestige {
  // Fórmula Cúbica: 1M = 1 chip, 8M = 2 chips, 27M = 3 chips, 1B = 10 chips
  static calculatePrestigeChips(totalEarnedHistory) {
    if (totalEarnedHistory < 1000000) return 0;
    return Math.floor(Math.cbrt(totalEarnedHistory / 1000000));
  }

  // NERF APLICADO: Cada Paçoca concede +10% (0.10) de bónus em vez de +100%
  static getMultiplier(prestigeChips) {
    return 1 + (prestigeChips * 0.10);
  }

  static getNextChipRequirement(totalEarnedHistory) {
    const currentChips = this.calculatePrestigeChips(totalEarnedHistory);
    const nextChipTarget = currentChips + 1;
    
    const requiredEarned = Math.pow(nextChipTarget, 3) * 1000000;
    const missing = Math.max(0, requiredEarned - totalEarnedHistory);
    
    const prevEarned = Math.pow(currentChips, 3) * 1000000;
    const progressRange = requiredEarned - prevEarned;
    const currentProgress = Math.max(0, totalEarnedHistory - prevEarned);
    const progressPercent = Math.min(100, Math.max(0, (currentProgress / progressRange) * 100));

    return {
      requiredEarned,
      missing,
      progressPercent
    };
  }
}