'use client';

import React, { useState } from 'react';

export interface VerifyEmailFormProps {
  email: string;
  onVerified: () => void;
  onSwitchView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}

export function VerifyEmailForm({
  email,
  onVerified,
  onSwitchView,
}: VerifyEmailFormProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFeedback(null);

      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Invalid code. Please check your email.');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`spotter_verified_${email}`, 'true');
      }

      setFeedback('Email verified successfully.');
      onVerified();
    } catch {
      setError('Unable to verify your code right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    try {
      setResending(true);
      setError(null);
      setFeedback(null);

      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not resend the code. Please try again shortly.');
        return;
      }

      setFeedback('A new 6-digit code has been sent to your email.');
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Could not resend the code. Please check your connection.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} noValidate aria-label="Verify Email">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderTop: '1px solid var(--border-color-subtle, #F1F5F9)',
          paddingTop: '20px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-on-surface-variant, #475569)',
            lineHeight: '1.5',
            margin: 0,
          }}
        >
          We sent a 6-digit verification code to{' '}
          <strong style={{ color: 'var(--color-on-surface, #0F172A)' }}>{email}</strong>.
          Enter it below to activate your account.
        </p>

        <div>
          <label
            htmlFor="verify-email-code"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-on-surface, #0F172A)',
              marginBottom: '6px',
            }}
          >
            6-digit code
          </label>
          <input
            id="verify-email-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            placeholder="123456"
            autoComplete="one-time-code"
            autoFocus
            aria-label="6-digit verification code"
            disabled={submitting}
            style={{
              width: '100%',
              height: '46px',
              padding: '0 14px',
              fontFamily: 'monospace',
              fontSize: '20px',
              letterSpacing: '8px',
              fontWeight: 700,
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: error ? '2px solid #EF4444' : '1px solid #CBD5E1',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-error-container, #FEF2F2)',
              border: '1px solid var(--color-error, #DC2626)',
              color: 'var(--color-error, #DC2626)',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            {error}
          </div>
        )}

        {feedback && !error && (
          <div
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-success-container, #DCFCE7)',
              border: '1px solid var(--color-success, #16A34A)',
              color: 'var(--color-on-success-container, #166534)',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            {feedback}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor:
              submitting || code.length !== 6
                ? '#94A3B8'
                : 'var(--color-primary, #0052FF)',
            color: 'var(--color-on-primary, #FFFFFF)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: submitting || code.length !== 6 ? 'not-allowed' : 'pointer',
            boxShadow:
              submitting || code.length !== 6
                ? 'none'
                : '0 1px 2px rgba(0, 82, 255, 0.2)',
            transition: 'background-color 0.15s ease',
          }}
        >
          {submitting ? 'Verifying...' : 'Verify Email'}
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? '#9CA3AF' : 'var(--color-primary, #0052FF)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: cooldown > 0 || resending ? 'default' : 'pointer',
              padding: 0,
              textDecoration: cooldown > 0 ? 'none' : 'underline',
            }}
          >
            {resending
              ? 'Sending...'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend code'}
          </button>

          <button
            type="button"
            onClick={() => onSwitchView('signin')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-on-surface-variant, #64748B)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </form>
  );
}
