export const REPORT_CATEGORIES = {
  gameplay: 'Jogabilidade e talentos', save: 'Progresso e sincronização',
  account: 'Conta e login', ranking: 'Ranking', audio: 'Som e música',
  visual: 'Visual e desempenho', other: 'Outro assunto',
};

export function validateReport({ type, category, message } = {}) {
  if (!['problem', 'suggestion'].includes(type) || !Object.hasOwn(REPORT_CATEGORIES, category)) {
    throw new Error('Escolha o tipo de mensagem e o assunto.');
  }
  if (typeof message !== 'string' || !message.trim() || message.length > 500) {
    throw new Error('Escreva uma mensagem de até 500 caracteres.');
  }
  return { type, category, message: message.trim() };
}

export class ReportsClient {
  constructor({ api = null, webhook = '', fetcher = fetch, now = () => Date.now() } = {}) {
    this.api = api;
    this.webhook = webhook;
    this.fetcher = fetcher;
    this.now = now;
    this.lastAttempt = -Infinity;
    this.sending = false;
  }

  async send(report, { user, platform = 'web', demo = false } = {}) {
    const data = validateReport(report);
    if (this.api) {
      if (this.api.isMocked) throw new Error('O suporte precisa da API real do Paçoca. Nenhuma mensagem foi enviada.');
      if (this.sending || this.now() - this.lastAttempt < 60000) throw new Error('Aguarde um minuto antes de enviar outra mensagem.');
      this.sending = true;
      this.lastAttempt = this.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await this.api.request('/clicker/reports', {
          method: 'POST', signal: controller.signal, body: { ...data, platform, request_id: crypto.randomUUID() },
        });
        if (response?.sent !== true || !response.report_id) throw new Error('O servidor não confirmou o envio. Aguarde antes de repetir.');
        return { sent: true };
      } finally { clearTimeout(timeout); this.sending = false; }
    }
    const url = new URL(this.webhook || 'https://invalid.local');
    if (url.origin !== 'https://discord.com' || !/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)) {
      throw new Error('O canal de suporte ainda não está configurado. Tente novamente mais tarde.');
    }
    if (this.sending || this.now() - this.lastAttempt < 60000) throw new Error('Aguarde um minuto antes de enviar outra mensagem.');
    this.sending = true;
    this.lastAttempt = this.now();
    url.searchParams.set('wait', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.fetcher(url.href, {
        method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Paçoca Clicker · Suporte', allowed_mentions: { parse: [] },
          embeds: [{
            title: data.type === 'problem' ? 'Problema no jogo' : 'Sugestão para o jogo',
            description: data.message, color: data.type === 'problem' ? 11229757 : 11898952,
            fields: [
              { name: 'Assunto', value: REPORT_CATEGORIES[data.category] },
              { name: 'Jogador (identificação declarada pelo app)', value: demo ? 'Demonstração local' : String(user?.user_name || user?.name || 'Não informado').slice(0, 100) },
              { name: 'ID da conta', value: demo ? 'Não autenticado no servidor' : String(user?.id ?? 'Não informado').slice(0, 100), inline: true },
              { name: 'Plataforma', value: String(platform).slice(0, 30), inline: true },
            ], timestamp: new Date(this.now()).toISOString(),
            footer: { text: 'Identidade e limite de envio ainda não são verificados pelo servidor.' },
          }],
        }),
      });
      if (response.status === 429) throw new Error('O suporte recebeu muitas mensagens. Aguarde um pouco antes de tentar novamente.');
      if (!response.ok) throw new Error('Não foi possível enviar agora. Aguarde um minuto e tente novamente.');
      const confirmation = await response.json().catch(() => null);
      if (!confirmation?.id) throw new Error('Não foi possível confirmar o envio. Ele pode ter sido recebido; aguarde antes de repetir.');
      return { sent: true };
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new Error('Não foi possível confirmar o envio. Confira sua conexão e aguarde antes de repetir.');
      }
      throw error;
    } finally { clearTimeout(timeout); this.sending = false; }
  }
}
