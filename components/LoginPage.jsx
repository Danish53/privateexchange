'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import Spinner from '@/components/ui/Spinner';
import { setPendingRegister } from '@/lib/auth-flow';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useWebsiteT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verified = searchParams.get('verified') === '1';
  const registered = searchParams.get('registered') === '1';
  const reset = searchParams.get('reset') === '1';
  const banner = reset
    ? t('auth.login.bannerReset')
    : verified || registered
      ? t('auth.login.bannerVerified')
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
        setError(data.error || t('auth.login.errorSignInFailed'));
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
      setError(t('auth.login.errorGeneric'));
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
            {t('auth.login.email')}
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.login.emailPlaceholder')}
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <PasswordField
          label={t('auth.login.password')}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="auth-link text-sm">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? t('auth.login.signingIn') : t('auth.login.signIn')}</span>
        </button>
      </form>

      <div className="mt-8 border-t border-brand-border-muted pt-6 text-center text-sm text-brand-muted">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="auth-link text-brand-heading">
          {t('auth.login.createOne')}
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  const { t } = useWebsiteT();

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      badge={t('auth.login.badge')}
      footer={
        <Link href="/" className="auth-link">
          {t('auth.returnMarketing')}
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
