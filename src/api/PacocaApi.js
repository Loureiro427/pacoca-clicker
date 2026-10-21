import { createDemoRanking } from './RankingDemo.js';

const API_URL = (import.meta.env.VITE_PACOCA_API_URL || 'https://api.pacoca.net/api').replace(/\/+$/, '');
const USE_LOCAL_MOCK = import.meta.env.DEV;
const LOCAL_USER = {
  id: 'local-player',
  name: 'Jogador local',
  user_name: 'jogador_local',
  img_account: null,
};
const LOCAL_SAVE_KEY = `pacoca_clicker_save:${LOCAL_USER.id}`;

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class PacocaApi {
  constructor() {
    this.token = null;
    this.deviceId = this.getDeviceId();
    this.isMocked = USE_LOCAL_MOCK;
    this.mockRevision = 0;
    this.mockState = this.readMockState();
  }

  setToken(token) {
    this.token = token || null;
  }

  async login(login, password, remember = true) {
    if (this.isMocked) return this.mockLogin();

    return this.request('/login', {
      method: 'POST',
      auth: false,
      body: { login, password, remember },
    });
  }

  async verify2FA(userId, code) {
    if (this.isMocked) return this.mockLogin();

    return this.request('/2fa/verify', {
      method: 'POST',
      auth: false,
      body: { user_id: userId, code },
    });
  }

  async bootstrap() {
    if (this.isMocked) {
      return {
        user: LOCAL_USER,
        profile: { state: this.mockState, revision: this.mockRevision },
        ranking: this.mockRanking(),
      };
    }

    return this.request('/clicker/bootstrap');
  }

  async saveProgress(state, revision) {
    if (this.isMocked) {
      this.mockState = state;
      this.mockRevision = Math.max(this.mockRevision, Number(revision) || 0) + 1;
      return {
        saved: true,
        profile: { state: this.mockState, revision: this.mockRevision },
      };
    }

    return this.request('/clicker/progress', {
      method: 'PUT',
      body: { state, revision },
    });
  }

  async resetProgress() {
    if (this.isMocked) {
      this.mockState = null;
      this.mockRevision += 1;
      return { deleted: true };
    }

    return this.request('/clicker/progress', { method: 'DELETE' });
  }

  async ranking(category = 'fortune') {
    if (this.isMocked) return this.mockRanking(category);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      return await this.request(`/clicker/ranking?category=${encodeURIComponent(category)}`, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async logout(userId) {
    if (this.isMocked) return { logged_out: true };

    return this.request('/logout', {
      method: 'POST',
      auth: false,
      body: { token: this.token, user_id: userId },
    });
  }

  async request(path, { method = 'GET', body, auth = true, signal } = {}) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'pt-BR',
      'X-Device-Id': this.deviceId,
    };

    if (auth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new ApiError('Não foi possível conectar à API do Paçoca. Verifique sua internet.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationMessage = data?.errors
        ? Object.values(data.errors).flat().find(Boolean)
        : null;
      throw new ApiError(validationMessage || data?.message || 'Não foi possível concluir a solicitação.', response.status, data);
    }

    return data;
  }

  mockLogin() {
    return {
      access_token: 'local-mock-token',
      user: LOCAL_USER,
      requires_2fa: false,
    };
  }

  mockRanking(category = 'fortune') {
    return createDemoRanking(category, this.mockState, LOCAL_USER);
  }

  readMockState() {
    if (!this.isMocked) return null;

    try {
      return JSON.parse(localStorage.getItem(LOCAL_SAVE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  getDeviceId() {
    const key = 'pacoca_clicker_device_id';
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
      deviceId = globalThis.crypto?.randomUUID?.()
        || `clicker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, deviceId);
    }

    return deviceId;
  }
}
