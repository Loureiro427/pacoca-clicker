export function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  
  const suffixes = ["", " mil", " milhões", " bilhões", " trilhões"];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
  let shortValue = parseFloat((suffixNum != 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  
  if (shortValue % 1 != 0) {
      shortValue = shortValue.toFixed(1);
  }
  return shortValue + suffixes[suffixNum];
}