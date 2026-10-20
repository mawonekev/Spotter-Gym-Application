/**
 * Foundation for Future RAG-Based AI Functionality
 * Source of truth: PRD section 7.1-7.9, .agent/rules/ai.md, and retrieval.md
 *
 * Establishes integration contracts for:
 * 1. Policy Document Retrieval (Tier-filtered CardChunks)
 * 2. Digit-level Grounding Verification
 * 3. Handoff to Front Desk when ungrounded or refused
 */

import type { Tier, QuestionOutcome, RefusalReason } from '../../lib/types/index.ts';
import { SIMILARITY_THRESHOLD } from '../../lib/constants/index.ts';
import { searchSharedCards, type RetrievedChunk } from './search.ts';
import { checkNeverAnswerRules } from '../router/rules.ts';

export interface RAGQueryContext {
  questionText: string;
  effectiveTier: Tier;
  sessionMemberId: string;
}

export interface RAGAnswerResult {
  outcome: QuestionOutcome;
  answerText?: string;
  sourceChunks?: RetrievedChunk[];
  refusalReason?: RefusalReason;
  handoffOfficerName: string;
  latencyMs?: number;
}

/**
 * Validates digit-level grounding:
 * Extracts every digit sequence from generated answer.
 * Asserts every digit sequence appears in either source chunks or the question.
 * Returns false (triggering BLOCKED_UNGROUNDED) on any hallucinated digit.
 */
export function verifyDigitGrounding(
  answer: string,
  sourceChunks: string[],
  question: string
): boolean {
  // Strip commas, colons, dots, currency symbols to isolate digit sequences
  const cleanAnswer = answer.replace(/[,\.:₦$]/g, ' ');
  const cleanSources = [...sourceChunks, question].join(' ').replace(/[,\.:₦$]/g, ' ');

  const answerDigits = cleanAnswer.match(/\d+/g) || [];
  const sourceDigits = new Set(cleanSources.match(/\d+/g) || []);

  for (const digit of answerDigits) {
    if (!sourceDigits.has(digit)) {
      return false; // Grounding violation: digit not found in source records
    }
  }

  return true;
}

/**
 * Prepares and evaluates RAG retrieval pipeline for gym policy queries.
 * Serves as the integration point for future model generation (Gemini-2.5-flash).
 */
export async function executeRAGPipeline(
  context: RAGQueryContext,
  queryEmbedding?: number[]
): Promise<RAGAnswerResult> {
  const startTime = Date.now();
  const defaultOfficer = 'Ngozi';

  // 1. Deterministic rules layer (< 50ms)
  const ruleResult = checkNeverAnswerRules(context.questionText);
  if (ruleResult.isRefused) {
    return {
      outcome: 'REFUSED_POLICY',
      refusalReason: ruleResult.reason,
      answerText:
        ruleResult.reason === 'MEDICAL'
          ? `I cannot answer questions about injuries or health. Please speak to ${defaultOfficer} or your doctor.`
          : "I do not have that in the gym's records.",
      handoffOfficerName: defaultOfficer,
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Vector search if embedding is provided
  let retrievedChunks: RetrievedChunk[] = [];
  if (queryEmbedding && queryEmbedding.length > 0) {
    retrievedChunks = await searchSharedCards(queryEmbedding, context.effectiveTier);
  }

  // 3. Fallback when no matching approved records exceed similarity threshold
  if (retrievedChunks.length === 0) {
    return {
      outcome: 'NO_ANSWER',
      answerText: "I do not have that in the gym's records.",
      handoffOfficerName: defaultOfficer,
      latencyMs: Date.now() - startTime,
    };
  }

  // 4. Return integration payload ready for model synthesis
  return {
    outcome: 'ANSWERED_SHARED',
    answerText: retrievedChunks[0].body,
    sourceChunks: retrievedChunks,
    handoffOfficerName: defaultOfficer,
    latencyMs: Date.now() - startTime,
  };
}
