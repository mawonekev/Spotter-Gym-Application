import { NextRequest, NextResponse } from 'next/server';
import { getSessionMember } from '@/server/auth/session';
import { COPY } from '@/lib/constants';

/**
 * Route handler for F-3 Check In
 * ARCHITECTURAL RULE per structure.md & ci.md:
 * - Calls src/server/** modules only.
 * - NEVER imports or touches Prisma directly.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionMember(req.headers.get('cookie'));
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const code = body.code?.trim();

    if (!code || code.length !== 4) {
      return NextResponse.json(
        { success: false, message: COPY.CHECK_IN_WRONG_CODE },
        { status: 400 }
      );
    }

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
