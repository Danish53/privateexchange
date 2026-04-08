export const TOKENS = [
  { name: '759', symbol: '759', balance: '1,250.00', value: '$1,250.00', bar: 'bg-amber-500' },
  { name: 'Cristalino', symbol: 'CRS', balance: '500.00', value: '$500.00', bar: 'bg-sky-400' },
  { name: 'Añejo', symbol: 'ANJ', balance: '250.00', value: '$250.00', bar: 'bg-orange-500' },
  { name: 'Raffle', symbol: 'RFL', balance: '100.00', value: '$100.00', bar: 'bg-violet-500' },
  { name: 'Susu', symbol: 'SUS', balance: '75.00', value: '$75.00', bar: 'bg-emerald-500' },
];

export const TRANSACTIONS = [
  { type: 'deposit', token: '759', amount: '+500.00', date: '2026-03-30', status: 'completed' },
  { type: 'transfer', token: 'Raffle', amount: '-50.00', date: '2026-03-29', status: 'completed' },
  { type: 'deposit', token: 'Cristalino', amount: '+200.00', date: '2026-03-28', status: 'completed' },
  { type: 'fee', token: '759', amount: '-0.50', date: '2026-03-29', status: 'completed' },
];

export const DRAWINGS = [
  { name: 'Weekly Draw', entries: 150, prize: '1,000 759', date: '2026-04-05' },
  { name: 'Special Draw', entries: 89, prize: '500 Cristalino', date: '2026-04-01' },
];

export const MEMBERSHIP = { tier: 'VIP', progress: 85 };
export const TOTAL_BALANCE = '$2,175.00';
