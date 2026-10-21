import { NextRequest, NextResponse } from 'next/server';
import { registerMember } from '@/server/auth/register';
import { logAuthEvent } from '@/server/auth/audit';
import {
  createUserSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '@/server/auth/session';
import {
  signUpRequestSchema,
  formatZodErrors,
  validatePasswordNotPwned,
} from '@/lib/validators';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  getClientIp,
  getDeviceId,
} from '@/lib/rate-limit';

/**
 * Route handler for member Create Account (sign up).
 * ARCHITECTURAL RULE: Never touches Prisma directly. Calls src/server/auth/register.ts.
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

    const raw = body as Record<string, unknown>;
    const rawFullName =
      typeof raw.fullName === 'string'
        ? raw.fullName
        : `${typeof raw.firstName === 'string' ? raw.firstName : ''} ${
            typeof raw.lastName === 'string' ? raw.lastName : ''
          }`.trim();

    const rawEmail = typeof raw.email === 'string' ? raw.email : undefined;
    const identifiers = {
      email: rawEmail,
      deviceId: getDeviceId(req),
    };

    // IP is the primary limiter; email and device id are secondary limiters.
    const rateLimitResult = checkRateLimit(req, 'register', undefined, identifiers);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Server-side Zod validation. Unknown payload properties are stripped.
    const parsed = signUpRequestSchema.safeParse({
      fullName: rawFullName,
      email: raw.email,
      phone: raw.phone,
      password: raw.password,
      privacyAccepted: raw.privacyAccepted,
    });

    if (!parsed.success) {
      const failure = recordFailedAuthAttempt(req, 'register', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid member registration data',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    // Breached-password check runs ONLY on sign up (and password reset).
    const pwnedError = await validatePasswordNotPwned(parsed.data.password);
    if (pwnedError) {
      const failure = recordFailedAuthAttempt(req, 'register', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: pwnedError,
          validationErrors: { password: pwnedError },
        },
        { status: 400 }
      );
    }

    const nameParts = parsed.data.fullName.trim().replace(/\s+/g, ' ').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const result = await registerMember({
      firstName,
      lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      password: parsed.data.password,
    });

    if (!result.success) {
      const failure = recordFailedAuthAttempt(req, 'register', undefined, identifiers);
      if (!failure.success) {
        return createRateLimitResponse(failure);
      }
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        },
        { status: 400 }
      );
    }

    clearFailedAuthAttempts(req, 'register', identifiers);

    logAuthEvent('AUTH_SIGNUP_SUCCESS', getClientIp(req), result.email, {
      memberNumber: result.memberNumber,
    });

    if (!result.memberId || !result.memberNumber) {
      throw new Error('Registration returned without a member identity.');
    }

    // Requirement: creating an account signs the member in immediately. The
    // dashboard is responsible for prompting email verification via its banner.
    const session = await createUserSession(result.memberId, {
      deviceId: getDeviceId(req),
      ip: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
      member: {
        memberId: result.memberId,
        memberNumber: result.memberNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        effectiveTier: result.tier ?? 'BASIC',
        effectiveStatus: 'ACTIVE',
        email: result.email,
        emailVerifiedAt: null,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        memberId: result.memberId,
        memberNumber: result.memberNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        emailVerified: false,
        tier: result.tier,
        message:
          'Account created successfully. A 6-digit verification code has been sent to your email.',
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error('Registration route error:', error);
    logAuthEvent('AUTH_SIGNUP_FAILURE', '127.0.0.1', undefined, {
      reason: 'Unhandled registration error',
    });
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
