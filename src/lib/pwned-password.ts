/**
 * Have I Been Pwned (HIBP) Pwned Passwords lookup service.
 * Uses k-Anonymity model:
 * 1. Hashes password with SHA-1.
 * 2. Sends only the first 5 hexadecimal characters of the hash to api.pwnedpasswords.com.
 * 3. Compares the remaining hash suffix locally to verify if it has been breached.
 * The full password and full hash never leave the device/server.
 */

export const DEFAULT_BREACH_MESSAGE =
  'This password has appeared in a data breach. Please choose a different password.';

export interface PwnedCheckResult {
  isBreached: boolean;
  breachCount: number;
  prefix?: string;
  error?: string;
}

export interface CheckPwnedOptions {
  /** Request timeout in milliseconds (default: 3000ms) */
  timeoutMs?: number;
  /** Custom fetch implementation (for testing / mocking) */
  customFetch?: typeof fetch;
}

/**
 * Calculates SHA-1 hexadecimal hash (uppercase) of a string.
 * Supports both Web Crypto (browsers, Next.js Edge, Node 18+) and node:crypto fallback.
 */
export async function sha1Hex(text: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  // Node.js fallback if subtle is unavailable
  const cryptoModule = typeof window === 'undefined' ? await import('crypto') : null;
  if (cryptoModule?.createHash) {
    return cryptoModule.createHash('sha1').update(text).digest('hex').toUpperCase();
  }
  throw new Error('Crypto API is unavailable in this environment');
}

/**
 * Checks whether a password appears in Have I Been Pwned's breached database.
 * Returns breach status and count.
 */
export async function checkPwnedPassword(
  password: string,
  options?: CheckPwnedOptions
): Promise<PwnedCheckResult> {
  if (!password || typeof password !== 'string') {
    return { isBreached: false, breachCount: 0 };
  }

  const trimmed = password.trim();
  if (trimmed.length === 0) {
    return { isBreached: false, breachCount: 0 };
  }

  try {
    const hash = await sha1Hex(trimmed);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const fetchFn = options?.customFetch ?? (options as any)?.fetchFn ?? globalThis.fetch;
    const timeoutMs = options?.timeoutMs ?? 3000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetchFn(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Spotter-Gym-Application',
        'Add-Padding': 'true',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[HIBP] Pwned Passwords API returned HTTP ${response.status}`);
      return {
        isBreached: false,
        breachCount: 0,
        prefix,
        error: `HIBP API returned status ${response.status}`,
      };
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const lineSuffix = parts[0]?.trim().toUpperCase();
        const count = parseInt(parts[1]?.trim() || '0', 10);

        if (lineSuffix === suffix && count > 0) {
          return {
            isBreached: true,
            breachCount: count,
            prefix,
          };
        }
      }
    }

    return {
      isBreached: false,
      breachCount: 0,
      prefix,
    };
  } catch (error: any) {
    console.warn(`[HIBP] Failed to check breached password: ${error?.message || error}`);
    return {
      isBreached: false,
      breachCount: 0,
      error: error?.message || 'Network error during breached password check',
    };
  }
}

/**
 * Validates that a password is not found in the HIBP breached database.
 * Returns null if safe, or an error message if breached.
 */
export async function validatePasswordNotPwned(
  password: string,
  options?: CheckPwnedOptions
): Promise<string | null> {
  const result = await checkPwnedPassword(password, options);
  if (result.isBreached) {
    return DEFAULT_BREACH_MESSAGE;
  }
  return null;
}
