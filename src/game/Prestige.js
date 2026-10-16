export class Prestige {
  // Fórmula Cúbica: Cada nova Paçoca de Ouro exige progressivamente MUITO mais esforço
  // 1M = 1 chip, 8M = 2 chips, 27M = 3 chips, 1B = 10 chips, 1T = 100 chips
  static calculatePrestigeChips(totalEarnedHistory) {
    if (totalEarnedHistory < 1000000) return 0;
    return Math.floor(Math.cbrt(totalEarnedHistory / 1000000));
  }

  // Multiplicador Global
  static getMultiplier(prestigeChips) {
    return 1 + prestigeChips;
  }

  // Requisitos matemáticos para a próxima Paçoca de Ouro
  static getNextChipRequirement(totalEarnedHistory) {
    const currentChips = this.calculatePrestigeChips(totalEarnedHistory);
    const nextChipTarget = currentChips + 1;
    
    // Eleva ao cubo (^3) em vez de ao quadrado (^2)
    const requiredEarned = Math.pow(nextChipTarget, 3) * 1000000;
    const missing = Math.max(0, requiredEarned - totalEarnedHistory);
    
    const prevEarned = Math.pow(currentChips, 3) * 1000000;
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