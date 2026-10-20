import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getClientIp,
  checkRateLimitByKey,
  checkRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  createRateLimitResponse,
  resetRateLimits,
  ONE_HOUR_MS,
} from '../src/lib/rate-limit.ts';

test('getClientIp - extracts IP from various headers', () => {
  // 1. x-forwarded-for with multiple comma-separated IPs
  const req1 = {
    headers: {
      get: (name) => (name === 'x-forwarded-for' ? '203.0.113.195, 70.41.3.18' : null),
    },
  };
  assert.equal(getClientIp(req1), '203.0.113.195');

  // 2. x-real-ip
  const req2 = {
    headers: {
      get: (name) => (name === 'x-real-ip' ? '198.51.100.42' : null),
    },
  };
  assert.equal(getClientIp(req2), '198.51.100.42');

  // 3. cf-connecting-ip
  const req3 = {
    headers: {
      get: (name) => (name === 'cf-connecting-ip' ? '192.0.2.1' : null),
    },
  };
  assert.equal(getClientIp(req3), '192.0.2.1');

  // 4. Default fallback when no headers present
  const req4 = {
    headers: {
      get: () => null,
    },
  };
  assert.equal(getClientIp(req4), '127.0.0.1');
});

test('checkRateLimitByKey - enforces limit and window for operational endpoints', () => {
  resetRateLimits();
  const key = 'checkin:10.0.0.1';
  const config = { limit: 3, windowMs: 10_000 };

  // First request
  const r1 = checkRateLimitByKey(key, config);
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 2);

  // Second request
  const r2 = checkRateLimitByKey(key, config);
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 1);

  // Third request
  const r3 = checkRateLimitByKey(key, config);
  assert.equal(r3.success, true);
  assert.equal(r3.remaining, 0);

  // Fourth request - should be blocked
  const r4 = checkRateLimitByKey(key, config);
  assert.equal(r4.success, false);
  assert.equal(r4.remaining, 0);
  assert.ok(r4.retryAfterSeconds > 0);
});

test('recordFailedAuthAttempt - enforces 5 failed attempts per IP and blocks for 1 hour', () => {
  resetRateLimits();
  const req = {
    headers: {
      get: (name) => (name === 'x-real-ip' ? '10.0.0.99' : null),
    },
  };

  // Initially IP is not blocked
  const initialCheck = checkRateLimit(req, 'signin');
  assert.equal(initialCheck.success, true);
  assert.equal(initialCheck.remaining, 5);

  // 4 failed attempts recorded
  for (let i = 1; i <= 4; i++) {
    const res = recordFailedAuthAttempt(req, 'signin');
    assert.equal(res.success, true);
    assert.equal(res.remaining, 5 - i);
  }

  // Still allowed to attempt
  const preFifthCheck = checkRateLimit(req, 'signin');
  assert.equal(preFifthCheck.success, true);
  assert.equal(preFifthCheck.remaining, 1);

  // 5th failed attempt triggers the 1-hour block per Section 8
  const fifthAttempt = recordFailedAuthAttempt(req, 'signin');
  assert.equal(fifthAttempt.success, false);
  assert.equal(fifthAttempt.remaining, 0);
  assert.equal(fifthAttempt.isBlocked, true);
  assert.ok(fifthAttempt.retryAfterSeconds > 3500 && fifthAttempt.retryAfterSeconds <= 3600);

  // Subsequent checkRateLimit blocks before handler runs
  const blockedCheck = checkRateLimit(req, 'signin');
  assert.equal(blockedCheck.success, false);
  assert.equal(blockedCheck.remaining, 0);
  assert.equal(blockedCheck.isBlocked, true);

  // Successful auth clears failed attempts
  clearFailedAuthAttempts(req, 'signin');
  const postClearCheck = checkRateLimit(req, 'signin');
  assert.equal(postClearCheck.success, true);
  assert.equal(postClearCheck.remaining, 5);
});

test('checkRateLimit - isolates rate limits across distinct IPs and endpoints', () => {
  resetRateLimits();
  const reqA = {
    headers: {
      get: (name) => (name === 'x-real-ip' ? '10.0.1.1' : null),
    },
  };
  const reqB = {
    headers: {
      get: (name) => (name === 'x-real-ip' ? '10.0.1.2' : null),
    },
  };

  // Exhaust limit on IP A
  for (let i = 0; i < 5; i++) {
    recordFailedAuthAttempt(reqA, 'signin');
  }

  // reqA is blocked
  const resA = checkRateLimit(reqA, 'signin');
  assert.equal(resA.success, false);
  assert.equal(resA.isBlocked, true);

  // reqB is on a distinct IP and remains unblocked
  const resB = checkRateLimit(reqB, 'signin');
  assert.equal(resB.success, true);
  assert.equal(resB.remaining, 5);

  // Different endpoint on same IP A (e.g. forgot-password) is separate
  const resForgot = checkRateLimit(reqA, 'forgot-password');
  assert.equal(resForgot.success, true);
  assert.equal(resForgot.remaining, 5);
});

test('createRateLimitResponse - returns 429 and standard headers', () => {
  const result = {
    success: false,
    limit: 5,
    remaining: 0,
    resetMs: ONE_HOUR_MS,
    retryAfterSeconds: 3600,
    isBlocked: true,
  };

  const response = createRateLimitResponse(result);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '3600');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '5');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '0');
  assert.equal(response.headers.get('X-RateLimit-Reset'), '3600');
});
