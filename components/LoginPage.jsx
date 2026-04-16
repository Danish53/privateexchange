'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import Spinner from '@/components/ui/Spinner';
import { setPendingRegister } from '@/lib/auth-flow';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verified = searchParams.get('verified') === '1';
  const registered = searchParams.get('registered') === '1';
  const reset = searchParams.get('reset') === '1';
  const banner = reset
    ? 'Password updated. Sign in with your new password.'
    : verified || registered
      ? 'Email verified. Sign in to your workspace.'
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.code === 'UNVERIFIED') {
        setPendingRegister({ email });
        router.push('/verify-otp');
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Sign in failed.');
        return;
      }
      login({ token: data.token, user: data.user });
      const role = data.user?.role;
      const dest =
        role === 'superadmin' || role === 'admin'
          ? '/dashboard/superadmin'
          : '/dashboard/user';
      router.push(dest);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {banner ? (
        <div className="mb-6 rounded-lg border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-center text-sm text-brand-muted">
          {banner}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="auth-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="auth-link text-sm">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? 'Signing in…' : 'Sign in'}</span>
        </button>
      </form>

      <div className="mt-8 border-t border-brand-border-muted pt-6 text-center text-sm text-brand-muted">
        No account?{' '}
        <Link href="/register" className="auth-link text-brand-heading">
          Create one
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to the 759 Private Exchange workspace."
      badge="Sign in"
      footer={
        <Link href="/" className="auth-link">
          ← Return to marketing site
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-lg bg-white/[0.04]" aria-hidden />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
