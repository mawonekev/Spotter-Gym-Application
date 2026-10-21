import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationCodeAndPersist } from '@/server/auth/verification';
import { resendVerificationSchema, formatZodErrors } from '@/lib/validators';
import {
  checkRateLimit,
  consumeRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  getClientIp,
  getDeviceId,
} from '@/lib/rate-limit';

/**
 * Route handler for resending a 6-digit email verification code.
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

    const rateLimitResult = checkRateLimit(
      req,
      'resend-verification',
      undefined,
      identifiers
    );
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Resends succeed even for unknown accounts, so throttle every issuance to
    // prevent verification-email flooding.
    const issueLimitResult = consumeRateLimit(
      req,
      'resend-verification-issue',
      undefined,
      identifiers
    );
    if (!issueLimitResult.success) {
      return createRateLimitResponse(issueLimitResult);
    }

    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(
        req,
        'resend-verification',
        undefined,
        identifiers
      );
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email address.',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const result = await resendVerificationCodeAndPersist(
      parsed.data.email,
      parsed.data.firstName,
      getClientIp(req)
    );

    clearFailedAuthAttempts(req, 'resend-verification', identifiers);

    return NextResponse.json({
      success: true,
      message: result.message || 'A new 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification code. Please try again.' },
      { status: 500 }
    );
  }
}
