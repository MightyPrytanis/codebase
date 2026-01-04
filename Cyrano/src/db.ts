/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Create the connection with lazy initialization
// postgres() doesn't actually connect until first query, but we want to be explicit
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn('[DB] WARNING: DATABASE_URL not set. Database operations will fail.');
}

// Create the connection - postgres client is lazy by default
// It won't actually connect until the first query is made
const client = dbUrl ? postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Don't fail on import if DB is unavailable
  onnotice: () => {}, // Suppress notices
}) : null as any;

// Create the database instance
// This is safe even if client is null - drizzle won't fail until first query
export const db = client ? drizzle(client, { schema }) : null as any;