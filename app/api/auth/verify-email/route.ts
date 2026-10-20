import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailCode } from '@/server/auth/verification';
import { verifyEmailSchema, formatZodErrors } from '@/lib/validators';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  getClientIp,
  getDeviceId,
} from '@/lib/rate-limit';

/**
 * Route handler for verifying a 6-digit email verification code.
 * Rate limited to 5 failed attempts per IP/email/device per 1 hour.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const rawEmail =
      typeof (body as Record<string, unknown>).email === 'string'
        ? ((body as Record<string, unknown>).email as string)
        : '';
    const identifiers = { email: rawEmail, deviceId: getDeviceId(req) };

    const rateLimitResult = checkRateLimit(req, 'verify-email', undefined, identifiers);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(req, 'verify-email', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email address and 6-digit verification code.',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const result = await verifyEmailCode(parsed.data.email, parsed.data.code, clientIp);

    if (!result.success) {
      const failure = recordFailedAuthAttempt(req, 'verify-email', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    clearFailedAuthAttempts(req, 'verify-email', identifiers);

    return NextResponse.json({
      success: true,
      message: result.message || 'Email verified successfully.',
      emailVerified: true,
    });
  } catch (error) {
    console.error('Verify-email error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
