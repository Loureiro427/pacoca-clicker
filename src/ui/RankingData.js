export const RANKING_CATEGORIES = {
  fortune: { label: 'Fortuna', unit: 'paçocas', description: 'Total de paçocas produzidas ao longo da sua jornada.' },
  gold: { label: 'Ouro', unit: 'paçocas de ouro', description: 'Saldo de paçocas de ouro disponível no seu império.' },
  structures: { label: 'Estruturas', unit: 'estruturas', description: 'Quantidade de estruturas que você possui atualmente.' },
};

function normalizeEntry(entry) {
  if (!entry || !entry.user || typeof entry.user !== 'object') return null;
  const value = entry.value;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const position = entry.position;
  if (position !== null && (!Number.isSafeInteger(position) || position < 1)) return null;
  return {
    position, value,
    user: {
      id: entry.user.id ?? null,
      name: String(entry.user.name || entry.user.user_name || 'Jogador'),
      user_name: String(entry.user.user_name || ''),
      img_account: typeof entry.user.img_account === 'string' ? entry.user.img_account : null,
    },
  };
}

export function normalizeRanking(data, category) {
  if (!RANKING_CATEGORIES[category] || !data || !Array.isArray(data.players)) {
    throw new Error('Resposta de ranking inválida');
  }
  if (data.category && data.category !== category) throw new Error('Categoria de ranking incorreta');
  const positions = new Set();
  const users = new Set();
  const players = [];
  for (const raw of data.players) {
    const entry = normalizeEntry(raw);
    if (!entry || entry.position === null || positions.has(entry.position)
      || (entry.user.id !== null && users.has(String(entry.user.id)))) continue;
    positions.add(entry.position);
    if (entry.user.id !== null) users.add(String(entry.user.id));
    players.push(entry);
  }
  if (data.players.length && !players.length) throw new Error('Ranking sem registros válidos');
  players.sort((a, b) => a.position - b.position);
  return {
    category, players, current_player: normalizeEntry(data.current_player),
    total_players: Number.isSafeInteger(data.total_players) && data.total_players >= players.length ? data.total_players : null,
    updated_at: typeof data.updated_at === 'string' && Number.isFinite(Date.parse(data.updated_at)) ? data.updated_at : null,
    demo: data.demo === true,
  };
}

export function safeAvatarUrl(path, cdnUrl) {
  if (!path) return '/pacoca.png';
  try {
    const url = new URL(path.replace(/^\/+/, ''), `${cdnUrl}/`);
    if (/^https?:\/\//i.test(path)) return new URL(path).href;
    if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//')) return '/pacoca.png';
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '/pacoca.png';
  } catch { return '/pacoca.png'; }
}
