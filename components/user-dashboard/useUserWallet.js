'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

/**
 * Loads `/api/user/wallet` for the signed-in member.
 * @returns {{ loading: boolean; error: string; tokens: Array<object>; totalUsdFormatted: string; portfolioUsd: number; reload: () => Promise<void> }}
 */
export function useUserWallet() {
  const { t } = useWebsiteT();
  const { token, ready, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState([]);
  const [totalUsdFormatted, setTotalUsdFormatted] = useState('$0.00');
  const [portfolioUsd, setPortfolioUsd] = useState(0);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setTokens([]);
      setTotalUsdFormatted('$0.00');
      setPortfolioUsd(0);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      // console.log('Wallet response', { status: res.status, json });
      if (!res.ok) {
        setError(json.error || t('dashboard.common.couldNotLoadWallet'));
        setTokens([]);
        setTotalUsdFormatted('$0.00');
        setPortfolioUsd(0);
        return;
      }
      setTokens(Array.isArray(json.tokens) ? json.tokens : []);
      setTotalUsdFormatted(json.totalUsdFormatted || '$0.00');
      let port = Number(json.portfolioUsd);
      if (!Number.isFinite(port) && Array.isArray(json.tokens)) {
        port = json.tokens.reduce((s, t) => s + (Number(t.usdValue) || 0), 0);
      }
      setPortfolioUsd(Number.isFinite(port) ? port : 0);
      if (typeof refreshUser === 'function') {
        try {
          await refreshUser();
        } catch {
          /* ignore */
        }
      }
    } catch {
      setError(t('dashboard.common.networkError'));
      setTokens([]);
      setTotalUsdFormatted('$0.00');
      setPortfolioUsd(0);
    } finally {
      setLoading(false);
    }
  }, [token, refreshUser, t]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  return { loading, error, tokens, totalUsdFormatted, portfolioUsd, reload: load };
}
