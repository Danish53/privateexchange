'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Spinner from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
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
        setError(data.error || 'Request failed.');
        return;
      }
      if (data.devOtp && typeof window !== 'undefined') {
        console.info('[dev] reset OTP:', data.devOtp);
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Try again.');
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
        title="Check your inbox"
        subtitle="If an account exists for that email, we sent a 6-digit code to reset your password."
        badge="Forgot password"
        backHref="/login"
        backLabel="Back to sign in"
      >
        <div className="space-y-6 text-center">
          <div className="rounded-lg border border-brand-accent/25 bg-brand-accent/10 px-4 py-4 text-sm text-brand-muted">
            Enter the code on the next screen with your new password. If SMTP is not configured, check the server console for the code.
          </div>
          <button type="button" onClick={goToReset} className="btn-primary w-full justify-center">
            Enter code & new password
          </button>
          <p className="text-sm text-brand-subtle">
            <Link href="/login" className="auth-link">
              Return to sign in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter the email for your account. We will send a reset code."
      badge="Recovery"
      backHref="/login"
      backLabel="Back to sign in"
      footer={
        <span className="text-brand-muted">
          Remembered?{' '}
          <Link href="/login" className="auth-link text-brand-heading">
            Sign in
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
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
          <span>{loading ? 'Sending…' : 'Send reset code'}</span>
        </button>
      </form>
    </AuthShell>
  );
}
