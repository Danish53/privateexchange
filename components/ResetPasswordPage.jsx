'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import Spinner from '@/components/ui/Spinner';

const OTP_LEN = 6;

function ResetForm() {
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
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    const code = otp.replace(/\D/g, '');
    if (code.length !== OTP_LEN) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
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
        setError(data.error || 'Reset failed.');
        return;
      }
      router.push('/login?reset=1');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="mb-6 text-center text-sm leading-relaxed text-brand-muted">
        Use the 6-digit code we sent and choose a new password.
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
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="reset-otp" className="auth-label">
            Reset code
          </label>
          <input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LEN))}
            placeholder="6-digit code"
            className="auth-input tracking-widest"
          />
        </div>

        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <p className="auth-hint -mt-3">At least 8 characters.</p>

        <PasswordField
          label="Confirm new password"
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
          <span>{loading ? 'Updating…' : 'Update password'}</span>
        </button>
      </form>

      <div className="mt-8 border-t border-brand-border-muted pt-6 text-center text-sm text-brand-muted">
        <Link href="/login" className="auth-link text-brand-heading">
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter the code from your email and choose a strong new password."
      badge="Reset password"
      backHref="/forgot-password"
      backLabel="Back"
      footer={
        <span className="text-brand-muted">
          Need help?{' '}
          <Link href="/" className="auth-link text-brand-heading">
            Contact via site
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
