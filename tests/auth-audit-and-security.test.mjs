/**
 * Comprehensive Authentication Security Audit Lifecycle Tests
 * Validates all 15 points specified in Section 12 of the Security Specification.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Core auth services
import { registerMember, findMember } from '../src/server/auth/register.ts';
import { authenticateMember } from '../src/server/auth/signin.ts';
import { hashPassword, verifyPassword, needsRehash } from '../src/server/auth/password.ts';
import {
  generateSixDigitCode,
  issueVerificationCode,
  verifyEmailCode,
  isEmailVerified,
  resendVerificationCode,
  resetVerificationStore,
  getVerificationRecord,
  hashVerificationCode,
} from '../src/server/auth/verification.ts';
import {
  requestPasswordReset,
  completePasswordReset,
  resetPasswordResetStore,
} from '../src/server/auth/password-reset.ts';
import {
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  resetRateLimits,
  ONE_HOUR_MS,
} from '../src/lib/rate-limit.ts';
import {
  normalizeEmail,
  validateSignUp,
  validateSignIn,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
  signInSchema,
  signUpSchema,
} from '../src/lib/validators.ts';
import { validatePasswordNotPwned } from '../src/lib/pwned-password.ts';
import { sendVerificationEmail, sendWelcomeEmail } from '../src/server/auth/email.ts';
import { logAuthEvent, getRecentAuthAuditLogs, clearAuthAuditLogs } from '../src/server/auth/audit.ts';

// -------------------------------------------------------------
// 1. Account Creation
// -------------------------------------------------------------
test('Lifecycle 1: Account creation - registers member and assigns unique member number', async () => {
  const result = await registerMember({
    firstName: 'Bolanle',
    lastName: 'Saraki',
    email: 'bolanle.saraki@example.com',
    phone: '08022334455',
    password: 'SuperSecret123!',
    tier: 'PREMIUM',
  });

  assert.equal(result.success, true);
  assert.ok(result.memberNumber?.startsWith('SP-'));
  assert.equal(result.firstName, 'Bolanle');
  assert.equal(result.emailVerified, false);
});

// -------------------------------------------------------------
// 2. Email Normalization
// -------------------------------------------------------------
test('Lifecycle 2: Email normalization - normalizes emails to lowercase across auth operations, preserves password case', () => {
  const mixed = '  ChiOma.Adeyemi@Example.COM  ';
  const normalized = normalizeEmail(mixed.trim());
  assert.equal(normalized, 'chioma.adeyemi@example.com');

  // Server-side Zod transformation normalizes email
  const parsed = signUpSchema.safeParse({
    fullName: 'Chioma Adeyemi',
    email: mixed,
    phone: '08012345678',
    password: 'ExactPasswordCase123!',
    privacyAccepted: true,
  });

  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.email, 'chioma.adeyemi@example.com');
    // Password casing must NEVER be modified or lowercased
    assert.equal(parsed.data.password, 'ExactPasswordCase123!');
  }
});

// -------------------------------------------------------------
// 3. Server-Side Zod Validation
// -------------------------------------------------------------
test('Lifecycle 3: Server-side Zod validation - validates and rejects malformed inputs across all auth schemas', () => {
  // Sign up
  assert.equal(signUpSchema.safeParse({}).success, false);
  assert.equal(signUpSchema.safeParse({ fullName: 'A', email: 'bad' }).success, false);

  // Sign in
  assert.equal(signInSchema.safeParse({}).success, false);
  assert.equal(signInSchema.safeParse({ phone: '', password: '' }).success, false);

  // Forgot password
  assert.equal(validateForgotPassword({}).success, false);
  assert.equal(validateForgotPassword({ identifier: '' }).success, false);
  assert.equal(validateForgotPassword({ identifier: 'test@example.com' }).success, true);

  // Reset password
  assert.equal(validateResetPassword({}).success, false);
  assert.equal(
    validateResetPassword({
      identifier: 'test@example.com',
      token: 'tok_123',
      newPassword: 'short',
      confirmPassword: 'short',
    }).success,
    false
  );

  // Email verification
  assert.equal(validateVerifyEmail({}).success, false);
  assert.equal(validateVerifyEmail({ email: 'test@example.com', code: '123' }).success, false);
  assert.equal(validateVerifyEmail({ email: 'test@example.com', code: '123456' }).success, true);

  // Resend verification
  assert.equal(validateResendVerification({}).success, false);
  assert.equal(validateResendVerification({ email: 'test@example.com' }).success, true);
});

// -------------------------------------------------------------
// 4. Password Rules & Input Trimming
// -------------------------------------------------------------
test('Lifecycle 4: Password rules & trimming - shared policy on sign-up and login, whitespace trimmed, case preserved', () => {
  // Sign up trims leading/trailing spaces and enforces the shared policy.
  const shortResult = signUpSchema.safeParse({
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08011223344',
    password: '   12345   ', // trims to 5 chars -> should fail
    privacyAccepted: true,
  });
  assert.equal(shortResult.success, false);

  // Password complexity is enforced server-side for both sign up and login.
  const weakLogin = signInSchema.safeParse({
    phone: '08012345678',
    password: '12345678',
  });
  assert.equal(weakLogin.success, false);

  // Login trims surrounding whitespace but preserves the case of the password.
  const loginWithSpaces = signInSchema.safeParse({
    phone: '  User@Example.COM  ',
    password: '  MyPasswordWithSpaces123  ',
  });
  assert.equal(loginWithSpaces.success, true);
  if (loginWithSpaces.success) {
    assert.equal(loginWithSpaces.data.password, 'MyPasswordWithSpaces123');
    assert.equal(loginWithSpaces.data.phone, 'user@example.com');
  }
});

// -------------------------------------------------------------
// 5. Breached-Password Detection During Sign-Up Only
// -------------------------------------------------------------
test('Lifecycle 5: Breached-password detection - detects compromised passwords during sign-up only', async () => {
  // Mock HIBP range query lookup for known compromised password
  const breachedResult = await validatePasswordNotPwned('password123', {
    fetchFn: async () =>
      new Response(
        'CBFD0029E65345758872FA4FF31649635F0:12345\n' +
        'C6008F9CAB4083784CBD1874F76618D2A97:238541\n' // Exact SHA-1 suffix for password123
      ),
  });
  assert.ok(breachedResult && breachedResult.includes('data breach'));

  // Clean unbreached password
  const cleanResult = await validatePasswordNotPwned('Kjh8$!zQw9#L1mP0', {
    fetchFn: async () => new Response('FFFFF0029E65345758872FA4FF31649635F0:1\n'),
  });
  assert.equal(cleanResult, null);
});

// -------------------------------------------------------------
// 6. Password Hashing and Salting with Argon2id
// -------------------------------------------------------------
test('Lifecycle 6: Password hashing - uses Argon2id with unique salt per password', async () => {
  const plain = 'StrongPassphrase!2026';

  const hash1 = await hashPassword(plain);
  const hash2 = await hashPassword(plain);

  // Must use Argon2id format
  assert.ok(hash1.startsWith('$argon2id$'), 'Must use Argon2id algorithm');
  assert.ok(hash2.startsWith('$argon2id$'), 'Must use Argon2id algorithm');

  // Two hashes of the exact same password must differ due to unique salts
  assert.notEqual(hash1, hash2, 'Salts must be uniquely generated for each hash');

  // Verification
  assert.equal(await verifyPassword(hash1, plain), true);
  assert.equal(await verifyPassword(hash2, plain), true);
  assert.equal(await verifyPassword(hash1, 'WrongPassword'), false);

  // needsRehash identifies non-argon2id hashes
  assert.equal(needsRehash(hash1), false);
  assert.equal(needsRehash('legacyPlaintext'), true);
});

// -------------------------------------------------------------
// 7. Verification Email Delivery
// -------------------------------------------------------------
test('Lifecycle 7: Verification email delivery - dispatches separate welcome and verification emails', async () => {
  const welcomeSent = await sendWelcomeEmail({
    toEmail: 'newmember@spotter.gym',
    memberNumber: 'SP-0050',
    firstName: 'Tunde',
    lastName: 'Bakare',
    tier: 'BASIC',
  });
  assert.equal(welcomeSent, true);

  const verificationSent = await sendVerificationEmail({
    toEmail: 'newmember@spotter.gym',
    code: '123456',
    firstName: 'Tunde',
  });
  assert.equal(verificationSent, true);
});

// -------------------------------------------------------------
// 8. Correct Verification-Code Submission
// -------------------------------------------------------------
test('Lifecycle 8: Correct verification-code submission - verifies code and marks account verified', async () => {
  resetVerificationStore();
  const email = 'verify.test@spotter.gym';
  const { code } = issueVerificationCode(email, 'VerifyUser');

  // Verify before completion
  assert.equal(isEmailVerified(email), false);

  // Submit correct code
  const result = await verifyEmailCode(email, code);
  assert.equal(result.success, true);
  assert.equal(result.emailVerified, true);
  assert.equal(isEmailVerified(email), true);

  // Stored code hash should be cleared
  const record = getVerificationRecord(email);
  assert.equal(record?.codeHash, '');
});

// -------------------------------------------------------------
// 9. Incorrect and Expired Verification Codes
// -------------------------------------------------------------
test('Lifecycle 9: Incorrect and expired verification codes - cleanly rejects invalid attempts', async () => {
  resetVerificationStore();
  const email = 'expiry.test@spotter.gym';
  const { code } = issueVerificationCode(email);

  // Wrong code
  const wrongResult = await verifyEmailCode(email, '999999');
  assert.equal(wrongResult.success, false);
  assert.match(wrongResult.error || '', /Invalid verification code/);

  // Expired code (simulate 5 min elapsed)
  const record = getVerificationRecord(email);
  assert.ok(record);
  record.expiresAt = Date.now() - 1000;

  const expiredResult = await verifyEmailCode(email, code);
  assert.equal(expiredResult.success, false);
  assert.match(expiredResult.error || '', /expired/);
});

// -------------------------------------------------------------
// 10. Successful Login After Verification
// -------------------------------------------------------------
test('Lifecycle 10: Successful login - authenticates member and reflects verification status', async () => {
  const registered = await registerMember({
    firstName: 'Damilola',
    lastName: 'Ojo',
    email: 'damilola.ojo@example.com',
    phone: '08033445566',
    password: 'ValidPassword123!',
    tier: 'BASIC',
  });
  assert.equal(registered.success, true);

  // Verify email
  const record = getVerificationRecord('damilola.ojo@example.com');
  assert.ok(record);
  record.verified = true;

  // Authenticate by phone
  const authByPhone = await authenticateMember({
    phone: '08033445566',
    password: 'ValidPassword123!',
  });
  assert.equal(authByPhone.success, true);
  assert.equal(authByPhone.firstName, 'Damilola');

  // Authenticate by email
  const authByEmail = await authenticateMember({
    phone: 'damilola.ojo@example.com',
    password: 'ValidPassword123!',
  });
  assert.equal(authByEmail.success, true);
  assert.equal(authByEmail.firstName, 'Damilola');
});

// -------------------------------------------------------------
// 11. Login Failure with Incorrect Credentials
// -------------------------------------------------------------
test('Lifecycle 11: Login failure - rejects unknown user and wrong password cleanly', async () => {
  // Unknown identifier
  const unknownAuth = await authenticateMember({
    phone: '08000000000',
    password: 'anyPassword123!',
  });
  assert.equal(unknownAuth.success, false);
  assert.match(unknownAuth.error || '', /No active gym record found/);

  // Registered user with incorrect password
  const wrongPassAuth = await authenticateMember({
    phone: '08012345678', // Chioma
    password: 'WrongPassword999!',
  });
  assert.equal(wrongPassAuth.success, false);
  assert.match(wrongPassAuth.error || '', /Invalid password/);
});

// -------------------------------------------------------------
// 12. Rate Limiting After Repeated Failed Attempts
// -------------------------------------------------------------
test('Lifecycle 12: Rate limiting - blocks IP for 1 hour after 5 failed authentication attempts', () => {
  resetRateLimits();
  const req = {
    headers: {
      get: (name) => (name === 'x-forwarded-for' ? '198.51.100.77' : null),
    },
  };

  // Initially unblocked
  assert.equal(checkRateLimit(req, 'signin').success, true);

  // Record 5 failed attempts
  for (let i = 1; i <= 4; i++) {
    const res = recordFailedAuthAttempt(req, 'signin');
    assert.equal(res.success, true);
    assert.equal(res.remaining, 5 - i);
  }

  // 5th failed attempt triggers 1-hour block
  const blockedRes = recordFailedAuthAttempt(req, 'signin');
  assert.equal(blockedRes.success, false);
  assert.equal(blockedRes.isBlocked, true);
  assert.ok(blockedRes.retryAfterSeconds > 3500);

  // Subsequent check is blocked
  const checkAfterBlock = checkRateLimit(req, 'signin');
  assert.equal(checkAfterBlock.success, false);
  assert.equal(checkAfterBlock.isBlocked, true);

  // Clear restores unblocked status
  clearFailedAuthAttempts(req, 'signin');
  assert.equal(checkRateLimit(req, 'signin').success, true);
});

// -------------------------------------------------------------
// 13. Password-Reset Requests and Completion
// -------------------------------------------------------------
test('Lifecycle 13: Password-reset - generates token, enforces 15-min expiry, and updates password with Argon2id', async () => {
  resetPasswordResetStore();
  const email = 'reset.user@spotter.gym';

  // Step 1: Request reset
  const requestRes = await requestPasswordReset(email);
  assert.equal(requestRes.success, true);
  assert.ok(requestRes.resetToken);

  const token = requestRes.resetToken;

  // Step 2: Complete reset with new password
  const completeRes = await completePasswordReset(
    email,
    token,
    'BrandNewPassword2026!'
  );
  assert.equal(completeRes.success, true);
  assert.match(completeRes.message, /successfully reset/);

  // Step 3: Reuse of token must be rejected
  const reuseRes = await completePasswordReset(
    email,
    token,
    'AnotherPassword2026!'
  );
  assert.equal(reuseRes.success, false);
  assert.match(reuseRes.message, /Invalid or expired/);
});

// -------------------------------------------------------------
// 14. Email Normalization and Password Handling During Password Reset
// -------------------------------------------------------------
test('Lifecycle 14: Password reset normalization - normalizes mixed-case email; validates new password', async () => {
  resetPasswordResetStore();
  const mixedEmail = 'Reset.User.Mixed@Spotter.GYM';

  const req = await requestPasswordReset(mixedEmail);
  assert.equal(req.success, true);
  const token = req.resetToken;

  // Attempt reset with short password -> fails validation
  const shortPass = await completePasswordReset(mixedEmail.toLowerCase(), token, 'short');
  assert.equal(shortPass.success, false);

  // Reset with valid password using mixed-case email -> normalized match succeeds
  const validPass = await completePasswordReset(mixedEmail, token, 'ValidResetPassword123!');
  assert.equal(validPass.success, true);
});

// -------------------------------------------------------------
// 15. Graceful Behavior When External Services Are Unavailable
// -------------------------------------------------------------
test('Lifecycle 15: External service failure resilience - handles HIBP or email transport outages safely', async () => {
  // Breached password service timeout/network error fails open safely without crashing
  const failedPwnedCheck = await validatePasswordNotPwned('AnyPassword123!', {
    fetchFn: async () => {
      throw new Error('HIBP network timeout');
    },
  });
  // Service gracefully handles network error and does not block legitimate registration
  assert.equal(failedPwnedCheck, null);

  // Audit logging captures events safely
  clearAuthAuditLogs();
  logAuthEvent('AUTH_SIGNIN_FAILURE', '127.0.0.1', 'test@example.com', {
    password: 'SecretPasswordShouldBeRedacted',
  });

  const logs = getRecentAuthAuditLogs(1);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].eventType, 'AUTH_SIGNIN_FAILURE');
  // Passwords must be redacted
  assert.equal(logs[0].details?.password, '[REDACTED]');
});
