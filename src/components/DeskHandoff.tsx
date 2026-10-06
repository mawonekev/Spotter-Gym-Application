import React from 'react';
import { COPY } from '../lib/constants';

interface DeskHandoffProps {
  officerName: string;
  questionText?: string;
  phoneNumber?: string;
}

export function DeskHandoff({
  officerName,
  questionText = '',
  phoneNumber = '2348000000000',
}: DeskHandoffProps) {
  const encodedText = encodeURIComponent(
    questionText
      ? `Hello ${officerName}, I have a question from Spotter: "${questionText}"`
      : `Hello ${officerName}, I need help at the front desk.`
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)',
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.9375rem 1.125rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--color-secondary-container)',
          color: 'var(--color-on-secondary-container)',
          fontFamily: 'var(--button-font-family, var(--font-family-primary))',
          fontSize: 'var(--button-font-size, var(--font-size-14))',
          fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
          lineHeight: 'var(--button-line-height, var(--line-height-20))',
          letterSpacing: 'var(--button-letter-spacing, -0.2px)',
          border: 'var(--border-width-thin) solid var(--border-color-subtle)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'opacity var(--motion-duration-fast) var(--motion-easing-standard)',
        }}
      >
        {COPY.HANDOFF_BUTTON(officerName)}
      </a>
      <span
        style={{
          fontSize: 'var(--font-size-11)',
          color: 'var(--color-on-surface-variant)',
          textAlign: 'center',
        }}
      >
        Opens WhatsApp with your question pre-typed
      </span>
    </div>
  );
}
