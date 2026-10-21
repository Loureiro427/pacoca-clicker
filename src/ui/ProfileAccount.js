import { safeAvatarUrl } from './RankingData.js';

const CDN_URL = (import.meta.env?.VITE_PACOCA_CDN_URL || 'https://cdn.pacoca.net/pacoca-prod-files').replace(/\/+$/, '');
let demo = false;

const SYNC_STATES = {
  pending: ['Aguardando confirmação', 'O serviço de sincronização ainda não confirmou o salvamento.'],
  syncing: ['Salvando sua jornada…', 'Sincronizando seu progresso com a conta Paçoca.'],
  synced: ['Progresso salvo na nuvem', 'Seu progresso foi confirmado pelo serviço de sincronização.'],
  offline: ['Sincronização pendente', 'A última tentativa falhou. O progresso local aguarda um novo envio.'],
  conflict: ['Uma jornada mais recente foi encontrada', 'Carregando o progresso da sua conta para manter tudo em dia.'],
};

/** Ponto de entrada para o João atualizar nome/foto após sincronizar o perfil. */
export function updateAccountProfile(user, { isDemo = false } = {}) {
  demo = isDemo;
  const name = document.getElementById('clicker-profile-name');
  const username = document.getElementById('clicker-profile-username');
  const avatar = document.getElementById('clicker-profile-avatar');
  const badge = document.getElementById('profile-account-badge');
  if (name) name.textContent = user?.name || 'Jogador';
  if (username) username.textContent = user?.user_name ? `@${user.user_name}` : '';
  if (badge) badge.textContent = demo ? 'Perfil de demonstração' : 'Conta Paçoca';
  if (avatar) {
    avatar.src = safeAvatarUrl(user?.img_account, CDN_URL);
    avatar.onerror = () => { avatar.onerror = null; avatar.src = '/pacoca.png'; };
  }
  updateAccountSyncStatus('pending');
}

export function updateAccountSyncStatus(status) {
  const resolved = demo ? 'demo' : Object.hasOwn(SYNC_STATES, status) ? status : 'pending';
  const [title, detail] = resolved === 'demo'
    ? ['Progresso de demonstração', 'Dados de teste neste dispositivo. Este modo não confirma salvamento no pacoca.net.']
    : SYNC_STATES[resolved];
  const summary = document.getElementById('clicker-sync-status');
  const description = document.getElementById('profile-sync-detail');
  const panel = document.getElementById('profile-sync');
  if (summary) { summary.textContent = title; summary.dataset.status = resolved; }
  if (description) description.textContent = detail;
  if (panel) panel.dataset.status = resolved;
}

export function formatJourneyDuration(startTime, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - startTime) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
