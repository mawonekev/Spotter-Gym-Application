/**
 * In-memory rate limiter for server route handlers.
 * Implements the Security Audit Specification:
 * - 5 failed authentication attempts per identifier within one hour.
 * - 1 hour block duration once threshold is reached.
 * - Counters live in memory (never in the primary database).
 * - Primary key: client IP. Secondary keys: email address and device id.
 * - Only failed attempts increment counters.
 */

import type { NextRequest } from 'next/server';
import { logAuthEvent } from '../server/auth/audit.ts';

export interface RateLimitConfig {
  /** Maximum number of allowed failed attempts */
  limit: number;
  /** Duration of the time window in milliseconds (default: 1 hour = 3,600,000 ms) */
  windowMs: number;
  /** Block duration in milliseconds once limit is reached (default: 1 hour) */
  blockDurationMs?: number;
}

export interface RateLimitIdentifiers {
  email?: string | null;
  deviceId?: string | null;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
  isBlocked?: boolean;
}

interface ClientBucket {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

type RateLimitRequest =
  | NextRequest
  | Request
  | { headers: Headers | { get(name: string): string | null } };

// In-memory bucket store: Map<key, ClientBucket>
const rateLimitStore = new Map<string, ClientBucket>();

/**
 * 1-Hour window in milliseconds per Section 8 specification
 */
export const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Default configurations per form endpoint
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints: 5 failed attempts per identifier per 1 hour, 1 hour block
  signin: { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },
  register: { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },
  'forgot-password': { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },
  'reset-password': { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },
  'verify-email': { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },
  'resend-verification': { limit: 5, windowMs: ONE_HOUR_MS, blockDurationMs: ONE_HOUR_MS },

  // Operational member endpoints: 5 attempts per minute
  checkin: { limit: 5, windowMs: 60_000 },
  ask: { limit: 5, windowMs: 60_000 },
};

/**
 * Extracts client IP address from request headers.
 * Resolves proxy headers in standard precedence: x-forwarded-for, x-real-ip, cf-connecting-ip.
 */
export function getClientIp(req: RateLimitRequest): string {
  const headers = req.headers;
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp?.trim()) {
    return xRealIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Reads a device identifier from the x-device-id header or the device cookie.
 * Device identifiers are optional; requests without one are still IP limited.
 */
export function getDeviceId(req: RateLimitRequest): string | undefined {
  const headerDeviceId = req.headers.get('x-device-id');
  if (headerDeviceId?.trim()) {
    return headerDeviceId.trim();
  }

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)spotter_device_id=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  return undefined;
}

