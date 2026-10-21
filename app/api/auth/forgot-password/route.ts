import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/server/auth/password-reset';
import { forgotPasswordSchema, formatZodErrors } from '@/lib/validators';
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
 * Route handler for requesting a password reset.
 * ARCHITECTURAL RULE: Never touches Prisma directly. Calls src/server/auth/password-reset.ts.
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

    const rawIdentifier =
      typeof (body as Record<string, unknown>).identifier === 'string'
        ? ((body as Record<string, unknown>).identifier as string)
        : '';

    const identifiers = {
      email: rawIdentifier.includes('@') ? rawIdentifier : undefined,
      deviceId: getDeviceId(req),
    };

    const rateLimitResult = checkRateLimit(
      req,
      'forgot-password',
      undefined,
      identifiers
    );
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // The endpoint replies successfully even for unknown accounts, so failed
    // attempts alone cannot stop reset-email flooding. Throttle issuance too.
    const issueLimitResult = consumeRateLimit(
      req,
      'forgot-password-issue',
      undefined,
      identifiers
    );
    if (!issueLimitResult.success) {
      return createRateLimitResponse(issueLimitResult);
    }

    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(
        req,
        'forgot-password',
        undefined,
        identifiers
      );
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email or phone number.',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const result = await requestPasswordReset(parsed.data.identifier, clientIp);

    clearFailedAuthAttempts(req, 'forgot-password', identifiers);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Forgot-password route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request. Please try again.' },
      { status: 500 }
    );
  }
}
