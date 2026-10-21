import { formatNumber } from '../utils/format.js';
import { normalizeRanking, RANKING_CATEGORIES, safeAvatarUrl } from './RankingData.js';

const CDN_URL = (import.meta.env?.VITE_PACOCA_CDN_URL || 'https://cdn.pacoca.net/pacoca-prod-files').replace(/\/+$/, '');
const el = id => document.getElementById(id);
const fullNumber = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);

export class RankingUI {
  constructor(api) {
    this.api = api;
    this.category = 'fortune';
    this.loading = false;
    this.requestId = 0;
    this.data = null;
  }

  init(initialData) {
    document.querySelectorAll('.rank-tab').forEach(button => {
      button.addEventListener('click', () => this.load(button.dataset.category));
    });
    el('ranking-refresh')?.addEventListener('click', () => this.load(this.category, true));
    document.querySelector('[data-target="ranking-area"]')?.addEventListener('click', () => this.load(this.category, true));
    this.setActiveTab();
    if (initialData) {
      try { this.render(normalizeRanking(initialData, this.category)); }
      catch { this.load(this.category, true); }
    } else {
      this.load(this.category, true);
    }
  }

  async load(category, refresh = false) {
    if (!RANKING_CATEGORIES[category]) return;
    if (!refresh && category === this.category && (this.loading || this.data)) return;
    const requestId = ++this.requestId;
    const keepResults = this.data?.category === category;
    this.loading = true;
    this.category = category;
    this.setActiveTab();
    this.setBusy(true);
    el('ranking-feedback').textContent = keepResults ? 'Atualizando sua classificação…' : 'Buscando os maiores impérios…';
    if (!keepResults) {
      this.data = null;
      this.clearResults();
      this.showSkeleton();
    }
    try {
      const response = await this.api.ranking(category);
      if (requestId !== this.requestId) return;
      this.render(normalizeRanking(response, category));
    } catch {
      if (requestId !== this.requestId) return;
      if (!keepResults) {
        this.clearResults();
        this.showState('Não foi possível carregar', 'Confira sua conexão e tente novamente.', true);
      }
      el('ranking-feedback').textContent = keepResults
        ? 'Não foi possível atualizar. A classificação anterior foi mantida. Tente novamente.'
        : 'Ranking indisponível no momento.';
    } finally {
      if (requestId === this.requestId) {
        this.loading = false;
        this.setBusy(false);
      }
    }
  }

  clearResults() {
    el('ranking-podium').replaceChildren();
    el('ranking-list-data').replaceChildren();
    el('ranking-state').hidden = true;
    el('ranking-current-player').replaceChildren();
    el('ranking-personal-hint').textContent = 'Sua posição aparece quando seu progresso entrar na classificação.';
    el('ranking-count').textContent = '';
    el('ranking-updated').textContent = 'Aguardando atualização';
    el('ranking-demo').hidden = true;
    el('ranking-source').textContent = 'Classificação global';
  }

