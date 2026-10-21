import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { registerMember, findMember, generateUniqueMemberNumber } from '../src/server/auth/register.ts';
import { authenticateMember } from '../src/server/auth/signin.ts';
import { getVerificationRecord } from '../src/server/auth/verification.ts';
import { sendWelcomeEmail } from '../src/server/auth/email.ts';
import { verifyDigitGrounding } from '../src/server/retrieval/rag-service.ts';
import { verifyPaystackWebhook } from '../src/server/payments/index.ts';

test('registerMember - generates unique member number and registers member', async () => {
  const result = await registerMember({
    firstName: 'Amaka',
    lastName: 'Okonkwo',
    phone: '08023456789',
    email: 'amaka@example.com',
    tier: 'PREMIUM',
  });

  assert.equal(result.success, true);
  assert.ok(result.memberNumber?.startsWith('SP-'));
  assert.equal(result.firstName, 'Amaka');
  assert.equal(result.lastName, 'Okonkwo');
  assert.equal(result.tier, 'PREMIUM');

  // Verify finding the newly registered member
  const found = await findMember('08023456789');
  assert.ok(found);
  assert.equal(found.firstName, 'Amaka');
  assert.equal(found.memberNumber, result.memberNumber);
});

test('registerMember - generates distinct sequential member numbers', async () => {
  const m1 = await registerMember({
    firstName: 'Tunde',
    lastName: 'Bakare',
    phone: '08034567890',
    email: 'tunde@example.com',
    tier: 'BASIC',
  });

  const m2 = await registerMember({
    firstName: 'Emeka',
    lastName: 'Ibe',
    phone: '08045678901',
    email: 'emeka@example.com',
    tier: 'BASIC',
  });

  assert.equal(m1.success, true);
  assert.equal(m2.success, true);
  assert.notEqual(m1.memberNumber, m2.memberNumber);
});

test('registerMember - rejects invalid input and returns validation errors', async () => {
  const result = await registerMember({
    firstName: '',
    lastName: '',
    phone: '123',
    email: 'invalid-email',
  });

  assert.equal(result.success, false);
  assert.ok(result.validationErrors?.firstName);
  assert.ok(result.validationErrors?.email);
});

test('authenticateMember - signs in registered member successfully', async () => {
  const authSuccess = await authenticateMember({
    phone: '08012345678', // Registered sample member
    password: 'securePassword123',
  });

  assert.equal(authSuccess.success, true);
  assert.equal(authSuccess.memberNumber, 'SP-0042');
  assert.equal(authSuccess.firstName, 'Chioma');
  assert.equal(authSuccess.effectiveTier, 'BASIC');
});

test('authenticateMember - allows sign-in before email verification and reports status', async () => {
  const email = 'vera.flow@example.com';
  const phone = '08055556666';
  const password = 'SecurePassword123!';

  const registered = await registerMember({
    firstName: 'Vera',
    lastName: 'Flow',
    email,
    phone,
    password,
  });
  assert.equal(registered.success, true);

  const unverified = await authenticateMember({ phone, password });
  assert.equal(unverified.success, true);
  assert.equal(unverified.emailVerified, false);
  assert.equal(unverified.requiresEmailVerification, undefined);

  const record = getVerificationRecord(email);
  assert.ok(record);
  record.verified = true;

  const verified = await authenticateMember({ phone: '0805 555 6666', password });
  assert.equal(verified.success, true);
  assert.equal(verified.firstName, 'Vera');
  assert.equal(verified.emailVerified, true);
});

test('authenticateMember - rejects unregistered mobile number', async () => {
  const authFail = await authenticateMember({
    phone: '08099999999',
    password: 'password123',
  });

  assert.equal(authFail.success, false);
  assert.match(authFail.error || '', /No active gym record found/);
});

test('sendWelcomeEmail - handles delivery gracefully via fallback transport', async () => {
  const emailSent = await sendWelcomeEmail({
    toEmail: 'member@spotter.gym',
    memberNumber: 'SP-0099',
    firstName: 'Zainab',
    lastName: 'Danjuma',
    tier: 'PREMIUM',
  });

  assert.equal(emailSent, true);
});

test('verifyDigitGrounding - enforces strict digit matching', () => {
  const chunks = ['Operating hours on Saturday are from 08:00 to 18:00.'];
  const question = 'What time does the gym close on Saturday?';

  // Valid grounded answer containing only digits from source chunks
  const validAnswer = 'The gym closes at 18:00 on Saturday.';
  assert.equal(verifyDigitGrounding(validAnswer, chunks, question), true);

  // Ungrounded answer containing invented/hallucinated digit sequence 20:00
  const ungroundedAnswer = 'The gym is open until 20:00 on Saturday.';
  assert.equal(verifyDigitGrounding(ungroundedAnswer, chunks, question), false);
});

test('verifyPaystackWebhook - validates webhook HMAC SHA-512 signature', () => {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_123' } });

  const validSignature = crypto
    .createHmac('sha512', 'sk_test_mock_secret')
    .update(body)
    .digest('hex');

  assert.equal(verifyPaystackWebhook(body, validSignature), true);
  assert.equal(verifyPaystackWebhook(body, 'invalid_signature_hex'), false);
});
