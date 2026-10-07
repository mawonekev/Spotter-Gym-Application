/**
 * Shared constants for Spotter
 * Source of truth: PRD and .agent/rules/copy.md
 */

import { SuggestedQuestion } from '../types';

export const APP_NAME = 'Spotter';

export const MAX_QUESTION_LENGTH = 400;

export const SIMILARITY_THRESHOLD = 0.70;

export const MIN_APPROVED_CARDS_RUNTIME = 30;

export const STAGE_BUDGETS_MS = {
  RULES_LAYER: 50,
  ROUTER: 3000,
  EMBEDDING: 2000,
  VECTOR_QUERY: 1000,
  ANSWER: 5000,
  HARD_CEILING: 11000,
} as const;

/**
 * Exact user-visible copy strings per .agent/rules/copy.md
 * Never use em dashes anywhere in user-visible text.
 */
export const COPY = {
  REFUSAL_MISSING_RECORDS: "I do not have that in the gym's records.",
  REFUSAL_MEDICAL: (officerName: string) =>
    `I cannot answer questions about injuries or health. Please speak to ${officerName} or your doctor.`,
  HANDOFF_BUTTON: (officerName: string) => `Send this to ${officerName}`,
  STALE_CACHED_BALANCE: 'Open to refresh',
  CHECK_IN_SUCCESS: 'Checked in.',
  CHECK_IN_WRONG_CODE: "That is not today's code. Check the board at the desk.",
  CHECK_IN_ALREADY: 'You are already checked in today.',
  CHECK_IN_NO_CODE_SET: "The desk has not set today's code yet.",
  CHECK_IN_BLOCKED_PAST_GRACE: 'Your membership has expired. Renew to check in.',
  DB_ERROR_PRIVATE: "I cannot read your records right now.",
  TIMEOUT_OR_UNREACHABLE: "I cannot reach the gym's records right now.",
  EMPTY_ATTENDANCE: (month: string) => `No check ins recorded for ${month}.`,
  EMPTY_PAYMENTS: 'No payments recorded yet. Ask the front desk if you paid in cash.',
  PAYMENT_INITIATION_FAILURE: 'Payment could not start. Try again or pay at the desk.',
  PAYMENT_CONFIRMATION_TIMEOUT: 'The gym is confirming your payment. Check back in a minute.',
  ACTIVATION_TITLE: 'Enter your activation code.',
  ACTIVATION_HELPER: 'Ask at the front desk or message the desk on WhatsApp.',
  ACTIVATION_INVALID_CODE: 'That code is not valid. Ask the front desk for a new one.',
} as const;

/**
 * Default eight suggested questions per PRD section 5.4 gate one and FR-9
 */
export const DEFAULT_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: 'sq-1', text: 'What time is the Saturday class?' },
  { id: 'sq-2', text: 'Can I bring a guest with me?' },
  { id: 'sq-3', text: 'What are the gym opening hours?' },
  { id: 'sq-4', text: 'How much is the renewal subscription?' },
  { id: 'sq-5', text: 'What is included in the Premium plan?' },
  { id: 'sq-6', text: 'What are the rules on pausing membership?' },
  { id: 'sq-7', text: 'How do I pay my arrears?' },
  { id: 'sq-8', text: 'Who is on duty at the front desk?' },
];

/**
 * Format balance in naira from canonical kobo integer
 */
export function formatKoboToNaira(kobo: number): string {
  const naira = Math.floor(Math.abs(kobo) / 100);
  return naira.toLocaleString('en-NG');
}
