/**
 * Deterministic never-answer rules layer for Spotter
 * Source of truth: .agent/rules/ai.md and PRD section 7.3
 * ARCHITECTURAL RULE: Runs in < 50ms before any network or model call.
 * A pattern hit refuses immediately, returns REFUSED_POLICY, and makes no model call.
 */

import { RefusalReason } from '@/lib/types';

export interface RuleCheckResult {
  isRefused: boolean;
  reason?: RefusalReason;
}

const MEDICAL_PATTERNS = [
  'injur', 'pain', 'hurt', 'ache', 'sprain', 'strain', 'physio',
  'doctor', 'hospital', 'medication', 'diet', 'calorie', 'supplement',
  'protein', 'creatine', 'steroid', 'pregnan', 'asthma', 'diabet', 'blood pressure'
];

const DOOR_ACCESS_PATTERNS = [
  'can i get in', 'will my card work', 'let me in', 'open the door', 'am i allowed in right now'
];

const MONEY_DECISION_PATTERNS = [
  'refund', 'waive', 'waiver', 'discount', 'free month', 'cancel my', 'reduce my fee'
];

const STAFF_CONDUCT_PATTERNS = [
  'rude', 'complain about', 'report the', 'the staff was', 'she was rude', 'he was rude'
];

/**
 * Checks a member's question against deterministic refusal rules.
 * Runs in under 50ms without network calls.
 */
export function checkNeverAnswerRules(
  questionText: string,
  _registeredMemberNames: string[] = []
): RuleCheckResult {
  const normalized = questionText.toLowerCase();

  // 1. Medical patterns
  for (const pat of MEDICAL_PATTERNS) {
    const regex = new RegExp(`\\b${pat}`, 'i');
    if (regex.test(normalized)) {
      return { isRefused: true, reason: 'MEDICAL' };
    }
  }

  // 2. Door access patterns
  for (const pat of DOOR_ACCESS_PATTERNS) {
    if (normalized.includes(pat)) {
      return { isRefused: true, reason: 'DOOR_ACCESS' };
    }
  }

  // 3. Money decisions
  for (const pat of MONEY_DECISION_PATTERNS) {
    if (normalized.includes(pat)) {
      return { isRefused: true, reason: 'MONEY_DECISION' };
    }
  }

  // 4. Staff conduct
  for (const pat of STAFF_CONDUCT_PATTERNS) {
    if (normalized.includes(pat)) {
      return { isRefused: true, reason: 'STAFF_CONDUCT' };
    }
  }

  return { isRefused: false };
}
