'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import { validateRequired } from '@/lib/validators';

export interface SignInFormProps {
  onSuccess?: (phone: string) => void;
  onSwitchView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}

export function SignInForm({ onSuccess, onSwitchView }: SignInFormProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: validateRequired(val) }));
    }
  };

  const handlePhoneBlur = () => {
    markTouched('phone');
    setErrors((prev) => ({ ...prev, phone: validateRequired(phone) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateRequired(val) }));
    }
  };

  const handlePasswordBlur = () => {
    markTouched('password');
    setErrors((prev) => ({ ...prev, password: validateRequired(password) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      phone: true,
      password: true,
    });

    const phoneErr = validateRequired(phone);
    const passwordErr = validateRequired(password);

    setErrors({
      phone: phoneErr,
      password: passwordErr,
    });

    if (!phoneErr && !passwordErr) {
      onSuccess?.(phone);
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
        {/* Mobile Number Field */}
        <FormField
          id="signin-phone"
          label="Mobile Number"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          error={errors.phone}
          placeholder="0801 234 5678"
          autoComplete="tel"
          autoFocus
          helperText="Enter your 11-digit registered mobile number."
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
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0045D8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary, #0052FF)';
          }}
        >
          Sign In
        </button>

        {/* Toggle to Sign Up */}
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant, #64748B)' }}>
            Don&apos;t have an account?{' '}
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
