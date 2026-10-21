import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MemberHomeView } from '@/components/MemberHomeView';
import { getSessionMember } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | Spotter',
  description: 'Your personal Spotter member dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const cookieStore = cookies();
  const member = await getSessionMember(cookieStore.toString());

  if (!member) {
    redirect('/auth?view=signin');
  }

  return (
    <MemberHomeView
      member={{
        memberId: member.memberId,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        effectiveTier: member.effectiveTier,
        effectiveStatus: member.effectiveStatus,
        email: member.email,
        emailVerified: member.emailVerifiedAt != null,
      }}
    />
  );
}
