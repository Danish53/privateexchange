'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = '759_user';

const AuthContext = createContext(null);

/** @typedef {{ id: string; email: string; name?: string; role: string; displayName?: string; phone?: string; country?: string; timezone?: string; avatarUrl?: string; createdAt?: string }} AuthUser */

/**
 * @typedef {{ token: string; user: AuthUser }} AuthState
 */

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(/** @type {AuthState | null} */ (null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user?.email) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${parsed.token}` },
          });
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            const next = {
              token: parsed.token,
              user: { ...parsed.user, ...data.user },
            };
            setAuth(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /** @param {AuthState} session */
  const login = useCallback((session) => {
    setAuth(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /** Merge profile fields into the stored user. */
  const updateProfile = useCallback((patch) => {
    setAuth((prev) => {
      if (!prev?.user) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /** Reload user from GET /api/auth/me (after profile API updates). */
  const refreshUser = useCallback(async () => {
    let token;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      token = JSON.parse(raw)?.token;
    } catch {
      return;
    }
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data?.user) return;
    setAuth((prev) => {
      if (!prev?.token) return prev;
      const next = { ...prev, user: { ...prev.user, ...data.user } };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const user = auth?.user ?? null;
  const token = auth?.token ?? null;

  const value = useMemo(
    () => ({ user, token, login, logout, updateProfile, refreshUser, ready }),
    [user, token, login, logout, updateProfile, refreshUser, ready]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
