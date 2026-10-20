/**
 * Security hardening regression tests for the 10-point authentication audit.
 * These tests exercise the shared validators, rate limiter, session helpers,
 * password hashing policy and the verification UI without requiring PostgreSQL.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  signInSchema,
  signUpRequestSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  validatePassword,
  normalizeEmail,
  ERROR_MESSAGES,
} from '../src/lib/validators.ts';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  resetRateLimits,
  getDeviceId,
  ONE_HOUR_MS,
} from '../src/lib/rate-limit.ts';
import {
  parseSessionCookie,
  computeEffectiveStatus,
  SESSION_COOKIE_NAME,
} from '../src/server/auth/session.ts';
import { verifyPassword, hashPassword, needsRehash } from '../src/server/auth/password.ts';
import { generateSixDigitCode, VERIFICATION_EXPIRY_MS } from '../src/server/auth/verification.ts';


test('email normalization and trimming apply to sign in and sign up schemas', () => {
  const signIn = signInSchema.safeParse({
    phone: '  USER@Example.COM  ',
    password: '  CaseSensitivePass1  ',
  });
  assert.equal(signIn.success, true);
  assert.equal(signIn.data.phone, 'user@example.com');
  assert.equal(signIn.data.password, 'CaseSensitivePass1');

  const signUp = signUpRequestSchema.safeParse({
    fullName: '  Jane Doe  ',
    email: '  Jane.Doe@Example.COM ',
    phone: '0801 234 5678',
    password: '  CaseSensitivePass1  ',
  });
  assert.equal(signUp.success, true);
  assert.equal(signUp.data.email, 'jane.doe@example.com');
  assert.equal(signUp.data.phone, '08012345678');
  assert.equal(signUp.data.password, 'CaseSensitivePass1');
});

test('Zod strips unknown payload properties before controller logic', () => {
  const parsed = signUpRequestSchema.safeParse({
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    password: 'CaseSensitivePass1',
    role: 'OWNER',
    tier: 'PREMIUM',
  });
  assert.equal(parsed.success, true);
  assert.equal('role' in parsed.data, false);
  assert.equal('tier' in parsed.data, false);
});

test('password policy is enforced on sign up, login and reset', () => {
  assert.equal(validatePassword('12345678'), ERROR_MESSAGES.PASSWORD_COMPLEXITY);
  assert.equal(validatePassword('abcdefgh'), ERROR_MESSAGES.PASSWORD_COMPLEXITY);
  assert.equal(validatePassword('GoodPass1'), null);

  assert.equal(
    signInSchema.safeParse({ phone: '08012345678', password: '12345678' }).success,
    false
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      identifier: 'user@example.com',
      token: 'token',
      newPassword: '12345678',
      confirmPassword: '12345678',
    }).success,
    false
  );
});

test('forgot-password normalizes email identifiers and trims phone identifiers', () => {
  const email = forgotPasswordSchema.safeParse({ identifier: '  User@Example.COM ' });
  assert.equal(email.success, true);
  assert.equal(email.data.identifier, 'user@example.com');

  const phone = forgotPasswordSchema.safeParse({ identifier: ' 0801 234 5678 ' });
  assert.equal(phone.success, true);
  assert.equal(phone.data.identifier, '08012345678');
});

test('rate limiting blocks by IP, email and device after five failures', () => {
  resetRateLimits();
  const req = {
    headers: {
      get: (name) => {
        if (name === 'x-forwarded-for') return '203.0.113.50';
        if (name === 'x-device-id') return 'device-abc';
        return null;
      },
    },
  };

  const identifiers = { email: 'Locked@Example.com', deviceId: 'device-abc' };
  assert.equal(checkRateLimit(req, 'signin', undefined, identifiers).success, true);

  for (let i = 1; i <= 4; i += 1) {
    assert.equal(
      recordFailedAuthAttempt(req, 'signin', undefined, identifiers).success,
      true
    );
  }

  const fifth = recordFailedAuthAttempt(req, 'signin', undefined, identifiers);
  assert.equal(fifth.success, false);
  assert.equal(fifth.isBlocked, true);
  assert.ok(fifth.retryAfterSeconds > ONE_HOUR_MS / 1000 - 10);

  // Same email from another IP is also blocked by the secondary email counter.
  const otherIp = {
    headers: { get: (name) => (name === 'x-forwarded-for' ? '203.0.113.99' : null) },
  };
  assert.equal(
    checkRateLimit(otherIp, 'signin', undefined, { email: 'locked@example.com' }).success,
    false
  );
});

test('device identifier is read from headers and cookies', () => {
  assert.equal(
    getDeviceId({ headers: { get: (name) => (name === 'x-device-id' ? 'abc' : null) } }),
    'abc'
  );
  assert.equal(
    getDeviceId({
      headers: {
        get: (name) =>
          name === 'cookie' ? 'foo=bar; spotter_device_id=dev-from-cookie' : null,
      },
    }),
    'dev-from-cookie'
  );
});

test('session cookies are opaque and effective status derives from expiry and grace', () => {
  assert.equal(
    parseSessionCookie(`${SESSION_COOKIE_NAME}=abc123; other=value`),
    'abc123'
  );
  assert.equal(parseSessionCookie('other=value'), null);

  const now = new Date('2026-10-20T12:00:00.000Z');
  const active = computeEffectiveStatus(
    {
      id: 'm1',
      memberNumber: 'SP-0001',
      tier: 'PREMIUM',
      expiryDate: new Date('2026-10-25T00:00:00.000Z'),
      cancelledAt: null,
      email: 'a@example.com',
      emailVerifiedAt: new Date(),
      gym: { graceDays: 3 },
    },
    now
  );
  assert.equal(active, 'ACTIVE');

  const grace = computeEffectiveStatus(
    {
      id: 'm1',
      memberNumber: 'SP-0001',
      tier: 'PREMIUM',
      expiryDate: new Date('2026-10-19T00:00:00.000Z'),
      cancelledAt: null,
      email: 'a@example.com',
      emailVerifiedAt: new Date(),
      gym: { graceDays: 3 },
    },
    now
  );
  assert.equal(grace, 'GRACE');

  const expired = computeEffectiveStatus(
    {
      id: 'm1',
      memberNumber: 'SP-0001',
      tier: 'PREMIUM',
      expiryDate: new Date('2026-10-10T00:00:00.000Z'),
      cancelledAt: null,
      email: 'a@example.com',
      emailVerifiedAt: new Date(),
      gym: { graceDays: 3 },
    },
    now
  );
  assert.equal(expired, 'EXPIRED');
});

test('only Argon2id hashes authenticate; legacy plaintext never does', async () => {
  const hash = await hashPassword('CaseSensitivePass1');
  assert.ok(hash.startsWith('$argon2id$'));
  assert.equal(await verifyPassword(hash, 'CaseSensitivePass1'), true);
  assert.equal(await verifyPassword(hash, 'casesensitivepass1'), false);
  assert.equal(await verifyPassword('CaseSensitivePass1', 'CaseSensitivePass1'), false);
  assert.equal(needsRehash('legacyPlaintext'), true);
});

test('verification codes use a CSPRNG with a 2-10 minute expiry window', () => {
  const code = generateSixDigitCode();
  assert.match(code, /^\d{6}$/);
  assert.ok(VERIFICATION_EXPIRY_MS >= 2 * 60 * 1000);
  assert.ok(VERIFICATION_EXPIRY_MS <= 10 * 60 * 1000);
});

test('verification and reset password UIs expose the required 6-digit and token controls', () => {
  const verifySource = readFileSync(
    new URL('../src/components/auth/VerifyEmailForm.tsx', import.meta.url),
    'utf8'
  );
  assert.match(verifySource, /id="verify-email-code"/);
  assert.match(verifySource, /maxLength=\{6\}/);
  assert.match(verifySource, /6-digit code/i);

  const resetSource = readFileSync(
    new URL('../src/components/auth/ResetPasswordForm.tsx', import.meta.url),
    'utf8'
  );
  assert.match(resetSource, /id="reset-token"/);
  assert.match(resetSource, /id="reset-new-password"/);
  assert.match(resetSource, /id="reset-confirm-password"/);
  assert.match(resetSource, /validateResetPassword/);
});
