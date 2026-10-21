// Limites generosos para preservar cliques rápidos e rajadas de toque.
// Esta barreira local não substitui a validação de progresso no servidor.
export class ManualClickGuard {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.accepted = [];
    this.blockedUntil = 0;
  }

  remainingMs() { return Math.max(0, this.blockedUntil - this.now()); }

  check(event) {
    if (event?.isTrusted !== true) return { allowed: false, reason: 'synthetic' };
    const now = this.now();
    if (this.blockedUntil > now) return { allowed: false, reason: 'rate', retryAfterMs: this.blockedUntil - now };
    this.accepted = this.accepted.filter(time => now - time < 10000);
    if (this.accepted.length >= 120 || this.accepted.filter(time => now - time < 1000).length >= 20) {
      this.blockedUntil = now + 30000;
      this.accepted = [];
      return { allowed: false, reason: 'rate', retryAfterMs: 30000 };
    }
    this.accepted.push(now);
    return { allowed: true };
  }
}
