'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import Spinner from '@/components/ui/Spinner';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

const OTP_LEN = 6;

function ResetForm() {
  const { t } = useWebsiteT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.reset.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.reset.passwordLength'));
      return;
    }
    const code = otp.replace(/\D/g, '');
    if (code.length !== OTP_LEN) {
      setError(t('auth.reset.codeRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.reset.emailRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('auth.reset.resetFailed'));
        return;
      }
      router.push('/login?reset=1');
    } catch {
      setError(t('auth.reset.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="mb-6 text-center text-sm leading-relaxed text-brand-muted">
        {t('auth.reset.formHint')}
      </p>

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
          <label htmlFor="reset-email" className="auth-label">
            {t('auth.reset.email')}
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.reset.emailPlaceholder')}
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="reset-otp" className="auth-label">
            {t('auth.reset.resetCode')}
          </label>
          <input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LEN))}
            placeholder={t('auth.reset.codePlaceholder')}
            className="auth-input tracking-widest"
          />
        </div>

        <PasswordField
          label={t('auth.reset.newPassword')}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <p className="auth-hint -mt-3">{t('auth.reset.passwordHint')}</p>

        <PasswordField
          label={t('auth.reset.confirmPassword')}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? t('auth.reset.updating') : t('auth.reset.updatePassword')}</span>
        </button>
      </form>

      <div className="mt-8 border-t border-brand-border-muted pt-6 text-center text-sm text-brand-muted">
        <Link href="/login" className="auth-link text-brand-heading">
          {t('auth.reset.backToSignIn')}
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  const { t } = useWebsiteT();

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
      badge={t('auth.reset.badge')}
      backHref="/forgot-password"
      backLabel={t('auth.reset.back')}
      footer={
        <span className="text-brand-muted">
          {t('auth.reset.needHelp')}{' '}
          <Link href="/" className="auth-link text-brand-heading">
            {t('auth.reset.contactViaSite')}
          </Link>
        </span>
      }
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-lg bg-white/[0.04]" aria-hidden />
        }
      >
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
