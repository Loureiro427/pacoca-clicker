/** Chuva decorativa limitada; não interfere na pontuação nem nos toques. */
export function createPacocaParticles(game) {
  const layer = document.getElementById('pacoca-particles');
  const area = document.getElementById('click-area');
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const particles = new Set();
  const clear = () => { for (const particle of [...particles]) particle.removeParticle(); };
  const emit = (count = 1) => {
    if (!layer || !area.classList.contains('active') || document.hidden || motion?.matches) return;
    for (let i = 0; i < count && particles.size < 32; i++) {
      const image = document.createElement('img');
      image.src = '/pacoca.png';
      image.alt = '';
      image.draggable = false;
      image.className = 'mini-pacoca';
      const duration = 4 + Math.random() * 3;
      image.style.left = `${Math.random() * 96}%`;
      image.style.width = `${22 + Math.random() * 18}px`;
      image.style.animationDuration = `${duration}s`;
      image.style.setProperty('--mini-rotation', `${120 + Math.random() * 240}deg`);
      let timeout;
      image.removeParticle = () => { clearTimeout(timeout); particles.delete(image); image.remove(); };
      image.addEventListener('animationend', image.removeParticle, { once: true });
      particles.add(image);
      layer.appendChild(image);
      timeout = setTimeout(image.removeParticle, duration * 1000 + 150);
    }
  };
  const interval = setInterval(() => {
    if (document.hidden || !area?.classList.contains('active') || motion?.matches) { clear(); return; }
    if (game.pps > 0) emit(Math.min(3, 1 + Math.floor(Math.log10(Math.max(1, game.pps)) / 3)));
  }, 650);
  const onVisibility = () => { if (document.hidden) clear(); };
  document.addEventListener('visibilitychange', onVisibility);
  return {
    emit,
    destroy() { clearInterval(interval); clear(); document.removeEventListener('visibilitychange', onVisibility); },
  };
}
