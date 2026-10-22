import { SaveManager } from '../storage/SaveManager.js';

export function normalizeCode(value) {
  // Teclados móveis e cópias de mensagens podem inserir caracteres invisíveis.
  // Eles não devem transformar um código visualmente válido em erro de formato.
  const code = String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) throw new Error('Use de 3 a 40 letras, números, hífen ou sublinhado.');
  return code;
}

export function validateCampaign(data, now = Date.now()) {
  const code = normalizeCode(data.code);
  if (!['coins', 'gold'].includes(data.reward_type)) throw new Error('Escolha uma recompensa válida.');
  const amount = Number(data.amount);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1e12) throw new Error('A quantidade deve ser um inteiro entre 1 e 1 trilhão.');
  const maxRedemptions = data.max_redemptions === '' || data.max_redemptions == null ? null : Number(data.max_redemptions);
  if (maxRedemptions !== null && (!Number.isSafeInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 1e9)) throw new Error('Informe um limite total válido.');
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= now)) throw new Error('Escolha uma validade no futuro.');
  return { code, reward_type: data.reward_type, amount, active: data.active === true, expires_at: expiresAt?.toISOString() ?? null, max_redemptions: maxRedemptions };
}

// Apenas sugere a entrada visual; a autorização de todas as rotas pertence à API.
export function isTeamAccount(user) {
  if (user?.can_manage_codes === true) return true;
  return ['joao', 'bochecha'].includes(String(user?.user_name ?? '').replace(/^@/, '').toLowerCase());
}

export async function redeemCode({ api, game, code, requestId }) {
  code = normalizeCode(code);
  if (SaveManager.resetting) throw new Error('O progresso está sendo atualizado. Aguarde a recarga do jogo.');
  game.saveGame();
  // Drena também o snapshot gerado enquanto um envio anterior estava em andamento.
  await SaveManager.flush();
  if (SaveManager.resetting) throw new Error('Há um conflito de progresso. Aguarde a recarga do jogo.');
  SaveManager.resetting = true;
  try {
    await SaveManager.syncPromise;
    if (SaveManager.pendingState) await SaveManager.flush();
    const response = await api.codesRequest('/redeem', {
      method: 'POST', body: { code, request_id: requestId, revision: SaveManager.revision },
    });
    const state = SaveManager.validate(response?.profile?.state);
    const revision = response?.profile?.revision;
    if (response?.redeemed !== true || !state || !Number.isSafeInteger(revision) || revision <= SaveManager.revision) {
      throw new Error('O servidor não confirmou o progresso atualizado. Consulte sua conta antes de repetir.');
    }
    localStorage.setItem(SaveManager.saveKey, JSON.stringify(state));
    SaveManager.revision = revision;
    SaveManager.pendingState = null;
    return response;
  } catch (error) {
    SaveManager.resetting = false;
    throw error;
  }
  // Mantém a gravação suspensa até a recarga para não reenviar o estado anterior.
}
