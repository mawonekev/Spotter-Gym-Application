import React, { useState } from 'react';
import { MAX_QUESTION_LENGTH } from '../lib/constants';

interface AskInputProps {
  onAsk: (questionText: string) => void;
  isLoading?: boolean;
}

export function AskInput({ onAsk, isLoading = false }: AskInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    onAsk(trimmed);
    setQuestion('');
  };

  const remainingChars = MAX_QUESTION_LENGTH - question.length;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)',
      }}
      aria-label="Ask Spotter a question"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-container-highest)',
          border: 'var(--border-width-thin) solid var(--border-color-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-1) var(--spacing-2) var(--spacing-1) var(--spacing-3)',
          minHeight: 'var(--touch-target-min)',
          gap: 'var(--spacing-2)',
        }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the gym..."
          maxLength={MAX_QUESTION_LENGTH}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--font-size-14)',
            color: 'var(--color-on-surface)',
          }}
          aria-label="Type your question"
        />

        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          style={{
            padding: '0.9375rem 1.125rem',
            borderRadius: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: question.trim() && !isLoading
              ? 'var(--color-primary)'
              : 'var(--color-surface-container)',
            color: question.trim() && !isLoading
              ? 'var(--color-on-primary)'
              : 'var(--color-on-surface-variant)',
            border: 'none',
            cursor: question.trim() && !isLoading ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--button-font-family, var(--font-family-primary))',
            fontSize: 'var(--button-font-size, var(--font-size-14))',
            fontWeight: 'var(--button-font-weight, var(--font-weight-medium))',
            lineHeight: 'var(--button-line-height, var(--line-height-20))',
            letterSpacing: 'var(--button-letter-spacing, -0.2px)',
            transition: 'background-color var(--motion-duration-fast) var(--motion-easing-standard)',
          }}
          aria-label="Send question"
        >
          {isLoading ? '...' : 'Ask'}
        </button>
      </div>

      {question.length > 300 && (
        <span
          style={{
            fontSize: 'var(--font-size-11)',
            color: remainingChars < 20 ? 'var(--color-error)' : 'var(--color-on-surface-variant)',
            alignSelf: 'flex-end',
            paddingRight: 'var(--spacing-2)',
          }}
        >
          {remainingChars} characters left
        </span>
      )}
    </form>
  );
}
