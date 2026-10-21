import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionMember } from '@/server/auth/session';

export const metadata: Metadata = {
  title: 'Spotter | Your personal gym records',
  description: 'Your personal gym records grounded exclusively in official records.',
  keywords: [
    'gym member app',
    'gym attendance check in',
    'gym records',
    'membership renewal',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const member = await getSessionMember(cookies().toString());

  if (member) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      {/* max-w-2xl matches the width of the content below (cards, banner, headings) so Get Started aligns with the right edge */}
      <header className="max-w-2xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded font-bold">
            S
          </div>
          <span className="text-indigo-600 font-bold text-xl">Spotter</span>
        </div>

        <Link
          href="/auth?view=signup"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition inline-block"
        >
          Get Started
        </Link>
      </header>

      {/* MAIN CONTENT */}
      {/* Use the exact same max-w-2xl and mx-auto here so the left and right edges line up perfectly */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 max-w-2xl leading-tight">
          Your Personal Gym Records, Instant Access
        </h1>
        <p className="text-slate-600 mb-8 max-w-md">
          Your personal gym records grounded exclusively in official records. Check in daily, view your attendance and balance, and pay renewals seamlessly.
        </p>

        {/* Yellow Banner */}
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl">
          <div className="flex items-start gap-3">
            <span className="text-yellow-800 text-xl font-bold" aria-hidden="true">
              ⚠️
            </span>
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                Email Verification Notice
              </h4>
              <p className="text-xs text-yellow-800 leading-relaxed">
                Check your inbox for your 6-digit verification code to complete your member profile activation.
              </p>
            </div>
          </div>
        </div>

        {/* Member Portal Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-2xl">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Member Portal
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Your records, your membership
          </h3>
          <p className="text-sm text-slate-600 mt-2 mb-5">
            Sign in to check in, view your own attendance and balance, and pay renewals securely.
          </p>

          <div className="flex justify-center items-center pt-2">
            <Link
              href="/auth?view=signin"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
