/**
 * Shared TypeScript types for Spotter
 * Source of truth: PRD section 8.5 & definitions in AGENTS.md
 */

export type Tier = 'BASIC' | 'PREMIUM';

export type EffectiveStatus = 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';

export interface MemberStatusSummary {
  memberId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  effectiveTier: Tier;
  effectiveStatus: EffectiveStatus;
  expiryDate: string; // ISO date format
  daysTrainedThisMonth: number;
  canonicalBalanceKobo: number;
  balanceCorrectAsOfDate: string; // e.g. "5 Oct 2026"
  isBalanceStale: boolean; // true if cached balance is older than 24 hours
}

export type QuestionOutcome =
  | 'REFUSED_POLICY'
  | 'NO_ANSWER'
  | 'BLOCKED_UNGROUNDED'
  | 'ANSWERED_SHARED'
  | 'ANSWERED_PRIVATE'
  | 'ERROR';

export type RefusalReason =
  | 'MEDICAL'
  | 'OTHER_MEMBER'
  | 'DOOR_ACCESS'
  | 'MONEY_DECISION'
  | 'STAFF_CONDUCT';

export interface SuggestedQuestion {
  id: string;
  text: string;
  fixedIntent?: string;
}

export interface AskQuestionResponse {
  answerText: string;
  outcome: QuestionOutcome;
  sourceCardBody?: string;
  lastConfirmedDate?: string;
  handoffOfficerName?: string;
  handoffWhatsAppUrl?: string;
}
