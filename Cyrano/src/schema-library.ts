/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';
import { users } from './schema.js';

/**
 * Practice Profiles Table
 * Stores user practice profiles with jurisdictions, practice areas, and preferences
 */
export const practiceProfiles = pgTable('practice_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Jurisdictions
  primaryJurisdiction: text('primary_jurisdiction').notNull(),
  additionalJurisdictions: jsonb('additional_jurisdictions').$type<string[]>().default([]),
  
  // Practice areas
  practiceAreas: jsonb('practice_areas').$type<string[]>().default([]),
  
  // Courts and counties
  counties: jsonb('counties').$type<string[]>().default([]),
  courts: jsonb('courts').$type<string[]>().default([]),
  
  // Issue areas/tags
  issueTags: jsonb('issue_tags').$type<string[]>().default([]),
  
  // Storage and cache preferences
  storagePreferences: jsonb('storage_preferences').$type<{
    localPath?: string;
    oneDriveEnabled?: boolean;
    gDriveEnabled?: boolean;
    s3Enabled?: boolean;
    s3Bucket?: string;
    cacheSize?: number;
  }>().default({}),
  
  // Research provider preferences
  researchProvider: text('research_provider'), // 'westlaw' | 'courtlistener' | 'other'
  
  // Integration credentials (encrypted)
  integrations: jsonb('integrations').$type<{
    clio?: {
      enabled: boolean;
      clientId?: string;
    };
    // MiFile removed - use micourt_query tool for user-initiated docket queries
    // miFile?: {
    //   enabled: boolean;
    //   enrolled?: boolean;
    // };
    outlook?: {
      enabled: boolean;
      authenticated?: boolean;
    };
    gmail?: {
      enabled: boolean;
      authenticated?: boolean;
    };
  }>().default({}),
  
  // MAE/LLM provider selection
  llmProvider: text('llm_provider'), // 'openai' | 'anthropic' | 'perplexity'
  llmProviderTested: boolean('llm_provider_tested').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Library Locations Table
 * Stores storage location configurations (local, OneDrive, Google Drive, S3)
 */
export const libraryLocations = pgTable('library_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'local' | 'onedrive' | 'gdrive' | 's3'
  name: text('name').notNull(),
  path: text('path').notNull(),
  credentials: jsonb('credentials'), // Encrypted storage credentials
  enabled: boolean('enabled').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: text('sync_status').default('idle'), // 'idle' | 'syncing' | 'error'
  syncError: text('sync_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Library Items Table
 * Stores documents, rules, templates, playbooks, and other legal resources
 */
export const libraryItems = pgTable('library_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  locationId: uuid('location_id').references(() => libraryLocations.id, { onDelete: 'cascade' }).notNull(),
  
  // File information
  filename: text('filename').notNull(),
  filepath: text('filepath').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  
  // Document metadata
  title: text('title').notNull(),
  description: text('description'),
  sourceType: text('source_type').notNull(), // 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other'
  
  // Jurisdictional metadata
  jurisdiction: text('jurisdiction'),
  county: text('county'),
  court: text('court'),
  judgeReferee: text('judge_referee'),
  
  // Content tags
  issueTags: jsonb('issue_tags').$type<string[]>().default([]),
  practiceAreas: jsonb('practice_areas').$type<string[]>().default([]),
  
  // Date metadata
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  dateCreated: timestamp('date_created'),
  dateModified: timestamp('date_modified'),
  
  // RAG integration
  ingested: boolean('ingested').default(false).notNull(),
  ingestedAt: timestamp('ingested_at'),
  vectorIds: jsonb('vector_ids').$type<string[]>().default([]), // IDs in vector store
  
  // Status
  pinned: boolean('pinned').default(false).notNull(),
  superseded: boolean('superseded').default(false).notNull(),
  supersededBy: uuid('superseded_by'), // ID of newer version
  
  // System metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),
});

/**
 * Ingest Queue Table
 * Tracks documents pending ingestion into RAG
 */
export const ingestQueue = pgTable('ingest_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  libraryItemId: uuid('library_item_id').references(() => libraryItems.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  priority: text('priority').default('normal').notNull(), // 'low' | 'normal' | 'high'
  status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

