/** Shared geometric pricing used by operations and staff (price × 1.15 per unit owned). */
export const PRICE_GROWTH = 1.15;

export function geometricPrice(baseCost: number, owned: number, amount: number, costMult = 1, growth = PRICE_GROWTH): number {
  if (amount <= 0) return 0;
  const first = baseCost * Math.pow(growth, owned);
  return Math.ceil(((first * (Math.pow(growth, amount) - 1)) / (growth - 1)) * costMult);
}

export function geometricMax(baseCost: number, owned: number, cash: number, costMult = 1, growth = PRICE_GROWTH): number {
  const first = baseCost * Math.pow(growth, owned) * costMult;
  if (cash < Math.ceil(first)) return 0;
  let n = Math.floor(Math.log((cash * (growth - 1)) / first + 1) / Math.log(growth));
  while (n > 0 && geometricPrice(baseCost, owned, n, costMult, growth) > cash) n--;
  while (geometricPrice(baseCost, owned, n + 1, costMult, growth) <= cash) n++;
  return n;
}
