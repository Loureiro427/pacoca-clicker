import test from 'node:test';
import assert from 'node:assert/strict';
import { RankingUI } from './RankingUI.js';

// DOM mínimo para testar respostas assíncronas e o texto apresentado ao jogador.
class Element {
  children = [];
  attributes = {};
  dataset = {};
  classList = { toggle() {} };
  textContent = '';
  addEventListener() {}
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  get childElementCount() { return this.children.length; }
}

function setup(t, api) {
  const previous = globalThis.document;
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  globalThis.document = { getElementById: get, createElement: () => new Element(),
    querySelectorAll: () => [], querySelector: () => null };
  t.after(() => { globalThis.document = previous; });
  return { ui: new RankingUI(api), get };
}

const response = (category, name = 'Jogador') => ({ category,
  players: [{ position: 1, value: 100, user: { id: 1, name } }], current_player: null });

test('troca rápida de categoria ignora resposta antiga sem travar controles', async t => {
  const requests = [];
  const { ui, get } = setup(t, { ranking: category => new Promise(resolve => requests.push({ category, resolve })) });
  const first = ui.load('fortune', true);
  const second = ui.load('gold');
  requests[1].resolve(response('gold', 'Ouro'));
  await second;
  requests[0].resolve(response('fortune', 'Antigo'));
  await first;
  assert.equal(ui.category, 'gold');
  assert.equal(ui.data.players[0].user.name, 'Ouro');
  assert.equal(get('ranking-results').attributes['aria-busy'], 'false');
  assert.equal(get('ranking-refresh').disabled, false);
});

test('erro de atualização mantém o resultado e categoria nova não mostra dados antigos', async t => {
  let fail = false;
  const { ui, get } = setup(t, { ranking: async category => {
    if (fail) throw new Error('offline');
    return response(category);
  } });
  await ui.load('fortune', true);
  const podium = get('ranking-podium').children[0];
  fail = true;
  await ui.load('fortune', true);
  assert.equal(get('ranking-podium').children[0], podium);
  assert.match(get('ranking-feedback').textContent, /anterior foi mantida/);
  await ui.load('structures');
  assert.equal(get('ranking-podium').children.length, 0);
  assert.equal(get('ranking-current-player').children.length, 0);
  assert.equal(get('ranking-state').hidden, false);
  assert.equal(ui.data, null);
});

test('bootstrap ausente carrega e nomes recebidos permanecem texto', async t => {
  let called = 0;
  const name = '<img src=x onerror=alert(1)>';
  const { ui, get } = setup(t, { ranking: async category => { called++; return response(category, name); } });
  ui.init(null);
  // Aguarda a continuação da consulta iniciada por init.
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(called, 1);
  const podium = get('ranking-podium').children[0];
  assert.equal(podium.children[2].textContent, name);
  assert.equal(podium.children[2].children.length, 0);
});

test('ranking vazio apresenta orientação e nenhuma posição pessoal fictícia', async t => {
  const { ui, get } = setup(t, { ranking: async () => ({ players: [], current_player: null }) });
  await ui.load('fortune', true);
  assert.equal(get('ranking-state').hidden, false);
  assert.equal(get('ranking-current-player').children.length, 0);
  assert.equal(get('ranking-count').textContent, '0 jogadores exibidos');
});
