/**
 * Member Sign-In Service for Spotter
 * Source of truth: PRD section 6.1, .agent/rules/auth.md, Security Audit Section 6 & 11
 */

import { validateSignIn, type SignInValues } from '../../lib/validators.ts';
import { findMember } from './register.ts';
import { verifyPassword } from './password.ts';
import {
  hasPendingVerification,
  isEmailVerified,
  issueVerificationCode,
} from './verification.ts';
import { logAuthEvent } from './audit.ts';
import type { Tier, EffectiveStatus } from '../../lib/types/index.ts';

export interface SignInResult {
  success: boolean;
  memberId?: string;
  memberNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  requiresEmailVerification?: boolean;
  effectiveTier?: Tier;
  effectiveStatus?: EffectiveStatus;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Authenticates a gym member by mobile number, member number, or email and password.
 * Preserves exact password semantics (no automatic trimming on login).
 * Verifies password using Argon2id.
 * Emits audit log events for sign-in success and failure.
 */
export async function authenticateMember(
  input: SignInValues,
  clientIp = '127.0.0.1'
): Promise<SignInResult> {
  // 1. Validate inputs
  const validation = validateSignIn(input);
  if (!validation.success || !validation.data) {
    logAuthEvent('AUTH_SIGNIN_FAILURE', clientIp, undefined, { reason: 'Validation failed' });
    return {
      success: false,
      error: 'Please enter a valid mobile number or email and password.',
      validationErrors: validation.errors,
    };
  }

  const { phone, password } = validation.data;

  // 2. Look up member (by phone, member number, or normalized email)
  const member = await findMember(phone);
  if (!member) {
    logAuthEvent('AUTH_SIGNIN_FAILURE', clientIp, phone, { reason: 'Member not found' });
    return {
      success: false,
      error: 'No active gym record found for this identifier. Please check your details or contact the front desk.',
    };
  }

  // 3. Verify password using Argon2id verification. A member without a password
  // hash must never authenticate (otherwise any password would be accepted).
  if (!member.passwordHash) {
    logAuthEvent('AUTH_SIGNIN_FAILURE', clientIp, phone, {
      reason: 'Password sign-in not configured',
    });
    return {
      success: false,
      error:
        'Password sign-in is not set up for this member. Please contact the front desk or use password reset.',
    };
  }

  const isPasswordValid = await verifyPassword(member.passwordHash, password);
  if (!isPasswordValid) {
    logAuthEvent('AUTH_SIGNIN_FAILURE', clientIp, phone, { reason: 'Invalid password' });
    return {
      success: false,
      error: 'Invalid password. Please check your credentials and try again.',
    };
  }

  // 4. Unverified accounts are restricted until email_verified_at is populated.
  const emailVerified =
    member.emailVerifiedAt != null || isEmailVerified(member.email);

  if (member.email && !emailVerified) {
    const verificationPending =
      member.emailVerificationCode != null || hasPendingVerification(member.email);

    if (!verificationPending) {
      // Re-issue a code if the previous one expired or was cleared so the member
      // can still complete verification instead of being permanently locked out.
      issueVerificationCode(member.email, member.firstName);
    }

    logAuthEvent('AUTH_SIGNIN_FAILURE', clientIp, phone, {
      reason: 'Email verification pending',
    });
    return {
      success: false,
      requiresEmailVerification: true,
      email: member.email,
      error:
        'Please verify your email address before signing in. Enter the 6-digit code sent to your email.',
    };
  }

  // 5. Compute effective status & tier
  const now = new Date();
  const effectiveStatus: EffectiveStatus =
    member.expiryDate > now ? 'ACTIVE' : 'EXPIRED';

  const effectiveTier: Tier =
    effectiveStatus === 'ACTIVE'
      ? member.tier
      : 'BASIC';

  logAuthEvent('AUTH_SIGNIN_SUCCESS', clientIp, phone);

  return {
    success: true,
    memberId: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    emailVerified,
    effectiveTier,
    effectiveStatus,
  };
}
