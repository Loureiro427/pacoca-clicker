export class Prestige {
  // 1 Paçoca de Ouro a cada 1.000.000 de Paçocas acumuladas
  static calculatePrestigeChips(totalEarnedHistory) {
    if (totalEarnedHistory < 1000000) return 0;
    return Math.floor(Math.sqrt(totalEarnedHistory / 1000000));
  }

  // Cada Paçoca de Ouro / Renascer adiciona +1x ao multiplicador (0 chips = 1x, 1 chip = 2x, 4 chips = 5x)
  static getMultiplier(prestigeChips) {
    return 1 + prestigeChips;
  }

  static getNextChipRequirement(totalEarnedHistory) {
    const currentChips = this.calculatePrestigeChips(totalEarnedHistory);
    const nextChipTarget = currentChips + 1;
    const requiredEarned = Math.pow(nextChipTarget, 2) * 1000000;
    const missing = Math.max(0, requiredEarned - totalEarnedHistory);
    
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