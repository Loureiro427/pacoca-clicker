export class AudioManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = localStorage.getItem('pacoca_sfx') !== 'false';
    this.musicEnabled = localStorage.getItem('pacoca_music') !== 'false';

    // ==========================================================
    // SISTEMA DE PLAYLIST (MÚSICAS DE FUNDO)
    // ==========================================================
    this.musicTracks = [
      '/music/track1.mp3', // Lo-Fi Bossa Nova
      '/music/track2.mp3', // Upbeat Chiptune
      '/music/track3.mp3', // Electro Swing Leve
      '/music/track4.mp3'  // Chillwave Império
    ];
    this.currentTrackIndex = Math.floor(Math.random() * this.musicTracks.length); // Começa numa música aleatória
    
    this.bgmPlayer = new Audio();
    this.bgmPlayer.volume = 0.25; // Volume baixo (25%) para não abafar os cliques
    
    // Quando a música acaba, passa automaticamente para a próxima
    this.bgmPlayer.addEventListener('ended', () => {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
      this.playMusic();
    });
  }

  // Inicializa o áudio geral no primeiro clique na tela
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Dá o play na música caso esteja ativada no perfil
    if (this.musicEnabled && this.bgmPlayer.paused) {
      this.playMusic();
    }
  }

  // ---------------------------------------------------------
  // CONTROLES DE MÚSICA
  // ---------------------------------------------------------
  playMusic() {
    if (!this.musicEnabled) return;
    this.bgmPlayer.src = this.musicTracks[this.currentTrackIndex];
    this.bgmPlayer.play().catch(e => {
      console.warn('O navegador bloqueou o autoplay da música até o usuário interagir.');
    });
  }

  setMusic(enabled) {
    this.musicEnabled = enabled;
    if (enabled) {
      if (this.ctx) this.playMusic(); // Só toca se o jogo já foi iniciado
    } else {
      this.bgmPlayer.pause();
    }
  }

  setSfx(enabled) {
    this.sfxEnabled = enabled;
  }

  // ---------------------------------------------------------
  // EFEITOS SONOROS (SFX) GERADOS MATEMATICAMENTE
  // ---------------------------------------------------------
  playClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playBuy() {
    if (!this.sfxEnabled || !this.ctx) return;
    this._playNote(523.25, 'triangle', 0, 0.1); 
    this._playNote(659.25, 'triangle', 0.05, 0.15); 
  }

  playGoldenSpawn() {
    if (!this.sfxEnabled || !this.ctx) return;
    this._playNote(880, 'sine', 0, 0.2);
    this._playNote(1108.73, 'sine', 0.05, 0.2);
    this._playNote(1318.51, 'sine', 0.1, 0.3);
  }

  playGoldenCollect() {
    if (!this.sfxEnabled || !this.ctx) return;
    this._playNote(1046.50, 'sine', 0, 0.15);
    this._playNote(1318.51, 'sine', 0.05, 0.2);
    this._playNote(1567.98, 'sine', 0.1, 0.4);
  }

  playSkillLearn() {
    if (!this.sfxEnabled || !this.ctx) return;
    this._playNote(523.25, 'square', 0, 0.1);
    this._playNote(659.25, 'square', 0.1, 0.1);
    this._playNote(783.99, 'square', 0.2, 0.1);
    this._playNote(1046.50, 'square', 0.3, 0.3);
  }

  playPrestige() {
    if (!this.sfxEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);
    osc.start();
    osc.stop(this.ctx.currentTime + 2);

    this._playNote(440, 'sine', 0.5, 2);
    this._playNote(554.37, 'sine', 0.5, 2);
    this._playNote(659.25, 'sine', 0.5, 2);
  }

  _playNote(freq, type, delay, duration) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const startTime = this.ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}