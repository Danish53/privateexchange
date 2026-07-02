'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import Spinner from '@/components/ui/Spinner';
import { setPendingRegister } from '@/lib/auth-flow';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useWebsiteT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.register.errorPasswordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.register.errorPasswordLength'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role: 'user' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('auth.register.errorRegistrationFailed'));
        return;
      }
      setPendingRegister({ email, name, role: 'user' });
      router.push('/verify-otp');
    } catch {
      setError(t('auth.register.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      badge={t('auth.register.badge')}
      contentMaxWidth="max-w-xl sm:max-w-2xl"
      subtitleMaxWidthClass="max-w-md sm:max-w-xl"
      footer={
        <span className="text-brand-muted">
          {t('auth.register.alreadyRegistered')}{' '}
          <Link href="/login" className="auth-link text-brand-heading">
            {t('auth.register.signIn')}
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
          <label htmlFor="reg-name" className="auth-label">
            {t('auth.register.fullName')}
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('auth.register.namePlaceholder')}
            autoComplete="name"
            required
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="auth-label">
            {t('auth.register.email')}
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.register.emailPlaceholder')}
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <PasswordField
          label={t('auth.register.password')}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <p className="auth-hint -mt-3">{t('auth.register.passwordHint')}</p>

        <PasswordField
          label={t('auth.register.confirmPassword')}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <p className="auth-hint text-center text-xs text-brand-muted">
          {t('auth.register.signUpNotePrefix')}{' '}
          <span className="font-medium text-brand-subtle">{t('auth.register.signUpNoteRole')}</span>{' '}
          {t('auth.register.signUpNoteSuffix')}
        </p>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? t('auth.register.sendingCode') : t('auth.register.continue')}</span>
        </button>
      </form>
    </AuthShell>
  );
}
