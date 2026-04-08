'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/components/auth-context';
import { clearPendingRegister, getPendingRegister } from '@/lib/auth-flow';

const LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [digits, setDigits] = useState(() => Array.from({ length: LENGTH }, () => ''));
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const inputsRef = useRef(/** @type {(HTMLInputElement | null)[]} */ ([]));

  useEffect(() => {
    const pending = getPendingRegister();
    if (!pending?.email) {
      router.replace('/register');
      return;
    }
    setEmail(pending.email);
    setReady(true);
  }, [router]);

  const setAt = (index, char) => {
    const next = [...digits];
    next[index] = char;
    setDigits(next);
  };

  const handleChange = (index, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    setError('');
    setAt(index, v);
    if (v && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < LENGTH; i += 1) {
      next[i] = text[i] || '';
    }
    setDigits(next);
    const last = Math.min(text.length, LENGTH) - 1;
    if (last >= 0) inputsRef.current[last]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== LENGTH) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        return;
      }
      clearPendingRegister();
      login({ token: data.token, user: data.user });
      router.push(data.user?.role === 'admin' ? '/dashboard' : '/dashboard/user');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendBusy(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not resend.');
        return;
      }
      if (data.devOtp && typeof window !== 'undefined') {
        console.info('[dev] OTP:', data.devOtp);
      }
    } catch {
      setError('Could not resend. Try again.');
    } finally {
      setResendBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page font-sans">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" variant="accent" />
          <p className="text-xs font-medium text-brand-subtle">Preparing verification…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}. Enter it below to activate your account.`}
      badge="Verification"
      backHref="/register"
      backLabel="Back to register"
      footer={
        <span className="text-brand-muted">
          Wrong email?{' '}
          <Link href="/register" className="auth-link text-brand-heading">
            Start over
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div>
          <p className="auth-label text-center">One-time code</p>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="auth-input h-14 w-11 text-center text-lg font-semibold tracking-widest sm:h-16 sm:w-12"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <p className="auth-hint text-center">
            Check your inbox (or server logs if email is not configured).
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? 'Verifying…' : 'Verify & continue'}</span>
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendBusy}
            aria-busy={resendBusy}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-accent disabled:opacity-50"
          >
            {resendBusy ? <Spinner size="sm" variant="accent" /> : null}
            <span>{resendBusy ? 'Sending…' : 'Resend code'}</span>
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
