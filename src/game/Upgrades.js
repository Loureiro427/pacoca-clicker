export const UpgradesData = [
  // ==========================================================================
  // 1. MELHORIAS DE CLIQUE (TIERS 1 A 5)
  // ==========================================================================
  {
    id: 'click_power_1', name: 'Dedos de Aço', cost: 500, reqGen: 'cursor', reqCount: 10,
    type: 'click', tier: 1, effect: 'clickMultiplier', value: 2,
    desc: 'Dobra a quantidade de Paçocas por toque.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`
  },
  {
    id: 'click_power_2', name: 'Mouse Dourado', cost: 15000, reqGen: 'cursor', reqCount: 25,
    type: 'click', tier: 2, effect: 'clickMultiplier', value: 2,
    desc: 'Seus cliques ficam 2x mais potentes.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></svg>`
  },
  {
    id: 'click_power_3', name: 'Cliques Quânticos', cost: 500000, reqGen: 'cursor', reqCount: 50,
    type: 'click', tier: 3, effect: 'clickMultiplier', value: 2,
    desc: 'O tecido da realidade dobra o valor de cada toque.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
  },
  {
    id: 'click_power_4', name: 'Luva Haptica Nuclear', cost: 25000000, reqGen: 'cursor', reqCount: 75,
    type: 'click', tier: 4, effect: 'clickMultiplier', value: 3,
    desc: 'Triplica a potência de todos os cliques manuais.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 14l3-3 5 5 4-4"/><circle cx="18" cy="6" r="3"/></svg>`
  },
  {
    id: 'click_power_5', name: 'Toque de Midas Antigo', cost: 1000000000, reqGen: 'cursor', reqCount: 100,
    type: 'click', tier: 5, effect: 'clickMultiplier', value: 4,
    desc: 'Multiplica o clique manual por 4x.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },

  // ==========================================================================
  // 2. ESTRUTURAS (GERADORES)
  // ==========================================================================
  // --- AJUDANTES ---
  {
    id: 'ajudante_boost_1', name: 'Café Expresso', cost: 1000, reqGen: 'ajudante', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'ajudante', value: 3,
    desc: 'Triplica a produção dos Ajudantes.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
  },
  {
    id: 'ajudante_boost_2', name: 'Energético Duplo', cost: 25000, reqGen: 'ajudante', reqCount: 25,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'ajudante', value: 3,
    desc: 'Ajudantes trabalham 3x mais rápido.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  },
  {
    id: 'ajudante_boost_3', name: 'Treinamento de Elite', cost: 500000, reqGen: 'ajudante', reqCount: 50,
    type: 'structure', tier: 3, effect: 'genMultiplier', targetGen: 'ajudante', value: 4,
    desc: 'Aumenta a eficiência dos Ajudantes em 4x.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>`
  },

  // --- BANCADAS ---
  {
    id: 'bancada_boost_1', name: 'Ferramentas de Inox', cost: 11000, reqGen: 'bancada', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'bancada', value: 3,
    desc: 'Triplica a eficiência das Bancadas.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  },
  {
    id: 'bancada_boost_2', name: 'Prensa Hidráulica', cost: 150000, reqGen: 'bancada', reqCount: 25,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'bancada', value: 3,
    desc: 'Multiplica a produção das Bancadas em 3x.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8"/></svg>`
  },

  // --- CARRINHOS ---
  {
    id: 'carrinho_boost_1', name: 'Rodinhas de Silicone', cost: 120000, reqGen: 'carrinho', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'carrinho', value: 3,
    desc: 'Triplica a produção dos Carrinhos.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
  },
  {
    id: 'carrinho_boost_2', name: 'Motor Turbo Elétrico', cost: 1800000, reqGen: 'carrinho', reqCount: 25,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'carrinho', value: 3,
    desc: 'Carrinhos entregam paçocas 3x mais rápido.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
  },

  // --- LOJAS ---
  {
    id: 'loja_boost_1', name: 'Vitrine Iluminada', cost: 1300000, reqGen: 'loja', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'loja', value: 3,
    desc: 'Triplica o faturamento das Lojas.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
  },
  {
    id: 'loja_boost_2', name: 'Programa de Fidelidade', cost: 20000000, reqGen: 'loja', reqCount: 25,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'loja', value: 3,
    desc: 'Lojas produzem 3x mais paçocas.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></svg>`
  },

  // --- FÁBRICAS ---
  {
    id: 'fabrica_boost_1', name: 'Esteira Automatizada', cost: 15000000, reqGen: 'fabrica', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'fabrica', value: 3,
    desc: 'Triplica o rendimento das Fábricas.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`
  },
  {
    id: 'fabrica_boost_2', name: 'Robô Embalador', cost: 250000000, reqGen: 'fabrica', reqCount: 25,
    type: 'structure', tier: 2, effect: 'genMultiplier', targetGen: 'fabrica', value: 3,
    desc: 'Aumenta a eficiência das Fábricas em 3x.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/></svg>`
  },

  // --- CENTROS DE DISTRIBUIÇÃO ---
  {
    id: 'centro_boost_1', name: 'Frota de Caminhões', cost: 220000000, reqGen: 'centro', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'centro', value: 3,
    desc: 'Triplica a capacidade do Centro de Distribuição.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
  },

  // --- IMPÉRIOS ---
  {
    id: 'imperio_boost_1', name: 'Conglomerado Global', cost: 4000000000, reqGen: 'imperio', reqCount: 10,
    type: 'structure', tier: 1, effect: 'genMultiplier', targetGen: 'imperio', value: 3,
    desc: 'Triplica o poder de produção dos Impérios.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/><path d="M5 20h14"/></svg>`
  },

  // ==========================================================================
  // 3. SINERGIAS ÉPICAS E LENDÁRIAS
  // ==========================================================================
  {
    id: 'syn_fabrica_click', name: 'Sindicato das Máquinas', cost: 15000000, reqGen: 'fabrica', reqCount: 1,
    type: 'synergy', tier: 'epic', effect: 'synergyClick', targetGen: 'fabrica', synergyMultiplier: 0.02,
    desc: 'Cada Fábrica aumenta o poder base do clique em +2%.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  },
  {
    id: 'syn_imperio_ajudante', name: 'Franquia Nacional', cost: 5000000000, reqGen: 'imperio', reqCount: 1,
    type: 'synergy', tier: 'epic', effect: 'synergyPPS', targetGen: 'ajudante', baseGen: 'imperio', synergyMultiplier: 0.10,
    desc: 'Cada Império melhora a produção dos Ajudantes em +10%.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M16.5 21l3.5-3.5L16.5 14"/><path d="M20 17.5H10"/></svg>`
  },
  {
    id: 'syn_centro_loja', name: 'Logística de Abastecimento', cost: 300000000, reqGen: 'centro', reqCount: 5,
    type: 'synergy', tier: 'epic', effect: 'synergyPPS', targetGen: 'loja', baseGen: 'centro', synergyMultiplier: 0.05,
    desc: 'Cada Centro de Distribuição aumenta o faturamento das Lojas em +5%.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`
  }
];