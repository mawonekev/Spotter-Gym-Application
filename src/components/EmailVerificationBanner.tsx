'use client';

import React, { useState } from 'react';

export interface EmailVerificationBannerProps {
  email: string;
  isVerified?: boolean;
  onVerified?: () => void;
}

export function EmailVerificationBanner({
  email,
  isVerified = false,
  onVerified,
}: EmailVerificationBannerProps) {
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(isVerified);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  if (verified) {
    return null;
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
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

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid code. Please check your email.');
        return;
      }

      setFeedback('Email verified successfully.');
      setVerified(true);
      onVerified?.();
    } catch {
      setError('Unable to verify code right now. Please try again.');
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

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Could not resend code. Please try again shortly.');
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
      setError('Could not resend code. Please check your connection.');
    } finally {
      setResending(false);
    }
  };

  return (
    <aside
      id="email-verification-banner"
      role="region"
      aria-label="Email verification notice"
      style={{
        backgroundColor: 'var(--color-warning-container, #FEF3C7)',
        color: 'var(--color-on-warning-container, #92400E)',
        border: '1px solid var(--color-warning-border, #FCD34D)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Envelope Icon */}
        <div
          aria-hidden="true"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#F59E0B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          ✉
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#78350F',
              marginBottom: '4px',
            }}
          >
            Verify your email address
          </div>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.4,
              color: '#92400E',
              margin: '0 0 12px 0',
            }}
          >
            We sent a 6-digit verification code to <strong>{email}</strong>. Enter the code below to complete your account verification.
          </p>

          <form
            onSubmit={handleVerify}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              id="verification-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="123456"
              aria-label="6-digit verification code"
              disabled={submitting}
              style={{
                width: '130px',
                height: '38px',
                padding: '0 12px',
                fontFamily: 'monospace',
                fontSize: '16px',
                letterSpacing: '3px',
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

            <button
              id="verify-code-submit-button"
              type="submit"
              disabled={submitting || code.length !== 6}
              style={{
                height: '38px',
                padding: '0 16px',
                backgroundColor: code.length === 6 ? '#0052FF' : '#94A3B8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s ease',
              }}
            >
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              id="resend-verification-button"
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              style={{
                height: '38px',
                padding: '0 12px',
                backgroundColor: 'transparent',
                color: cooldown > 0 ? '#9CA3AF' : '#1D4ED8',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: cooldown > 0 || resending ? 'default' : 'pointer',
                textDecoration: cooldown > 0 ? 'none' : 'underline',
              }}
            >
              {resending
                ? 'Sending...'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend code'}
            </button>
          </form>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#B91C1C',
              }}
            >
              {error}
            </div>
          )}

          {feedback && !error && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#15803D',
              }}
            >
              {feedback}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
