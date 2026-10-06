import React from 'react';
import { SuggestedQuestion } from '../lib/types';

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[];
  onSelectQuestion: (question: SuggestedQuestion) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({
  questions,
  onSelectQuestion,
  disabled = false,
}: SuggestedQuestionsProps) {
  return (
    <section
      aria-label="Frequently asked questions"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-14)',
            fontWeight: 'var(--font-weight-semi-bold)',
            color: 'var(--color-on-surface-variant)',
            letterSpacing: 'var(--letter-spacing-wide)',
            textTransform: 'uppercase',
          }}
        >
          Common Questions
        </h3>
        <span
          style={{
            fontSize: 'var(--font-size-12)',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          Tap to ask
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--spacing-2)',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: 'var(--spacing-1)',
        }}
      >
        {questions.map((q) => (
          <button
            key={q.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'left',
              padding: '0.9375rem 1.125rem',
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
              border: 'var(--border-width-thin) solid var(--border-color-subtle)',
              borderRadius: '0.5rem',
              fontFamily: 'var(--button-font-family, var(--font-family-primary))',
              fontSize: 'var(--button-font-size, var(--font-size-14))',
              lineHeight: 'var(--button-line-height, var(--line-height-20))',
              fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
              letterSpacing: 'var(--button-letter-spacing, -0.2px)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 'var(--state-disabled-opacity)' : 'var(--state-default-opacity)',
              transition:
                'background-color var(--motion-duration-fast) var(--motion-easing-standard)',
            }}
          >
            {q.text}
          </button>
        ))}
      </div>
    </section>
  );
}
