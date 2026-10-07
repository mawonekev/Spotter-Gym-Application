import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRequired,
  validateFullName,
  validateEmail,
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

test('validatePhone', () => {
  assert.equal(validatePhone(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validatePhone('123'), ERROR_MESSAGES.PHONE_INVALID);
  assert.equal(validatePhone('08012345678'), null);
  assert.equal(validatePhone('+2348012345678'), null);
});

test('validatePassword', () => {
  assert.equal(validatePassword(''), ERROR_MESSAGES.REQUIRED);
  assert.equal(validatePassword('1234567'), ERROR_MESSAGES.PASSWORD_LENGTH);
  assert.equal(validatePassword('12345678'), null);
  assert.equal(validatePassword('verySecretPassword!'), null);
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
  assert.equal(errors.memberNumber, ERROR_MESSAGES.REQUIRED);
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

