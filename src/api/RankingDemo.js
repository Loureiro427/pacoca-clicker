// Somente para a API simulada de desenvolvimento. Nunca é fonte do ranking real.
const DEMO_PLAYERS = [
  ['demo-1', 'Amendoim Rei', 'amendoimrei', 4200000000, 1250, 14500],
  ['demo-2', 'Dona Paçoca', 'donapacoca', 2850000000, 840, 9800],
  ['demo-3', 'Doce Império', 'doceimperio', 1640000000, 620, 7200],
  ['demo-4', 'Café com Paçoca', 'cafecompacoca', 925000000, 310, 4100],
  ['demo-5', 'Formiga Cósmica', 'formigacosmica', 740000000, 190, 2800],
  ['demo-6', 'Mestre do Clique', 'mestredoclique', 512000000, 125, 1950],
  ['demo-7', 'Fábrica de Doces', 'fabricadedoces', 280000000, 80, 1100],
];

export function createDemoRanking(category, state, user) {
  const index = { fortune: 3, gold: 4, structures: 5 }[category];
  if (index === undefined) throw new Error('Categoria inválida');
  const values = {
    fortune: Number(state?.totalEarned) || 0,
    gold: Number(state?.prestigeChips) || 0,
    structures: Object.values(state?.inventory || {}).reduce((sum, count) => sum + (Number(count) || 0), 0),
  };
  const players = DEMO_PLAYERS.map(row => ({
    user: { id: row[0], name: row[1], user_name: row[2], img_account: null }, value: row[index],
  }));
  players.push({ user, value: values[category] });
  players.sort((a, b) => b.value - a.value || String(a.user.id).localeCompare(String(b.user.id)));
  players.forEach((entry, index) => { entry.position = index + 1; });
  return {
    category, players, current_player: players.find(entry => entry.user.id === user.id),
    total_players: players.length, updated_at: new Date().toISOString(), demo: true,
  };
}
