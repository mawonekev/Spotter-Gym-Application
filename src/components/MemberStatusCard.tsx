import React from 'react';
import { MemberStatusSummary } from '../lib/types';
import { COPY, formatKoboToNaira } from '../lib/constants';

interface MemberStatusCardProps {
  status: MemberStatusSummary;
  onRefreshBalance?: () => void;
  onOpenCheckIn?: () => void;
}

export function MemberStatusCard({
  status,
  onRefreshBalance,
  onOpenCheckIn,
}: MemberStatusCardProps) {
  const isZeroDays = status.daysTrainedThisMonth === 0;
  const daysCounterText = isZeroDays
    ? '0 days this month'
    : `${status.daysTrainedThisMonth} days this month`;

  const nairaAmount = formatKoboToNaira(status.canonicalBalanceKobo);

  return (
    <section
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-4)',
        border: 'var(--border-width-thin) solid var(--border-color-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)',
      }}
      aria-label="Member status summary"
    >
      {/* Top Header: Member Name and Effective Tier */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 'var(--font-size-14)',
              color: 'var(--color-on-surface-variant)',
              lineHeight: 'var(--line-height-20)',
            }}
          >
            Welcome back,
          </span>
          <h2
            style={{
              fontSize: 'var(--font-size-22)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-on-surface)',
              lineHeight: 'var(--line-height-28)',
            }}
          >
            {status.firstName} {status.lastName}
          </h2>
        </div>

        {/* Effective Tier Badge */}
        <span
          style={{
            padding: 'var(--spacing-1) var(--spacing-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-12)',
            fontWeight: 'var(--font-weight-semi-bold)',
            backgroundColor:
              status.effectiveTier === 'PREMIUM'
                ? 'var(--color-primary-container)'
                : 'var(--color-secondary-container)',
            color:
              status.effectiveTier === 'PREMIUM'
                ? 'var(--color-on-primary-container)'
                : 'var(--color-on-secondary-container)',
            letterSpacing: 'var(--letter-spacing-wide)',
            textTransform: 'uppercase',
          }}
        >
          {status.effectiveTier}
        </span>
      </div>

      {/* Main Habit Metric: Attendance Counter */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          border: 'var(--border-width-thin) solid var(--border-color-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-size-12)',
              color: 'var(--color-on-surface-variant)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            Attendance
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-28)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              lineHeight: 'var(--line-height-32)',
            }}
          >
            {daysCounterText}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-size-11)',
              color: 'var(--color-on-surface-variant)',
              marginTop: 'var(--spacing-1)',
            }}
          >
            Expires {status.expiryDate}
          </span>
        </div>

        {onOpenCheckIn && (
          <button
            type="button"
            id="attendance-checkin-btn"
            onClick={onOpenCheckIn}
            style={{
              backgroundColor: 'var(--color-primary-container)',
              color: 'var(--color-on-primary-container)',
              border: 'none',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-14)',
              fontWeight: 'var(--font-weight-semi-bold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: 'var(--elevation-level1)',
            }}
            aria-label="Check In"
          >
            Check In
          </button>
        )}
      </div>

      {/* Balance Statement with strict FR-8b framing */}
      <div
        style={{
          fontSize: 'var(--font-size-12)',
          lineHeight: 'var(--line-height-16)',
          color: 'var(--color-on-surface-variant)',
          paddingTop: 'var(--spacing-1)',
        }}
      >
        {status.isBalanceStale ? (
          <button
            type="button"
            onClick={onRefreshBalance}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-primary)',
              fontWeight: 'var(--font-weight-medium)',
              textDecoration: 'underline',
              fontSize: 'inherit',
            }}
          >
            {COPY.STALE_CACHED_BALANCE}
          </button>
        ) : (
          <span>
            {status.canonicalBalanceKobo > 0
              ? `Our records show ${nairaAmount} naira outstanding for July. `
              : 'Our records show no outstanding balance. '}
            Correct as of {status.balanceCorrectAsOfDate}, based on payments recorded here.
          </span>
        )}
      </div>
    </section>
  );
}
