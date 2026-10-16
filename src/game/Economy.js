import { GeneratorsData } from './Generators.js';
import { UpgradesData } from './Upgrades.js';

const PRICE_MULTIPLIER = 1.10; 

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
          // Bônus Direto
          if (upg.effect === 'genMultiplier' && upg.targetGen === gen.id) {
            multi *= upg.value;
          }
          // Sinergia entre estruturas (ex: Império buffa Ajudante)
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
      // Multiplicador Direto
      if (upg.effect === 'clickMultiplier') {
        multi *= upg.value;
      }
      // Sinergia com Estruturas (ex: Fábricas buffam clique)
      if (upg.effect === 'synergyClick') {
        const countGen = inventory[upg.targetGen] || 0;
        multi *= (1 + (countGen * upg.synergyMultiplier));
      }
    }
  });

  return Math.floor(baseClick * multi);
}