import { NextRequest, NextResponse } from 'next/server';
import { authenticateMember } from '@/server/auth/signin';
import { createUserSession, SESSION_COOKIE_NAME, SESSION_TTL_MS } from '@/server/auth/session';
import { signInSchema, formatZodErrors } from '@/lib/validators';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  getClientIp,
  getDeviceId,
} from '@/lib/rate-limit';

/**
 * Route handler for member sign-in.
 * ARCHITECTURAL RULE: Never touches Prisma directly. Calls src/server/auth/signin.ts.
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

    const parsed = signInSchema.safeParse(body);
    const rawIdentifier =
      typeof (body as Record<string, unknown>).phone === 'string'
        ? ((body as Record<string, unknown>).phone as string)
        : '';

    // IP is the primary limiter; email and device id are secondary limiters.
    const identifiers = {
      email: rawIdentifier.includes('@') ? rawIdentifier : undefined,
      deviceId: getDeviceId(req),
    };

    const rateLimitResult = checkRateLimit(req, 'signin', undefined, identifiers);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(req, 'signin', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid mobile number or email and password.',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const result = await authenticateMember(parsed.data, clientIp);

    if (!result.success) {
      // A pending verification is not a failed credential attempt.
      if (!result.requiresEmailVerification) {
        const failure = recordFailedAuthAttempt(
          req,
          'signin',
          undefined,
          identifiers
        );
        if (!failure.success) {
          return createRateLimitResponse(failure);
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
          requiresEmailVerification: result.requiresEmailVerification === true,
          email: result.email,
        },
        { status: result.requiresEmailVerification ? 403 : 401 }
      );
    }

    clearFailedAuthAttempts(req, 'signin', identifiers);

    const session = await createUserSession(result.memberId!, {
      deviceId: getDeviceId(req),
      ip: clientIp,
      userAgent: req.headers.get('user-agent') ?? undefined,
      member: {
        memberId: result.memberId!,
        memberNumber: result.memberNumber!,
        effectiveTier: result.effectiveTier ?? 'BASIC',
        effectiveStatus: result.effectiveStatus ?? 'ACTIVE',
        email: result.email,
        emailVerifiedAt: result.emailVerified ? new Date() : null,
      },
    });

    const response = NextResponse.json({
      success: true,
      member: {
        id: result.memberId,
        memberNumber: result.memberNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        emailVerified: result.emailVerified,
        effectiveTier: result.effectiveTier,
        effectiveStatus: result.effectiveStatus,
      },
      message: 'Signed in successfully.',
    });

    // HTTP-only, SameSite=Lax session cookie containing an opaque signed-in token.
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error('Sign-in route error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign-in failed. Please try again.' },
      { status: 500 }
    );
  }
}
