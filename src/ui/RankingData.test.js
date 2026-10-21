import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRanking, safeAvatarUrl } from './RankingData.js';
import { createDemoRanking } from '../api/RankingDemo.js';

const player = (position, value = 100, id = position) => ({ position, value, user: { id, name: `Jogador ${id}` } });

test('normaliza por posição oficial sem inventar colocações ausentes', () => {
  const data = normalizeRanking({ players: [player(9), player(1), player(4)], current_player: player(null) }, 'fortune');
  assert.deepEqual(data.players.map(entry => entry.position), [1, 4, 9]);
  assert.equal(data.current_player.position, null);
  assert.equal(data.total_players, null);
});

test('remove duplicatas e valores inválidos sem renderizar pontuações corrompidas', () => {
  const data = normalizeRanking({ players: [player(1), player(1, 50, 99), player(2, Infinity), player(3, -1), player(4, 100, 1)] }, 'gold');
  assert.equal(data.players.length, 1);
  assert.throws(() => normalizeRanking({ players: [player(0)] }, 'gold'));
  assert.throws(() => normalizeRanking({ players: [], category: 'gold' }, 'fortune'));
  assert.throws(() => normalizeRanking({}, 'fortune'));
});

test('aceita ranking vazio e restringe os protocolos de avatar', () => {
  assert.deepEqual(normalizeRanking({ players: [] }, 'gold').players, []);
  const cdn = 'https://cdn.example/assets';
  assert.equal(safeAvatarUrl('users/foto.png', cdn), `${cdn}/users/foto.png`);
  assert.equal(safeAvatarUrl('https://example.com/foto.png', cdn), 'https://example.com/foto.png');
  for (const path of ['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/x']) {
    assert.equal(safeAvatarUrl(path, cdn), '/pacoca.png');
  }
});

test('demonstração é identificada e usa total produzido mesmo após gastar o saldo', () => {
  const user = { id: 'local', name: 'Você' };
  const data = createDemoRanking('fortune', { score: 1, totalEarned: 5000000000 }, user);
  assert.equal(data.demo, true);
  assert.equal(data.current_player.value, 5000000000);
  assert.equal(data.current_player.position, 1);
  assert.equal(normalizeRanking(data, 'fortune').players.length, 8);
  assert.equal(createDemoRanking('structures', { inventory: { ajudante: 7, fabrica: 3 } }, user).current_player.value, 10);
});
