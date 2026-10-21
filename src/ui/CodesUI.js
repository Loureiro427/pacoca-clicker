import { isTeamAccount, normalizeCode, validateCampaign, redeemCode } from '../systems/CodesClient.js';
import { trackDialog } from '../systems/AppNavigation.js';

export function initCodesUI({ api, user, game }) {
  const template = document.createElement('template');
  template.innerHTML = `
    <dialog id="codes-dialog" class="support-dialog" aria-labelledby="codes-title"><form class="support-dialog-body" id="codes-form">
      <span class="profile-eyebrow">PRESENTES DA EQUIPE</span><h2 id="codes-title">Resgatar código</h2><p>Cada código vale uma vez por conta, conforme as condições da campanha. O resgate confirmado recarrega o jogo com seu progresso da nuvem.</p>
      <label for="redeem-code">Seu código</label><input id="redeem-code" name="code" required maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PACOCAPRESENTE">
      <p class="support-error" role="status" aria-live="polite" id="codes-status"></p><div class="support-actions"><button type="button" class="support-secondary" id="codes-close">Cancelar</button><button class="support-primary" type="submit">Resgatar presente</button></div>
    </form></dialog>
    <dialog id="admin-codes-dialog" class="support-dialog" aria-labelledby="admin-codes-title"><div class="support-dialog-body">
      <span class="profile-eyebrow">ÁREA DA EQUIPE</span><h2 id="admin-codes-title">Códigos de recompensa</h2><p>A API do Paçoca valida o acesso da equipe e registra as alterações.</p>
      <form id="admin-codes-form"><label for="campaign-code">Código</label><input id="campaign-code" name="code" required maxlength="40" autocomplete="off" placeholder="PACOCAPRESENTE">
      <label for="campaign-reward">Recompensa</label><select id="campaign-reward" name="reward_type"><option value="coins">Paçocas</option><option value="gold">Ouro de talentos</option></select>
      <label for="campaign-amount">Quantidade</label><input id="campaign-amount" name="amount" type="number" min="1" max="1000000000000" step="1" required>
      <label for="campaign-expires">Expira em (opcional, horário local)</label><input id="campaign-expires" name="expires_at" type="datetime-local">
      <label for="campaign-limit">Limite total de resgates (opcional)</label><input id="campaign-limit" name="max_redemptions" type="number" min="1" max="1000000000" step="1">
      <label class="code-active"><input name="active" type="checkbox" checked> Ativar ao criar</label><button class="support-primary" type="submit">Criar código</button></form>
      <p id="admin-codes-status" class="support-error" role="status" aria-live="polite"></p><button type="button" id="admin-codes-refresh" class="support-secondary">Atualizar lista</button><div id="admin-codes-list" class="codes-list"></div><button type="button" id="admin-codes-close" class="support-secondary">Fechar painel</button>
    </div></dialog>`;
  document.body.appendChild(template.content);
  const get = id => document.getElementById(id);
  const dialog = get('codes-dialog');
  const admin = get('admin-codes-dialog');
  const form = get('codes-form');
  const adminForm = get('admin-codes-form');
  let busy = false;
  let authorized = false;
  let previousFocus;
  const setBusy = value => {
    busy = value;
    for (const element of [...dialog.querySelectorAll('button,input'), ...admin.querySelectorAll('button,input,select')]) element.disabled = value;
  };
  const open = target => {
    previousFocus = document.activeElement;
    target.showModal();
    trackDialog(target);
  };
  for (const target of [dialog, admin]) {
    target.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    target.addEventListener('close', () => previousFocus?.focus());
  }
  get('profile-codes').addEventListener('click', () => open(dialog));
  get('codes-close').addEventListener('click', () => { if (!busy) dialog.close(); });
  get('admin-codes-close').addEventListener('click', () => { if (!busy) admin.close(); });
  const requests = new Map();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const status = get('codes-status');
    try {
      const code = normalizeCode(form.elements.code.value);
      if (!requests.has(code)) requests.set(code, crypto.randomUUID());
      setBusy(true);
      status.textContent = 'Confirmando seu presente no Paçoca…';
      await redeemCode({ api, game, code, requestId: requests.get(code) });
      status.textContent = 'Presente resgatado! Atualizando seu progresso…';
      window.location.reload();
    } catch (error) { status.textContent = error.message; setBusy(false); }
  });
  const status = get('admin-codes-status');
  const list = get('admin-codes-list');
  const deny = () => {
    authorized = false;
    adminForm.hidden = true;
    list.replaceChildren();
    status.textContent = 'Acesso não autorizado. A API precisa liberar sua conta da equipe.';
  };
  const render = codes => {
    list.replaceChildren();
    if (!codes.length) { list.textContent = 'Nenhum código criado ainda.'; return; }
    for (const code of codes) {
      if (!code || typeof code.id !== 'string' && typeof code.id !== 'number') continue;
      const card = document.createElement('article'); card.className = 'code-card';
      const heading = document.createElement('strong'); heading.textContent = String(code.code ?? 'Código');
      const info = document.createElement('p');
      info.textContent = `${code.active === true ? 'Ativo' : 'Desativado'} · ${Number(code.amount).toLocaleString('pt-BR')} ${code.reward_type === 'gold' ? 'ouro' : 'paçocas'} · ${Number(code.redemptions_count) || 0}/${code.max_redemptions ?? '∞'} resgates`;
      const expires = document.createElement('p');
      expires.textContent = code.expires_at ? `Validade: ${new Date(code.expires_at).toLocaleString('pt-BR')}` : 'Sem data de expiração';
      const actions = document.createElement('div'); actions.className = 'support-actions';
      for (const remove of [false, true]) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'support-secondary';
        button.textContent = remove ? 'Excluir' : code.active === true ? 'Desativar' : 'Ativar';
        button.addEventListener('click', async () => {
          if (busy || !authorized) return;
          // Confirmação dentro do próprio cartão: evita dois diálogos sobrepostos.
          if (remove && button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'Confirmar exclusão'; return; }
          await run(async () => {
            const response = await api.codesRequest(`/admin/${encodeURIComponent(code.id)}`, remove ? { method: 'DELETE' } : { method: 'PATCH', body: { active: code.active !== true } });
            if (response?.[remove ? 'deleted' : 'updated'] !== true) throw new Error('O servidor não confirmou a alteração. Atualize a lista antes de repetir.');
            await load();
          }, remove ? 'Código excluído.' : 'Código atualizado.');
        });
        actions.append(button);
      }
      card.append(heading, info, expires, actions); list.append(card);
    }
  };
  const load = async () => {
    const response = await api.codesRequest('/admin');
    if (response?.can_manage !== true || !Array.isArray(response.codes)) { deny(); return; }
    authorized = true;
    adminForm.hidden = false;
    render(response.codes);
  };
  const run = async (action, success = '') => {
    setBusy(true); status.textContent = 'Consultando o Paçoca…';
    try { await action(); if (authorized) status.textContent = success; }
    catch (error) {
      if (error.status === 401 || error.status === 403) deny();
      else status.textContent = error.status === 404 ? 'O painel aguarda a integração do servidor pelo João.' : error.message;
    } finally { setBusy(false); }
  };
  const adminButton = get('profile-admin-codes');
  adminButton.hidden = !isTeamAccount(user);
  adminButton.addEventListener('click', () => { adminForm.hidden = true; list.replaceChildren(); open(admin); run(load); });
  get('admin-codes-refresh').addEventListener('click', () => { if (!busy) run(load); });
  let createRequest = null;
  adminForm.addEventListener('submit', event => {
    event.preventDefault();
    if (busy || !authorized) return;
    run(async () => {
      const fields = new FormData(adminForm);
      const campaign = validateCampaign({ ...Object.fromEntries(fields), active: fields.has('active') });
      const serialized = JSON.stringify(campaign);
      if (createRequest?.serialized !== serialized) createRequest = { serialized, id: crypto.randomUUID() };
      const response = await api.codesRequest('/admin', { method: 'POST', body: { ...campaign, request_id: createRequest.id } });
      if (response?.created !== true) throw new Error('O servidor não confirmou a criação. Atualize a lista antes de repetir.');
      adminForm.reset(); createRequest = null;
      await load();
    }, 'Código criado com sucesso.');
  });
}
