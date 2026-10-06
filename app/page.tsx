import type { Metadata } from 'next';
import { MemberHomeView } from '@/components/MemberHomeView';

/**
 * SEO metadata configured specifically for the marketing/home page.
 * Private member views inherit noindex from app/layout.tsx.
 */
export const metadata: Metadata = {
  title: 'Spotter | Your personal gym records',
  description: 'Your personal gym records',
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
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Spotter | Your personal gym records',
    description: 'Your personal gym records',
    url: 'https://spotter.gym',
    siteName: 'Spotter',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Spotter | Your personal gym records',
    description: 'Your personal gym records',
  },
};

export default function HomePage() {
  return <MemberHomeView />;
}
