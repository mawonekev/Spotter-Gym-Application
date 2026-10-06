/**
 * Raw SQL module for CardChunk vector operations
 * Source of truth: .agent/rules/retrieval.md, commands.md, and structure.md
 * ARCHITECTURAL RULE:
 * - All CardChunk writes go through this file using raw SQL ($executeRaw).
 * - Never call prisma.cardChunk.create or prisma.cardChunk.update.
 */

export interface CardChunkInsertInput {
  cardVersionId: string;
  chunkIndex: number;
  title: string;
  body: string;
  category: string;
  minTier: string;
  embedding: number[];
}

/**
 * Inserts CardChunk with pgvector embedding using parameterized raw SQL.
 */
export async function insertCardChunk(
  _input: CardChunkInsertInput
): Promise<void> {
  // Scaffolding stub for raw SQL vector insert
}