function normalizeEmailIdentifier(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Builds every counter key for a request: IP first, then optional email/device.
 */
function buildKeys(
  prefix: string,
  req: RateLimitRequest,
  identifiers?: RateLimitIdentifiers
): string[] {
  const keys = [`${prefix}:ip:${getClientIp(req)}`];

  const email = normalizeEmailIdentifier(identifiers?.email);
  if (email) {
    keys.push(`${prefix}:email:${email}`);
  }

  const deviceId =
    identifiers?.deviceId?.trim() || getDeviceId(req);
  if (deviceId) {
    keys.push(`${prefix}:device:${deviceId}`);
  }

  return keys;
}

function getConfig(
  prefix: string,
  customConfig?: Partial<RateLimitConfig>
): Required<RateLimitConfig> {
  const baseConfig = DEFAULT_RATE_LIMITS[prefix] || {
    limit: 5,
    windowMs: ONE_HOUR_MS,
  };
  const limit = customConfig?.limit ?? baseConfig.limit;
  const windowMs = customConfig?.windowMs ?? baseConfig.windowMs;
  const blockDurationMs =
    customConfig?.blockDurationMs ?? baseConfig.blockDurationMs ?? windowMs;

  return { limit, windowMs, blockDurationMs };
}

function blockedResult(
  limit: number,
  remainingMs: number
): RateLimitResult {
  return {
    success: false,
    limit,
    remaining: 0,
    resetMs: remainingMs,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
    isBlocked: true,
  };
}

/**
 * Checks whether any counter for this request is currently rate-limited.
 * Does NOT increment failed counts.
 */
export function isIpBlocked(
  req: RateLimitRequest,
  prefix: string,
  customConfig?: Partial<RateLimitConfig>,
  identifiers?: RateLimitIdentifiers
): RateLimitResult {
  const { limit, windowMs } = getConfig(prefix, customConfig);
  const now = Date.now();
  let remaining = limit;
  let resetMs = windowMs;

  for (const key of buildKeys(prefix, req, identifiers)) {
    const bucket = rateLimitStore.get(key);
    if (!bucket) continue;

    // Active block.
    if (bucket.blockedUntil && now < bucket.blockedUntil) {
      return blockedResult(limit, bucket.blockedUntil - now);
    }

    // Expired window: clean it up.
    if (now >= bucket.resetTime) {
      rateLimitStore.delete(key);
      continue;
    }

    // Threshold reached but block flag not set (defensive).
    if (bucket.count >= limit) {
      return blockedResult(limit, Math.max(0, bucket.resetTime - now));
    }

    remaining = Math.min(remaining, Math.max(0, limit - bucket.count));
    resetMs = Math.max(resetMs, bucket.resetTime - now);
  }

  return {
    success: true,
    limit,
    remaining,
    resetMs,
    retryAfterSeconds: 0,
    isBlocked: false,
  };
}

/**
 * Records a failed authentication attempt against every available identifier.
 * When a counter reaches the threshold, that identifier is blocked for one hour.
 */
export function recordFailedAuthAttempt(
  req: RateLimitRequest,
  prefix: string,
  customConfig?: Partial<RateLimitConfig>,
  identifiers?: RateLimitIdentifiers
): RateLimitResult {
  const { limit, windowMs, blockDurationMs } = getConfig(prefix, customConfig);
  const now = Date.now();
  let remaining = limit;
  let resetMs = windowMs;
  let triggered = false;

  for (const key of buildKeys(prefix, req, identifiers)) {
    let bucket = rateLimitStore.get(key);

    // Never increment a counter that is already blocked.
    if (bucket?.blockedUntil && now < bucket.blockedUntil) {
      return blockedResult(limit, bucket.blockedUntil - now);
    }

    if (!bucket || now >= bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    if (bucket.count >= limit) {
      bucket.blockedUntil = now + blockDurationMs;
      bucket.resetTime = now + blockDurationMs;
      triggered = true;
    } else {
      remaining = Math.min(remaining, Math.max(0, limit - bucket.count));
      resetMs = Math.max(resetMs, bucket.resetTime - now);
    }
  }

  if (triggered) {
    const result = blockedResult(limit, blockDurationMs);
    logAuthEvent('AUTH_RATE_LIMIT_BLOCKED', getClientIp(req), identifiers?.email ?? undefined, {
      prefix,
      failedAttempts: limit,
      blockedForSeconds: result.retryAfterSeconds,
      deviceId: identifiers?.deviceId ?? getDeviceId(req),
    });
    return result;
  }

  return {
    success: true,
    limit,
    remaining,
    resetMs,
    retryAfterSeconds: 0,
    isBlocked: false,
  };
}

/**
 * Clears failed attempts for every identifier on successful authentication.
 */
export function clearFailedAuthAttempts(
  req: RateLimitRequest,
  prefix: string,
  identifiers?: RateLimitIdentifiers
): void {
  for (const key of buildKeys(prefix, req, identifiers)) {
    rateLimitStore.delete(key);
  }
}

/**
 * Checks rate limit for a request based on IP/email/device identifiers.
 */
export function checkRateLimit(
  req: RateLimitRequest,
  prefix: string,
  customConfig?: Partial<RateLimitConfig>,
  identifiers?: RateLimitIdentifiers
): RateLimitResult {
  return isIpBlocked(req, prefix, customConfig, identifiers);
}

/**
 * Directly checks and increments for non-auth requests (like checkin daily code or asking questions).
 */
export function checkRateLimitByKey(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  let bucket = rateLimitStore.get(key);

  if (!bucket || now >= bucket.resetTime) {
    bucket = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, bucket);

    return {
      success: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - 1),
      resetMs: config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (bucket.count >= config.limit) {
    const remainingMs = Math.max(0, bucket.resetTime - now);
    const retryAfterSeconds = Math.ceil(remainingMs / 1000);

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetMs: remainingMs,
      retryAfterSeconds,
    };
  }

  bucket.count += 1;
  const remainingMs = Math.max(0, bucket.resetTime - now);

  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - bucket.count),
    resetMs: remainingMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Returns a standard 429 Too Many Requests response with standard rate limit headers.
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      success: false,
      error: `Too many attempts. Please try again in ${Math.ceil(
        result.retryAfterSeconds / 60
      )} minute(s).`,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfterSeconds.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(result.resetMs / 1000).toString(),
      },
    }
  );
}

/**
 * Resets the in-memory rate limit store (useful for tests or administrative resets).
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}
