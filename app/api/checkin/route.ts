import { NextRequest, NextResponse } from 'next/server';
import { getSessionMember } from '@/server/auth/session';
import { COPY } from '@/lib/constants';
import { checkInSchema, formatZodErrors } from '@/lib/validators';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

/**
 * Route handler for F-3 Check In
 * ARCHITECTURAL RULE per structure.md & ci.md:
 * - Calls src/server/** modules only.
 * - NEVER imports or touches Prisma directly.
 */
export async function POST(req: NextRequest) {
  try {
    // IP-based rate limiting
    const rateLimitResult = checkRateLimit(req, 'checkin');
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const session = await getSessionMember(req.headers.get('cookie'));
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Server-side Zod validation for check-in code
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: COPY.CHECK_IN_WRONG_CODE,
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // Scaffolding check
    if (code === '4821') {
      return NextResponse.json({
        success: true,
        message: COPY.CHECK_IN_SUCCESS,
      });
    }

    return NextResponse.json(
      { success: false, message: COPY.CHECK_IN_WRONG_CODE },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: COPY.DB_ERROR_PRIVATE },
      { status: 500 }
    );
  }
}
