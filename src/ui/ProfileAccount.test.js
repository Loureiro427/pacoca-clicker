import test from 'node:test';
import assert from 'node:assert/strict';
import { updateAccountProfile, updateAccountSyncStatus, formatJourneyDuration } from './ProfileAccount.js';
import { UIManager } from './UIManager.js';
import { AchievementsData } from '../game/Achievements.js';

function setup(t) {
  const previous = globalThis.document;
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, dataset: {}, attributes: {}, events: {}, value: '',
      classList: { add() {}, remove() {} }, querySelector: () => null,
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(name, fn) { this.events[name] = fn; } });
    return elements.get(id);
  };
  globalThis.document = { getElementById: get };
  t.after(() => { globalThis.document = previous; });
  return get;
}

test('conta demonstrativa nunca apresenta confirmação de nuvem real', t => {
  const get = setup(t);
  updateAccountProfile({ name: '<img src=x>', user_name: 'teste', img_account: 'javascript:alert(1)' }, { isDemo: true });
  updateAccountSyncStatus('synced');
  assert.equal(get('profile-sync').dataset.status, 'demo');
  assert.equal(get('clicker-profile-name').textContent, '<img src=x>');
  assert.equal(get('clicker-profile-avatar').src, '/pacoca.png');
});

test('identidade real só indica nuvem confirmada após callback de sucesso', t => {
  const get = setup(t);
  updateAccountProfile({ name: 'Jogador', user_name: 'jogador' });
  assert.equal(get('clicker-sync-status').dataset.status, 'pending');
  updateAccountSyncStatus('offline');
  assert.equal(get('profile-sync').dataset.status, 'offline');
  updateAccountSyncStatus('synced');
  assert.equal(get('clicker-sync-status').textContent, 'Progresso salvo na nuvem');
  updateAccountSyncStatus('desconhecido');
  assert.equal(get('profile-sync').dataset.status, 'pending');
});

test('tempo da jornada formata minutos, horas e dias sem valores negativos', () => {
  assert.equal(formatJourneyDuration(0, 59 * 60000), '59m');
  assert.equal(formatJourneyDuration(0, 61 * 60000), '1h 1m');
  assert.equal(formatJourneyDuration(0, 25 * 3600000), '1d 1h');
  assert.equal(formatJourneyDuration(100, 0), '0m');
});

test('perfil destaca ouro pendente e filtra conquistas sem alterar o progresso', t => {
  const get = setup(t);
  const game = { totalClicks: 10, totalEarned: 8000000, startTime: Date.now(), pps: 10,
    clickValue: 2, prestigeMultiplier: 1.2, prestigeChips: 2, claimedPrestigeChips: 1,
    unlockedAchievements: [AchievementsData[0].id], getTotalStructures: () => 3 };
  UIManager.prototype.updateProfile.call({ achievementFilter: 'unlocked' }, game);
  assert.equal(get('btn-prestige').disabled, false);
  assert.match(get('prestige-missing-text').innerText, /\+1 de ouro/);
  assert.equal(get('profile-achievement-count').innerText, `1/${AchievementsData.length}`);
  assert.equal(get(`ach-${AchievementsData[0].id}`).hidden, false);
  assert.equal(get(`ach-${AchievementsData[1].id}`).hidden, true);
  assert.equal(game.claimedPrestigeChips, 1);
});
