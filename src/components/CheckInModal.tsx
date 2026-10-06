import React, { useState } from 'react';
import { COPY } from '../lib/constants';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (code: string) => Promise<{ success: boolean; message: string }>;
  isBlockedPastGrace?: boolean;
}

export function CheckInModal({
  isOpen,
  onClose,
  onCheckIn,
  isBlockedPastGrace = false,
}: CheckInModalProps) {
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (code.length < 4) {
      const nextCode = code + digit;
      setCode(nextCode);
      if (nextCode.length === 4) {
        submitCheckIn(nextCode);
      }
    }
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
    setStatusMessage(null);
  };

  const submitCheckIn = async (fullCode: string) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await onCheckIn(fullCode);
      setStatusMessage(res.message);
      if (res.success) {
        setTimeout(() => {
          setCode('');
          setStatusMessage(null);
          onClose();
        }, 1200);
      }
    } catch {
      setStatusMessage(COPY.DB_ERROR_PRIVATE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gym Check In"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'var(--color-scrim)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 'var(--z-index-modal)',
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-6) var(--spacing-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-4)',
          boxShadow: 'var(--elevation-level4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-22)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-on-surface)',
            }}
          >
            Check In
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-on-surface-variant)',
              cursor: 'pointer',
              padding: '0.9375rem 1.125rem',
              borderRadius: '0.5rem',
              fontFamily: 'var(--button-font-family, var(--font-family-primary))',
              fontSize: 'var(--button-font-size, var(--font-size-14))',
              fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
              lineHeight: 'var(--button-line-height, var(--line-height-20))',
              letterSpacing: 'var(--button-letter-spacing, -0.2px)',
            }}
            aria-label="Close check-in"
          >
            Cancel
          </button>
        </div>

        {isBlockedPastGrace ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-4) 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-3)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-16)',
                color: 'var(--color-error)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {COPY.CHECK_IN_BLOCKED_PAST_GRACE}
            </p>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: 'var(--font-size-14)',
                color: 'var(--color-on-surface-variant)',
                textAlign: 'center',
              }}
            >
              Type today&apos;s 4-digit code written on the desk board.
            </p>

            {/* 4 Digit Slots Display */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-3)',
                margin: 'var(--spacing-2) 0',
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    width: '48px',
                    height: '56px',
                    border: 'var(--border-width-medium) solid',
                    borderColor:
                      code.length === idx
                        ? 'var(--color-primary)'
                        : 'var(--border-color-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-28)',
                    fontWeight: 'var(--font-weight-bold)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  {code[idx] || ''}
                </div>
              ))}
            </div>

            {/* Status Feedback */}
            {statusMessage && (
              <p
                style={{
                  fontSize: 'var(--font-size-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  color:
                    statusMessage === COPY.CHECK_IN_SUCCESS
                      ? 'var(--color-success)'
                      : 'var(--color-error)',
                  textAlign: 'center',
                }}
              >
                {statusMessage}
              </p>
            )}

            {/* Numeric Keypad for fast in-person typing */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-2)',
                width: '100%',
                maxWidth: '280px',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((val, i) => {
                if (val === '') {
                  return <div key={i} />;
                }
                const isDel = val === 'DEL';
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => (isDel ? handleBackspace() : handleDigit(val))}
                    style={{
                      padding: '0.9375rem 1.125rem',
                      borderRadius: '0.5rem',
                      border: 'var(--border-width-thin) solid var(--border-color-subtle)',
                      backgroundColor: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      fontFamily: 'var(--button-font-family, var(--font-family-primary))',
                      fontSize: 'var(--button-font-size, var(--font-size-14))',
                      fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
                      lineHeight: 'var(--button-line-height, var(--line-height-20))',
                      letterSpacing: 'var(--button-letter-spacing, -0.2px)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition:
                        'background-color var(--motion-duration-fast) var(--motion-easing-standard)',
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
