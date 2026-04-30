/**
 * Canonical five ecosystem tokens (proposal). DB `Token` documents are seeded from this list.
 * `usdPerUnit` is display-only until a live rates engine exists.
 */
export const PLATFORM_TOKEN_SEED = [
  { slug: '759', name: 'US Dollar', symbol: 'USD', sortOrder: 0, usdPerUnit: 1, bar: 'bg-amber-500' },
  { slug: 'cristalino', name: 'Cristalino', symbol: 'CRS', sortOrder: 1, usdPerUnit: 1, bar: 'bg-sky-400' },
  { slug: 'anejo', name: 'Añejo', symbol: 'ANJ', sortOrder: 2, usdPerUnit: 1, bar: 'bg-orange-500' },
  { slug: 'raffle', name: 'Raffle', symbol: 'RFL', sortOrder: 3, usdPerUnit: 1, bar: 'bg-violet-500' },
  { slug: 'susu', name: 'Susu', symbol: 'SUS', sortOrder: 4, usdPerUnit: 1, bar: 'bg-emerald-500' },
];
