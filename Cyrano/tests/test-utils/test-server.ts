/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Test Server Utilities
 *
 * Provides helpers for starting an HTTP app server on an ephemeral port and
 * making HTTP requests with automatic retry on transient connection errors.
 *
 * Usage:
 *   import { startAppServer, fetchWithRetry } from '../test-utils/test-server.js';
 *
 *   let baseUrl = '';
 *   beforeAll(async () => {
 *     const started = await startAppServer(app, process.env.TEST_PORT);
 *     baseUrl = started.baseUrl;
 *     // ...
 *     return started.stop; // or store server for afterAll
 *   });
 */

import type { Server } from 'http';
import type { AddressInfo } from 'net';

/**
 * Start the provided Express app on an ephemeral port (or preferredPort if given).
 * Returns { server, baseUrl, stop }.
 *
 * Using port 0 (ephemeral) avoids port conflicts on CI runners and local machines.
 * The actual bound port is resolved from server.address() after listen().
 */
export async function startAppServer(
  app: any,
  preferredPort?: number | string
): Promise<{ server: Server; baseUrl: string; stop: () => Promise<void> }> {
  const http = await import('http');
  const port = preferredPort ? Number(preferredPort) : 0;
  const server: Server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Server startup timeout after 15s')),
      15000
    );

    server.listen(port, async () => {
      clearTimeout(timeout);

      const addr = server.address() as AddressInfo | string | null;
      const boundPort =
        addr && typeof addr === 'object'
          ? addr.port
          : Number(String(addr ?? port).split(':').pop());

      let connected = false;
      let lastStatus: number | null = null;
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`http://localhost:${boundPort}/health`);
          if (res.ok) {
            connected = true;
            break;
          }
          lastStatus = res.status;
        } catch {
          // Server not yet accepting connections — retry after delay
          lastStatus = null;
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!connected) {
        const statusInfo =
          lastStatus !== null
            ? ` (last HTTP status: ${lastStatus})`
            : ' (connection refused)';
        reject(new Error(`Server did not respond on /health endpoint${statusInfo}`));
        return;
      }

      resolve();
    });

    server.on('error', (err: any) => {
      clearTimeout(timeout);
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use. Please stop the existing server or use a different TEST_PORT.`
          )
        );
      } else {
        reject(err);
      }
    });
  });

  const addr = server.address() as AddressInfo | string | null;
  if (!addr) throw new Error('Could not determine server address');
  const boundPort =
    typeof addr === 'object'
      ? addr.port
      : Number(String(addr).split(':').pop());
  const baseUrl = `http://localhost:${boundPort}`;

  console.log(`Test HTTP server started on port ${boundPort}`);

  return {
    server,
    baseUrl,
    stop: () =>
      new Promise<void>((res) =>
        server.close(() => {
          console.log('Test HTTP server closed');
          res();
        })
      ),
  };
}

/**
 * Fetch with automatic retry on transient connection errors (ECONNREFUSED, ECONNRESET,
 * "fetch failed"). Useful when the server is bound but middleware is still initializing.
 *
 * @param input  - URL or Request object (same as fetch)
 * @param init   - RequestInit options (same as fetch)
 * @param retries - Number of retry attempts (default 5)
 * @param delayMs - Base delay in ms; each retry is multiplied by attempt number (default 150)
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 5,
  delayMs = 150
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input as RequestInfo, init);
    } catch (err: any) {
      const message = String(err?.message ?? err);
      const isTransient =
        message.includes('ECONNREFUSED') ||
        message.includes('ECONNRESET') ||
        message.includes('fetch failed');
      if (!isTransient || attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error('fetchWithRetry: unexpectedly exhausted retries');
}
