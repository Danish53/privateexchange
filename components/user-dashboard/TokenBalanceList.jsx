function tokenInitials(symbol) {
  const s = String(symbol || '').replace(/\s/g, '');
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 3).toUpperCase();
}

/** Same token table as Wallet — avatar chips, Amount + USD columns, mobile stack. */
export default function TokenBalanceList({ tokens = [] }) {
  if (!tokens.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] px-4 py-10 text-center text-sm text-brand-muted">
        No balances to show yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-black/[0.22]">
      <div className="hidden border-b border-white/[0.06] px-4 py-2.5 sm:block sm:px-5">
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto_auto] items-center gap-4">
          <span />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            Asset
          </span>
          <span className="text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            Amount
          </span>
          <span className="text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            USD
          </span>
        </div>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {tokens.filter((token) => token.isActive === true).map((token) => {
          const rowKey = token.slug || token.symbol;
          const avatar = (
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] to-black/55 text-[0.7rem] font-bold tracking-tight text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] sm:h-[3.25rem] sm:w-[3.25rem] sm:text-xs">
              <span
                className={`pointer-events-none absolute inset-0 opacity-[0.24] ${token.bar}`}
                aria-hidden
              />
              <span className="relative z-[1]">{tokenInitials(token.symbol)}</span>
            </div>
          );
          return (
            <li
              key={rowKey}
              className="transition duration-200 hover:bg-[var(--brand-surface-hover)]/70"
            >
              <div className="px-4 py-4 sm:hidden">
                <div className="flex items-start gap-3">
                  {avatar}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight text-brand-heading">{token.name}</p>
                    <p className="mt-0.5 text-xs text-brand-subtle">{token.symbol}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between gap-4 border-t border-white/[0.05] pt-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                      Amount
                    </p>
                    <p className="font-semibold tabular-nums text-brand-heading">{token.balance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                      USD
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-brand-heading">
                      {token.value}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden grid-cols-[3.25rem_minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-4 sm:grid">
                {avatar}
                <div className="min-w-0">
                  <p className="font-semibold leading-tight text-brand-heading">{token.name}</p>
                  <p className="mt-0.5 text-xs text-brand-subtle">{token.symbol}</p>
                </div>
                <p className="text-right font-semibold tabular-nums text-brand-heading">
                  {token.balance}
                </p>
                <p className="text-right text-base font-semibold tabular-nums text-brand-heading">
                  {token.value}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
