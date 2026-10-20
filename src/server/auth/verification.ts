/**
 * Email Verification Service
 * Handles:
 * - 6-digit verification code generation using crypto.randomBytes
 * - Secure SHA-256 hash storage of verification codes (never raw codes in persistent storage)
 * - 5-minute expiration period per Security Specification Section 10
 * - Constant-time code verification and audit logging
 * - Asynchronous background verification email delivery via Nodemailer
 */

import crypto from 'node:crypto';
import { sendVerificationEmailInBackground } from './email.ts';
import { logAuthEvent } from './audit.ts';
import { prisma } from '../db.ts';

export interface VerificationRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  createdAt: number;
  verified: boolean;
  attempts: number;
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  emailVerified?: boolean;
}

// 5-minute expiration window per Security Specification Section 10 default
export const VERIFICATION_EXPIRY_MS = 5 * 60 * 1000;

// In-memory verification store: Map<normalized_email, VerificationRecord>.
// Shared through globalThis so every route handler bundle sees the same records.
const globalForVerification = globalThis as unknown as {
  __spotterVerificationStore?: Map<string, VerificationRecord>;
};

const verificationStore =
  globalForVerification.__spotterVerificationStore ??
  new Map<string, VerificationRecord>();

globalForVerification.__spotterVerificationStore = verificationStore;

/**
 * Computes a SHA-256 hash of a verification code for secure storage.
 */
export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Generates a cryptographically secure 6-digit numeric verification code
 * using the randomBytes algorithm.
 */
export function generateSixDigitCode(): string {
  // Read 4 bytes as unsigned 32-bit integer, map into 000000-999999 range uniformly
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
}

/**
 * Persists a verification code hash and its expiry to PostgreSQL and records the
 * issuance in the verification_statuses audit table. Resolves safely when the
 * database is unavailable so the in-memory fallback can keep development and
 * tests running.
 */
async function persistVerificationIssued(
  email: string,
  codeHash: string,
  expiresAt: number,
  ip = '127.0.0.1'
): Promise<void> {
  try {
    const member = await prisma.member.findFirst({
      where: { email },
      select: { id: true },
    });

    await prisma.member.updateMany({
      where: { email },
      data: {
        emailVerificationCode: codeHash,
        emailVerificationExpiresAt: new Date(expiresAt),
      },
    });

    await prisma.verificationStatus.create({
      data: {
        memberId: member?.id ?? null,
        email,
        status: 'PENDING',
        codeHash,
        expiresAt: new Date(expiresAt),
        ip,
      },
    });
  } catch {
    // The in-memory verification store remains the fallback source of truth.
  }
}

/**
 * Issues a 6-digit verification code for an email address and sends it in the background.
 * Expiration: 5 minutes. The returned object is synchronous for backwards
 * compatibility; use issueVerificationCodeAndPersist when the caller must wait
 * for the durable database write before replying.
 */
export function issueVerificationCode(
  email: string,
  firstName?: string,
  clientIp = '127.0.0.1',
  persistInBackground = true
): { code: string; expiresAt: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const code = generateSixDigitCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = Date.now() + VERIFICATION_EXPIRY_MS;

  const record: VerificationRecord = {
    email: normalizedEmail,
    codeHash,
    expiresAt,
    createdAt: Date.now(),
    verified: false,
    attempts: 0,
  };

  verificationStore.set(normalizedEmail, record);

  // Attempt database sync in the background. Callers that need a durable record
  // before responding (registration/resend endpoints) use the async variant.
  if (persistInBackground) {
    void persistVerificationIssued(normalizedEmail, codeHash, expiresAt, clientIp);
  }

  // Send verification email in background
  sendVerificationEmailInBackground({
    toEmail: normalizedEmail,
    code,
    firstName,
  });

  logAuthEvent('AUTH_VERIFICATION_CODE_ISSUED', clientIp, normalizedEmail);

  return { code, expiresAt };
}

/**
 * Issues and durably persists a verification code before resolving.
 */
export async function issueVerificationCodeAndPersist(
  email: string,
  firstName?: string,
  clientIp = '127.0.0.1'
): Promise<{ code: string; expiresAt: number }> {
  const result = issueVerificationCode(email, firstName, clientIp, false);
  await persistVerificationIssued(
    email.trim().toLowerCase(),
    hashVerificationCode(result.code),
    result.expiresAt,
    clientIp
  );
  return result;
}

/**
 * Checks whether an email address has already been verified.
 */
export function isEmailVerified(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const record = verificationStore.get(normalizedEmail);
  return record?.verified === true;
}

/**
 * Returns true when an unverified code is still pending for this email.
 * Used by sign-in to prompt only accounts that are mid-verification.
 */
export function hasPendingVerification(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const record = verificationStore.get(normalizedEmail);
  return record !== undefined && !record.verified;
}

/**
 * Resolves verification status from memory first, then the database.
 * The database is the durable source once a verification completes.
 */
export async function getEmailVerificationStatus(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (isEmailVerified(normalizedEmail)) {
    return true;
  }

  try {
    const member = await prisma.member.findFirst({
      where: { email: normalizedEmail },
      select: { emailVerifiedAt: true },
    });
    return member?.emailVerifiedAt != null;
  } catch {
    return false;
  }
}

