/**
 * Session reads for Spotter
 * Source of truth: .agent/rules/auth.md and structure.md
 * ARCHITECTURAL RULE: This is the ONLY place the session cookie is read.
 * Source of member ID and effective tier. Never read member ID from request body.
 */

import { Tier, EffectiveStatus } from '@/lib/types';

export interface SessionMember {
  memberId: string;
  memberNumber: string;
  effectiveTier: Tier;
  effectiveStatus: EffectiveStatus;
}

/**
 * Reads and verifies the HTTP-only session cookie.
 * In full implementation, verifies session token against MemberSession table.
 */
export async function getSessionMember(
  _cookieHeader?: string | null
): Promise<SessionMember | null> {
  // Scaffolding placeholder for session cookie parsing
  return {
    memberId: 'mem_chioma_001',
    memberNumber: 'SP-042',
    effectiveTier: 'BASIC',
    effectiveStatus: 'ACTIVE',
  };
}
