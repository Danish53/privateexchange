'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Spinner from '@/components/ui/Spinner';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

export default function ForgotPasswordPage() {
  const { t } = useWebsiteT();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('auth.forgot.requestFailed'));
        return;
      }
      if (data.devOtp && typeof window !== 'undefined') {
        console.info('[dev] reset OTP:', data.devOtp);
      }
      setSent(true);
    } catch {
      setError(t('auth.forgot.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    router.push(`/reset-password${q}`);
  };

  if (sent) {
    return (
      <AuthShell
        title={t('auth.forgot.titleSent')}
        subtitle={t('auth.forgot.subtitleSent')}
        badge={t('auth.forgot.badgeSent')}
        backHref="/login"
        backLabel={t('auth.forgot.backToSignIn')}
      >
        <div className="space-y-6 text-center">
          <div className="rounded-lg border border-brand-accent/25 bg-brand-accent/10 px-4 py-4 text-sm text-brand-muted">
            {t('auth.forgot.sentHint')}
          </div>
          <button type="button" onClick={goToReset} className="btn-primary w-full justify-center">
            {t('auth.forgot.enterCode')}
          </button>
          <p className="text-sm text-brand-subtle">
            <Link href="/login" className="auth-link">
              {t('auth.forgot.returnToSignIn')}
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      badge={t('auth.forgot.badge')}
      backHref="/login"
      backLabel={t('auth.forgot.backToSignIn')}
      footer={
        <span className="text-brand-muted">
          {t('auth.forgot.remembered')}{' '}
          <Link href="/login" className="auth-link text-brand-heading">
            {t('auth.forgot.signIn')}
          </Link>
        </span>
      }
    >
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
          <label htmlFor="forgot-email" className="auth-label">
            {t('auth.forgot.email')}
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.forgot.emailPlaceholder')}
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? t('auth.forgot.sending') : t('auth.forgot.sendCode')}</span>
        </button>
      </form>
    </AuthShell>
  );
}
