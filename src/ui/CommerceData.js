export function getUpgradeState(upgrade, score, inventory, purchased) {
  if (purchased.includes(upgrade.id)) return 'bought';
  if ((inventory[upgrade.reqGen] || 0) < upgrade.reqCount) return 'locked';
  return score >= upgrade.cost ? 'available' : 'unaffordable';
}

export function matchesUpgradeView(upgrade, state, category, view) {
  return (category === 'all' || category === upgrade.type)
    && (view === 'bought' ? state === 'bought'
      : view === 'available' ? state === 'available' : state !== 'bought');
}
