import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRequired,
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
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
