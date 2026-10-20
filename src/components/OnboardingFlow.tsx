'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface OnboardingFlowProps {
  onComplete?: () => void;
  initialStep?: number;
}

export function OnboardingFlow({ onComplete, initialStep = 1 }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [memberName, setMemberName] = useState<string>('Member');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('spotter_user_name');
      if (storedName) {
        setMemberName(storedName.split(' ')[0] || 'Member');
      }

      // Check if onboarding is pending for a new signup
      const isPending =
        sessionStorage.getItem('spotter_onboarding_pending') === 'true' ||
        localStorage.getItem('spotter_onboarding_pending') === 'true';

      if (!isPending) {
        // Existing user or unauthorized direct navigation: take them directly to their dashboard
        setIsAuthorized(false);
        router.replace('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('spotter_onboarding_pending');
      localStorage.removeItem('spotter_onboarding_pending');
      localStorage.setItem('spotter_onboarding_completed', 'true');
    }
    if (onComplete) {
      onComplete();
    } else {
      router.push('/');
    }
  };

  if (isAuthorized === false) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface, #FFFFFF)',
          color: 'var(--color-on-surface-variant, #64748B)',
          fontSize: '14px',
        }}
      >
        Redirecting to dashboard...
      </div>
    );
  }

  // Steps definition for platform education
  const steps = [
    {
      step: 1,
      badge: 'STEP 1 OF 4',
      pillTitle: 'Member Portal',
      title: 'Your Member Records in One Place',
      subtitle: `Welcome, ${memberName}. Spotter provides immediate access to your gym membership records and attendance.`,
      visual: (
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #F8FAFC)',
            border: '1px solid var(--border-color-default, #E2E8F0)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: 'var(--color-primary, #0052FF)',
                  textTransform: 'uppercase',
                }}
              >
                OFFICIAL MEMBER CARD
              </span>
              <h3
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-on-surface, #0F172A)',
                }}
              >
                {memberName} Adeyemi
              </h3>
            </div>
            <span
              style={{
                backgroundColor: 'var(--color-success-container, #DCFCE7)',
                color: 'var(--color-on-success-container, #16A34A)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              ACTIVE
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface, #FFFFFF)',
                border: '1px solid var(--border-color-subtle, #F1F5F9)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-on-surface-variant, #64748B)',
                  fontWeight: 500,
                }}
              >
                Attendance
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-on-surface, #0F172A)',
                  marginTop: '4px',
                }}
              >
                0 days this month
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface, #FFFFFF)',
                border: '1px solid var(--border-color-subtle, #F1F5F9)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-on-surface-variant, #64748B)',
                  fontWeight: 500,
                }}
              >
                Membership Tier
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-primary, #0052FF)',
                  marginTop: '4px',
                }}
              >
                BASIC TIER
              </div>
            </div>
          </div>
        </div>
      ),
      points: [
        {
          title: 'Private records by Member ID',
          desc: 'Your profile, tier, and renewal date are securely fetched and always up to date.',
        },
        {
          title: 'Track your training habit',
          desc: 'Every completed workout increments your monthly attendance counter automatically.',
        },
      ],
    },
    {
      step: 2,
      badge: 'STEP 2 OF 4',
      pillTitle: 'Daily Check-In',
      title: 'Self-Service Daily Check-In',
      subtitle: 'Check in quickly each day using the four digit code posted at the front desk.',
      visual: (
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #F8FAFC)',
            border: '1px solid var(--border-color-default, #E2E8F0)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant, #64748B)',
              marginBottom: '12px',
            }}
          >
            Today&#39;s Code on Front Desk Board
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            {['4', '8', '2', '9'].map((digit, i) => (
              <div
                key={i}
                style={{
                  width: '44px',
                  height: '48px',
                  borderRadius: '8px',
                  border: '2px solid var(--color-primary, #0052FF)',
                  backgroundColor: 'var(--color-surface, #FFFFFF)',
                  color: 'var(--color-primary, #0052FF)',
                  fontSize: '22px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 82, 255, 0.08)',
                }}
              >
                {digit}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--color-success-container, #DCFCE7)',
              color: 'var(--color-on-success-container, #16A34A)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>✓</span> Checked in.
          </div>
        </div>
      ),
      points: [
        {
          title: 'Daily rotating code',
          desc: 'The front desk officer posts a new 4-digit code each morning on the reception board.',
        },
        {
          title: 'One check-in per day',
          desc: 'Check in directly on your phone while inside the gym during operating hours.',
        },
      ],
    },
    {
      step: 3,
      badge: 'STEP 3 OF 4',
      pillTitle: 'Grounded Answers',
      title: 'Instant Answers from Gym Records',
      subtitle: 'Ask about opening hours, class timetables, prices, and rules with full accuracy.',
      visual: (
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #F8FAFC)',
            border: '1px solid var(--border-color-default, #E2E8F0)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--border-color-subtle, #F1F5F9)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--color-on-surface, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>What time is the Saturday class?</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-primary, #0052FF)',
                fontWeight: 600,
              }}
            >
              Asked
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              borderLeft: '3px solid var(--color-primary, #0052FF)',
              borderRadius: '6px',
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-on-surface-variant, #64748B)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              Source: Weekend Timetable (Approved Card)
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--color-on-surface, #0F172A)',
                lineHeight: '1.4',
              }}
            >
              Saturday classes run from 08:00 to 10:00 for group aerobics and strength circuits.
            </div>
          </div>
        </div>
      ),
      points: [
        {
          title: 'Strictly grounded knowledge',
          desc: 'Spotter answers exclusively from cards approved by the gym owner. No hallucinated figures.',
        },
        {
          title: 'Clear refusal when unknown',
          desc: 'If records hold no answer, Spotter lets you know cleanly instead of guessing.',
        },
      ],
    },
    {
      step: 4,
      badge: 'STEP 4 OF 4',
      pillTitle: 'Desk Support',
      title: 'Human Support with Front Desk Handoff',
      subtitle: 'Spotter names the officer on duty and connects you directly to WhatsApp when needed.',
      visual: (
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-low, #F8FAFC)',
            border: '1px solid var(--border-color-default, #E2E8F0)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-container, #E0E7FF)',
              color: 'var(--color-primary, #0052FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-on-surface, #0F172A)',
              }}
            >
              Ngozi
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-on-surface-variant, #64748B)',
              }}
            >
              Front Desk Officer on Duty
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💬</span> Send this to Ngozi
          </div>
        </div>
      ),
      points: [
        {
          title: 'Injury and medical queries',
          desc: 'For health or injury questions, Spotter directs you immediately to speak with your doctor or desk staff.',
        },
        {
          title: 'Pre-filled WhatsApp messages',
          desc: 'Unanswered questions open WhatsApp with your question pre-typed to the on-duty officer.',
        },
      ],
    },
  ];

  const activeStep = steps[currentStep - 1];

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Navigation */}
      <header
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '0 4px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: 'var(--color-primary, #0052FF)',
              color: 'var(--color-on-primary, #FFFFFF)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.2px',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              textTransform: 'uppercase',
            }}
          >
            SPOTTER
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-on-surface, #0F172A)',
            }}
          >
            Member Onboarding
          </span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          id="onboarding-skip-button"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-on-surface-variant, #64748B)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'color 0.2s',
          }}
        >
          Skip to Dashboard &rarr;
        </button>
      </header>

      {/* Main Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--color-surface, #FFFFFF)',
          borderRadius: '12px',
          padding: '32px 28px',
          boxSizing: 'border-box',
          boxShadow:
            '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 8px -1px rgba(15, 23, 42, 0.04)',
          border: '1px solid var(--border-color-default, #E2E8F0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Progress Bar and Indicator */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              id="onboarding-step-indicator"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--color-primary, #0052FF)',
                textTransform: 'uppercase',
              }}
            >
              {activeStep.badge}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--color-on-surface-variant, #64748B)',
                fontWeight: 500,
              }}
            >
              {activeStep.pillTitle}
            </span>
          </div>

          {/* Segmented 4-Step Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-label={`Step ${currentStep} of 4: ${activeStep.title}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              width: '100%',
              height: '6px',
            }}
          >
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                style={{
                  height: '100%',
                  borderRadius: '3px',
                  backgroundColor:
                    stepNumber <= currentStep
                      ? 'var(--color-primary, #0052FF)'
                      : 'var(--color-surface-container, #E2E8F0)',
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Title & Subtitle */}
        <div>
          <h1
            id="onboarding-step-title"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-on-surface, #0F172A)',
              margin: '0 0 8px 0',
              lineHeight: '1.25',
              letterSpacing: '-0.3px',
            }}
          >
            {activeStep.title}
          </h1>
          <p
            id="onboarding-step-subtitle"
            style={{
              fontSize: '14px',
              color: 'var(--color-on-surface-variant, #475569)',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            {activeStep.subtitle}
          </p>
        </div>

        {/* Visual Preview for Active Step */}
        <div id="onboarding-visual-container">{activeStep.visual}</div>

        {/* Key Feature Takeaways */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {activeStep.points.map((point, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-container, #EEF2FF)',
                  color: 'var(--color-primary, #0052FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                ✓
              </div>
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--color-on-surface, #0F172A)',
                  }}
                >
                  {point.title}
                </strong>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--color-on-surface-variant, #64748B)',
                    lineHeight: '1.4',
                    marginTop: '2px',
                  }}
                >
                  {point.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color-subtle, #F1F5F9)',
            gap: '12px',
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              id="onboarding-back-button"
              onClick={handleBack}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-on-surface, #1E293B)',
                border: '1px solid var(--border-color-default, #CBD5E1)',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              &larr; Previous
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            id="onboarding-next-button"
            onClick={handleNext}
            style={{
              backgroundColor: 'var(--color-primary, #0052FF)',
              color: 'var(--color-on-primary, #FFFFFF)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0, 82, 255, 0.2)',
              marginLeft: 'auto',
            }}
          >
            {currentStep === 4 ? (
              <>Go to Dashboard &rarr;</>
            ) : (
              <>Next Step &rarr;</>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
