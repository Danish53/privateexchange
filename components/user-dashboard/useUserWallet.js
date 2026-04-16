'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';

/**
 * Loads `/api/user/wallet` for the signed-in member.
 * @returns {{ loading: boolean; error: string; tokens: Array<{ name: string; symbol: string; slug?: string; balance: string; value: string; bar: string }>; totalUsdFormatted: string; reload: () => Promise<void> }}
 */
export function useUserWallet() {
  const { token, ready } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState([]);
  const [totalUsdFormatted, setTotalUsdFormatted] = useState('$0.00');

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setTokens([]);
      setTotalUsdFormatted('$0.00');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load wallet.');
        setTokens([]);
        setTotalUsdFormatted('$0.00');
        return;
      }
      setTokens(Array.isArray(json.tokens) ? json.tokens : []);
      setTotalUsdFormatted(json.totalUsdFormatted || '$0.00');
    } catch {
      setError('Network error.');
      setTokens([]);
      setTotalUsdFormatted('$0.00');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  return { loading, error, tokens, totalUsdFormatted, reload: load };
}
