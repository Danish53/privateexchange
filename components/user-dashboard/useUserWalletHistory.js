'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';

/**
 * @param {{ limit?: number; enableTokenFilter?: boolean }} [options]
 */
export function useUserWalletHistory(options = {}) {
  const { limit = 100, enableTokenFilter = true } = options;
  const { token, ready } = useAuth();
  const [tokenFilter, setTokenFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [totalForUser, setTotalForUser] = useState(0);

  const effectiveToken = enableTokenFilter ? tokenFilter : 'all';

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setEntries([]);
      setTotalForUser(0);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        token: effectiveToken,
        limit: String(limit),
      });
      const res = await fetch(`/api/user/wallet/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load history.');
        setEntries([]);
        setTotalForUser(0);
        return;
      }
      setEntries(Array.isArray(json.entries) ? json.entries : []);
      setTotalForUser(typeof json.totalForUser === 'number' ? json.totalForUser : 0);
    } catch {
      setError('Network error.');
      setEntries([]);
      setTotalForUser(0);
    } finally {
      setLoading(false);
    }
  }, [token, effectiveToken, limit]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  return {
    loading,
    error,
    entries,
    totalForUser,
    tokenFilter,
    setTokenFilter,
    reload: load,
  };
}
