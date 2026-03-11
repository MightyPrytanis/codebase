/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Retry fetch for transient connection errors (ECONNREFUSED, ECONNRESET, fetch failed)
 * that can occur when the test server is still initializing.
 *
 * @param input  - URL or Request to fetch
 * @param init   - Optional RequestInit options
 * @param retries  - Maximum number of retry attempts (default: 5)
 * @param delayMs  - Base delay in milliseconds; multiplied by (attempt + 1) for backoff (default: 150)
 */
export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  retries = 5,
  delayMs = 150,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isTransient =
        msg.includes('ECONNREFUSED') ||
        msg.includes('ECONNRESET') ||
        msg.includes('fetch failed');
      if (!isTransient || attempt === retries) throw err;
      await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
    }
  }
  // Unreachable, but satisfies TypeScript return type
  throw new Error('fetchWithRetry: exhausted retries');
}
