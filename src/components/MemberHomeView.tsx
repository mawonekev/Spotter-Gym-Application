'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MemberStatusSummary, SuggestedQuestion, AskQuestionResponse } from '@/lib/types';
import { DEFAULT_SUGGESTED_QUESTIONS, COPY } from '@/lib/constants';
import { MemberStatusCard } from '@/components/MemberStatusCard';
import { SuggestedQuestions } from '@/components/SuggestedQuestions';
import { AskInput } from '@/components/AskInput';
import { CheckInModal } from '@/components/CheckInModal';
import { DeskHandoff } from '@/components/DeskHandoff';

/**
 * Initial offline-cached status for Chioma Adeyemi per PRD persona & FR-8.
 * Renders immediately with zero network delay on warm open.
 */
const INITIAL_CACHED_STATUS: MemberStatusSummary = {
  memberId: 'mem_chioma_001',
  memberNumber: 'SP-042',
  firstName: 'Chioma',
  lastName: 'Adeyemi',
  effectiveTier: 'BASIC',
  effectiveStatus: 'ACTIVE',
  expiryDate: '28 Oct 2026',
  daysTrainedThisMonth: 10,
  canonicalBalanceKobo: 0,
  balanceCorrectAsOfDate: '5 Oct 2026',
  isBalanceStale: false,
};

