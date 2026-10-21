import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from './AudioManager.js';

function setup(t, { context = true } = {}) {
  const previous = { Audio: globalThis.Audio, window: globalThis.window, localStorage: globalThis.localStorage };
  class Player {
    paused = true;
    sourceChanges = 0;
    plays = 0;
    listeners = {};
    set src(value) { this.source = value; this.sourceChanges++; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    play() { this.plays++; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  class Context {
    state = 'suspended';
    resumes = 0;
    resume() { this.resumes++; this.state = 'running'; return Promise.resolve(); }
  }
  globalThis.Audio = Player;
  globalThis.window = context ? { AudioContext: Context } : {};
  globalThis.localStorage = { getItem: () => null };
  t.after(() => Object.assign(globalThis, previous));
  return new AudioManager();
}

test('toques repetidos durante o carregamento não reiniciam a música', async t => {
  const audio = setup(t);
  let finishPlay;
  audio.bgmPlayer.play = () => {
    audio.bgmPlayer.plays++;
    return new Promise(resolve => { finishPlay = resolve; });
  };
  audio.init();
  audio.init();
  audio.init();
  assert.equal(audio.bgmPlayer.plays, 1);
  assert.equal(audio.bgmPlayer.sourceChanges, 1);
  finishPlay();
  await audio.musicPlayPromise;
  audio.init();
  assert.equal(audio.bgmPlayer.sourceChanges, 1);
  finishPlay();
  await audio.musicPlayPromise;
});

test('ativar música funciona antes do primeiro clique e sem Web Audio', async t => {
  const audio = setup(t, { context: false });
  audio.setMusic(false);
  audio.setMusic(true);
  await audio.musicPlayPromise;
  assert.equal(audio.ctx, null);
  assert.equal(audio.bgmPlayer.plays, 1);
  assert.equal(audio.bgmPlayer.paused, false);
});

test('desativar e reativar música preserva a faixa carregada', async t => {
  const audio = setup(t);
  audio.init();
  await audio.musicPlayPromise;
  audio.setMusic(false);
  assert.equal(audio.bgmPlayer.paused, true);
  audio.init();
  assert.equal(audio.bgmPlayer.plays, 1);
  audio.setMusic(true);
  await audio.musicPlayPromise;
  assert.equal(audio.bgmPlayer.sourceChanges, 1);
  assert.equal(audio.bgmPlayer.plays, 2);
});

test('playlist avança e interação retoma efeitos interrompidos', async t => {
  const audio = setup(t);
  audio.init();
  await audio.musicPlayPromise;
  await audio.resumePromise;
  const firstIndex = audio.currentTrackIndex;
  audio.bgmPlayer.listeners.ended();
  await audio.musicPlayPromise;
  assert.equal(audio.currentTrackIndex, (firstIndex + 1) % 4);
  assert.equal(audio.bgmPlayer.sourceChanges, 2);
  audio.ctx.state = 'interrupted';
  audio.init();
  await audio.resumePromise;
  assert.equal(audio.ctx.resumes, 2);
  assert.equal(audio.ctx.state, 'running');
});

test('falha de autoplay permite nova tentativa na próxima interação', async t => {
  const audio = setup(t);
  const warn = console.warn;
  console.warn = () => {};
  audio.bgmPlayer.play = () => Promise.reject(new Error('Autoplay bloqueado'));
  try {
    audio.init();
    await audio.musicPlayPromise;
    assert.equal(audio.musicPlayPromise, null);
    audio.bgmPlayer.play = () => { audio.bgmPlayer.paused = false; return Promise.resolve(); };
    audio.init();
    await audio.musicPlayPromise;
    assert.equal(audio.bgmPlayer.paused, false);
    assert.equal(audio.bgmPlayer.sourceChanges, 1);
  } finally { console.warn = warn; }
});
