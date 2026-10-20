import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRequired,
  validateFullName,
  validateEmail,
  normalizeEmail,
  normalizePhone,
  validatePhone,
  validatePassword,
  validateSignUp,
  isSignUpFormValid,
  ERROR_MESSAGES,
} from '../src/lib/validators.ts';

test('validateRequired', () => {
  assert.equal(validateRequired(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validateRequired('   '), ERROR_MESSAGES.REQUIRED);
  assert.equal(validateRequired('hello'), null);
});

test('validateFullName', () => {
  // Empty
  assert.equal(validateFullName(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validateFullName('   '), ERROR_MESSAGES.REQUIRED);

  // Single name (e.g. "Jane" rejected)
  assert.equal(validateFullName('Jane'), ERROR_MESSAGES.FULL_NAME);
  assert.equal(validateFullName('Chioma'), ERROR_MESSAGES.FULL_NAME);

  // Two names (accepted)
  assert.equal(validateFullName('Jane Doe'), null);
  assert.equal(validateFullName('Chioma Adeyemi'), null);

  // Extra whitespace trimmed and collapsed
  assert.equal(validateFullName('  Jane    Doe  '), null);

  // Hyphenated and apostrophe names
  assert.equal(validateFullName("Mary-Jane O'Connor"), null);
});

test('validateEmail', () => {
  // In real-time (typing): empty returns null (blur handles empty)
  assert.equal(validateEmail('', true), null);

  // Non-empty incomplete email shows format error immediately
  assert.equal(validateEmail('abc', true), ERROR_MESSAGES.EMAIL_INVALID);
  assert.equal(validateEmail('abc@', true), ERROR_MESSAGES.EMAIL_INVALID);
  assert.equal(validateEmail('abc@example', true), ERROR_MESSAGES.EMAIL_INVALID);

  // Valid email passes
  assert.equal(validateEmail('abc@example.com', true), null);
  assert.equal(validateEmail('chioma@gym.ng', true), null);

  // On blur / submit: empty field returns required error
  assert.equal(validateEmail('', false), ERROR_MESSAGES.REQUIRED);
  assert.equal(validateEmail('   ', false), ERROR_MESSAGES.REQUIRED);
  assert.equal(validateEmail('invalid', false), ERROR_MESSAGES.EMAIL_INVALID);
  assert.equal(validateEmail('valid@example.com', false), null);
});

test('normalizeEmail', () => {
  assert.equal(normalizeEmail(''), '');
  assert.equal(normalizeEmail(null), '');
  assert.equal(normalizeEmail(undefined), '');
  assert.equal(normalizeEmail('Chioma@Example.com'), 'chioma@example.com');
  assert.equal(normalizeEmail('USER@GYM.NG'), 'user@gym.ng');
  assert.equal(normalizeEmail('Jane.Doe+Tag@EXAMPLE.COM'), 'jane.doe+tag@example.com');
});

test('normalizePhone', () => {
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(null), '');
  assert.equal(normalizePhone(undefined), '');
  assert.equal(normalizePhone('0801 234 5678'), '08012345678');
  assert.equal(normalizePhone('+234 (801) 234-5678'), '2348012345678');
});

test('validatePhone', () => {
  assert.equal(validatePhone(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validatePhone('123'), ERROR_MESSAGES.PHONE_INVALID);
  assert.equal(validatePhone('08012345678'), null);
  assert.equal(validatePhone('+2348012345678'), null);
});

test('validatePassword', () => {
  assert.equal(validatePassword(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validatePassword('   '), ERROR_MESSAGES.REQUIRED);
  assert.equal(validatePassword('1234567'), ERROR_MESSAGES.PASSWORD_LENGTH);
  assert.equal(validatePassword('  12345  '), ERROR_MESSAGES.PASSWORD_LENGTH);
  // Digits only fails the shared complexity policy (letter + number required).
  assert.equal(validatePassword('12345678'), ERROR_MESSAGES.PASSWORD_COMPLEXITY);
  assert.equal(validatePassword('weakpass'), ERROR_MESSAGES.PASSWORD_COMPLEXITY);
  assert.equal(validatePassword('  12345678  '), ERROR_MESSAGES.PASSWORD_COMPLEXITY);
  assert.equal(validatePassword('verySecretPassword1!'), null);
  assert.equal(validatePassword('  12345678ab  '), null);
});

test('validateSignUp and isSignUpFormValid - empty form', () => {
  const emptyValues = {
    fullName: '',
    email: '',
    phone: '',
    memberNumber: '',
    password: '',
    privacyAccepted: false,
  };

  const errors = validateSignUp(emptyValues);
  assert.equal(errors.fullName, ERROR_MESSAGES.REQUIRED);
  assert.equal(errors.email, ERROR_MESSAGES.REQUIRED);
  assert.equal(errors.phone, ERROR_MESSAGES.REQUIRED);
  assert.equal(errors.password, ERROR_MESSAGES.REQUIRED);
  assert.equal(errors.privacyAccepted, ERROR_MESSAGES.PRIVACY_REQUIRED);

  assert.equal(isSignUpFormValid(emptyValues), false);
});

test('validateSignUp and isSignUpFormValid - one invalid field', () => {
  const baseValid = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    password: 'password123',
    privacyAccepted: true,
  };

  // Invalid email
  const badEmail = { ...baseValid, email: 'notanemail' };
  assert.deepEqual(validateSignUp(badEmail), { email: ERROR_MESSAGES.EMAIL_INVALID });
  assert.equal(isSignUpFormValid(badEmail), false);

  // Single word name (rejected)
  const singleName = { ...baseValid, fullName: 'Jane' };
  assert.deepEqual(validateSignUp(singleName), { fullName: ERROR_MESSAGES.FULL_NAME });
  assert.equal(isSignUpFormValid(singleName), false);

  // Unchecked privacy
  const unacceptedPrivacy = { ...baseValid, privacyAccepted: false };
  assert.deepEqual(validateSignUp(unacceptedPrivacy), { privacyAccepted: ERROR_MESSAGES.PRIVACY_REQUIRED });
  assert.equal(isSignUpFormValid(unacceptedPrivacy), false);

  // Password too short
  const shortPassword = { ...baseValid, password: '123' };
  assert.deepEqual(validateSignUp(shortPassword), { password: ERROR_MESSAGES.PASSWORD_LENGTH });
  assert.equal(isSignUpFormValid(shortPassword), false);
});

test('validateSignUp and isSignUpFormValid - all valid', () => {
  const validValues = {
    fullName: 'Chioma Adeyemi',
    email: 'chioma@example.com',
    phone: '0801 234 5678',
    memberNumber: '1042',
    password: 'securePassword123',
    privacyAccepted: true,
  };

  const errors = validateSignUp(validValues);
  assert.deepEqual(errors, {});
  assert.equal(isSignUpFormValid(validValues), true);
});

test('validateSignUp and isSignUpFormValid - valid-then-broken', () => {
  let values = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    password: 'password123',
    privacyAccepted: true,
  };

  // Initially valid
  assert.equal(isSignUpFormValid(values), true);

  // User clears email
  values = { ...values, email: '' };
  assert.equal(isSignUpFormValid(values), false);
  assert.equal(validateSignUp(values).email, ERROR_MESSAGES.REQUIRED);

  // User fixes email
  values = { ...values, email: 'jane@gym.ng' };
  assert.equal(isSignUpFormValid(values), true);

  // User shortens name to 1 word
  values = { ...values, fullName: 'Jane' };
  assert.equal(isSignUpFormValid(values), false);
  assert.equal(validateSignUp(values).fullName, ERROR_MESSAGES.FULL_NAME);

  // User fixes name
  values = { ...values, fullName: 'Jane Doe' };
  assert.equal(isSignUpFormValid(values), true);

  // User unchecks privacy notice
  values = { ...values, privacyAccepted: false };
  assert.equal(isSignUpFormValid(values), false);
});

test('validateSignUp and isSignUpFormValid - confirmPassword matching when provided', () => {
  const base = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    password: 'password123',
    privacyAccepted: true,
  };

  // Mismatch
  const mismatch = { ...base, confirmPassword: 'differentPassword' };
  assert.equal(validateSignUp(mismatch).confirmPassword, ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
  assert.equal(isSignUpFormValid(mismatch), false);

  // Match
  const match = { ...base, confirmPassword: 'password123' };
  assert.deepEqual(validateSignUp(match), {});
  assert.equal(isSignUpFormValid(match), true);
});

test('validateSignIn schema validation', async () => {
  const { validateSignIn } = await import('../src/lib/validators.ts');

  // Invalid empty inputs
  const emptyRes = validateSignIn({ phone: '', password: '' });
  assert.equal(emptyRes.success, false);
  assert.ok(emptyRes.errors?.phone);
  assert.ok(emptyRes.errors?.password);

  // Invalid phone
  const badPhoneRes = validateSignIn({ phone: '123', password: 'password123' });
  assert.equal(badPhoneRes.success, false);
  assert.ok(badPhoneRes.errors?.phone);

  // Valid credentials
  const validRes = validateSignIn({ phone: '08012345678', password: 'securePassword1' });
  assert.equal(validRes.success, true);
  assert.equal(validRes.data?.phone, '08012345678');
});

test('validateMemberRegistration schema validation', async () => {
  const { validateMemberRegistration } = await import('../src/lib/validators.ts');

  // Missing fields
  const missingRes = validateMemberRegistration({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  assert.equal(missingRes.success, false);
  assert.ok(missingRes.errors?.firstName);
  assert.ok(missingRes.errors?.lastName);
  assert.ok(missingRes.errors?.email);
  assert.ok(missingRes.errors?.phone);

  // Invalid email and tier
  const invalidFieldsRes = validateMemberRegistration({
    firstName: 'Chioma',
    lastName: 'Adeyemi',
    email: 'not-an-email',
    phone: '08012345678',
    tier: 'INVALID_TIER',
  });
  assert.equal(invalidFieldsRes.success, false);
  assert.ok(invalidFieldsRes.errors?.email);
  assert.ok(invalidFieldsRes.errors?.tier);

  // Valid member registration
  const validRes = validateMemberRegistration({
    firstName: 'Chioma',
    lastName: 'Adeyemi',
    email: 'chioma@example.com',
    phone: '08012345678',
    tier: 'PREMIUM',
  });
  assert.equal(validRes.success, true);
  assert.equal(validRes.data?.firstName, 'Chioma');
  assert.equal(validRes.data?.tier, 'PREMIUM');
});

test('validateCheckIn schema validation', async () => {
  const { validateCheckIn, checkInSchema } = await import('../src/lib/validators.ts');

  // Empty or wrong length
  const emptyRes = validateCheckIn({ code: '' });
  assert.equal(emptyRes.success, false);
  assert.ok(emptyRes.errors?.code);

  const shortRes = validateCheckIn({ code: '123' });
  assert.equal(shortRes.success, false);

  const nonDigitRes = validateCheckIn({ code: 'abcd' });
  assert.equal(nonDigitRes.success, false);

  // Valid 4-digit code
  const validRes = validateCheckIn({ code: '4821' });
  assert.equal(validRes.success, true);
  assert.equal(validRes.data?.code, '4821');

  // Direct schema parse
  assert.equal(checkInSchema.safeParse({ code: '4821' }).success, true);
});

test('validateAskQuestion schema validation', async () => {
  const { validateAskQuestion, askQuestionSchema } = await import('../src/lib/validators.ts');

  // Empty question
  const emptyRes = validateAskQuestion({ question: '' });
  assert.equal(emptyRes.success, false);
  assert.ok(emptyRes.errors?.question);

  // Exceeds 400 characters
  const tooLongRes = validateAskQuestion({ question: 'a'.repeat(401) });
  assert.equal(tooLongRes.success, false);
  assert.ok(tooLongRes.errors?.question);

  // Valid question
  const validRes = validateAskQuestion({ question: 'What time is the Saturday class?' });
  assert.equal(validRes.success, true);
  assert.equal(validRes.data?.question, 'What time is the Saturday class?');

  // Direct schema parse
  assert.equal(askQuestionSchema.safeParse({ question: 'Can I bring a guest?' }).success, true);
});

test('validateForgotPassword schema validation', async () => {
  const { validateForgotPassword, forgotPasswordSchema } = await import('../src/lib/validators.ts');

  // Empty identifier
  const emptyRes = validateForgotPassword({ identifier: '' });
  assert.equal(emptyRes.success, false);
  assert.ok(emptyRes.errors?.identifier);

  // Valid identifier
  const validRes = validateForgotPassword({ identifier: '08012345678' });
  assert.equal(validRes.success, true);
  assert.equal(validRes.data?.identifier, '08012345678');

  // Direct schema parse
  assert.equal(forgotPasswordSchema.safeParse({ identifier: 'user@example.com' }).success, true);
});

