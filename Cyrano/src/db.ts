/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Validate that a string looks like a postgres URL without exposing its contents
function isValidPostgresUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'postgres:' || u.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

// Normalize: trim whitespace that can sneak in from env var copy-paste or CI secrets
const dbUrl = process.env.DATABASE_URL?.trim();

let client: ReturnType<typeof postgres> | null = null;

if (!dbUrl) {
  console.warn('[DB] WARNING: DATABASE_URL not set. Database operations will fail.');
} else if (!isValidPostgresUrl(dbUrl)) {
  console.warn('[DB] WARNING: DATABASE_URL is not a valid postgres URL. Database operations will fail.');
} else {
  try {
    // postgres client is lazy by default - won't actually connect until first query
    client = postgres(dbUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Don't fail on import if DB is unavailable
      onnotice: () => {}, // Suppress notices
    });
  } catch (error) {
    console.warn('[DB] WARNING: Failed to initialize postgres client. Database operations will fail.', error instanceof Error ? error.message : 'Unknown error');
    client = null;
  }
}

// Create the database instance
// This is safe even if client is null - drizzle won't fail until first query
export const db = client ? drizzle(client, { schema }) : null as any;