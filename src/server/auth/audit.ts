/**
 * Authentication and Security Audit Logging
 * Source of truth: Security Audit Specification Section 11
 *
 * Records critical authentication events, failed login attempts, and security actions.
 * Plaintext passwords, PINs, and full verification codes are NEVER logged.
 */

import crypto from 'node:crypto';
import { prisma } from '../db.ts';

export type AuthAuditEventType =
  | 'AUTH_SIGNIN_SUCCESS'
  | 'AUTH_SIGNIN_FAILURE'
  | 'AUTH_SIGNUP_SUCCESS'
  | 'AUTH_SIGNUP_FAILURE'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_PASSWORD_RESET_FAILURE'
  | 'AUTH_EMAIL_VERIFIED'
  | 'AUTH_EMAIL_VERIFY_FAILURE'
  | 'AUTH_VERIFICATION_CODE_ISSUED'
  | 'AUTH_SESSION_CREATED'
  | 'AUTH_SESSION_REVOKED'
  | 'AUTH_RATE_LIMIT_BLOCKED';

export interface AuthAuditEntry {
  id: string;
  timestamp: string;
  eventType: AuthAuditEventType;
  ip: string;
  identifier?: string; // Phone, member number, or normalized email (safe identifiers only)
  details?: Record<string, unknown>;
}

// In-memory ring buffer of the most recent 500 audit events
const auditLogBuffer: AuthAuditEntry[] = [];
const MAX_AUDIT_ENTRIES = 500;

/**
 * Logs an authentication or security audit event.
 */
export function logAuthEvent(
  eventType: AuthAuditEventType,
  ip: string,
  identifier?: string,
  details?: Record<string, unknown>
): AuthAuditEntry {
  const entry: AuthAuditEntry = {
    id: `audit_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    eventType,
    ip: ip || '127.0.0.1',
    identifier: identifier ? identifier.trim().toLowerCase() : undefined,
    details: details ? sanitizeDetails(details) : undefined,
  };

  auditLogBuffer.unshift(entry);
  if (auditLogBuffer.length > MAX_AUDIT_ENTRIES) {
    auditLogBuffer.pop();
  }

  // Persist to the dedicated auth_audit_logs table. Best effort: never let an
  // audit storage outage break authentication or leak a stack trace to a user.
  void persistAuthAuditEntry(entry).catch(() => {
    // In-memory ring buffer still retains the event for this process.
  });

  // Safe structured console output
  console.log(
    `[AUTH AUDIT] ${entry.timestamp} | ${entry.eventType} | IP: ${entry.ip} | ID: ${
      entry.identifier || 'anonymous'
    }`
  );

  return entry;
}

/**
 * Writes an audit entry to PostgreSQL (auth_audit_logs).
 */
export async function persistAuthAuditEntry(
  entry: AuthAuditEntry
): Promise<void> {
  try {
    await prisma.authAuditLog.create({
      data: {
        id: entry.id,
        eventType: entry.eventType,
        ip: entry.ip,
        identifier: entry.identifier ?? null,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        createdAt: new Date(entry.timestamp),
      },
    });
  } catch {
    // Database unavailable: the in-memory buffer remains available for support.
  }
}

/**
 * Sanitizes details to ensure sensitive authentication credentials are never logged.
 */
function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(details)) {
    if (
      /password|pin|secret|code|token/i.test(key) &&
      typeof val === 'string'
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Retrieves the recent audit log entries (for tests or administrative audit).
 */
export function getRecentAuthAuditLogs(limit = 50): AuthAuditEntry[] {
  return auditLogBuffer.slice(0, limit);
}

/**
 * Clears the audit buffer (used for unit tests).
 */
export function clearAuthAuditLogs(): void {
  auditLogBuffer.length = 0;
}
