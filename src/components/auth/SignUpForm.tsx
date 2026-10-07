'use client';

import React, { useState } from 'react';
import { FormField } from '../FormField';
import {
  validateRequired,
  validateFullName,
  validateEmail,
  validatePassword,
} from '@/lib/validators';

export interface SignUpFormProps {
  onSuccess?: (memberName: string, phone: string) => void;
  onSwitchView: (view: 'signin' | 'signup' | 'forgot-password') => void;
}

export function SignUpForm({ onSuccess, onSwitchView }: SignUpFormProps) {
  // Form Values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Error state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Full Name Change & Blur
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    if (touched.fullName) {
      setErrors((prev) => ({ ...prev, fullName: validateFullName(val) }));
    }
  };

  const handleFullNameBlur = () => {
    markTouched('fullName');
    setErrors((prev) => ({ ...prev, fullName: validateFullName(fullName) }));
  };

  // Email Change (Real-time validation on every keystroke) & Blur
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    // Real-time email validation: validates on every keystroke once typing begins
    if (val.length > 0) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val, true) }));
    } else if (touched.email) {
      // If user had previously focused and erased completely
      setErrors((prev) => ({ ...prev, email: validateRequired(val) }));
    } else {
      setErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handleEmailBlur = () => {
    markTouched('email');
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: validateRequired(email) }));
    } else {
      setErrors((prev) => ({ ...prev, email: validateEmail(email, false) }));
    }
  };

  // Phone Change & Blur
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

  // Member Number Change & Blur
  const handleMemberNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMemberNumber(val);
    if (touched.memberNumber) {
      setErrors((prev) => ({ ...prev, memberNumber: validateRequired(val) }));
    }
  };

  const handleMemberNumberBlur = () => {
    markTouched('memberNumber');
    setErrors((prev) => ({ ...prev, memberNumber: validateRequired(memberNumber) }));
  };

  // Password Change & Blur
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handlePasswordBlur = () => {
    markTouched('password');
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      memberNumber: true,
      password: true,
    });

    // Validate all
    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email, false);
    const phoneErr = validateRequired(phone);
    const memberNumErr = validateRequired(memberNumber);
    const passwordErr = validatePassword(password);
    const privErr = privacyAccepted ? null : 'You must accept the privacy notice to proceed';

    setErrors({
      fullName: nameErr,
      email: emailErr,
      phone: phoneErr,
      memberNumber: memberNumErr,
      password: passwordErr,
    });
    setPrivacyError(privErr);

    if (!nameErr && !emailErr && !phoneErr && !memberNumErr && !passwordErr && !privErr) {
      onSuccess?.(fullName, phone);
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
        {/* Full Name Field */}
        <FormField
          id="signup-fullname"
          label="Full Name"
          type="text"
          value={fullName}
          onChange={handleFullNameChange}
          onBlur={handleFullNameBlur}
          error={errors.fullName}
          placeholder="Chioma Adeyemi"
          autoComplete="name"
        />

        {/* Email Address Field with real-time validation */}
        <FormField
          id="signup-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          error={errors.email}
          placeholder="chioma@example.com"
          autoComplete="email"
        />

        {/* Mobile Number Field */}
        <FormField
          id="signup-phone"
          label="Mobile Number"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          error={errors.phone}
          placeholder="0801 234 5678"
          autoComplete="tel"
          helperText="Used for mobile sign-in authentication."
        />

        {/* Member Number Field */}
        <FormField
          id="signup-membernumber"
          label="Member Number"
          type="text"
          value={memberNumber}
          onChange={handleMemberNumberChange}
          onBlur={handleMemberNumberBlur}
          error={errors.memberNumber}
          placeholder="e.g. 1042"
          helperText="Enter the member number on your gym card."
        />

        {/* Password Field with Show/Hide toggle */}
        <FormField
          id="signup-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          error={errors.password}
          helperText={
            password.length > 0 && !errors.password
              ? 'Use at least eight characters.'
              : undefined
          }
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

        {/* Privacy Notice Checkbox */}
        <div style={{ marginTop: '4px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--color-on-surface-variant, #475569)',
              lineHeight: '1.45',
              cursor: 'pointer',
            }}
          >
            <input
              id="signup-privacy"
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked);
                if (privacyError) setPrivacyError(null);
              }}
              style={{
                width: '16px',
                height: '16px',
                marginTop: '2px',
                accentColor: 'var(--color-primary, #0052FF)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <span>
              I accept that Spotter stores my check-in history and email privately for 24 months, accessible only to my member account.
            </span>
          </label>
          {privacyError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--color-error, #DC2626)',
                fontSize: '12px',
                marginTop: '6px',
                fontWeight: 500,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="var(--color-error, #DC2626)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <path d="M7.126 1.954c.385-.667 1.363-.667 1.748 0l6.084 10.54c.385.667-.104 1.506-.874 1.506H1.916c-.77 0-1.259-.839-.874-1.506L7.126 1.954zM8 6v4M8 12.5v.5" />
              </svg>
              <span>{privacyError}</span>
            </div>
          )}
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
          Create Account
        </button>

        {/* Switch to Sign In */}
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant, #64748B)' }}>
            Already have an account?{' '}
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
