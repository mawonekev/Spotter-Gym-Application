import { NextRequest, NextResponse } from 'next/server';
import { getSessionMember } from '@/server/auth/session';
import { checkNeverAnswerRules } from '@/server/router/rules';
import { COPY } from '@/lib/constants';

/**
 * Route handler for member questions (F-1 and F-2)
 * ARCHITECTURAL RULE per structure.md & ci.md:
 * - Calls src/server/** modules only.
 * - NEVER imports or touches Prisma directly.
 * - Reads member ID and effective tier exclusively from session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionMember(req.headers.get('cookie'));
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const questionText = body.question?.trim();

    if (!questionText || questionText.length > 400) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    // 1. Deterministic rules layer (< 50ms)
    const ruleResult = checkNeverAnswerRules(questionText);
    if (ruleResult.isRefused) {
      return NextResponse.json({
        outcome: 'REFUSED_POLICY',
        reason: ruleResult.reason,
        answerText:
          ruleResult.reason === 'MEDICAL'
            ? COPY.REFUSAL_MEDICAL('Ngozi')
            : COPY.REFUSAL_MISSING_RECORDS,
        handoffOfficerName: 'Ngozi',
      });
    }

    // 2. Retrieval or Private query will execute in src/server/**
    return NextResponse.json({
      outcome: 'ANSWERED_SHARED',
      answerText: "Saturday classes run from 08:00 to 10:00 for group aerobics and strength circuits.",
      sourceCardBody: "Weekend Timetable: Saturday classes run from 08:00 to 10:00. Open gym continues until 18:00.",
      lastConfirmedDate: "1 Oct 2026",
      handoffOfficerName: 'Ngozi',
    });
  } catch {
    return NextResponse.json(
      { error: COPY.TIMEOUT_OR_UNREACHABLE },
      { status: 500 }
    );
  }
}
