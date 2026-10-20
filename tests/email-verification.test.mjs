import test from 'node:test';
import assert from 'node:assert/strict';
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
import { registerMember } from '../src/server/auth/register.ts';

test('generateSixDigitCode - generates cryptographically random 6-digit numeric strings', () => {
  const codes = new Set();
  for (let i = 0; i < 50; i++) {
    const code = generateSixDigitCode();
    assert.equal(typeof code, 'string');
    assert.equal(code.length, 6, `Code "${code}" must be exactly 6 characters`);
    assert.match(code, /^\d{6}$/, `Code "${code}" must contain only 6 digits`);
    codes.add(code);
  }

  // Across 50 iterations, randomBytes should generate overwhelmingly unique values
  assert.ok(codes.size > 40, 'Codes should have high cryptographic entropy');
});

test('issueVerificationCode - creates pending record and sets 5-minute expiration with SHA-256 hash', () => {
  resetVerificationStore();
  const email = 'Chioma.Adeyemi@Example.COM';
  const { code, expiresAt } = issueVerificationCode(email, 'Chioma');

  assert.match(code, /^\d{6}$/);
  assert.ok(expiresAt > Date.now());
  // Expiration is 5 minutes in the future per Security Specification Section 10
  const diffMinutes = (expiresAt - Date.now()) / (60 * 1000);
  assert.ok(diffMinutes >= 4 && diffMinutes <= 6, `Expected ~5 min expiry, got ${diffMinutes}`);

  const record = getVerificationRecord(email);
  assert.ok(record);
  assert.equal(record.email, 'chioma.adeyemi@example.com');
  // Raw code is never stored in persistent record, only SHA-256 hash
  assert.equal(record.codeHash, hashVerificationCode(code));
  assert.equal(record.verified, false);
});

test('verifyEmailCode - validates correct 6-digit code and marks verified', async () => {
  resetVerificationStore();
  const email = 'test@spotter.gym';
  const { code } = issueVerificationCode(email, 'Test');

  // 1. Wrong code rejected
  const wrongRes = await verifyEmailCode(email, '000000');
  if (code !== '000000') {
    assert.equal(wrongRes.success, false);
    assert.match(wrongRes.error, /Invalid verification code/);
    assert.equal(isEmailVerified(email), false);
  }

  // 2. Malformed code rejected
  const shortRes = await verifyEmailCode(email, '123');
  assert.equal(shortRes.success, false);
  assert.match(shortRes.error, /valid 6-digit/);

  // 3. Correct code accepted
  const correctRes = await verifyEmailCode(email, code);
  assert.equal(correctRes.success, true);
  assert.equal(correctRes.emailVerified, true);
  assert.equal(isEmailVerified(email), true);

  // 4. Subsequent verification handles already verified status
  const repeatRes = await verifyEmailCode(email, code);
  assert.equal(repeatRes.success, true);
  assert.equal(repeatRes.emailVerified, true);
});

test('verifyEmailCode - rejects expired verification code', async () => {
  resetVerificationStore();
  const email = 'expired@spotter.gym';
  const { code } = issueVerificationCode(email);

  const record = getVerificationRecord(email);
  assert.ok(record);
  // Manually backdate expiration to simulate expired code
  record.expiresAt = Date.now() - 1000;

  const res = await verifyEmailCode(email, code);
  assert.equal(res.success, false);
  assert.match(res.error, /expired/);
  assert.equal(isEmailVerified(email), false);
});

test('resendVerificationCode - issues fresh 6-digit code', () => {
  resetVerificationStore();
  const email = 'resend@spotter.gym';
  issueVerificationCode(email);

  const resendRes = resendVerificationCode(email, 'ResendUser');
  assert.equal(resendRes.success, true);

  const record = getVerificationRecord(email);
  assert.ok(record);
  assert.equal(record.verified, false);
});

test('registerMember - auto-generates 6-digit verification code and sets unverified status', async () => {
  resetVerificationStore();
  const input = {
    firstName: 'Amaka',
    lastName: 'Eze',
    email: 'amaka.eze@example.com',
    phone: '08098765432',
    tier: 'PREMIUM',
  };

  const regResult = await registerMember(input);
  assert.equal(regResult.success, true);
  assert.equal(regResult.emailVerified, false);

  // Verification record was automatically created with SHA-256 hash
  const record = getVerificationRecord(input.email);
  assert.ok(record);
  assert.ok(record.codeHash.length > 0);
  assert.equal(record.verified, false);
  assert.equal(isEmailVerified(input.email), false);
});
