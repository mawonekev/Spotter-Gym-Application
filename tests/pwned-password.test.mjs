import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sha1Hex,
  checkPwnedPassword,
  validatePasswordNotPwned,
  DEFAULT_BREACH_MESSAGE,
} from '../src/lib/pwned-password.ts';
import {
  validateSignUpWithPwnedCheck,
  ERROR_MESSAGES,
} from '../src/lib/validators.ts';

test('sha1Hex - correctly hashes password to uppercase SHA-1 hexadecimal', async () => {
  const hash = await sha1Hex('password123');
  assert.equal(hash, 'CBFDAC6008F9CAB4083784CBD1874F76618D2A97');
});

test('checkPwnedPassword - detects breached password via mock fetch', async () => {
  const mockFetch = async (url) => {
    assert.match(url, /api\.pwnedpasswords\.com\/range\/CBFDA/);
    return {
      ok: true,
      text: async () => [
        '0018A45C4D1DEF81644B54AB7F969B88D65:1',
        'C6008F9CAB4083784CBD1874F76618D2A97:2266543',
        'F341512A45C4D1DEF81644B54AB7F969B88:5',
      ].join('\r\n'),
    };
  };

  const result = await checkPwnedPassword('password123', { customFetch: mockFetch });
  assert.equal(result.isBreached, true);
  assert.equal(result.breachCount, 2266543);
  assert.equal(result.prefix, 'CBFDA');
});

test('checkPwnedPassword - ignores padding entries with count 0', async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      text: async () => [
        'C6008F9CAB4083784CBD1874F76618D2A97:0', // count is 0 (padding hash)
      ].join('\r\n'),
    };
  };

  const result = await checkPwnedPassword('password123', { customFetch: mockFetch });
  assert.equal(result.isBreached, false);
  assert.equal(result.breachCount, 0);
});

test('checkPwnedPassword - returns not breached when suffix not in response', async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      text: async () => [
        '0018A45C4D1DEF81644B54AB7F969B88D65:1',
        'FFFFFC4D1DEF81644B54AB7F969B88D65AA:10',
      ].join('\r\n'),
    };
  };

  const result = await checkPwnedPassword('UnbreachedSecretPassword123!', { customFetch: mockFetch });
  assert.equal(result.isBreached, false);
  assert.equal(result.breachCount, 0);
});

test('checkPwnedPassword - handles network errors gracefully without crashing', async () => {
  const mockFetch = async () => {
    throw new Error('Connection timeout');
  };

  const result = await checkPwnedPassword('password123', { customFetch: mockFetch });
  assert.equal(result.isBreached, false);
  assert.equal(result.breachCount, 0);
  assert.match(result.error, /Connection timeout/);
});

test('validatePasswordNotPwned - returns error string if breached and null if safe', async () => {
  const mockBreachedFetch = async () => ({
    ok: true,
    text: async () => 'C6008F9CAB4083784CBD1874F76618D2A97:100\r\n',
  });

  const breachedMsg = await validatePasswordNotPwned('password123', { customFetch: mockBreachedFetch });
  assert.equal(breachedMsg, DEFAULT_BREACH_MESSAGE);

  const mockSafeFetch = async () => ({
    ok: true,
    text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n',
  });

  const safeMsg = await validatePasswordNotPwned('SecureP@ssword2026', { customFetch: mockSafeFetch });
  assert.equal(safeMsg, null);
});

test('validateSignUpWithPwnedCheck - integrates with sign up form validation', async () => {
  const mockBreachedFetch = async () => ({
    ok: true,
    text: async () => 'C6008F9CAB4083784CBD1874F76618D2A97:50\r\n',
  });

  const formValues = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    password: 'password123',
    privacyAccepted: true,
  };

  const errors = await validateSignUpWithPwnedCheck(formValues, { customFetch: mockBreachedFetch });
  assert.equal(errors.password, ERROR_MESSAGES.PASSWORD_BREACHED);
});

test('Live HIBP API lookup - detects common breached password and verifies safe password', async () => {
  // Test with live HIBP API
  const breachedResult = await checkPwnedPassword('password123');
  assert.equal(breachedResult.isBreached, true);
  assert.ok(breachedResult.breachCount > 1_000_000);

  // Test random high-entropy unique password
  const uniqueSafe = 'SpotterGym_UnlikelyToEverBeBreached_93kQ#x8Z!';
  const safeResult = await checkPwnedPassword(uniqueSafe);
  assert.equal(safeResult.isBreached, false);
  assert.equal(safeResult.breachCount, 0);
});
