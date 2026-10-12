export const UpgradesData = [
  {
    id: 'click_power_1',
    name: 'Dedos de Aço',
    cost: 50,
    reqGen: 'cursor',
    reqCount: 1,
    effect: 'clickMultiplier',
    value: 2,
    desc: 'Dobra a quantidade de Paçocas por toque.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`
  },
  {
    id: 'ajudante_boost_1',
    name: 'Café Expresso para Ajudantes',
    cost: 200,
    reqGen: 'ajudante',
    reqCount: 1,
    effect: 'genMultiplier',
    targetGen: 'ajudante',
    value: 2,
    desc: 'Dobra a produção dos Ajudantes da Paçoca.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
  },
  {
    id: 'bancada_boost_1',
    name: 'Ferramentas de Inox',
    cost: 2500,
    reqGen: 'bancada',
    reqCount: 5,
    effect: 'genMultiplier',
    targetGen: 'bancada',
    value: 2,
    desc: 'Dobra a eficiência das Bancadas de Produção.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  },
  {
    id: 'carrinho_boost_1',
    name: 'Rodinhas de Silicone',
    cost: 25000,
    reqGen: 'carrinho',
    reqCount: 5,
    effect: 'genMultiplier',
    targetGen: 'carrinho',
    value: 2,
    desc: 'Dobra a produção dos Carrinhos de Paçoca.',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
  }
];