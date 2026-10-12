export class Prestige {
  // Fórmula: 1 Paçoca de Ouro a cada 1.000.000 de Paçocas acumuladas na história (progressão por raiz quadrada)
  static calculatePrestigeChips(totalEarnedHistory) {
    if (totalEarnedHistory < 1000000) return 0;
    return Math.floor(Math.sqrt(totalEarnedHistory / 1000000));
  }

  // Cada Paçoca de Ouro concede +2% de bônus global permanente
  static getMultiplier(prestigeChips) {
    return 1 + (prestigeChips * 0.02);
  }
}