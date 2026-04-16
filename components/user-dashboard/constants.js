import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';

/** Token labels for forms (e.g. transfer) — balances come from `/api/user/wallet`. */
export const TOKEN_OPTIONS_FOR_FORMS = PLATFORM_TOKEN_SEED.map((t) => ({
  name: t.name,
  symbol: t.symbol,
}));

/** Populated from the platform when drawing pools are live. */
export const DRAWINGS = [];

export const MEMBERSHIP = { tier: 'Member', progress: 0 };
