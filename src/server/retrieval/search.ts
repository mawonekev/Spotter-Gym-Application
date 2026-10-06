/**
 * Tier-filtered vector search over approved shared cards
 * Source of truth: .agent/rules/retrieval.md and structure.md
 * ARCHITECTURAL RULE:
 * - Accepts query embedding and effective tier only.
 * - NEVER accepts a member ID.
 * - Private models must NEVER be imported or referenced here (enforced by CI).
 */

import { Tier } from '@/lib/types';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';

export interface RetrievedChunk {
  chunkId: string;
  cardVersionId: string;
  title: string;
  body: string;
  category: string;
  similarity: number;
}

/**
 * Searches approved CardChunks by cosine similarity, filtered by effective tier.
 */
export async function searchSharedCards(
  _queryEmbedding: number[],
  _effectiveTier: Tier
): Promise<RetrievedChunk[]> {
  // Scaffolding stub for vector query
  // Real implementation will use $queryRaw on CardChunk casting minTier and computing cosine similarity
  const chunks: RetrievedChunk[] = [];
  return chunks.filter((c) => c.similarity >= SIMILARITY_THRESHOLD);
}
