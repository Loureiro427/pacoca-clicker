import { GeneratorsData } from './Generators.js';
import { UpgradesData } from './Upgrades.js';

// NERF APLICADO: Aumentado de 1.10 para 1.15. 
// Evita que o jogador compre 500 fábricas na primeira semana.
const PRICE_MULTIPLIER = 1.15; 

export function calculateCost(baseCost, owned, amount = 1) {
  if (amount === 1) return Math.floor(baseCost * Math.pow(PRICE_MULTIPLIER, owned));
  const p0 = baseCost * Math.pow(PRICE_MULTIPLIER, owned);
  return Math.floor(p0 * (Math.pow(PRICE_MULTIPLIER, amount) - 1) / (PRICE_MULTIPLIER - 1));
}

export function calculateTotalPPS(inventory, boughtUpgrades = []) {
  let total = 0;

  GeneratorsData.forEach(gen => {
    if (gen.basePPS > 0) {
      let genPPS = gen.basePPS;
      let multi = 1;

      UpgradesData.forEach(upg => {
        if (boughtUpgrades.includes(upg.id)) {
          if (upg.effect === 'genMultiplier' && upg.targetGen === gen.id) {
            multi *= upg.value;
          }
          if (upg.effect === 'synergyPPS' && upg.targetGen === gen.id) {
            const countBase = inventory[upg.baseGen] || 0;
            multi *= (1 + (countBase * upg.synergyMultiplier));
          }
        }
      });

      total += (genPPS * multi) * (inventory[gen.id] || 0);
    }
  });

  return total;
}

export function calculateClickValue(inventory, boughtUpgrades = []) {
  const cursorGen = GeneratorsData.find(g => g.id === 'cursor');
  const cursorCount = inventory['cursor'] || 0;
  let baseClick = 1 + (cursorCount * (cursorGen?.clickBonus || 1));
  let multi = 1;

  UpgradesData.forEach(upg => {
    if (boughtUpgrades.includes(upg.id)) {
      if (upg.effect === 'clickMultiplier') {
        multi *= upg.value;
      }
      if (upg.effect === 'synergyClick') {
        const countGen = inventory[upg.targetGen] || 0;
        multi *= (1 + (countGen * upg.synergyMultiplier));
      }
    }
  });

  return Math.floor(baseClick * multi);
}