import test from 'node:test';
import assert from 'node:assert/strict';
import { ReportsClient, validateReport } from './ReportsClient.js';

const webhook = 'https://discord.com/api/webhooks/123456789/test-token';
const report = { type: 'problem', category: 'save', message: 'Meu progresso não aparece.' };

test('mensagens vazias, tipos desconhecidos e mais de 500 caracteres são rejeitados', () => {
  assert.throws(() => validateReport({ ...report, message: ' ' }));
  assert.throws(() => validateReport({ ...report, message: 'a'.repeat(501) }));
  assert.throws(() => validateReport({ ...report, category: '__proto__' }));
  assert.equal(validateReport({ ...report, type: 'suggestion', message: 'a'.repeat(500) }).message.length, 500);
});

test('envio pede confirmação e bloqueia menções, sem transmitir senha ou token da conta', async () => {
  let request;
  const client = new ReportsClient({ webhook, fetcher: async (url, options) => {
    request = { url, ...options };
    return { ok: true, json: async () => ({ id: 'confirmado' }) };
  } });
  assert.deepEqual(await client.send({ ...report, message: '@everyone Teste' }, { user: { id: 7, name: 'Pessoa', password: 'NÃO ENVIAR', token: 'NÃO ENVIAR' }, platform: 'android' }), { sent: true });
  assert.match(request.url, /wait=true/);
  const payload = JSON.parse(request.body);
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
  assert.equal(request.body.includes('NÃO ENVIAR'), false);
  assert.equal(payload.embeds[0].description, '@everyone Teste');
});

test('limite local impede envios repetidos e libera após um minuto', async () => {
  let time = 0;
  let calls = 0;
  const client = new ReportsClient({ webhook, now: () => time, fetcher: async () => {
    calls++; return { ok: true, json: async () => ({ id: 'id' }) };
  } });
  await client.send(report);
  await assert.rejects(client.send(report), /um minuto/);
  assert.equal(calls, 1);
  time = 60000;
  await client.send(report);
  assert.equal(calls, 2);
});

test('falhas e respostas sem recibo nunca são apresentadas como sucesso', async () => {
  for (const response of [
    { ok: false, status: 429 },
    { ok: false, status: 500 },
    { ok: true, json: async () => ({}) },
  ]) {
    const client = new ReportsClient({ webhook, fetcher: async () => response });
    await assert.rejects(client.send(report));
    assert.equal(client.sending, false);
  }
});

test('canal não configurado não faz nenhuma chamada de rede', async () => {
  let calls = 0;
  const client = new ReportsClient({ webhook: '', fetcher: async () => calls++ });
  await assert.rejects(client.send(report), /não está configurado/);
  assert.equal(calls, 0);
});

test('suporte integrado usa sessão da API e exige recibo antes de confirmar', async () => {
  let request;
  const api = { request: async (path, options) => { request = { path, ...options }; return { sent: true, report_id: 'receipt-1' }; } };
  const client = new ReportsClient({ api });
  await client.send(report, { platform: 'android', user: { id: 'forged' } });
  assert.equal(request.path, '/clicker/reports');
  assert.equal(request.body.platform, 'android');
  assert.equal(request.body.user, undefined);
  assert.equal(request.body.type, 'problem');
  assert.ok(request.body.request_id);
  const unconfirmed = new ReportsClient({ api: { request: async () => ({ sent: true }) } });
  await assert.rejects(unconfirmed.send(report), /não confirmou/);
  const demo = new ReportsClient({ api: { isMocked: true } });
  await assert.rejects(demo.send(report), /Nenhuma mensagem/);
});
