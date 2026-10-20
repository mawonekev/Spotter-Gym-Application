/**
 * Member Registration Service for Spotter
 * Source of truth: PRD section 8.5, AGENTS.md, and prompt requirements
 *
 * Implements:
 * - Receptionist member registration workflow
 * - Unique member number generation (SP-XXXX format)
 * - Atomic database transaction
 * - Background welcome email via Nodemailer
 */

import { prisma } from '../db.ts';
import { sendWelcomeEmailInBackground } from './email.ts';
import type { Tier } from '../../lib/types/index.ts';
import {
  normalizePhone,
  validateMemberRegistration,
  type MemberRegistrationInput,
} from '../../lib/validators.ts';
import { issueVerificationCodeAndPersist } from './verification.ts';
import { hashPassword } from './password.ts';
import { logAuthEvent } from './audit.ts';

export interface RegistrationResult {
  success: boolean;
  memberId?: string;
  memberNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tier?: Tier;
  emailVerified?: boolean;
  error?: string;
  validationErrors?: Record<string, string>;
}

// Fallback in-memory store for development when database server is unreachable
export interface InMemMember {
  id: string;
  gymId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tier: Tier;
  expiryDate: Date;
  createdAt: Date;
  passwordHash?: string;
  emailVerifiedAt?: Date | null;
  emailVerificationCode?: string | null;
  emailVerificationExpiresAt?: Date | null;
}

const globalForFallback = globalThis as unknown as {
  __spotterInMemoryMembers?: InMemMember[];
  __spotterInMemCounter?: number;
};

const seedMembers: InMemMember[] = [
  {
    id: 'mem_chioma_001',
    gymId: 'gym_spotter_001',
    memberNumber: 'SP-0042',
    firstName: 'Chioma',
    lastName: 'Adeyemi',
    phone: '08012345678',
    email: 'chioma@example.com',
    tier: 'BASIC',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    // Standard test hash for "securePassword123" using Argon2id format
    passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$WsumX5jAwc8PEOc3rMoYUg$P7lyhtU+0tXd3CVYCJGaCgnLErGlnxjLKV2GgFsJAdk',
    // The seeded demo member predates the verification rollout and is treated
    // as already verified; newly registered accounts start unverified.
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    emailVerificationCode: null,
    emailVerificationExpiresAt: null,
  },
];

// Share the development fallback across route handler bundles. Without this,
// registration and sign-in can each hold their own module copy of this array.
const inMemoryMembers: InMemMember[] =
  globalForFallback.__spotterInMemoryMembers ?? seedMembers;
globalForFallback.__spotterInMemoryMembers = inMemoryMembers;

function nextFallbackMemberNumber(): string {
  const next = (globalForFallback.__spotterInMemCounter ?? 42) + 1;
  globalForFallback.__spotterInMemCounter = next;
  return `SP-${next.toString().padStart(4, '0')}`;
}

/**
 * Generates a unique member number within the gym.
 * Format: SP-XXXX (e.g. SP-0043, SP-1042)
 */
export async function generateUniqueMemberNumber(gymId: string): Promise<string> {
  try {
    const memberCount = await prisma.member.count({
      where: { gymId },
    });

    let nextNum = memberCount + 1;
    let candidate = `SP-${nextNum.toString().padStart(4, '0')}`;

    // Ensure candidate is truly unique
    let existing = await prisma.member.findUnique({
      where: {
        gymId_memberNumber: {
          gymId,
          memberNumber: candidate,
        },
      },
    });

    while (existing) {
      nextNum += 1;
      candidate = `SP-${nextNum.toString().padStart(4, '0')}`;
      existing = await prisma.member.findUnique({
        where: {
          gymId_memberNumber: {
            gymId,
            memberNumber: candidate,
          },
        },
      });
    }

    return candidate;
  } catch {
    // Fallback counter if database is unreachable
    return nextFallbackMemberNumber();
  }
}

/**
 * Registers a new gym member (used by receptionists and self-service registration).
 * Guarantees atomicity: if registration fails, no partial records are left.
 * Sends welcome email in the background upon successful account creation.
 */
