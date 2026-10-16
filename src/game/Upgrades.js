export const UpgradesData = [
  // ================= CLIQUE =================
  {
    id: 'click_power_1', name: 'Dedos de Aço', cost: 500, reqGen: 'cursor', reqCount: 10,
    type: 'click', tier: 1, effect: 'clickMultiplier', value: 2,
    desc: 'Dobra a quantidade de Paçocas por toque.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`
  },
  {
    id: 'click_power_2', name: 'Mouse Dourado', cost: 15000, reqGen: 'cursor', reqCount: 30,
    type: 'click', tier: 2, effect: 'clickMultiplier', value: 2,
    desc: 'Seus cliques ficam 2x mais potentes.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></svg>`
  },
  {
    id: 'click_power_3', name: 'Cliques Quânticos', cost: 500000, reqGen: 'cursor', reqCount: 60,
    type: 'click', tier: 3, effect: 'clickMultiplier', value: 2,
    desc: 'O tecido da realidade dobra o seu clique.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
  },

  // ================= ESTRUTURAS =================
  {
    id: 'ajudante_boost_1', name: 'Café Expresso', cost: 1000, reqGen: 'ajudante', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'ajudante', value: 3,
    desc: 'Triplica a produção dos Ajudantes.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
  },
  {
    id: 'ajudante_boost_2', name: 'Energético Duplo', cost: 25000, reqGen: 'ajudante', reqCount: 30,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'ajudante', value: 3,
    desc: 'Ajudantes trabalham 3x mais rápido.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  },
  {
    id: 'bancada_boost_1', name: 'Ferramentas de Inox', cost: 11000, reqGen: 'bancada', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'bancada', value: 3,
    desc: 'Triplica a eficiência das Bancadas.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  },
  {
    id: 'carrinho_boost_1', name: 'Rodinhas de Silicone', cost: 120000, reqGen: 'carrinho', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'carrinho', value: 3,
    desc: 'Triplica a produção dos Carrinhos.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
  },

  // ================= SINERGIAS (ÉPICOS) =================
  {
    id: 'syn_fabrica_click', name: 'Sindicato das Máquinas', cost: 5000000, reqGen: 'fabrica', reqCount: 1,
    type: 'synergy', tier: 'epic', effect: 'synergyClick', targetGen: 'fabrica', synergyMultiplier: 0.02,
    desc: 'Cada Fábrica aumenta o poder base do seu clique em +2%.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  },
  {
    id: 'syn_imperio_ajudante', name: 'Franquia Nacional', cost: 1000000000, reqGen: 'imperio', reqCount: 1,
    type: 'synergy', tier: 'epic', effect: 'synergyPPS', targetGen: 'ajudante', baseGen: 'imperio', synergyMultiplier: 0.10,
    desc: 'Cada Império melhora a produção dos Ajudantes em +10%.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M16.5 21l3.5-3.5L16.5 14"/><path d="M20 17.5H10"/></svg>`
  }
];