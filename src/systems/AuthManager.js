import { ApiError } from '../api/PacocaApi.js';
import { SaveManager } from '../storage/SaveManager.js';

const TOKEN_KEY = 'pacoca_clicker_token';
const USER_KEY = 'pacoca_clicker_user';
const FRONTEND_URL = (import.meta.env.VITE_PACOCA_FRONTEND_URL || 'https://pacoca.net').replace(/\/+$/, '');

window.togglePassword = function(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
};

export class AuthManager {
  constructor(api, onAuthSuccess) {
    this.api = api;
    this.onAuthSuccess = onAuthSuccess;
    this.pendingUserId = null;
    this.remember = true;
    this.started = false;
  }

  async init() {
    this.bindEvents();
    this.configureExternalLinks();
    await this.runLoadingAnimation();

    if (this.api.isMocked) {
      try {
        const data = await this.api.login('local', 'local');
        await this.completeAuthentication(data.access_token, data.user, false);
      } catch (error) {
        this.showLogin(error.message);
      }
      return;
    }

    const session = this.readSession();
    if (!session?.token) {
      this.showLogin();
      return;
    }

    this.api.setToken(session.token);
    try {
      await this.completeAuthentication(session.token, session.user, session.remember);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.clearSession();
      }
      this.showLogin(error.message);
    }
  }

  bindEvents() {
    document.getElementById('login-form')?.addEventListener('submit', event => this.handleLogin(event));
    document.getElementById('two-factor-form')?.addEventListener('submit', event => this.handle2FA(event));
    document.getElementById('link-back-login')?.addEventListener('click', event => {
      event.preventDefault();
      this.pendingUserId = null;
      this.setView('login-view');
      this.setError('');
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());
    document.getElementById('forgot-password-link')?.addEventListener('click', event => {
      const login = document.getElementById('login-user')?.value.trim();
      if (login) event.currentTarget.href = `${FRONTEND_URL}/esqueci-minha-senha?login=${encodeURIComponent(login)}`;
    });
  }

  configureExternalLinks() {
    const registerLink = document.getElementById('link-go-register');
    const forgotLink = document.getElementById('forgot-password-link');
    if (registerLink) registerLink.href = `${FRONTEND_URL}/cadastro`;
    if (forgotLink) forgotLink.href = `${FRONTEND_URL}/esqueci-minha-senha`;
  }

  async handleLogin(event) {
    event.preventDefault();
    const login = document.getElementById('login-user')?.value.trim();
    const password = document.getElementById('login-pass')?.value || '';
    this.remember = document.getElementById('remember-me')?.checked !== false;

    if (!login || !password) {
      this.setError('Informe seu email ou nome de usuário e a senha.');
      return;
    }

    this.setBusy(true, 'Entrando...');
    this.setError('');

    try {
      const data = await this.api.login(login, password, this.remember);
      if (data.requires_2fa) {
        this.pendingUserId = data.user_id;
        this.setView('two-factor-view');
        document.getElementById('two-factor-code')?.focus();
        return;
      }

      await this.completeAuthentication(data.access_token, data.user, this.remember);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setBusy(false);
    }
  }

  async handle2FA(event) {
    event.preventDefault();
    const code = document.getElementById('two-factor-code')?.value.trim();
    if (!this.pendingUserId || !code) {
      this.setError('Informe o código de autenticação.');
      return;
    }

    this.setBusy(true, 'Verificando...');
    this.setError('');

    try {
      const data = await this.api.verify2FA(this.pendingUserId, code);
      await this.completeAuthentication(data.access_token, data.user, this.remember);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setBusy(false);
    }
  }

  async completeAuthentication(token, fallbackUser, remember) {
    if (this.started) return;

    this.api.setToken(token);
    const bootstrap = await this.api.bootstrap();
    const user = bootstrap.user || fallbackUser;
    await this.onAuthSuccess({ token, user, bootstrap, remember });
    if (!this.api.isMocked) this.saveSession(token, user, remember);
    this.started = true;
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'none';
  }

  async logout() {
    window.dispatchEvent(new Event('pacoca:before-logout'));
    await SaveManager.flush().catch(() => {});
    await SaveManager.flush().catch(() => {});
    const session = this.readSession();
    const button = document.getElementById('btn-logout');
    if (button) button.disabled = true;

    try {
      await this.api.logout(session?.user?.id);
    } catch (_) {
      // A sessão local deve ser encerrada mesmo se o servidor estiver indisponível.
    }

    this.clearSession();
    window.location.reload();
  }

  async runLoadingAnimation() {
    const fill = document.getElementById('loading-bar-fill');
    for (const progress of [18, 42, 68, 88, 100]) {
      if (fill) fill.style.width = `${progress}%`;
      await new Promise(resolve => setTimeout(resolve, 90));
    }
  }

  showLogin(message = '') {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    this.setView('login-view');
    this.setError(message);
  }

  setView(viewId) {
    document.querySelectorAll('.auth-view').forEach(view => view.classList.toggle('active', view.id === viewId));
  }

  setError(message) {
    const elements = document.querySelectorAll('.auth-error-message');
    elements.forEach(element => {
      element.textContent = message || '';
      element.style.display = message ? 'block' : 'none';
    });
  }

  setBusy(busy, label = 'Entrar') {
    const buttons = document.querySelectorAll('#btn-login-submit, #btn-two-factor-submit');
    buttons.forEach(button => {
      button.disabled = busy;
      if (button.id === 'btn-login-submit') button.textContent = busy ? label : 'Entrar';
      if (button.id === 'btn-two-factor-submit') button.textContent = busy ? label : 'Confirmar código';
    });
  }

  saveSession(token, user, remember) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  readSession() {
    for (const [storage, remember] of [[localStorage, true], [sessionStorage, false]]) {
      const token = storage.getItem(TOKEN_KEY);
      if (!token) continue;

      try {
        return { token, user: JSON.parse(storage.getItem(USER_KEY) || 'null'), remember };
      } catch (_) {
        return { token, user: null, remember };
      }
    }

    return null;
  }

  clearSession() {
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    });
    this.api.setToken(null);
  }
}
