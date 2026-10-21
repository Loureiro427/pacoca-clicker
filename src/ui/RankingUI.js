import { formatNumber } from '../utils/format.js';

const CDN_URL = (import.meta.env.VITE_PACOCA_CDN_URL || 'https://cdn.pacoca.net/pacoca-prod-files').replace(/\/+$/, '');

export class RankingUI {
  constructor(api) {
    this.api = api;
    this.category = 'fortune';
    this.loading = false;
  }

  init(initialData) {
    document.querySelectorAll('.rank-tab').forEach(button => {
      button.addEventListener('click', () => this.load(button.dataset.category));
    });

    document.querySelector('[data-target="ranking-area"]')?.addEventListener('click', () => this.load(this.category, true));
    this.render(initialData);
  }

  async load(category, refresh = false) {
    if (this.loading || (!refresh && category === this.category)) return;
    this.loading = true;
    this.category = category || 'fortune';
    this.setActiveTab();
    this.showState('Carregando ranking...');

    try {
      this.render(await this.api.ranking(this.category));
    } catch (error) {
      this.showState(error.message, true);
    } finally {
      this.loading = false;
    }
  }

  render(data) {
    if (!data) return;
    this.category = data.category || this.category;
    this.setActiveTab();

    const players = Array.isArray(data.players) ? data.players : [];
    const podium = document.getElementById('ranking-podium');
    const list = document.getElementById('ranking-list-data');
    const current = document.getElementById('ranking-current-player');

    podium.replaceChildren();
    list.replaceChildren();

    const top = players.slice(0, 3);
    [top[1], top[0], top[2]].filter(Boolean).forEach(entry => podium.appendChild(this.createPodium(entry)));
    players.slice(3).forEach(entry => list.appendChild(this.createRankCard(entry)));

    if (players.length === 0) this.showState('Ainda não há jogadores neste ranking.');

    if (data.current_player) {
      current.replaceChildren(...this.createRankCard(data.current_player, true).childNodes);
      current.style.display = 'flex';
    } else {
      current.style.display = 'none';
    }
  }

  createPodium(entry) {
    const position = Number(entry.position);
    const step = document.createElement('div');
    step.className = `podium-step step-${position}`;

    if (position === 1) {
      const crown = document.createElement('div');
      crown.className = 'podium-crown';
      crown.textContent = '👑';
      step.appendChild(crown);
    }

    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = `podium-avatar-wrapper ${position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze'}`;
    const avatar = this.createAvatar(entry.user, 'podium-avatar');
    const medal = document.createElement('div');
    medal.className = 'podium-medal';
    medal.textContent = position;
    avatarWrapper.append(avatar, medal);

    const name = document.createElement('strong');
    name.className = 'podium-name';
    name.textContent = entry.user?.name || entry.user?.user_name || 'Jogador';
    const score = document.createElement('span');
    score.className = 'podium-score';
    score.textContent = this.valueLabel(entry.value);
    step.append(avatarWrapper, name, score);
    return step;
  }

  createRankCard(entry, isCurrent = false) {
    const card = document.createElement('div');
    card.className = `rank-card${isCurrent ? ' is-me' : ''}`;
    const position = document.createElement('div');
    position.className = 'rank-pos';
    position.textContent = entry.position;
    const info = document.createElement('div');
    info.className = 'rank-info';
    const name = document.createElement('strong');
    name.textContent = isCurrent ? `${entry.user?.name || 'Você'} (você)` : entry.user?.name || entry.user?.user_name || 'Jogador';
    const value = document.createElement('span');
    value.textContent = this.valueLabel(entry.value);
    info.append(name, value);
    card.append(position, this.createAvatar(entry.user, 'rank-avatar'), info);
    return card;
  }

  createAvatar(user, className) {
    const image = document.createElement('img');
    image.className = className;
    image.alt = user?.name || 'Jogador';
    image.src = this.avatarUrl(user?.img_account);
    image.onerror = () => {
      image.onerror = null;
      image.src = '/pacoca.png';
    };
    return image;
  }

  avatarUrl(path) {
    if (!path) return '/pacoca.png';
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    return `${CDN_URL}/${String(path).replace(/^\/+/, '')}`;
  }

  valueLabel(value) {
    const formatted = formatNumber(Number(value) || 0);
    if (this.category === 'gold') return `${formatted} Paçocas de Ouro`;
    if (this.category === 'structures') return `${formatted} estruturas`;
    return `${formatted} Paçocas`;
  }

  setActiveTab() {
    document.querySelectorAll('.rank-tab').forEach(button => {
      button.classList.toggle('active', button.dataset.category === this.category);
    });
  }

  showState(message, isError = false) {
    const list = document.getElementById('ranking-list-data');
    if (!list) return;
    list.replaceChildren();
    const state = document.createElement('div');
    state.className = `ranking-state${isError ? ' error' : ''}`;
    state.textContent = message;
    list.appendChild(state);
  }
}
