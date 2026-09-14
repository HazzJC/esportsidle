/** Shared geometric pricing used by operations and staff (price × 1.15 per unit owned). */
export const PRICE_GROWTH = 1.15;

export function geometricPrice(baseCost: number, owned: number, amount: number, costMult = 1): number {
  if (amount <= 0) return 0;
  const first = baseCost * Math.pow(PRICE_GROWTH, owned);
  return Math.ceil(((first * (Math.pow(PRICE_GROWTH, amount) - 1)) / (PRICE_GROWTH - 1)) * costMult);
}

export function geometricMax(baseCost: number, owned: number, cash: number, costMult = 1): number {
  const first = baseCost * Math.pow(PRICE_GROWTH, owned) * costMult;
  if (cash < Math.ceil(first)) return 0;
  let n = Math.floor(Math.log((cash * (PRICE_GROWTH - 1)) / first + 1) / Math.log(PRICE_GROWTH));
  while (n > 0 && geometricPrice(baseCost, owned, n, costMult) > cash) n--;
  while (geometricPrice(baseCost, owned, n + 1, costMult) <= cash) n++;
  return n;
}
