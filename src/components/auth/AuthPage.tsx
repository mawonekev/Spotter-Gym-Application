'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export type AuthView = 'signin' | 'signup' | 'forgot-password';

export function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial view from query param (?view=signup), defaulting to 'signin'
  const paramView = searchParams.get('view');
  const initialView: AuthView =
    paramView === 'signup' || paramView === 'forgot-password' || paramView === 'signin'
      ? paramView
      : 'signin';

  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync if query param changes externally
  useEffect(() => {
    if (paramView === 'signup' || paramView === 'forgot-password' || paramView === 'signin') {
      setCurrentView(paramView);
    }
  }, [paramView]);

  // Handle switching view without full route change
  const handleSwitchView = (nextView: AuthView) => {
    setCurrentView(nextView);
    // Optional: update URL query string without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', nextView);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleAuthSuccess = (name?: string) => {
    setSuccessNotice(
      currentView === 'signup'
        ? `Welcome to Spotter, ${name?.split(' ')[0] || 'Member'}!`
        : 'Signed in successfully.'
    );
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const titles: Record<AuthView, { title: string; subtitle: string }> = {
    signin: {
      title: 'Sign In',
      subtitle: 'Enter your mobile number and password to access your personal Spotter portal.',
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Link your gym card to activate your personal Spotter portal.',
    },
    'forgot-password': {
      title: 'Reset Password',
      subtitle: 'Enter your registered details to recover access to your Spotter portal.',
    },
  };

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
      {/* Top Header Navigation per screenshot */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '0 4px',
          boxSizing: 'border-box',
        }}
      >
        <Link
          href="/"
          style={{
            color: 'var(--color-on-surface, #1E293B)',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">&larr;</span> Back to Spotter
        </Link>

        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-on-surface-variant, #64748B)',
            fontWeight: 400,
          }}
        >
          Official Member App
        </span>
      </div>

      {/* Main Centered Form Card per screenshot */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--color-surface, #FFFFFF)',
          borderRadius: '8px',
          padding: '32px 32px 36px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          border: '1px solid var(--border-color-default, #E2E8F0)',
        }}
      >
        {successNotice ? (
          <div
            role="status"
            aria-live="polite"
            tabIndex={-1}
            style={{
              textAlign: 'center',
              padding: '36px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              outline: 'none',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-container, #DCFCE7)',
                color: 'var(--color-on-success-container, #16A34A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-on-surface, #0F172A)',
                margin: 0,
              }}
            >
              {successNotice}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-on-surface-variant, #64748B)',
                margin: 0,
              }}
            >
              Redirecting to your gym portal...
            </p>
          </div>
        ) : (
          <div>
            {/* Blue Brand Badge */}
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  backgroundColor: 'var(--color-primary, #0052FF)',
                  color: 'var(--color-on-primary, #FFFFFF)',
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

            {/* Title & Subtitle */}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--color-on-surface, #0F172A)',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
                lineHeight: '1.2',
              }}
            >
              {titles[currentView].title}
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-on-surface-variant, #64748B)',
                margin: '0 0 20px 0',
                lineHeight: '1.45',
              }}
            >
              {titles[currentView].subtitle}
            </p>

            {/* Conditional Rendering of the Active View */}
            {currentView === 'signup' && (
              <SignUpForm
                onSuccess={(name, phone) => handleAuthSuccess(name)}
                onSwitchView={handleSwitchView}
              />
            )}

            {currentView === 'signin' && (
              <SignInForm
                onSuccess={(phone) => handleAuthSuccess()}
                onSwitchView={handleSwitchView}
              />
            )}

            {currentView === 'forgot-password' && (
              <ForgotPasswordForm
                onSuccess={() => {}}
                onSwitchView={handleSwitchView}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
