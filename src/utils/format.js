export function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  if (num < 1000) return Math.floor(num).toString();
  
  const suffixes = ["", "mil", "mi", "bi", "tri", "qua", "qui", "sex", "sep", "oct", "non", "dec"];
  
  // Descobre a grandeza do número (ex: milhares = 1, milhões = 2, bilhões = 3)
  const exp = Math.floor(Math.log10(num) / 3);
  
  if (exp >= suffixes.length) return "Infinito";
  
  // Reduz o número para a casa correta (ex: 1500000 vira 1.5)
  const shortValue = num / Math.pow(1000, exp);
  
  // Deixa com no máximo 2 casas decimais
  let formattedValue = shortValue.toFixed(2);
  
  // Remove zeros desnecessários (1.50 vira 1.5 | 1.00 vira 1)
  formattedValue = formattedValue.replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
  
  // Substitui o ponto por vírgula para o padrão PT-BR
  formattedValue = formattedValue.replace('.', ',');

  return `${formattedValue} ${suffixes[exp]}`;
}