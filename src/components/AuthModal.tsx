'use client';

import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (memberName: string, phone: string) => void;
  initialMode?: 'signup' | 'signin';
  officerName?: string;
}

/**
 * Normalizes phone numbers by removing spaces, hyphens, and parentheses
 */
function cleanPhoneNumber(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, '');
}

/**
 * Validates Nigerian or international mobile numbers
 */
function isValidPhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  const nigerianRegex = /^(?:\+?234|0)[789][01]\d{8}$/;
  const generalRegex = /^\+?[1-9]\d{9,13}$/;
  return nigerianRegex.test(cleaned) || generalRegex.test(cleaned);
}

/**
 * Validates standard email address
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);

  // Sign Up Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Sign In Form Fields
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation Icon
  const WarningIcon = () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#DC2626"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M7.126 1.954c.385-.667 1.363-.667 1.748 0l6.084 10.54c.385.667-.104 1.506-.874 1.506H1.916c-.77 0-1.259-.839-.874-1.506L7.126 1.954zM8 6v4M8 12.5v.5" />
    </svg>
  );

  // Handle Sign Up Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'This field must not be empty';
    } else if (fullName.trim().split(/\s+/).length < 2) {
      newErrors.fullName = 'Please enter both your first and last name';
    }

    if (!email.trim()) {
      newErrors.email = 'This field must not be empty';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'This field must not be empty';
    } else if (!isValidPhoneNumber(phone)) {
      newErrors.phone = 'Please enter a valid mobile number (e.g. 0801 234 5678)';
    }

    if (!memberNumber.trim()) {
      newErrors.memberNumber = 'This field must not be empty';
    }

    if (!password) {
      newErrors.password = 'This field must not be empty';
    } else if (password.length < 8) {
      newErrors.password = 'Use at least eight characters.';
    }

    if (!privacyAccepted) {
      newErrors.privacy = 'You must accept the privacy notice to proceed';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSuccessFeedback(`Account created! Welcome, ${fullName.split(' ')[0]}.`);
      setTimeout(() => {
        onSuccess?.(fullName, phone);
        setSuccessFeedback(null);
        resetState();
        onClose();
      }, 1000);
    }
  };

  // Handle Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const newErrors: Record<string, string> = {};

    if (!signInPhone.trim()) {
      newErrors.signInPhone = 'This field must not be empty';
    } else if (!isValidPhoneNumber(signInPhone)) {
      newErrors.signInPhone = 'Please enter a valid mobile number (e.g. 0801 234 5678)';
    }

    if (!signInPassword) {
      newErrors.signInPassword = 'This field must not be empty';
    } else if (signInPassword.length < 4) {
      newErrors.signInPassword = 'Password must be at least four characters';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSuccessFeedback('Signed in successfully.');
      setTimeout(() => {
        onSuccess?.('Chioma Adeyemi', signInPhone);
        setSuccessFeedback(null);
        resetState();
        onClose();
      }, 900);
    }
  };

  const resetState = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setMemberNumber('');
    setPassword('');
    setShowPassword(false);
    setPrivacyAccepted(false);
    setSignInPhone('');
    setSignInPassword('');
    setShowSignInPassword(false);
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'signup' ? 'Create Account' : 'Sign In'}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1300,
        overflowY: 'auto',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Bar per screenshot */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '0 4px',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => {
            resetState();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#1E293B',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">&larr;</span> Back to Spotter
        </button>

        <span
          style={{
            fontSize: '13px',
            color: '#64748B',
            fontWeight: 400,
          }}
        >
          Official Member App
        </span>
      </div>

      {/* Main Form Card per screenshot */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '32px 32px 36px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
        }}
      >
        {successFeedback ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
              }}
            >
              ✓
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0F172A',
                margin: 0,
              }}
            >
              {successFeedback}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Entering your gym portal...
            </p>
          </div>
        ) : mode === 'signup' ? (
          /* ==============================================================
             CREATE ACCOUNT (SIGN UP) FORM
             ============================================================== */
          <div>
            {/* Header Badge */}
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  backgroundColor: '#0052FF',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                }}
              >
                SPOTTER
              </span>
            </div>

            {/* Main Title & Subtitle */}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
                lineHeight: '1.2',
              }}
            >
              Create Account
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: '0 0 20px 0',
                lineHeight: '1.45',
              }}
            >
              Link your gym card to activate your personal Spotter portal.
            </p>

            {/* Form Fields */}
            <form onSubmit={handleSignUpSubmit} noValidate>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '20px',
                }}
              >
                {/* 1. Full Name */}
                <div>
                  <label
                    htmlFor="field-fullname"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    id="field-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        setErrors((prev) => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder="Chioma Adeyemi"
                    autoComplete="name"
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      border: `1px solid ${
                        errors.fullName ? '#DC2626' : '#E2E8F0'
                      }`,
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {errors.fullName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.fullName}</span>
                    </div>
                  )}
                </div>

                {/* 2. Email Address */}
                <div>
                  <label
                    htmlFor="field-email"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="field-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="chioma@example.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      border: `1px solid ${
                        errors.email ? '#DC2626' : '#E2E8F0'
                      }`,
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {errors.email && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* 3. Mobile Number */}
                <div>
                  <label
                    htmlFor="field-phone"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Mobile Number
                  </label>
                  <input
                    id="field-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) {
                        setErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="0801 234 5678"
                    autoComplete="tel"
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      border: `1px solid ${
                        errors.phone ? '#DC2626' : '#E2E8F0'
                      }`,
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {errors.phone ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.phone}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        marginTop: '4px',
                      }}
                    >
                      Used for mobile sign-in authentication.
                    </div>
                  )}
                </div>

                {/* 4. Member Number (as shown in screenshot) */}
                <div>
                  <label
                    htmlFor="field-membernumber"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Member Number
                  </label>
                  <input
                    id="field-membernumber"
                    type="text"
                    value={memberNumber}
                    onChange={(e) => {
                      setMemberNumber(e.target.value);
                      if (errors.memberNumber) {
                        setErrors((prev) => ({ ...prev, memberNumber: '' }));
                      }
                    }}
                    placeholder="e.g. 1042"
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      border: `1px solid ${
                        errors.memberNumber ? '#DC2626' : '#E2E8F0'
                      }`,
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {errors.memberNumber ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.memberNumber}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        marginTop: '4px',
                      }}
                    >
                      Enter the member number on your gym card.
                    </div>
                  )}
                </div>

                {/* 5. Password Field with Show/Hide toggle button */}
                <div>
                  <label
                    htmlFor="field-password"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Password
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      width: '100%',
                    }}
                  >
                    <input
                      id="field-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                          setErrors((prev) => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder=""
                      style={{
                        flex: 1,
                        height: '44px',
                        backgroundColor: '#F1F5F9',
                        border: `1px solid ${
                          errors.password ? '#DC2626' : '#E2E8F0'
                        }`,
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0 14px',
                        fontSize: '14px',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        backgroundColor: '#E2E8F0',
                        border: `1px solid ${
                          errors.password ? '#DC2626' : '#E2E8F0'
                        }`,
                        borderRadius: '0 6px 6px 0',
                        padding: '0 16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.password}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        marginTop: '4px',
                      }}
                    >
                      Use at least eight characters.
                    </div>
                  )}
                </div>

                {/* 6. Consent Checkbox */}
                <div style={{ marginTop: '4px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: '1.45',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        setPrivacyAccepted(e.target.checked);
                        if (errors.privacy) {
                          setErrors((prev) => ({ ...prev, privacy: '' }));
                        }
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '2px',
                        accentColor: '#0052FF',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      I accept that Spotter stores my check-in history and email
                      privately for 24 months, accessible only to my member account.
                    </span>
                  </label>
                  {errors.privacy && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '6px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.privacy}</span>
                    </div>
                  )}
                </div>

                {/* 7. Submit Button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#0052FF',
                    color: '#FFFFFF',
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
                    e.currentTarget.style.backgroundColor = '#0052FF';
                  }}
                >
                  Create Account
                </button>

                {/* Toggle to Sign In */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    Already have an account?{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrors({});
                      setSubmitted(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0052FF',
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
          </div>
        ) : (
          /* ==============================================================
             SIGN IN FORM
             ============================================================== */
          <div>
            {/* Header Badge */}
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  backgroundColor: '#0052FF',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                }}
              >
                SPOTTER
              </span>
            </div>

            {/* Main Title & Subtitle */}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
                lineHeight: '1.2',
              }}
            >
              Sign In
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: '0 0 20px 0',
                lineHeight: '1.45',
              }}
            >
              Enter your mobile number and password to access your portal.
            </p>

            {/* Form Fields */}
            <form onSubmit={handleSignInSubmit} noValidate>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '20px',
                }}
              >
                {/* 1. Mobile Phone Number */}
                <div>
                  <label
                    htmlFor="signin-mobile"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Mobile Number
                  </label>
                  <input
                    id="signin-mobile"
                    type="tel"
                    value={signInPhone}
                    onChange={(e) => {
                      setSignInPhone(e.target.value);
                      if (errors.signInPhone) {
                        setErrors((prev) => ({ ...prev, signInPhone: '' }));
                      }
                    }}
                    placeholder="0801 234 5678"
                    autoComplete="tel"
                    autoFocus
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      border: `1px solid ${
                        errors.signInPhone ? '#DC2626' : '#E2E8F0'
                      }`,
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '14px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {errors.signInPhone ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.signInPhone}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        marginTop: '4px',
                      }}
                    >
                      Enter your 11-digit registered mobile number.
                    </div>
                  )}
                </div>

                {/* 2. Password with Show/Hide button */}
                <div>
                  <label
                    htmlFor="signin-password"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '6px',
                    }}
                  >
                    Password
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      width: '100%',
                    }}
                  >
                    <input
                      id="signin-password"
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (errors.signInPassword) {
                          setErrors((prev) => ({ ...prev, signInPassword: '' }));
                        }
                      }}
                      placeholder=""
                      style={{
                        flex: 1,
                        height: '44px',
                        backgroundColor: '#F1F5F9',
                        border: `1px solid ${
                          errors.signInPassword ? '#DC2626' : '#E2E8F0'
                        }`,
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0 14px',
                        fontSize: '14px',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        backgroundColor: '#E2E8F0',
                        border: `1px solid ${
                          errors.signInPassword ? '#DC2626' : '#E2E8F0'
                        }`,
                        borderRadius: '0 6px 6px 0',
                        padding: '0 16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                    >
                      {showSignInPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.signInPassword && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '12px',
                        marginTop: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <WarningIcon />
                      <span>{errors.signInPassword}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#0052FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 1px 2px rgba(0, 82, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0045D8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0052FF';
                  }}
                >
                  Sign In
                </button>

                {/* Toggle to Sign Up */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    Don&apos;t have an account?{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrors({});
                      setSubmitted(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0052FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
