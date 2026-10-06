/**
 * Private record SQL queries for Spotter
 * Source of truth: .agent/rules/privacy.md, structure.md, and payments.md
 * ARCHITECTURAL RULE:
 * - Every function takes sessionMemberId as its first argument.
 * - Logs to PrivateAccessLog with session member ID and target member ID.
 * - NEVER uses vector search or embeddings.
 * - Canonical balance: balance_kobo = SUM(LedgerEntry.amountKobo) WHERE memberId = :id
 */

import { MemberStatusSummary } from '@/lib/types';

/**
 * Fetches member's own private status summary.
 * Enforces sessionMemberId as primary parameter and logs access.
 */
export async function getMemberStatus(
  sessionMemberId: string
): Promise<MemberStatusSummary | null> {
  // Scaffolding stub for private status query
  return {
    memberId: sessionMemberId,
    memberNumber: 'SP-042',
    firstName: 'Chioma',
    lastName: 'Adeyemi',
    effectiveTier: 'BASIC',
    effectiveStatus: 'ACTIVE',
    expiryDate: '28 Oct 2026',
    daysTrainedThisMonth: 10,
    canonicalBalanceKobo: 0,
    balanceCorrectAsOfDate: '5 Oct 2026',
    isBalanceStale: false,
  };
}

/**
 * Computes canonical balance for a member: SUM(LedgerEntry.amountKobo) WHERE memberId = :id
 */
export async function computeCanonicalBalance(
  _sessionMemberId: string
): Promise<number> {
  // Scaffolding stub: 0 kobo
  return 0;
}
