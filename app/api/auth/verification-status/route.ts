import { NextRequest, NextResponse } from 'next/server';
import { getEmailVerificationStatus } from '@/server/auth/verification';

export const dynamic = 'force-dynamic';

/**
 * Route handler to query email verification status.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required.' },
        { status: 400 }
      );
    }

    const verified = await getEmailVerificationStatus(email);

    return NextResponse.json({
      success: true,
      email: email.trim().toLowerCase(),
      emailVerified: verified,
    });
  } catch (error) {
    console.error('Verification-status route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query status.' },
      { status: 500 }
    );
  }
}
