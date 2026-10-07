'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import { validateRequired } from '@/lib/validators';

export interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onSwitchView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}

export function ForgotPasswordForm({ onSuccess, onSwitchView }: ForgotPasswordFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentifier(val);
    if (touched) {
      setError(validateRequired(val));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateRequired(identifier));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = validateRequired(identifier);
    setError(err);

    if (!err) {
      setSent(true);
      onSuccess?.();
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
          style={{
            fontSize: '13px',
            color: 'var(--color-on-surface-variant, #64748B)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          If an account exists for {identifier}, instructions have been sent via WhatsApp or email.
        </p>

        <button
          type="button"
          onClick={() => onSwitchView('signin')}
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
        <FormField
          id="forgot-identifier"
          label="Mobile Number or Email"
          type="text"
          value={identifier}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error}
          placeholder="0801 234 5678 or you@example.com"
          autoFocus
          helperText="We will send a verification code or reset link to your contact."
        />

        <button
          type="submit"
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: 'var(--color-primary, #0052FF)',
            color: 'var(--color-on-primary, #FFFFFF)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: '0 1px 2px rgba(0, 82, 255, 0.2)',
          }}
        >
          Send Reset Instructions
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
