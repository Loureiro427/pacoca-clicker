// Função para alternar visibilidade de senhas
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  }
};

export class AuthManager {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.init();
  }

  init() {
    this.startLoadingScreen();
    this.bindEvents();
  }

  startLoadingScreen() {
    const bar = document.getElementById('loading-bar-fill');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 10;
      if (bar) bar.style.width = `${Math.min(100, progress)}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) loadingScreen.style.display = 'none';

          // Se o usuário já selecionou "Manter logado" antes, entra direto no jogo
          const isLogged = localStorage.getItem('pacoca_logged_in') === 'true';
          if (isLogged) {
            this.finishAuth();
          } else {
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) authScreen.style.display = 'flex';
          }
        }, 300);
      }
    }, 120);
  }

  bindEvents() {
    const linkGoRegister = document.getElementById('link-go-register');
    const linkGoLogin = document.getElementById('link-go-login');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    // Troca para tela de Cadastro
    if (linkGoRegister) {
      linkGoRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.remove('active');
        registerView.classList.add('active');
      });
    }

    // Troca para tela de Login
    if (linkGoLogin) {
      linkGoLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.classList.remove('active');
        loginView.classList.add('active');
      });
    }

    // Submissão do Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', () => {
        const remember = document.getElementById('remember-me').checked;
        if (remember) {
          localStorage.setItem('pacoca_logged_in', 'true');
        }
        this.finishAuth();
      });
    }

    // Submissão do Cadastro
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', () => {
        localStorage.setItem('pacoca_logged_in', 'true');
        this.finishAuth();
      });
    }
  }

  finishAuth() {
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.style.display = 'none';

    // Executa a inicialização do jogo!
    if (this.onAuthSuccess) {
      this.onAuthSuccess();
    }
  }
}