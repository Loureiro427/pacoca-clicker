import { formatNumber } from '../utils/format.js';

export function formatClickGain(value) {
  return value < 1000 ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : formatNumber(value);
}

export function bindClickExperience(game, { particles } = {}) {
  const button = document.getElementById('pacoca-button');
  if (!button) return;
  let animation;
  const produce = (x, y) => {
    const result = game.click();
    particles?.emit(result.isCrit ? 4 : 2);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const message = document.getElementById('click-result');
    message.textContent = `+${formatClickGain(result.gained)} paçocas${result.isCrit ? ' · Crítico!' : result.echo ? ' · Com eco!' : ''}`;
    message.title = result.gained.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
    const status = document.getElementById('click-special-status');
    if (result.isCrit || result.echo || result.empowered) {
      status.textContent = result.isCrit ? `Crítico de ${result.critMultiplier}×!` : result.echo ? 'Eco clicável ativado!' : 'Mão de Pedra ativa!';
    } else { status.textContent = ''; }
    if (!reducedMotion) {
      animation?.cancel();
      animation = button.animate?.([
        { transform: 'scale(1)' }, { transform: 'scale(.94) translateY(4px)', offset: .35 }, { transform: 'scale(1)' },
      ], { duration: 150, easing: 'ease-out' });
      showClickFloater(x, y, result);
    }
  };
  button.addEventListener('dragstart', event => event.preventDefault());
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || button.disabled) return;
    event.preventDefault();
    produce(event.clientX, event.clientY);
  });
  // Enter, Espaço e tecnologias assistivas geram um click sem ponteiro.
  button.addEventListener('click', event => {
    if (event.detail !== 0 || button.disabled) return;
    const rect = button.getBoundingClientRect();
    produce(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

}

function showClickFloater(x, y, result) {
  const existing = document.querySelectorAll('.click-gain-floater');
  if (existing.length >= 12) existing[0].remove();
  const floater = document.createElement('div');
  floater.className = `click-gain-floater${result.isCrit ? ' is-critical' : ''}`;
  floater.setAttribute('aria-hidden', 'true');
  floater.textContent = `${result.isCrit ? '✦ ' : ''}+${formatClickGain(result.gained)}`;
  floater.style.left = `${Math.min(window.innerWidth - 50, Math.max(50, x))}px`;
  floater.style.top = `${y}px`;
  document.body.appendChild(floater);
  setTimeout(() => floater.remove(), 750);
}

export function updateClickStats(game, now = Date.now()) {
  const text = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  text('click-base-value', `+${formatClickGain(game.clickValue)}`);
  text('click-total-count', formatNumber(game.totalClicks));
  const combo = document.getElementById('click-combo');
  if (!combo) return;
  const hasCombo = game.skillTree.hasSkill('act_4');
  const empowered = game.maoDePedraTime > 0;
  combo.hidden = !hasCombo && !empowered;
  if (combo.hidden) return;
  const count = now - game.lastClickTime < 800 ? game.comboCount : 0;
  text('click-combo-label', empowered ? '✦ Mão de Pedra ativa' : 'Combo de cliques');
  text('click-combo-count', empowered ? `${Math.ceil(game.maoDePedraTime)}s` : `${count} / 50`);
  text('click-combo-hint', empowered ? 'Poder triplo nos seus cliques.' : count ? `+${count}% no clique base. Mantenha o ritmo!` : 'Toque em sequência para fortalecer seus cliques.');
  const fill = document.getElementById('click-combo-fill');
  if (fill) fill.style.width = `${empowered ? Math.min(100, game.maoDePedraTime / 3 * 100) : count * 2}%`;
}
