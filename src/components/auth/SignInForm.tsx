'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import { normalizeEmail, validateRequired, validatePassword } from '@/lib/validators';

export interface SignInFormProps {
  onSuccess?: (email?: string) => void;
  onSwitchView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}

export function SignInForm({ onSuccess, onSwitchView }: SignInFormProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const normalizeIdentifier = (value: string) =>
    value.includes('@') ? normalizeEmail(value) : value.trim();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (serverError) setServerError(null);
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: validateRequired(val) }));
    }
  };

  const handlePhoneBlur = () => {
    markTouched('phone');
    const normalized = normalizeIdentifier(phone);
    if (normalized !== phone) {
      setPhone(normalized);
    }
    setErrors((prev) => ({ ...prev, phone: validateRequired(normalized) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (serverError) setServerError(null);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateRequired(val) }));
    }
  };

  const handlePasswordBlur = () => {
    markTouched('password');
    const trimmed = password.trim();
    if (trimmed !== password) {
      setPassword(trimmed);
    }
    setErrors((prev) => ({ ...prev, password: validatePassword(trimmed) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      phone: true,
      password: true,
    });

    const trimmedPhone = normalizeIdentifier(phone);
    const trimmedPassword = password.trim();
    if (trimmedPhone !== phone) {
      setPhone(trimmedPhone);
    }
    if (trimmedPassword !== password) {
      setPassword(trimmedPassword);
    }

    const phoneErr = validateRequired(trimmedPhone);
    const passwordErr = validatePassword(trimmedPassword);

    setErrors({
      phone: phoneErr,
      password: passwordErr,
    });

    if (phoneErr || passwordErr) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, password: trimmedPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.error || 'Failed to sign in. Please verify your details.');
        return;
      }

      const memberEmail =
        typeof data.member?.email === 'string' ? data.member.email : undefined;
      onSuccess?.(memberEmail || (trimmedPhone.includes('@') ? trimmedPhone : undefined));
    } catch {
      setServerError('Unable to reach server. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Mobile Number or Email Field */}
        <FormField
          id="signin-phone"
          label="Mobile Number or Email"
          type="text"
          value={phone}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          error={errors.phone}
          placeholder="0801 234 5678 or you@example.com"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          helperText="Emails are matched case-insensitively."
        />

        {/* Password Field */}
        <div>
          <FormField
            id="signin-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={errors.password}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  backgroundColor: 'var(--color-surface-container, #E2E8F0)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: errors.password
                    ? 'var(--color-error, #DC2626)'
                    : 'var(--border-color-default, #E2E8F0)',
                  borderRadius: '0 6px 6px 0',
                  padding: '0 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-on-surface-variant, #475569)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => onSwitchView('forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #0052FF)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: isSubmitting ? '#60A5FA' : 'var(--color-primary, #0052FF)',
            color: 'var(--color-on-primary, #FFFFFF)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            boxShadow: '0 1px 2px rgba(0, 82, 255, 0.2)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = '#0045D8';
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-primary, #0052FF)';
          }}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Toggle to Sign Up (Available at the bottom for new users) */}
        <div style={{ textAlign: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant, #64748B)' }}>
            New to Spotter?{' '}
          </span>
          <button
            type="button"
            onClick={() => onSwitchView('signup')}
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
            Sign up
          </button>
        </div>
      </div>
    </form>
  );
}
