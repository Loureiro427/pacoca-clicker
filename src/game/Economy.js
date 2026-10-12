import { GeneratorsData } from './Generators.js';
import { UpgradesData } from './Upgrades.js';

const PRICE_MULTIPLIER = 1.15;

export function calculateCost(baseCost, owned, amount = 1) {
  if (amount === 1) {
    return Math.floor(baseCost * Math.pow(PRICE_MULTIPLIER, owned));
  }
  const p0 = baseCost * Math.pow(PRICE_MULTIPLIER, owned);
  const totalCost = p0 * (Math.pow(PRICE_MULTIPLIER, amount) - 1) / (PRICE_MULTIPLIER - 1);
  return Math.floor(totalCost);
}

export function calculateTotalPPS(inventory, boughtUpgrades = []) {
  let total = 0;

  GeneratorsData.forEach(gen => {
    if (gen.basePPS > 0) {
      let genPPS = gen.basePPS;

      // Aplica multiplicadores dos Upgrades referentes a este gerador
      UpgradesData.forEach(upg => {
        if (boughtUpgrades.includes(upg.id) && upg.effect === 'genMultiplier' && upg.targetGen === gen.id) {
          genPPS *= upg.value;
        }
      });

      total += genPPS * (inventory[gen.id] || 0);
    }
  });

  return total;
}

export function calculateClickValue(inventory, boughtUpgrades = []) {
  const cursorGen = GeneratorsData.find(g => g.id === 'cursor');
  const cursorCount = inventory['cursor'] || 0;
  let clickVal = 1 + (cursorCount * (cursorGen?.clickBonus || 1));

  // Aplica multiplicadores dos Upgrades de clique
  UpgradesData.forEach(upg => {
    if (boughtUpgrades.includes(upg.id) && upg.effect === 'clickMultiplier') {
      clickVal *= upg.value;
    }
  });

  return Math.floor(clickVal);
}