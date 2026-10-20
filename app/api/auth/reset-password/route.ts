import { NextRequest, NextResponse } from 'next/server';
import { completePasswordReset } from '@/server/auth/password-reset';
import { resetPasswordSchema, formatZodErrors } from '@/lib/validators';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  getClientIp,
  getDeviceId,
} from '@/lib/rate-limit';

/**
 * Route handler for completing a password reset.
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
      'reset-password',
      undefined,
      identifiers
    );
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(
        req,
        'reset-password',
        undefined,
        identifiers
      );
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password reset request',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const result = await completePasswordReset(
      parsed.data.identifier,
      parsed.data.token,
      parsed.data.newPassword,
      clientIp
    );

    if (!result.success) {
      const failure = recordFailedAuthAttempt(
        req,
        'reset-password',
        undefined,
        identifiers
      );
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message,
        },
        { status: 400 }
      );
    }

    clearFailedAuthAttempts(req, 'reset-password', identifiers);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Reset-password route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
