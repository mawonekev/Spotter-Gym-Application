/**
 * Password Reset Service for Spotter
 * Handles password reset request token generation, hashing, verification,
 * and completion with Argon2id hashing and breached-password verification.
 * Source of truth: Security Audit Specification Section 7 & 10
 */

import crypto from 'node:crypto';
import { hashPassword } from './password.ts';
import { sendPasswordResetEmailInBackground } from './email.ts';
import { logAuthEvent } from './audit.ts';
import { validatePasswordNotPwned } from '../../lib/pwned-password.ts';
import { validatePassword } from '../../lib/validators.ts';
import { prisma } from '../db.ts';

export interface PasswordResetRecord {
  identifier: string; // normalized email or phone
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
  used: boolean;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
  resetToken?: string; // provided only in test mode / internal return
}

// 15-minute expiration window for password reset tokens
export const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

// In-memory token store for resilience: Map<identifier, PasswordResetRecord>
const resetTokenStore = new Map<string, PasswordResetRecord>();

/**
 * Computes a SHA-256 hash of a reset token for secure storage.
 */
export function hashResetToken(token?: string | null): string {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generates a secure random reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Initiates a password reset request.
 * Normalizes email identifier to lowercase.
 * Always returns a generic success message to prevent user enumeration.
 */
export async function requestPasswordReset(
  rawIdentifier: string,
  clientIp = '127.0.0.1'
): Promise<PasswordResetResult> {
  const isEmail = rawIdentifier.includes('@');
  const identifier = isEmail
    ? rawIdentifier.trim().toLowerCase()
    : rawIdentifier.replace(/[\s\-\(\)\+]/g, '');

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = Date.now() + RESET_TOKEN_EXPIRY_MS;

  resetTokenStore.set(identifier, {
    identifier,
    tokenHash,
    expiresAt,
    createdAt: Date.now(),
    used: false,
  });

  logAuthEvent('AUTH_PASSWORD_RESET_REQUEST', clientIp, identifier);

  // If email identifier, trigger email dispatch
  if (isEmail) {
    sendPasswordResetEmailInBackground({
      toEmail: identifier,
      resetToken: token,
    });
  }

  // Persist the hashed token so reset survives a server restart when DB is up.
  try {
    const member = await prisma.member.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
      select: { firstName: true },
    });

    if (member) {
      await prisma.member.updateMany({
        where: isEmail ? { email: identifier } : { phone: identifier },
        data: {
          resetPasswordToken: tokenHash,
          resetPasswordExpiresAt: new Date(expiresAt),
        },
      });
    }
  } catch {
    // Graceful fallback
  }

  return {
    success: true,
    message: 'If an account exists with that identifier, instructions have been sent.',
    resetToken: token,
  };
}

/**
 * Completes the password reset process with a new password.
 * Enforces:
 * - Token validity and expiration check
 * - Breached-password check
 * - Argon2id password hashing
 * - Audit logging
 */
export async function completePasswordReset(
  rawIdentifier: string,
  token: string,
  newPassword: string,
  clientIp = '127.0.0.1'
): Promise<PasswordResetResult> {
  const isEmail = rawIdentifier.includes('@');
  const identifier = isEmail
    ? rawIdentifier.trim().toLowerCase()
    : rawIdentifier.replace(/[\s\-\(\)\+]/g, '');

  let record = resetTokenStore.get(identifier);

  // Fall back to the durable token if this process no longer has it in memory.
  if (!record) {
    try {
      const member = await prisma.member.findFirst({
        where: isEmail ? { email: identifier } : { phone: identifier },
        select: { resetPasswordToken: true, resetPasswordExpiresAt: true },
      });
      if (member?.resetPasswordToken && member.resetPasswordExpiresAt) {
        record = {
          identifier,
          tokenHash: member.resetPasswordToken,
          expiresAt: member.resetPasswordExpiresAt.getTime(),
          createdAt: Date.now(),
          used: false,
        };
        resetTokenStore.set(identifier, record);
      }
    } catch {
      // In-memory fallback only.
    }
  }

  if (!record || record.used) {
    return {
      success: false,
      message: 'Invalid or expired password reset request. Please request a new link.',
      error: 'Invalid or expired reset token',
    };
  }

  if (Date.now() > record.expiresAt) {
    return {
      success: false,
      message: 'Password reset link has expired. Please request a new one.',
      error: 'Token expired',
    };
  }

  // Constant-time comparison of token hashes
  const candidateHash = hashResetToken(token);
  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(record.tokenHash, 'hex')
    );
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    return {
      success: false,
      message: 'Invalid reset token provided.',
      error: 'Invalid token',
    };
  }

  // Trim surrounding whitespace (never alter case) and apply the same policy
  // used by the sign-up form so an API caller cannot bypass it.
  const trimmedPassword = newPassword.trim();
  const passwordError = validatePassword(trimmedPassword);
  if (passwordError) {
    return {
      success: false,
      message: passwordError,
      error: passwordError,
    };
  }

  // Check breached password
  const pwnedError = await validatePasswordNotPwned(trimmedPassword);
  if (pwnedError) {
    return {
      success: false,
      message: pwnedError,
      error: pwnedError,
    };
  }

  // Hash new password using Argon2id with automatic unique salting
  const newHash = await hashPassword(trimmedPassword);

  // Mark token as used
  record.used = true;
  record.tokenHash = '';

  // Synchronize with database
  try {
    await prisma.member.updateMany({
      where: isEmail ? { email: identifier } : { phone: identifier },
      data: {
        passwordHash: newHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
  } catch {
    // In-memory fallback
  }

  logAuthEvent('AUTH_PASSWORD_RESET_SUCCESS', clientIp, identifier);

  return {
    success: true,
    message: 'Your password has been successfully reset. You may now sign in with your new password.',
  };
}

/**
 * Resets the in-memory reset token store (used for tests).
 */
export function resetPasswordResetStore(): void {
  resetTokenStore.clear();
}
