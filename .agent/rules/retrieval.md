---
trigger: model_decision
description: Read when dealing with vector search, pgvector, CardChunk embeddings, chunking, similarity threshold (0.70), or retrieval raw SQL
---

# Retrieval Rules

Controls the vector search path.

- **Storage.** Use `pgvector` on the same PostgreSQL database. Do not add a separate vector service. Reason: PRD section 9.1. At under three hundred chunks, a separate service is equipment, not engineering.
- **What is embedded.** Only `CardChunk` rows belonging to an APPROVED `CardVersion` whose parent `Card` is also APPROVED. Each chunk carries `category` and `minTier` copied down. Reason: PRD section 9.2.
- **What is never embedded.** See `privacy.md`. This file does not repeat the list.
- **Chunking.** Under two hundred and fifty words: one chunk, title plus body. Above: split on blank lines into chunks of at most two hundred words, with the title prepended to each. Reason: PRD section 9.4.
- **Timetable chunking.** One chunk per day of the week, prefixed with the day name. Reason: PRD section 9.4. A Saturday question should match a Saturday chunk.
- **Tier filter position.** Run the filter in the `WHERE` clause, before ranking. Filter on `effectiveTier` only. Never post filter. Reason: PRD section 9.5. Post filtering ranks across every card then drops the disallowed ones, which can empty the result while a valid card sat just below the cut.
- **Retrieval query.** Use the query in PRD section 10.5 verbatim. Cast the enum column to text and compare against a text array. Reason: PRD section 10.5. Passing a JavaScript array through Prisma raw parameters and casting to a Postgres enum array is fragile across versions.
- **Retirement.** Filter on `Card.status = 'APPROVED'`. Deleting chunks is cleanup. Correctness lives in the query. Reason: PRD section 9.6 and 10.5.
- **Reindex sequence.** Generate chunks. Call the embedding API outside any transaction. If any embedding call fails, abort. Then open one transaction: delete old chunks, insert new chunks by raw SQL, set version status to APPROVED, set `Card.currentVersionId`, set `lastConfirmedAt`. Commit. Reason: PRD section 9.6. A card is never live and unindexed at the same time.
- **Reconfirm without edit.** Update `lastConfirmedAt` only. Do not reindex. Do not call the embedding API. Reason: PRD section 9.6.
- **Minimum tier change.** Update chunks in place. The text did not change, so the embedding is still valid. Reason: PRD section 9.6.
- **No index on `minTier`.** Do not add a B tree index on `minTier`. Reason: PRD section 10.3. Two distinct values across three hundred rows means the planner ignores it.
- **No HNSW index yet.** Ship without a vector index. Add the HNSW index only when chunk count passes five thousand. Reason: PRD section 10.3. The exact sequential scan is faster at this size.
- **Threshold.** Drop results below 0.70 cosine similarity in application code before the answer step. Reason: PRD section 9.7. `ai.md` references this value.
- **Below threshold.** Return the no answer response. Do not call the language model. Reason: PRD section 7.5.
- **Embedding API error during search.** If the embedding call for a member question fails, return the error state and the handoff. Do not fall back to keyword search. Reason: PRD section 6.3 error state. A keyword fallback would return cards the tier filter might not allow.
- **Raw SQL only for CardChunk.** All writes go through `src/server/retrieval/index-card.ts` using `$executeRaw`. All reads go through `src/server/retrieval/search.ts` using `$queryRaw`. Bind every parameter. Reason: PRD section 10.6. The Prisma client cannot set an `Unsupported` column.
- **Runtime card count check.** Refuse all member questions while fewer than thirty cards hold status APPROVED. Return the no answer response and the handoff. Reason: PRD FR-11b. The check is per request, not at launch.