  render(data) {
    this.data = data;
    this.category = data.category;
    this.clearResults();
    this.setActiveTab();
    const podium = el('ranking-podium');
    const list = el('ranking-list-data');
    // Usa a posição do servidor; a ordem de chegada não define o vencedor.
    [2, 1, 3].forEach(position => {
      const entry = data.players.find(player => player.position === position);
      if (entry) podium.appendChild(this.createPodium(entry));
    });
    data.players.filter(entry => entry.position > 3).forEach(entry => list.appendChild(this.createRankCard(entry)));
    if (!data.players.length) {
      this.showState('O próximo império pode ser o seu', 'Ainda não há jogadores nesta categoria. Continue produzindo e volte para conferir.');
    } else if (!list.childElementCount) {
      const message = document.createElement('p');
      message.className = 'ranking-list-note';
      message.textContent = 'Os jogadores classificados estão no pódio acima.';
      list.appendChild(message);
    }
    el('ranking-demo').hidden = !data.demo;
    el('ranking-source').textContent = data.demo ? 'Prévia demonstrativa' : 'Classificação global';
    el('ranking-count').textContent = data.total_players !== null
      ? `${fullNumber(data.total_players)} participantes`
      : `${data.players.length} jogadores exibidos`;
    if (data.current_player) {
      el('ranking-current-player').appendChild(this.createRankCard(data.current_player, true));
      const ahead = data.players.find(player => player.position === data.current_player.position - 1);
      el('ranking-personal-hint').textContent = data.current_player.position === 1
        ? 'O topo é seu. Cada paçoca conta para continuar aqui.'
        : ahead && ahead.value > data.current_player.value
          ? `Você está a ${formatNumber(ahead.value - data.current_player.value)} ${RANKING_CATEGORIES[this.category].unit} da pontuação de quem está à sua frente.`
          : data.current_player.position === null
            ? 'Seu progresso ainda não tem uma posição nesta categoria.'
            : 'Sua jornada continua. Produza mais e conquiste seu próximo lugar.';
    }
    const time = data.updated_at ? new Date(data.updated_at) : new Date();
    el('ranking-updated').textContent = `${data.updated_at ? 'Dados de' : 'Consultado em'} ${time.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
    el('ranking-feedback').textContent = data.players.length ? 'Classificação atualizada.' : 'Nenhum jogador classificado nesta categoria.';
  }

  createPodium(entry) {
    const step = document.createElement('div');
    step.className = `podium-step step-${entry.position}`;
    step.setAttribute('role', 'listitem');
    const label = document.createElement('span');
    label.className = 'podium-title';
    label.textContent = entry.position === 1 ? '✦ PRIMEIRO LUGAR' : `${entry.position}º LUGAR`;
    const wrapper = document.createElement('div');
    wrapper.className = `podium-avatar-wrapper ${['', 'gold', 'silver', 'bronze'][entry.position]}`;
    const medal = document.createElement('span');
    medal.className = 'podium-medal';
    medal.textContent = entry.position;
    wrapper.append(this.createAvatar(entry.user, 'podium-avatar'), medal);
    const name = document.createElement('strong');
    name.className = 'podium-name';
    name.textContent = entry.user.name;
    name.title = entry.user.name;
    const username = document.createElement('span');
    username.className = 'podium-username';
    username.textContent = entry.user.user_name ? `@${entry.user.user_name}` : 'Jogador';
    const score = document.createElement('strong');
    score.className = 'podium-score';
    score.textContent = formatNumber(entry.value);
    score.title = this.valueLabel(entry.value, true);
    const unit = document.createElement('span');
    unit.className = 'podium-unit';
    unit.textContent = RANKING_CATEGORIES[this.category].unit;
    step.append(label, wrapper, name, username, score, unit);
    return step;
  }

  createRankCard(entry, isCurrent = false) {
    const card = document.createElement('div');
    card.className = `rank-card${isCurrent ? ' is-me' : ''}`;
    if (!isCurrent) card.setAttribute('role', 'listitem');
    const position = document.createElement('div');
    position.className = 'rank-pos';
    position.textContent = entry.position === null ? '—' : `#${fullNumber(entry.position)}`;
    const info = document.createElement('div');
    info.className = 'rank-info';
    const name = document.createElement('strong');
    name.textContent = isCurrent ? `${entry.user.name} · Você` : entry.user.name;
    name.title = name.textContent;
    const username = document.createElement('span');
    username.textContent = entry.user.user_name ? `@${entry.user.user_name}` : 'Jogador';
    info.append(name, username);
    const value = document.createElement('div');
    value.className = 'rank-value';
    value.title = this.valueLabel(entry.value, true);
    const score = document.createElement('strong');
    score.textContent = formatNumber(entry.value);
    const unit = document.createElement('span');
    unit.textContent = RANKING_CATEGORIES[this.category].unit;
    value.append(score, unit);
    card.append(position, this.createAvatar(entry.user, 'rank-avatar'), info, value);
    return card;
  }

  createAvatar(user, className) {
    const image = document.createElement('img');
    image.className = className;
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.src = safeAvatarUrl(user.img_account, CDN_URL);
    image.onerror = () => { image.onerror = null; image.src = '/pacoca.png'; };
    return image;
  }

  valueLabel(value, full = false) {
    return `${full ? fullNumber(value) : formatNumber(value)} ${RANKING_CATEGORIES[this.category].unit}`;
  }

  setActiveTab() {
    document.querySelectorAll('.rank-tab').forEach(button => {
      const active = button.dataset.category === this.category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    el('ranking-description').textContent = RANKING_CATEGORIES[this.category].description;
  }

  setBusy(busy) {
    el('ranking-results').setAttribute('aria-busy', String(busy));
    el('ranking-refresh').disabled = busy;
  }

  showSkeleton() {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'ranking-skeleton';
      skeleton.setAttribute('aria-hidden', 'true');
      el('ranking-list-data').appendChild(skeleton);
    }
  }

  showState(title, message, isError = false) {
    const state = el('ranking-state');
    state.hidden = false;
    state.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'ranking-state-icon';
    icon.textContent = isError ? '↻' : '✦';
    icon.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('strong');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = message;
    state.append(icon, heading, description);
    if (isError) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'ranking-refresh';
      retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', () => this.load(this.category, true));
      state.appendChild(retry);
    }
  }
}