/**
 * Verifies a 6-digit code against the recorded code for an email.
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  clientIp = '127.0.0.1'
): Promise<VerificationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  let record = verificationStore.get(normalizedEmail);

  // After a server restart (or when registration ran in a different route
  // bundle), the durable code lives in the database rather than memory.
  if (!record) {
    try {
      const member = await prisma.member.findFirst({
        where: { email: normalizedEmail },
        select: {
          emailVerifiedAt: true,
          emailVerificationCode: true,
          emailVerificationExpiresAt: true,
        },
      });

      if (member?.emailVerifiedAt) {
        return {
          success: true,
          message: 'Email is already verified.',
          emailVerified: true,
        };
      }

      if (member?.emailVerificationCode && member.emailVerificationExpiresAt) {
        record = {
          email: normalizedEmail,
          codeHash: member.emailVerificationCode,
          expiresAt: member.emailVerificationExpiresAt.getTime(),
          createdAt: Date.now(),
          verified: false,
          attempts: 0,
        };
        verificationStore.set(normalizedEmail, record);
      }
    } catch {
      // Database unavailable; fall through to the missing-record response.
    }
  }

  if (!record) {
    logAuthEvent('AUTH_EMAIL_VERIFY_FAILURE', clientIp, normalizedEmail, {
      reason: 'No pending verification record found',
    });
    return {
      success: false,
      error: 'No verification code found for this email address. Please request a new code.',
    };
  }

  if (record.verified) {
    return {
      success: true,
      message: 'Email is already verified.',
      emailVerified: true,
    };
  }

  // Check code expiration (5-minute window)
  if (Date.now() > record.expiresAt) {
    try {
      await prisma.verificationStatus.create({
        data: {
          email: normalizedEmail,
          status: 'EXPIRED',
          expiresAt: new Date(record.expiresAt),
          ip: clientIp,
        },
      });
    } catch {
      // Audit persistence is best-effort; the request still fails closed.
    }
    logAuthEvent('AUTH_EMAIL_VERIFY_FAILURE', clientIp, normalizedEmail, {
      reason: 'Code expired',
    });
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  const cleanInput = code.trim();

  // Validate format
  if (!/^\d{6}$/.test(cleanInput)) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit verification code.',
    };
  }

  // Constant-time comparison between stored SHA-256 hash and candidate code hash
  const candidateHash = hashVerificationCode(cleanInput);
  let isMatch = false;

  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(record.codeHash, 'hex')
    );
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    record.attempts += 1;
    logAuthEvent('AUTH_EMAIL_VERIFY_FAILURE', clientIp, normalizedEmail, {
      reason: 'Code mismatch',
      attempt: record.attempts,
    });
    return {
      success: false,
      error: 'Invalid verification code. Please check your email and try again.',
    };
  }

  // Mark verified and clear stored verification material per Section 10
  record.verified = true;
  record.codeHash = '';

  // Synchronize with database and append the verification audit trail.
  try {
    const member = await prisma.member.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    await prisma.member.updateMany({
      where: { email: normalizedEmail },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    await prisma.verificationStatus.create({
      data: {
        memberId: member?.id ?? null,
        email: normalizedEmail,
        status: 'VERIFIED',
        verifiedAt: new Date(),
        ip: clientIp,
      },
    });
  } catch {
    // Database connectivity fallback
  }

  // Also update in-memory member store if present
  try {
    const globalFallback = globalThis as unknown as {
      __spotterInMemoryMembers?: Array<{ email: string; emailVerifiedAt?: Date | null; emailVerificationCode?: string | null }>;
    };
    if (globalFallback.__spotterInMemoryMembers) {
      const match = globalFallback.__spotterInMemoryMembers.find(
        (m) => m.email.toLowerCase() === normalizedEmail
      );
      if (match) {
        match.emailVerifiedAt = new Date();
        match.emailVerificationCode = null;
      }
    }
  } catch {
    // Graceful fallback
  }

  logAuthEvent('AUTH_EMAIL_VERIFIED', clientIp, normalizedEmail);

  return {
    success: true,
    message: 'Email verified successfully.',
    emailVerified: true,
  };
}

/**
 * Resends a 6-digit verification code to the email address.
 */
export function resendVerificationCode(
  email: string,
  firstName?: string,
  clientIp = '127.0.0.1'
): VerificationResult {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = verificationStore.get(normalizedEmail);

  if (existing?.verified) {
    return {
      success: true,
      message: 'Email is already verified.',
      emailVerified: true,
    };
  }

  issueVerificationCode(normalizedEmail, firstName, clientIp);

  return {
    success: true,
    message: 'A new 6-digit verification code has been sent to your email.',
    emailVerified: false,
  };
}

/**
 * Resends a verification code and waits for the durable database write.
 */
export async function resendVerificationCodeAndPersist(
  email: string,
  firstName?: string,
  clientIp = '127.0.0.1'
): Promise<VerificationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = verificationStore.get(normalizedEmail);

  if (existing?.verified) {
    return {
      success: true,
      message: 'Email is already verified.',
      emailVerified: true,
    };
  }

  await issueVerificationCodeAndPersist(normalizedEmail, firstName, clientIp);

  return {
    success: true,
    message: 'A new 6-digit verification code has been sent to your email.',
    emailVerified: false,
  };
}

/**
 * Resets the in-memory verification store (used for unit tests).
 */
export function resetVerificationStore(): void {
  verificationStore.clear();
}

/**
 * Gets raw verification record for testing assertions.
 */
export function getVerificationRecord(email: string): VerificationRecord | undefined {
  return verificationStore.get(email.trim().toLowerCase());
}
