import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { OnboardingFlow } from '@/components/OnboardingFlow';

export const metadata: Metadata = {
  title: 'Member Onboarding | Spotter',
  description: 'Learn how to use your Spotter gym member portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
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
          Loading onboarding tour...
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
