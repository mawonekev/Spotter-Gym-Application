/**
 * Session reads and writes for Spotter.
 * Source of truth: .agent/rules/auth.md and structure.md
 * ARCHITECTURAL RULE: This is the ONLY place the session cookie is read.
 * Source of member ID and effective tier. Never read member ID from request body.
 *
 * Sessions are opaque 256-bit random tokens. Only the SHA-256 hash is persisted
 * (user_sessions). A process-local fallback keeps development and tests usable
 * when PostgreSQL is temporarily unreachable.
 */

import crypto from 'node:crypto';
import type { Tier, EffectiveStatus } from '../../lib/types/index.ts';
import { prisma } from '../db.ts';
import { logAuthEvent } from './audit.ts';

export const SESSION_COOKIE_NAME = 'spotter_session';
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days per PRD FR-6

export interface SessionMember {
  memberId: string;
  memberNumber: string;
  firstName?: string;
  lastName?: string;
  effectiveTier: Tier;
  effectiveStatus: EffectiveStatus;
  email?: string | null;
  emailVerifiedAt?: Date | null;
}

export interface SessionContext {
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  /** Snapshot used by the in-memory fallback when the database is unavailable. */
  member?: SessionMember;
}

interface FallbackSession {
  memberId: string;
  member?: SessionMember;
  expiresAt: number;
  revokedAt?: Date;
}

const globalForSessions = globalThis as unknown as {
  __spotterFallbackSessions?: Map<string, FallbackSession>;
};

const fallbackSessions =
  globalForSessions.__spotterFallbackSessions ?? new Map<string, FallbackSession>();
globalForSessions.__spotterFallbackSessions = fallbackSessions;

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseSessionCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

interface MemberForSession {
  id: string;
  memberNumber: string;
  firstName?: string;
  lastName?: string;
  tier: string;
  expiryDate: Date;
  cancelledAt: Date | null;
  email: string | null;
  emailVerifiedAt: Date | null;
  gym?: { graceDays: number } | null;
}

/**
 * Computes effective status from persisted facts (never stored).
 */
export function computeEffectiveStatus(
  member: MemberForSession,
  now = new Date()
): EffectiveStatus {
  if (member.cancelledAt) {
    return 'CANCELLED';
  }

  const expiryEnd = new Date(member.expiryDate);
  expiryEnd.setHours(23, 59, 59, 999);
  if (now <= expiryEnd) {
    return 'ACTIVE';
  }

  const graceDays = member.gym?.graceDays ?? 0;
  const graceEnd = new Date(expiryEnd);
  graceEnd.setDate(graceEnd.getDate() + graceDays);

  return now <= graceEnd ? 'GRACE' : 'EXPIRED';
}

function toSessionMember(member: MemberForSession): SessionMember {
  const effectiveStatus = computeEffectiveStatus(member);
  const effectiveTier: Tier =
    effectiveStatus === 'ACTIVE' || effectiveStatus === 'GRACE'
      ? (member.tier as Tier)
      : 'BASIC';

  return {
    memberId: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    effectiveTier,
    effectiveStatus,
    email: member.email,
    emailVerifiedAt: member.emailVerifiedAt,
  };
}

/**
 * Creates a new opaque session, persists its hash, and returns the raw token.
 */
export async function createUserSession(
  memberId: string,
  context: SessionContext = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  let snapshot = context.member;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { gym: true },
    });

    if (member) {
      snapshot = toSessionMember(member as MemberForSession);

      await prisma.userSession.create({
        data: {
          memberId,
          tokenHash,
          deviceId: context.deviceId ?? 'unknown',
          ipAddress: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          expiresAt,
        },
      });
    }
  } catch {
    // Database unavailable: fall back to the process-local session store.
  }

  fallbackSessions.set(tokenHash, {
    memberId,
    member: snapshot,
    expiresAt: expiresAt.getTime(),
  });

  logAuthEvent('AUTH_SESSION_CREATED', context.ip ?? '127.0.0.1', snapshot?.email ?? memberId, {
    deviceId: context.deviceId,
  });

  return { token, expiresAt };
}

/**
 * Reads and verifies the HTTP-only session cookie against the persisted session
 * and the member's current status. Unverified members remain signed in so the
 * dashboard can prompt them to verify their email without locking them out.
 */
export async function getSessionMember(
  cookieHeader?: string | null
): Promise<SessionMember | null> {
  const token = parseSessionCookie(cookieHeader);
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const now = Date.now();

  try {
    const session = await prisma.userSession.findUnique({
      where: { tokenHash },
      include: { member: { include: { gym: true } } },
    });

    if (!session) {
      fallbackSessions.delete(tokenHash);
      return null;
    }

    if (
      session.revokedAt ||
      session.expiresAt.getTime() <= now
    ) {
      fallbackSessions.delete(tokenHash);
      return null;
    }

    const member = session.member as MemberForSession;
    const sessionMember = toSessionMember(member);

    // Keep the fallback snapshot current for a later database outage.
    fallbackSessions.set(tokenHash, {
      memberId: member.id,
      member: sessionMember,
      expiresAt: session.expiresAt.getTime(),
    });

    void prisma.userSession
      .update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {});

    return sessionMember;
  } catch {
    const fallback = fallbackSessions.get(tokenHash);
    if (!fallback) {
      return null;
    }
    if (fallback.revokedAt || now >= fallback.expiresAt || !fallback.member) {
      fallbackSessions.delete(tokenHash);
      return null;
    }
    return fallback.member;
  }
}

/**
 * Revokes the current session (sign out) and clears the fallback copy.
 */
export async function revokeUserSession(cookieHeader?: string | null): Promise<void> {
  const token = parseSessionCookie(cookieHeader);
  if (!token) return;

  const tokenHash = hashSessionToken(token);
  fallbackSessions.delete(tokenHash);

  try {
    await prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Best effort; the cookie is cleared by the route regardless.
  }

  logAuthEvent('AUTH_SESSION_REVOKED', '127.0.0.1');
}

/**
 * Resets the fallback session store (used by tests).
 */
export function resetFallbackSessions(): void {
  fallbackSessions.clear();
}
