'use client';

import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

function tokenInitials(symbol) {
  const s = String(symbol || '').replace(/\s/g, '');
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 3).toUpperCase();
}

/** Same token table as Wallet — avatar chips, Amount + USD columns, mobile stack. */
export default function TokenBalanceList({ tokens = [] }) {
  const { t } = useWebsiteT();

  if (!tokens.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] px-4 py-10 text-center text-sm text-brand-muted">
        {t('dashboard.tokenBalance.noBalances')}
      </div>
    );
  }

  const activeTokens = tokens.filter((token) => token.isActive === true && token?.slug !== 'usd');

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {activeTokens.map((token) => {
        const rowKey = token.slug || token.symbol;
        return (
          <div
            key={rowKey}
            className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          >
            <div className="pl-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                {token.symbol}
              </p>
              <p className="font-mono font-semibold tabular-nums text-brand-heading">{token.name}</p>
            </div>

            <div className="pl-2 mt-3 border-t border-white/[0.06] pt-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                {t('dashboard.tokenBalance.balance')}
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums text-brand-heading">
                {token.balance}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
