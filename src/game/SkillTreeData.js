export const SkillTreeBranches = {
  central: {
    id: 'central',
    name: 'Gênesis',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    desc: 'O ponto de partida de todo o conhecimento da Paçoca.'
  },
  active: {
    id: 'active',
    name: 'Caminho do Toque Sagrado',
    color: '#FF3B30',
    glowColor: 'rgba(255, 59, 48, 0.6)',
    desc: 'Especialização em velocidade de cliques, combos manuais e acertos críticos.'
  },
  passive: {
    id: 'passive',
    name: 'Império Industrial',
    color: '#E67E22',
    glowColor: 'rgba(230, 126, 34, 0.6)',
    desc: 'Otimização de estruturas automáticas, desconto em compras e produção offline.'
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alquimia Dourada',
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    desc: 'Manipulação de Paçocas Douradas, eventos de Frenesi e transmutação de riqueza.'
  }
};

export const SkillTreeNodes = [
  // NÓ CENTRAL ORIGEM
  {
    id: 'origin',
    branch: 'central',
    name: 'A Origem da Paçoca',
    lore: 'No princípio, havia apenas um grão puro de amendoim capaz de moldar impérios.',
    desc: 'Desbloqueia o acesso às três ramificações da Árvore de Habilidades.',
    cost: 0,
    requires: [],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><circle cx="12" cy="12" r="9" stroke="#FFD700" stroke-width="2" fill="#2A2238"/><path d="M12 3v18M3 12h18" stroke="#FFF59D" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#FFD700"/></svg>`
  },

  // -----------------------------------------------------------------
  // ⚔️ RAMO ATIVO (10 Habilidades)
  // -----------------------------------------------------------------
  {
    id: 'act_1',
    branch: 'active',
    name: 'Dedos de Aço',
    lore: 'Treinamento contínuo para fortalecer a pressão de cada toque.',
    desc: '+15% no valor base de todos os cliques manuais.',
    cost: 1,
    requires: ['origin'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V2a2 2 0 0 0-4 0v9M6 14a6 6 0 0 0 12 0v-3a2 2 0 0 0-4 0" stroke-linecap="round"/><path d="M10 18h4" stroke="#FF9500" stroke-width="2"/></svg>`
  },
  {
    id: 'act_2',
    branch: 'active',
    name: 'Toque Sincronizado',
    lore: 'Conecta a força manual ao ritmo mecânico das fábricas.',
    desc: 'Cada clique manual gera +1% do seu PPS total instantaneamente.',
    cost: 3,
    requires: ['act_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4" fill="rgba(255, 59, 48, 0.2)"/></svg>`
  },
  {
    id: 'act_3',
    branch: 'active',
    name: 'Impacto Crítico I',
    lore: 'Aprenda a focar toda a energia em um único ponto do mascote.',
    desc: '5% de chance de realizar um Clique Crítico (5x o valor normal).',
    cost: 5,
    requires: ['act_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FF3B30"/></svg>`
  },
  {
    id: 'act_3a',
    branch: 'active',
    name: 'Precisão Cirúrgica',
    lore: 'Canaliza o impacto diretamente no núcleo da paçoca.',
    desc: 'Aumenta a potência do Clique Crítico para 12x.',
    cost: 10,
    requires: ['act_3'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#FF3B30"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>`
  },
  {
    id: 'act_3b',
    branch: 'active',
    name: 'Faísca Frenética',
    lore: 'O impacto do golpe alimenta a duração dos eventos ativos.',
    desc: 'Cliques críticos adicionam +0.5s no tempo de qualquer Frenesi ativo.',
    cost: 10,
    requires: ['act_3'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.5 7.5" stroke="#FF9500"/></svg>`
  },
  {
    id: 'act_4',
    branch: 'active',
    name: 'Rítmico de Amendoim',
    lore: 'Manter a cadência perfeita multiplica a eficiência dos impactos.',
    desc: 'Ativa o contador de combo: toques rápidos seguidos aumentam os ganhos em até +50%.',
    cost: 15,
    requires: ['act_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M22 12A10 10 0 0 0 12 2v10z"/><circle cx="12" cy="12" r="6" stroke="#FF9500"/></svg>`
  },
  {
    id: 'act_4a',
    branch: 'active',
    name: 'Overclock Manual',
    lore: 'Atingir a velocidade máxima faz suas mãos irradiarem calor.',
    desc: 'Quando o combo atinge o máximo, ativa por 3s o efeito Mão de Pedra (cliques valem o triplo).',
    cost: 30,
    requires: ['act_4'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M12 2v10l4.5 4.5"/><circle cx="12" cy="12" r="9" stroke-dasharray="4 2"/></svg>`
  },
  {
    id: 'act_5',
    branch: 'active',
    name: 'Vibração Tátil',
    lore: 'Cursores e ajudantes respondem melhor a comandos vigorosos.',
    desc: 'Aumenta a eficiência das estruturas Cursor e Ajudante em +25%.',
    cost: 15,
    requires: ['act_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M4 11a9 9 0 0 1 9-9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="2" fill="#FF3B30"/></svg>`
  },
  {
    id: 'act_6',
    branch: 'active',
    name: 'Eco Clicável',
    lore: 'Cada golpe deixa uma ressonância que aciona mecanismos automáticos.',
    desc: 'A cada 10 cliques manuais, executa 1 clique automático extra instantâneo.',
    cost: 50,
    requires: ['act_4'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>`
  },
  {
    id: 'act_7',
    branch: 'active',
    name: 'Dedo de Midas',
    lore: 'A suprema maestria do toque transmutador.',
    desc: '10% de todo o seu PPS passivo é somado instantaneamente a CADA clique manual.',
    cost: 150,
    requires: ['act_3a', 'act_6'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(255, 215, 0, 0.3)"/></svg>`
  },

  // -----------------------------------------------------------------
  // 🏭 RAMO PASSIVO / INDUSTRIAL (10 Habilidades)
  // -----------------------------------------------------------------
  {
    id: 'pas_1',
    branch: 'passive',
    name: 'Engrenagens de Bronze',
    lore: 'Mecanismos refinados reduzem o atrito e aceleram a produção.',
    desc: '+10% de PPS global em todas as suas estruturas.',
    cost: 1,
    requires: ['origin'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  },
  {
    id: 'pas_2',
    branch: 'passive',
    name: 'Barganha de Suprimentos',
    lore: 'Contratos diretos com produtores de açúcar e amendoim.',
    desc: 'Reduz em 5% o custo de compra de qualquer estrutura na Loja.',
    cost: 3,
    requires: ['pas_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-width="3"/></svg>`
  },
  {
    id: 'pas_2a',
    branch: 'passive',
    name: 'Compra no Atacado',
    lore: 'Comprar em grandes volumes atrai descontos comerciais massivos.',
    desc: 'Ganha 5% de desconto adicional ao comprar nos modos x10 e x100.',
    cost: 5,
    requires: ['pas_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
  },
  {
    id: 'pas_3',
    branch: 'passive',
    name: 'Manutenção Preventiva',
    lore: 'Engenharia de precisão para evitar paradas na produção.',
    desc: 'Fábricas, Centros e Impérios produzem +20% a mais.',
    cost: 10,
    requires: ['pas_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  },
  {
    id: 'pas_4',
    branch: 'passive',
    name: 'Turno da Madrugada',
    lore: 'As máquinas nunca dormem, gerando recursos no silêncio da noite.',
    desc: 'A eficiência da Produção Offline aumenta em +50%.',
    cost: 15,
    requires: ['pas_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(230, 126, 34, 0.2)"/></svg>`
  },
  {
    id: 'pas_4a',
    branch: 'passive',
    name: 'Despertar Energizado',
    lore: 'O vapor acumulado durante a noite é liberado assim que você retorna.',
    desc: 'Ao retornar de um período offline, ganha 30s de Frenesi 2x imediato.',
    cost: 15,
    requires: ['pas_4'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  },
  {
    id: 'pas_5',
    branch: 'passive',
    name: 'Logística Otimizada',
    lore: 'Diversificar o império gera simbiose comercial perfeita.',
    desc: 'Cada tipo diferente de estrutura que você possui aumenta o PPS total em +2%.',
    cost: 20,
    requires: ['pas_3'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
  },
  {
    id: 'pas_6',
    branch: 'passive',
    name: 'Sinergia de Montagem',
    lore: 'Ajudantes instruem a operação das bancadas com perfeição.',
    desc: 'Ajudantes aumentam a eficiência das Bancadas em +10%.',
    cost: 30,
    requires: ['pas_5'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    id: 'pas_7',
    branch: 'passive',
    name: 'Sobrecarga de Produção',
    lore: 'Quanto mais tempo as turbinas rodam, mais aquecidas elas ficam.',
    desc: 'A produção aumenta 0.5% a cada minuto de sessão contínua (até +30%).',
    cost: 50,
    requires: ['pas_5'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E67E22" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  },
  {
    id: 'pas_8',
    branch: 'passive',
    name: 'Automação Suprema',
    lore: 'A fusão definitiva entre robótica e doçura.',
    desc: 'A cada 10 segundos, dispara um Super Clique Automático equivalente a 60 cliques.',
    cost: 150,
    requires: ['pas_6', 'pas_7'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  },

  // -----------------------------------------------------------------
  // ✨ RAMO ALQUÍMICO / SORTE (10 Habilidades)
  // -----------------------------------------------------------------
  {
    id: 'alc_1',
    branch: 'alchemy',
    name: 'Ímã Dourado',
    lore: 'Sintoniza a atração magnética das relíquias cósmicas de ouro.',
    desc: 'Paçocas Douradas aparecem com 20% mais frequência na tela.',
    cost: 1,
    requires: ['origin'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><path d="M6 15v-2a6 6 0 1 1 12 0v2"/><path d="M6 15H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/><path d="M18 15h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/></svg>`
  },
  {
    id: 'alc_2',
    branch: 'alchemy',
    name: 'Frenesi Prolongado',
    lore: 'Estende a ressonância temporal da euforia dourada.',
    desc: 'Aumenta a duração de qualquer evento de Frenesi em +10 segundos.',
    cost: 3,
    requires: ['alc_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>`
  },
  {
    id: 'alc_2a',
    branch: 'alchemy',
    name: 'Mega Frenesi',
    lore: 'Purifica a essência do frenesi para elevar a potência multiplicadora.',
    desc: 'O multiplicador do evento Frenesi sobe de 7x para 10x.',
    cost: 10,
    requires: ['alc_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  {
    id: 'alc_3',
    branch: 'alchemy',
    name: 'Brilho Celestial',
    lore: 'A luz emitida pelas aparições torna-se impossível de ignorar.',
    desc: 'Paçocas Douradas ficam 40% maiores e duram 50% mais tempo na tela.',
    cost: 15,
    requires: ['alc_1'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><circle cx="12" cy="12" r="5" fill="rgba(0, 229, 255, 0.3)"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
  },
  {
    id: 'alc_4',
    branch: 'alchemy',
    name: 'Sorte do Alquimista',
    lore: 'Transmuta o toque em torrentes imediatas de riquezas.',
    desc: 'Ao tocar em uma Paçoca Dourada, 10% de chance de ganhar 10 min de PPS acumulado.',
    cost: 20,
    requires: ['alc_2'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    id: 'alc_4a',
    branch: 'alchemy',
    name: 'Toque de Sorte',
    lore: 'Coletar eventos sagrados ecoa no registro de conquistas.',
    desc: 'Paçocas Douradas coletadas contam como 100 cliques manuais para conquistas.',
    cost: 20,
    requires: ['alc_4'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  },
  {
    id: 'alc_5',
    branch: 'alchemy',
    name: 'Essência de Ouro',
    lore: 'Manter reservas de relíquias fortalece o campo magnético do império.',
    desc: 'Cada Paçoca de Ouro não gasta guardada concede +1% extra de multiplicador global.',
    cost: 30,
    requires: ['alc_3'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 6v12M6 12h12"/></svg>`
  },
  {
    id: 'alc_6',
    branch: 'alchemy',
    name: 'Recompensa Dupla',
    lore: 'Dobra a fenda dimensional pela qual as relíquias atravessam.',
    desc: '15% de chance de spawnar 2 Paçocas Douradas simultaneamente.',
    cost: 50,
    requires: ['alc_4'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5" stroke="#FFD700"/></svg>`
  },
  {
    id: 'alc_7',
    branch: 'alchemy',
    name: 'Transmutação Sincronizada',
    lore: 'Durante a euforia, cada clique reage quimicamente com seu saldo.',
    desc: 'Durante o Frenesi, cada clique gera +1% com base nas paçocas atuais acumuladas.',
    cost: 75,
    requires: ['alc_5'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`
  },
  {
    id: 'alc_8',
    branch: 'alchemy',
    name: 'Midas Celestial',
    lore: 'A lendária capacidade de forjar ouro permanente através de eventos raros.',
    desc: 'Paçocas Douradas têm 3% de chance de conceder +1 Paçoca de Ouro permanente sem renascer!',
    cost: 150,
    requires: ['alc_6', 'alc_7'],
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.5h7.6L12 2z" fill="rgba(255, 215, 0, 0.4)"/></svg>`
  }
];