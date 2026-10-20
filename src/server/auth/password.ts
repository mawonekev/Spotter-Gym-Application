/**
 * Password Hashing and Verification Service
 * Uses Argon2id algorithm with automatic unique salt generation per password.
 * Source of truth: Security Audit Specification Section 6, .agent/rules/auth.md
 */

import { hash, verify, type Options } from '@node-rs/argon2';

/**
 * Recommended Argon2id parameters:
 * - memoryCost: 19456 KiB (~19 MiB)
 * - timeCost: 2 iterations
 * - parallelism: 1 thread
 * - algorithm: Argon2id (numeric enum value 2)
 */
const DEFAULT_ARGON2_OPTIONS: Options = {
  algorithm: 2, // Algorithm.Argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hashes a plaintext password using Argon2id with a cryptographically unique salt.
 * Plaintext passwords are never logged or stored.
 */
export async function hashPassword(
  password: string,
  customOptions?: Partial<Options>
): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Cannot hash empty or invalid password');
  }

  const options: Options = {
    ...DEFAULT_ARGON2_OPTIONS,
    ...customOptions,
  };

  return hash(password, options);
}

/**
 * Verifies a plaintext candidate password against a stored Argon2id hash.
 * Constant-time comparison is handled by the Argon2 library.
 *
 * Only encoded Argon2id hashes are accepted. Legacy plaintext, MD5, SHA-256 and
 * bcrypt values never authenticate: accounts holding them must reset their
 * password. This prevents a downgrade back to an unsafe hashing scheme.
 */
export async function verifyPassword(
  storedHash: string,
  candidatePassword: string
): Promise<boolean> {
  if (!storedHash || !candidatePassword) {
    return false;
  }

  if (!storedHash.startsWith('$argon2id$')) {
    return false;
  }

  try {
    return await verify(storedHash, candidatePassword);
  } catch {
    // Log safe error without logging password or hash values
    console.warn('[Auth Security] Password verification error encountered');
    return false;
  }
}

/**
 * Determines whether a stored password hash needs re-hashing with Argon2id.
 */
export function needsRehash(storedHash: string): boolean {
  if (!storedHash) return true;
  return !storedHash.startsWith('$argon2id');
}
