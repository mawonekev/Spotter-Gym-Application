'use client';

import React from 'react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  helperText,
  rightElement,
  style,
  ...inputProps
}: FormFieldProps) {
  const hasError = !!error;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Label */}
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 'var(--font-size-13, 13px)',
          fontWeight: 'var(--font-weight-semi-bold, 600)',
          color: 'var(--color-on-surface, #0F172A)',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>

      {/* Input Group with optional rightElement */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <input
          id={id}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          style={{
            flex: 1,
            height: '44px',
            backgroundColor: 'var(--color-surface-container-low, #F1F5F9)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: hasError
              ? 'var(--color-error, #DC2626)'
              : 'var(--border-color-default, #E2E8F0)',
            borderRadius: rightElement ? '6px 0 0 6px' : '6px',
            borderRight: rightElement ? 'none' : undefined,
            padding: '0 14px',
            fontSize: 'var(--font-size-14, 14px)',
            color: 'var(--color-on-surface, #0F172A)',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...style,
          }}
          {...inputProps}
        />
        {rightElement}
      </div>

      {/* Error Message with Warning Icon (Accessibility: role="alert") */}
      {hasError ? (
        <div
          id={errorId}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--color-error, #DC2626)',
            fontSize: 'var(--font-size-12, 12px)',
            marginTop: '5px',
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {/* Warning Icon */}
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
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div
          id={helperId}
          style={{
            fontSize: 'var(--font-size-12, 12px)',
            color: 'var(--color-on-surface-variant, #64748B)',
            marginTop: '4px',
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
