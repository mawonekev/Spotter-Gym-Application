'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import {
  normalizeEmail,
  normalizePhone,
  validateResetPassword,
} from '@/lib/validators';

export interface ResetPasswordFormProps {
  initialIdentifier?: string;
  onSuccess?: () => void;
  onSwitchView: (
    view: 'signin' | 'signup' | 'forgot-password' | 'reset-password'
  ) => void;
}

export function ResetPasswordForm({
  initialIdentifier = '',
  onSuccess,
  onSwitchView,
}: ResetPasswordFormProps) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalizeIdentifier = (value: string) => {
    const trimmed = value.trim();
    return trimmed.includes('@') ? normalizeEmail(trimmed) : normalizePhone(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const values = {
      identifier: normalizeIdentifier(identifier),
      token: token.trim(),
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    };

    setIdentifier(values.identifier);
    setNewPassword(values.newPassword);
    setConfirmPassword(values.confirmPassword);

    const validation = validateResetPassword(values);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors || {});
      return;
    }

    setErrors({});
    setServerError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setServerError(
          data?.error ||
            data?.message ||
            'Could not reset your password. Please request a new code.'
        );
        return;
      }

      onSuccess?.();
    } catch {
      setServerError('Unable to reach the server. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Reset Password">
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
          id="reset-identifier"
          label="Mobile Number or Email"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          placeholder="0801 234 5678 or you@example.com"
          autoCapitalize="none"
          autoComplete="username"
        />

        <FormField
          id="reset-token"
          label="Reset Code"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={errors.token}
          placeholder="Paste the reset code from your email"
          helperText="The reset code expires 15 minutes after it is sent."
        />

        <FormField
          id="reset-new-password"
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          autoComplete="new-password"
          helperText="At least eight characters, including a letter and a number."
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              aria-controls="reset-new-password"
              style={{
                backgroundColor: 'var(--color-surface-container, #E2E8F0)',
                border: '1px solid var(--border-color-default, #E2E8F0)',
                borderRadius: '0 6px 6px 0',
                padding: '0 16px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-on-surface-variant, #475569)',
                cursor: 'pointer',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <FormField
          id="reset-confirm-password"
          label="Confirm New Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
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
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
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
      </div>
    </form>
  );
}
