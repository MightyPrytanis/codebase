/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Sensitive Terms Table
 *
 * Stores user-defined terms that should always be anonymized, in addition to
 * the default regex / NLP patterns.  Each row identifies one term and the
 * entity type whose token prefix will be used in the replacement
 * (e.g. 'organization' → COMPANY_N).
 */
export const sensitiveTerms = pgTable('sensitive_terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  term: text('term').notNull(),
  entityType: text('entity_type').notNull(), // AnonymizableEntityType string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Exclusions Table (Allowed Exceptions)
 *
 * Stores terms that are explicitly whitelisted from anonymization – they are
 * exempt even when they would otherwise match a default regex or NLP pattern.
 * "Allowed Exceptions" is the user-facing name for this feature to avoid the
 * historically exclusionary "whitelist" terminology.
 */
export const exclusions = pgTable('exclusions', {
  id: uuid('id').primaryKey().defaultRandom(),
  term: text('term').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
