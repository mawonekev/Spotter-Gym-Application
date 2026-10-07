import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth/AuthPage';

export const metadata: Metadata = {
  title: 'Authentication | Spotter',
  description: 'Sign in or create your Spotter gym member account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense
      fallback={
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
          Loading portal...
        </div>
      }
    >
      <AuthPage />
    </Suspense>
  );
}