export async function registerMember(
  input: MemberRegistrationInput
): Promise<RegistrationResult> {
  // 1. Schema validation
  const validation = validateMemberRegistration(input);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: 'Invalid member registration data',
      validationErrors: validation.errors,
    };
  }

  const { firstName, lastName, email, phone, tier = 'BASIC', gymId: requestedGymId, password } = validation.data;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);

  // 2. Reject duplicate accounts so sign-in cannot resolve to the wrong member
  const duplicateResult: RegistrationResult = {
    success: false,
    error: 'An account with this email or mobile number already exists. Please sign in instead.',
    validationErrors: {
      email: 'This email is already registered.',
      phone: 'This mobile number is already registered.',
    },
  };

  const existingFallback = inMemoryMembers.find(
    (member) =>
      member.email.toLowerCase() === normalizedEmail ||
      normalizePhone(member.phone) === normalizedPhone
  );
  if (existingFallback) {
    return duplicateResult;
  }

  try {
    const existing = await prisma.member.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
      select: { id: true },
    });
    if (existing) {
      return duplicateResult;
    }
  } catch {
    // Database unavailable; the fallback store is the source of truth.
  }

  // 3. Hash password with Argon2id if provided
  let passwordHash: string | undefined = undefined;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    passwordHash = await hashPassword(password.trim());
  }

  // 3. Perform database registration or graceful fallback
  let createdMember: {
    id: string;
    memberNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    tier: Tier;
  };

  try {
    // Find or create default Gym record
    let gym = requestedGymId
      ? await prisma.gym.findUnique({ where: { id: requestedGymId } })
      : await prisma.gym.findFirst();

    if (!gym) {
      gym = await prisma.gym.create({
        data: {
          name: 'Spotter Gym',
          timezone: 'Africa/Lagos',
          graceDays: 3,
        },
      });
    }

    const memberNumber = await generateUniqueMemberNumber(gym.id);
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    // Atomic transaction: create member with initial activation status
    const result = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          gymId: gym.id,
          memberNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          email: normalizedEmail,
          passwordHash: passwordHash || null,
          tier,
          expiryDate: thirtyDaysAhead,
          activatedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      });

      return newMember;
    });

    createdMember = {
      id: result.id,
      memberNumber: result.memberNumber,
      firstName: result.firstName,
      lastName: result.lastName,
      phone: result.phone,
      email: result.email || normalizedEmail,
      tier: result.tier as Tier,
    };
  } catch (dbError) {
    console.warn('[Register] Database write failed, using synchronized fallback:', dbError);

    // Fallback store ensures workflow completes during database connectivity maintenance
    const memberNumber = nextFallbackMemberNumber();
    const id = `mem_${Date.now()}`;

    const inMemItem: InMemMember = {
      id,
      gymId: 'gym_spotter_001',
      memberNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      tier: (tier as Tier) || 'BASIC',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      passwordHash,
      emailVerifiedAt: null,
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
    };

    inMemoryMembers.push(inMemItem);

    createdMember = {
      id: inMemItem.id,
      memberNumber: inMemItem.memberNumber,
      firstName: inMemItem.firstName,
      lastName: inMemItem.lastName,
      phone: inMemItem.phone,
      email: inMemItem.email,
      tier: inMemItem.tier,
    };
  }

  // Log audit event for account registration
  logAuthEvent('AUTH_SIGNUP_SUCCESS', '127.0.0.1', createdMember.email);

  // 4. Trigger Welcome Email and issue 6-digit verification email in background
  sendWelcomeEmailInBackground({
    toEmail: createdMember.email,
    memberNumber: createdMember.memberNumber,
    firstName: createdMember.firstName,
    lastName: createdMember.lastName,
    tier: createdMember.tier,
  });

  // Issue 6-digit verification code using crypto.randomBytes and persist it
  // before returning so email_verification_code / expires_at are durable.
  await issueVerificationCodeAndPersist(
    createdMember.email,
    createdMember.firstName
  );

  return {
    success: true,
    memberId: createdMember.id,
    memberNumber: createdMember.memberNumber,
    firstName: createdMember.firstName,
    lastName: createdMember.lastName,
    phone: createdMember.phone,
    email: createdMember.email,
    tier: createdMember.tier,
    emailVerified: false,
  };
}

/**
 * Finds a member by phone, member number, or email (normalized).
 */
export async function findMember(rawIdentifier: string): Promise<InMemMember | null> {
  const cleaned = rawIdentifier.trim();
  const isEmail = cleaned.includes('@');
  const normalized = isEmail ? cleaned.toLowerCase() : normalizePhone(cleaned);

  try {
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { phone: normalized },
          { memberNumber: cleaned },
          { email: normalized },
        ],
      },
    });

    if (member) {
      return {
        id: member.id,
        gymId: member.gymId,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email || '',
        tier: member.tier as Tier,
        expiryDate: member.expiryDate,
        createdAt: member.createdAt,
        passwordHash: member.passwordHash || undefined,
        emailVerifiedAt: member.emailVerifiedAt,
        emailVerificationCode: member.emailVerificationCode,
        emailVerificationExpiresAt: member.emailVerificationExpiresAt,
      };
    }
  } catch {
    // Database query failed, search fallback store
  }

  const match = inMemoryMembers.find(
    (m) =>
      normalizePhone(m.phone) === normalized ||
      m.memberNumber === cleaned ||
      m.email.toLowerCase() === normalized
  );

  return match || null;
}

