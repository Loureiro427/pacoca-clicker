export const AchievementsData = [
  // --- Cliques ---
  {
    id: 'first_click',
    name: 'Primeiro Toque',
    desc: 'Deu o primeiro toque na Paçoca.',
    reqType: 'totalClicks',
    reqValue: 1,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    id: 'clicker_100',
    name: 'Dedo Ágil',
    desc: 'Alcance 100 toques manuais na Paçoca.',
    reqType: 'totalClicks',
    reqValue: 100,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`
  },
  {
    id: 'clicker_10k',
    name: 'Tendinite Adquirida',
    desc: 'Alcance 10.000 toques manuais. Seu médico mandou lembranças.',
    reqType: 'totalClicks',
    reqValue: 10000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10l4.5 4.5"/><circle cx="12" cy="12" r="9" stroke-dasharray="4 2"/></svg>`
  },
  {
    id: 'clicker_100k',
    name: 'Película Trincada',
    desc: '100.000 toques! Sua película de vidro não aguentou a pressão.',
    reqType: 'totalClicks',
    reqValue: 100000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="4"/><path d="M7 6l10 12M17 6L7 18" stroke-dasharray="2 2"/></svg>`
  },

  // --- Economia (Total Acumulado) ---
  {
    id: 'earned_1k',
    name: 'Primeiro Milhar',
    desc: 'Produza um total acumulado de 1.000 Paçocas.',
    reqType: 'totalEarned',
    reqValue: 1000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>`
  },
  {
    id: 'earned_1m',
    name: 'Milionário da Paçoca',
    desc: 'Acumule 1 Milhão. Já dá para abrir uma conta secreta.',
    reqType: 'totalEarned',
    reqValue: 1000000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
  },
  {
    id: 'earned_1b',
    name: 'Elon Musk do Amendoim',
    desc: '1 Bilhão de Paçocas. Já dá para lançar um foguete de açúcar?',
    reqType: 'totalEarned',
    reqValue: 1000000000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22l10-4 10 4L12 2z"/></svg>`
  },
  {
    id: 'earned_1t',
    name: 'PIB de um País',
    desc: '1 Trilhão! Sua fábrica controla a economia mundial agora.',
    reqType: 'totalEarned',
    reqValue: 1000000000000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  },

  // --- Estruturas ---
  {
    id: 'structures_50',
    name: 'Rede de Produção',
    desc: 'Possua um total de 50 estruturas.',
    reqType: 'totalStructures',
    reqValue: 50,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
  },
  {
    id: 'structures_250',
    name: 'Monopólio Doce',
    desc: 'Possua 250 estruturas. A concorrência foi totalmente esmagada.',
    reqType: 'totalStructures',
    reqValue: 250,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`
  },
  {
    id: 'structures_1000',
    name: 'Dono Disso Tudo',
    desc: '1.000 estruturas! Você é o verdadeiro Rei da Paçoca.',
    reqType: 'totalStructures',
    reqValue: 1000,
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>`
  }
];