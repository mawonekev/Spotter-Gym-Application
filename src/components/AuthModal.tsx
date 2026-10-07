'use client';

import React, { useState } from 'react';
import { COPY } from '../lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (memberName?: string) => void;
  initialMode?: 'signin' | 'signup';
  officerName?: string;
}

type ActivationStep = 'code' | 'privacy' | 'pin';

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  officerName = 'Ngozi',
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In State
  const [signInPin, setSignInPin] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);

  // Sign Up / Activation State
  const [activationStep, setActivationStep] = useState<ActivationStep>('code');
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Sign In PIN digit input
  const handleSignInDigit = (digit: string) => {
    if (signInPin.length < 4) {
      const nextPin = signInPin + digit;
      setSignInPin(nextPin);
      setSignInError(null);
      if (nextPin.length === 4) {
        submitSignIn(nextPin);
      }
    }
  };

  const handleSignInBackspace = () => {
    setSignInPin((prev) => prev.slice(0, -1));
    setSignInError(null);
  };

  const submitSignIn = async (pin: string) => {
    setIsSignInSubmitting(true);
    setSignInError(null);

    // In version one, default member Chioma Adeyemi PIN is 1234
    setTimeout(() => {
      setIsSignInSubmitting(false);
      if (pin === '1234' || pin === '4821') {
        setSuccessMessage('Signed in.');
        setTimeout(() => {
          setSignInPin('');
          setSuccessMessage(null);
          onSuccess?.('Chioma Adeyemi');
          onClose();
        }, 800);
      } else {
        setSignInError('That PIN is not correct. Try again.');
        setSignInPin('');
      }
    }, 400);
  };

  // Handle Activation Code Submit
  const handleVerifyActivationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    const cleanCode = activationCode.trim().toUpperCase();
    if (cleanCode.length !== 8) {
      setActivationError(COPY.ACTIVATION_INVALID_CODE);
      return;
    }

    // Accept valid 8-character uppercase alphanumeric code per FR-1
    if (/^[A-Z0-9]{8}$/.test(cleanCode)) {
      setActivationStep('privacy');
    } else {
      setActivationError(COPY.ACTIVATION_INVALID_CODE);
    }
  };

  // Handle Privacy Notice Acceptance
  const handleAcceptPrivacy = () => {
    if (privacyAccepted) {
      setActivationStep('pin');
    }
  };

  // Handle New PIN Input for Activation
  const handleNewPinDigit = (digit: string) => {
    if (newPin.length < 4) {
      const updated = newPin + digit;
      setNewPin(updated);
      setPinError(null);
    } else if (confirmPin.length < 4) {
      const updatedConfirm = confirmPin + digit;
      setConfirmPin(updatedConfirm);
      setPinError(null);
    }
  };

  const handleNewPinBackspace = () => {
    if (confirmPin.length > 0) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else if (newPin.length > 0) {
      setNewPin((prev) => prev.slice(0, -1));
    }
    setPinError(null);
  };

  const handleCompleteActivation = () => {
    if (newPin.length !== 4) {
      setPinError('Please enter a 4-digit PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('The two PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    setSuccessMessage('Account activated. Welcome to Spotter!');
    setTimeout(() => {
      setSuccessMessage(null);
      setActivationCode('');
      setNewPin('');
      setConfirmPin('');
      setActivationStep('code');
      onSuccess?.('Chioma Adeyemi');
      onClose();
    }, 1000);
  };

  const resetAll = () => {
    setSignInPin('');
    setSignInError(null);
    setActivationCode('');
    setActivationError(null);
    setActivationStep('code');
    setPrivacyAccepted(false);
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Member Authentication"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-index-modal)',
        padding: 'var(--spacing-4)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-6) var(--spacing-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-4)',
          boxShadow: 'var(--elevation-level4)',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Top Header & Close Button */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface-container-low)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setSuccessMessage(null);
              }}
              style={{
                border: 'none',
                backgroundColor:
                  mode === 'signin' ? 'var(--color-primary)' : 'transparent',
                color:
                  mode === 'signin'
                    ? 'var(--color-on-primary)'
                    : 'var(--color-on-surface-variant)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-12)',
                fontWeight: 'var(--font-weight-semi-bold)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setSuccessMessage(null);
              }}
              style={{
                border: 'none',
                backgroundColor:
                  mode === 'signup' ? 'var(--color-primary)' : 'transparent',
                color:
                  mode === 'signup'
                    ? 'var(--color-on-primary)'
                    : 'var(--color-on-surface-variant)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-12)',
                fontWeight: 'var(--font-weight-semi-bold)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Activate / Sign Up
            </button>
          </div>

          <button
            type="button"
            onClick={resetAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-on-surface-variant)',
              cursor: 'pointer',
              padding: 'var(--spacing-2)',
              fontSize: 'var(--font-size-14)',
              fontWeight: 'var(--font-weight-medium)',
            }}
            aria-label="Close dialog"
          >
            Cancel
          </button>
        </div>

        {/* Success Feedback Display */}
        {successMessage ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-8) 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-success-container)',
                color: 'var(--color-on-success-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              ✓
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-18)',
                fontWeight: 'var(--font-weight-semi-bold)',
                color: 'var(--color-on-surface)',
                margin: 0,
              }}
            >
              {successMessage}
            </p>
          </div>
        ) : mode === 'signin' ? (
          /* ==================== SIGN IN FLOW ==================== */
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-4)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-22)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-on-surface)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Sign In
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-14)',
                  color: 'var(--color-on-surface-variant)',
                  margin: 0,
                }}
              >
                Enter your 4-digit PIN to access your gym records.
              </p>
            </div>

            {/* 4-Digit PIN Boxes */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-3)',
                margin: 'var(--spacing-2) 0',
              }}
              aria-label="4-digit PIN entry"
            >
              {[0, 1, 2, 3].map((index) => {
                const filled = signInPin.length > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: '48px',
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${
                        filled
                          ? 'var(--color-primary)'
                          : 'var(--border-color-default)'
                      }`,
                      backgroundColor: filled
                        ? 'var(--color-primary-container)'
                        : 'var(--color-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-22)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-on-primary-container)',
                    }}
                  >
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {signInError && (
              <p
                style={{
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-12)',
                  fontWeight: 'var(--font-weight-medium)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {signInError}
              </p>
            )}

            {/* On-screen Numeric Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-2)',
                width: '100%',
                maxWidth: '280px',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isSignInSubmitting}
                  onClick={() => handleSignInDigit(digit)}
                  style={{
                    height: '52px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color-subtle)',
                    backgroundColor: 'var(--color-surface-container)',
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--font-size-22)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                disabled={isSignInSubmitting}
                onClick={() => handleSignInDigit('0')}
                style={{
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color-subtle)',
                  backgroundColor: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                  fontSize: 'var(--font-size-22)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                0
              </button>
              <button
                type="button"
                disabled={isSignInSubmitting}
                onClick={handleSignInBackspace}
                style={{
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color-subtle)',
                  backgroundColor: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                  fontSize: 'var(--font-size-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Backspace"
              >
                ⌫
              </button>
            </div>

            {/* Switch Helper */}
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-2)' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--font-size-12)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 'var(--spacing-1)',
                }}
              >
                First time or new device? Activate with your code
              </button>
            </div>
          </div>
        ) : (
          /* ==================== SIGN UP / ACTIVATION FLOW ==================== */
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-4)',
            }}
          >
            {activationStep === 'code' && (
              <form
                onSubmit={handleVerifyActivationCode}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--spacing-4)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-22)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-on-surface)',
                      margin: '0 0 var(--spacing-1) 0',
                    }}
                  >
                    {COPY.ACTIVATION_TITLE}
                  </h2>
                  <p
                    style={{
                      fontSize: 'var(--font-size-14)',
                      color: 'var(--color-on-surface-variant)',
                      margin: 0,
                    }}
                  >
                    {COPY.ACTIVATION_HELPER}
                  </p>
                </div>

                <div style={{ width: '100%', maxWidth: '320px' }}>
                  <input
                    id="activation-code-input"
                    type="text"
                    maxLength={8}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                    value={activationCode}
                    onChange={(e) => {
                      setActivationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      setActivationError(null);
                    }}
                    placeholder="e.g. SP42XK89"
                    style={{
                      width: '100%',
                      height: '54px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${
                        activationError
                          ? 'var(--color-error)'
                          : 'var(--border-color-default)'
                      }`,
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-on-surface)',
                      fontSize: 'var(--font-size-22)',
                      fontWeight: 'var(--font-weight-bold)',
                      textAlign: 'center',
                      letterSpacing: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 'var(--font-size-11)',
                      color: 'var(--color-on-surface-variant)',
                      textAlign: 'center',
                      marginTop: 'var(--spacing-1)',
                    }}
                  >
                    8 characters issued by the gym
                  </div>
                </div>

                {activationError && (
                  <p
                    style={{
                      color: 'var(--color-error)',
                      fontSize: 'var(--font-size-12)',
                      fontWeight: 'var(--font-weight-medium)',
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    {activationError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={activationCode.length !== 8}
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    height: '48px',
                    backgroundColor:
                      activationCode.length === 8
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-container-high)',
                    color:
                      activationCode.length === 8
                        ? 'var(--color-on-primary)'
                        : 'var(--color-on-surface-variant)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 'var(--font-weight-semi-bold)',
                    fontSize: 'var(--font-size-14)',
                    cursor: activationCode.length === 8 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Verify Code
                </button>

                <a
                  href={`https://wa.me/?text=Hello%20${encodeURIComponent(
                    officerName
                  )},%20I%20need%20an%20activation%20code%20for%20Spotter.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--color-primary)',
                    fontSize: 'var(--font-size-12)',
                    fontWeight: 'var(--font-weight-medium)',
                    textDecoration: 'none',
                    marginTop: 'var(--spacing-1)',
                  }}
                >
                  Message {officerName} on WhatsApp
                </a>
              </form>
            )}

            {activationStep === 'privacy' && (
              /* Privacy Notice Screen (FR-58) */
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-3)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--font-size-22)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-on-surface)',
                    margin: 0,
                  }}
                >
                  Privacy Notice
                </h2>

                <div
                  style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-4)',
                    border: '1px solid var(--border-color-subtle)',
                    fontSize: 'var(--font-size-12)',
                    lineHeight: 'var(--line-height-20)',
                    color: 'var(--color-on-surface-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>What is stored:</strong> Your check-in attendance, question logs, and payment receipts.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Who controls your data:</strong> The gym is the data controller. The software developer is a data processor acting strictly on gym instructions under the Nigeria Data Protection Act.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>How long it is kept:</strong> Attendance, question logs, and access records are kept for 24 months. Payment receipts are retained for 7 years for financial compliance.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Your rights:</strong> You may request a complete copy of your records or ask for deletion anytime by messaging the front desk on WhatsApp.
                  </p>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    fontSize: 'var(--font-size-12)',
                    color: 'var(--color-on-surface)',
                    cursor: 'pointer',
                    marginTop: 'var(--spacing-1)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>I understand and accept this privacy notice.</span>
                </label>

                <button
                  type="button"
                  disabled={!privacyAccepted}
                  onClick={handleAcceptPrivacy}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: privacyAccepted
                      ? 'var(--color-primary)'
                      : 'var(--color-surface-container-high)',
                    color: privacyAccepted
                      ? 'var(--color-on-primary)'
                      : 'var(--color-on-surface-variant)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontWeight: 'var(--font-weight-semi-bold)',
                    fontSize: 'var(--font-size-14)',
                    cursor: privacyAccepted ? 'pointer' : 'not-allowed',
                    marginTop: 'var(--spacing-2)',
                  }}
                >
                  Accept and Set PIN
                </button>
              </div>
            )}

            {activationStep === 'pin' && (
              /* Set 4-Digit PIN Screen (FR-3) */
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--spacing-4)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-22)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-on-surface)',
                      margin: '0 0 var(--spacing-1) 0',
                    }}
                  >
                    Set your 4-digit PIN
                  </h2>
                  <p
                    style={{
                      fontSize: 'var(--font-size-14)',
                      color: 'var(--color-on-surface-variant)',
                      margin: 0,
                    }}
                  >
                    {newPin.length < 4
                      ? 'Choose a 4-digit PIN to secure your account.'
                      : 'Re-enter your 4-digit PIN to confirm.'}
                  </p>
                </div>

                {/* Display Dots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    {[0, 1, 2, 3].map((idx) => {
                      const isEntered =
                        newPin.length < 4
                          ? newPin.length > idx
                          : confirmPin.length > idx;
                      return (
                        <div
                          key={idx}
                          style={{
                            width: '40px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${
                              isEntered
                                ? 'var(--color-primary)'
                                : 'var(--border-color-default)'
                            }`,
                            backgroundColor: isEntered
                              ? 'var(--color-primary-container)'
                              : 'var(--color-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-22)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-on-primary-container)',
                          }}
                        >
                          {isEntered ? '•' : ''}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 'var(--font-size-11)', color: 'var(--color-on-surface-variant)' }}>
                    {newPin.length < 4 ? 'Step 1: Choose PIN' : 'Step 2: Confirm PIN'}
                  </span>
                </div>

                {pinError && (
                  <p
                    style={{
                      color: 'var(--color-error)',
                      fontSize: 'var(--font-size-12)',
                      fontWeight: 'var(--font-weight-medium)',
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    {pinError}
                  </p>
                )}

                {/* Keypad for setting PIN */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--spacing-2)',
                    width: '100%',
                    maxWidth: '280px',
                  }}
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleNewPinDigit(digit)}
                      style={{
                        height: '50px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color-subtle)',
                        backgroundColor: 'var(--color-surface-container)',
                        color: 'var(--color-on-surface)',
                        fontSize: 'var(--font-size-22)',
                        fontWeight: 'var(--font-weight-medium)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {digit}
                    </button>
                  ))}
                  <div />
                  <button
                    type="button"
                    onClick={() => handleNewPinDigit('0')}
                    style={{
                      height: '50px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color-subtle)',
                      backgroundColor: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      fontSize: 'var(--font-size-22)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleNewPinBackspace}
                    style={{
                      height: '50px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color-subtle)',
                      backgroundColor: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      fontSize: 'var(--font-size-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Backspace"
                  >
                    ⌫
                  </button>
                </div>

                {newPin.length === 4 && confirmPin.length === 4 && (
                  <button
                    type="button"
                    onClick={handleCompleteActivation}
                    style={{
                      width: '100%',
                      maxWidth: '280px',
                      height: '48px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-on-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      fontWeight: 'var(--font-weight-semi-bold)',
                      fontSize: 'var(--font-size-14)',
                      cursor: 'pointer',
                    }}
                  >
                    Save PIN & Complete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
