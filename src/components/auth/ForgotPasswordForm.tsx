'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import { normalizeEmail, normalizePhone, validateRequired } from '@/lib/validators';

export interface ForgotPasswordFormProps {
  onSuccess?: (identifier: string) => void;
  onSwitchView: (
    view: 'signin' | 'signup' | 'forgot-password' | 'reset-password'
  ) => void;
}

function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  return trimmed.includes('@') ? normalizeEmail(trimmed) : normalizePhone(trimmed);
}

export function ForgotPasswordForm({ onSuccess, onSwitchView }: ForgotPasswordFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentifier(val);
    if (serverError) setServerError(null);
    if (touched) {
      setError(validateRequired(val.trim()));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const normalized = normalizeIdentifier(identifier);
    if (normalized !== identifier) {
      setIdentifier(normalized);
    }
    setError(validateRequired(normalized));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);

    const normalized = normalizeIdentifier(identifier);
    const err = validateRequired(normalized);
    setError(err);

    if (err) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: normalized }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setServerError(
          data?.error || 'Could not send reset instructions. Please try again.'
        );
        return;
      }

      setSentMessage(
        data?.message ||
          'If an account exists for that identifier, reset instructions have been sent.'
      );
      setSent(true);
      onSuccess?.(normalized);
    } catch {
      setServerError('Unable to reach the server. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px',
          borderTop: '1px solid var(--border-color-subtle, #F1F5F9)',
          paddingTop: '20px',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-success-container, #DCFCE7)',
            color: 'var(--color-on-success-container, #16A34A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-on-surface, #0F172A)',
            margin: 0,
          }}
        >
          Reset Instructions Sent
        </h3>
        <p
          role="status"
          style={{
            fontSize: '13px',
            color: 'var(--color-on-surface-variant, #64748B)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {sentMessage}
        </p>

        <button
          type="button"
          onClick={() => onSwitchView('reset-password')}
          style={{
            marginTop: '12px',
            backgroundColor: 'var(--color-primary, #0052FF)',
            color: 'var(--color-on-primary, #FFFFFF)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Enter reset code
        </button>

        <button
          type="button"
          onClick={() => onSwitchView('signin')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #0052FF)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderTop: '1px solid var(--border-color-subtle, #F1F5F9)',
          paddingTop: '20px',
        }}
      >
        {serverError && (
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
            {serverError}
          </div>
        )}

        <FormField
          id="forgot-identifier"
          label="Mobile Number or Email"
          type="text"
          value={identifier}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error}
          placeholder="0801 234 5678 or you@example.com"
          autoCapitalize="none"
          autoFocus
          helperText="We will send a reset code to your contact."
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: submitting
              ? '#60A5FA'
              : 'var(--color-primary, #0052FF)',
            color: 'var(--color-on-primary, #FFFFFF)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            boxShadow: '0 1px 2px rgba(0, 82, 255, 0.2)',
          }}
        >
          {submitting ? 'Sending...' : 'Send Reset Instructions'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant, #64748B)' }}>
            Remember your password?{' '}
          </span>
          <button
            type="button"
            onClick={() => onSwitchView('signin')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #0052FF)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </form>
  );
}