export function MemberHomeView() {
  const [status, setStatus] = useState<MemberStatusSummary>(INITIAL_CACHED_STATUS);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<AskQuestionResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [officerOnDuty] = useState('Ngozi');

  // Dynamically update document title based on the active view
  useEffect(() => {
    if (isCheckInOpen) {
      document.title = 'Check In | Spotter';
    } else if (activeAnswer) {
      document.title = 'Record Answer | Spotter';
    } else {
      document.title = 'Spotter | Your personal gym records';
    }
  }, [isCheckInOpen, activeAnswer]);

  const handleAskQuestion = async (questionText: string) => {
    setIsAsking(true);
    setActiveAnswer(null);

    // Simulated grounding response adhering to PRD FR-11 and copy rules
    setTimeout(() => {
      setIsAsking(false);
      setActiveAnswer({
        answerText:
          'Saturday classes run from 08:00 to 10:00 for group aerobics and strength circuits.',
        outcome: 'ANSWERED_SHARED',
        sourceCardBody:
          'Weekend Timetable: Saturday classes run from 08:00 to 10:00 for group aerobics and strength circuits. Open gym continues until 18:00.',
        lastConfirmedDate: '1 Oct 2026',
        handoffOfficerName: officerOnDuty,
      });
    }, 600);
  };

  const handleSelectSuggestedQuestion = (q: SuggestedQuestion) => {
    handleAskQuestion(q.text);
  };

  const handleCheckInSubmit = async (code: string) => {
    // 4-digit daily code verification simulation
    if (code === '4821') {
      setStatus((prev) => ({
        ...prev,
        daysTrainedThisMonth: prev.daysTrainedThisMonth + 1,
      }));
      return { success: true, message: COPY.CHECK_IN_SUCCESS };
    }
    return { success: false, message: COPY.CHECK_IN_WRONG_CODE };
  };

  const handleRefreshBalance = () => {
    setStatus((prev) => ({
      ...prev,
      isBalanceStale: false,
      balanceCorrectAsOfDate: '5 Oct 2026',
    }));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: 'var(--color-surface)',
        position: 'relative',
      }}
    >
      {/* 1. Header: Continuous with Hero (same background, no bottom border, no separate background) */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-4) var(--spacing-6)',
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Left branding: Blue square containing letter 'S' logo + brand text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            aria-hidden="true"
            style={{ borderRadius: '6px', flexShrink: 0 }}
          >
            <rect width="32" height="32" rx="6" fill="var(--color-primary, #4F46E5)" />
            <text
              x="16"
              y="23"
              fontFamily="var(--font-family-primary, sans-serif)"
              fontWeight="700"
              fontSize="20"
              fill="var(--color-on-primary, #FFFFFF)"
              textAnchor="middle"
            >
              S
            </text>
          </svg>
          <span
            style={{
              fontSize: 'var(--font-size-22)',
              fontWeight: 'var(--font-weight-bold)',
              letterSpacing: 'var(--letter-spacing-tight)',
              color: 'var(--color-primary)',
            }}
          >
            Spotter
          </span>
        </div>

        {/* Right action: Single 'Get Started' link pointing to /auth?view=signup */}
        <Link
          id="header-get-started-btn"
          href="/auth?view=signup"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            padding: '0.9375rem 1.125rem',
            borderRadius: '0.5rem',
            fontFamily: 'var(--button-font-family, var(--font-family-primary))',
            fontSize: 'var(--button-font-size, var(--font-size-14))',
            fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
            lineHeight: 'var(--button-line-height, var(--line-height-20))',
            letterSpacing: 'var(--button-letter-spacing, -0.2px)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--elevation-level1)',
          }}
          aria-label="Get Started"
        >
          Get Started
        </Link>
      </header>

      {/* 2. Hero Section: Visually continuous with Header */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: 'var(--spacing-6) var(--spacing-6) var(--spacing-8)',
          backgroundColor: 'transparent',
          width: '100%',
          boxSizing: 'border-box',
        }}
        aria-label="Hero"
      >
        {/* Hero display heading: Display Large, Medium weight, responsive clamp(), reduced line-height 1.1 */}
        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw + 1rem, 3.5625rem)',
            fontWeight: 'var(--font-weight-medium)',
            lineHeight: 1.1,
            letterSpacing: 'var(--letter-spacing-tight)',
            color: 'var(--color-on-surface)',
            maxWidth: '18ch',
            margin: 0,
          }}
        >
          Your Personal Gym Records,{' '}
          <span style={{ display: 'inline-block' }}>Instant Access</span>
        </h1>

        {/* Hero description: Balanced max-width, readable text block without arbitrary <br> */}
        <p
          style={{
            fontSize: 'var(--font-size-16)',
            lineHeight: 'var(--line-height-24)',
            color: 'var(--color-on-surface-variant)',
            maxWidth: '48ch',
            margin: 'var(--spacing-3) 0 0 0',
          }}
        >
          Your personal gym records grounded exclusively in official records. Check in daily, view your attendance and balance, and pay renewals seamlessly.
        </p>

        {/* Spacing between description and CTA: Exactly 1rem */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center' }}>
          {/* Exactly one primary CTA: 'Get Started for Free' pointing to /auth?view=signup */}
          <Link
            id="hero-get-started-cta"
            href="/auth?view=signup"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              padding: '0.9375rem 1.125rem',
              borderRadius: '0.5rem',
              fontFamily: 'var(--button-font-family, var(--font-family-primary))',
              fontSize: 'var(--button-font-size, var(--font-size-14))',
              fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
              lineHeight: 'var(--button-line-height, var(--line-height-20))',
              letterSpacing: 'var(--button-letter-spacing, -0.2px)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--elevation-level2)',
            }}
            aria-label="Get Started for Free"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* 3. Main Member Interactive Content Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
          padding: '0 var(--spacing-6) var(--spacing-8)',
          width: '100%',
          maxWidth: 'var(--layout-content-reading-width, 720px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Member Status Card */}
        <MemberStatusCard
          status={status}
          onRefreshBalance={handleRefreshBalance}
          onOpenCheckIn={() => setIsCheckInOpen(true)}
        />

        {/* Active Answer Display (if question was asked) */}
        {activeAnswer && (
          <div
            style={{
              backgroundColor: 'var(--color-surface-container)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              border: 'var(--border-width-thin) solid var(--border-color-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-12)',
                  fontWeight: 'var(--font-weight-semi-bold)',
                  color: 'var(--color-primary)',
                }}
              >
                Record Answer
              </span>
              <button
                type="button"
                onClick={() => setActiveAnswer(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-on-surface-variant)',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>

            <p
              style={{
                fontSize: 'var(--font-size-14)',
                lineHeight: 'var(--line-height-20)',
                color: 'var(--color-on-surface)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {activeAnswer.answerText}
            </p>

            {/* FR-12: Source card and confirmation date */}
            {activeAnswer.sourceCardBody && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-width-thin) solid var(--border-color-subtle)',
                  fontSize: 'var(--font-size-12)',
                  color: 'var(--color-on-surface-variant)',
                  lineHeight: 'var(--line-height-16)',
                }}
              >
                <div style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-1)' }}>
                  Source Record (confirmed {activeAnswer.lastConfirmedDate}):
                </div>
                {activeAnswer.sourceCardBody}
              </div>
            )}
          </div>
        )}

        {/* 8 Tappable Suggested Questions (FR-9) */}
        <SuggestedQuestions
          questions={DEFAULT_SUGGESTED_QUESTIONS}
          onSelectQuestion={handleSelectSuggestedQuestion}
          disabled={isAsking}
        />

        {/* Free-typing question input box */}
        <AskInput onAsk={handleAskQuestion} isLoading={isAsking} />

        {/* Ask the Desk WhatsApp fallback */}
        <DeskHandoff officerName={officerOnDuty} />
      </div>

      {/* Check In Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckIn={handleCheckInSubmit}
      />
    </div>
  );
}
