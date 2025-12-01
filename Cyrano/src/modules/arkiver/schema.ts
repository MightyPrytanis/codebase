/**
 * Arkiver Database Schema (Drizzle ORM)
 * 
 * Based on MCP Interface Contract and Base44 ArkiverMJ specifications
 * Created: 2025-11-22
 * Status: PROPOSAL - Awaiting approval
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { pgTable, uuid, text, integer, timestamp, jsonb, real, boolean } from 'drizzle-orm/pg-core';
import { users } from '../../schema';

/**
 * Uploaded files table
 * Tracks all files uploaded to Arkiver for processing
 */
export const arkiverFiles = pgTable('arkiver_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // File metadata
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(), // 'pdf', 'docx', 'txt', 'eml', 'png', etc.
  fileSize: integer('file_size').notNull(), // Size in bytes
  storagePath: text('storage_path').notNull(), // Path on filesystem
  mimeType: text('mime_type'), // e.g., 'application/pdf'
  
  // Processing status
  status: text('status').notNull().default('uploaded'), // 'uploaded', 'queued', 'processing', 'completed', 'failed'
  processingProgress: integer('processing_progress').default(0), // 0-100
  
  // Source tracking
  sourceLLM: text('source_llm'), // Which LLM generated this (if applicable): 'ChatGPT', 'Claude', etc.
  sourceType: text('source_type'), // 'legal_document', 'conversation', 'email', etc.
  
  // Ownership
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  
  // Processing configuration (from contract's ExtractionSettings)
  extractionSettings: jsonb('extraction_settings').$type<{
    extractionMode?: 'standard' | 'deep' | 'fast'; // Contract requirement (lines 141-144)
    insightType?: string;
    extractEntities?: boolean;
    extractCitations?: boolean;
    extractTimeline?: boolean;
    enableOCR?: boolean;
    categories?: string[];
  }>(),
  
  // Processing results summary
  fileSummary: text('file_summary'), // AI-generated summary after processing
  insightCount: integer('insight_count').default(0), // Number of insights extracted
  
  // Additional metadata
  metadata: jsonb('metadata').$type<{
    pageCount?: number;
    wordCount?: number;
    language?: string;
    author?: string;
    creationDate?: string;
    [key: string]: any;
  }>(),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'), // When processing completed
});

/**
 * Extracted insights table
 * Stores individual insights extracted from files
 * Based on contract's Insight interface (lines 456-468)
 */
export const arkiverInsights = pgTable('arkiver_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Relationship to file
  fileId: uuid('file_id').references(() => arkiverFiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Insight content (from contract)
  title: text('title').notNull(), // Contract requirement (line 459)
  type: text('type').notNull(), // 'citation', 'entity', 'date', 'topic', 'summary', etc.
  content: text('content').notNull(), // The extracted insight text
  context: text('context'), // Surrounding context for the insight
  
  // Contract-required top-level fields (lines 463-467)
  entities: jsonb('entities').$type<Record<string, any>>(), // Extracted entities object
  citations: jsonb('citations').$type<string[]>().default([]), // Array of citations
  caseId: text('case_id'), // Optional LexFiat integration
  
  // Quality metrics
  confidence: real('confidence'), // 0.0-1.0 confidence score from extraction
  relevance: real('relevance'), // 0.0-1.0 relevance score (if calculated)
  
  // Categorization
  tags: jsonb('tags').$type<string[]>().default([]), // User-defined or auto-generated tags
  category: text('category'), // High-level category: 'legal', 'factual', 'procedural', etc.
  
  // Source attribution
  source: text('source').notNull().default('system'), // 'system', 'llm:gpt4', 'llm:claude', 'user'
  sourceLLM: text('source_llm'), // If extracted by LLM
  
  // Position in document
  pageNumber: integer('page_number'), // Page where insight was found
  position: jsonb('position').$type<{
    start?: number;
    end?: number;
    line?: number;
  }>(),
  
  // Structured data (for specific insight types)
  structuredData: jsonb('structured_data').$type<{
    // For citations
    citation?: {
      volume?: string;
      reporter?: string;
      page?: string;
      court?: string;
      year?: string;
    };
    // For entities
    entity?: {
      entityType?: string; // 'person', 'organization', 'location', 'date', etc.
      name?: string;
      role?: string;
    };
    // For dates/events
    event?: {
      date?: string;
      description?: string;
      participants?: string[];
    };
    [key: string]: any;
  }>(),
  
  // Additional metadata
  metadata: jsonb('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Async job queue table
 * Tracks long-running processing jobs
 */
export const arkiverJobs = pgTable('arkiver_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Job details
  fileId: uuid('file_id').references(() => arkiverFiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'file_extraction', 'insight_processing', 'integrity_test', etc.
  
  // Status tracking
  status: text('status').notNull().default('queued'), // 'queued', 'processing', 'completed', 'failed', 'cancelled'
  progress: integer('progress').notNull().default(0), // 0-100
  
  // Job configuration
  config: jsonb('config').$type<{
    extractionType?: string;
    processingSteps?: string[];
    timeout?: number;
    retryCount?: number;
    [key: string]: any;
  }>(),
  
  // Results and errors
  result: jsonb('result').$type<{
    insightsCreated?: number;
    processingTime?: number;
    summary?: string;
    [key: string]: any;
  }>(),
  error: jsonb('error').$type<{
    code: string;
    message: string;
    details?: any;
  }>(), // Contract requirement (lines 259-263)
  
  // Execution tracking
  attempts: integer('attempts').notNull().default(0), // Number of retry attempts
  maxAttempts: integer('max_attempts').notNull().default(3), // Max retries before giving up
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  lastAttemptAt: timestamp('last_attempt_at'),
});

/**
 * AI Integrity Test Results table
 * Stores results from AI integrity monitoring tests
 * Based on Base44 ArkiverMJ specifications
 */
export const arkiverIntegrityTests = pgTable('arkiver_integrity_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Test details
  testName: text('test_name').notNull(), // e.g., "Opinion Drift: GPT-4 on Climate Change"
  testType: text('test_type').notNull(), // 'opinion_drift', 'bias_detection', 'honesty_assessment', 'ten_rules_compliance'
  targetLLM: text('target_llm').notNull(), // 'ChatGPT', 'Claude', 'Gemini', etc.
  
  // Test parameters
  topic: text('topic'), // Topic being tested (for opinion drift)
  dateRange: jsonb('date_range').$type<{
    start: string;
    end: string;
  }>(),
  
  // Test results
  score: real('score'), // Overall score (0.0-1.0)
  driftScore: real('drift_score'), // Opinion drift score (if applicable)
  biasIndicators: jsonb('bias_indicators').$type<string[]>(), // Detected biases
  findings: text('findings'), // Human-readable findings
  aiAnalysis: text('ai_analysis'), // LLM-generated analysis
  recommendations: jsonb('recommendations').$type<string[]>(), // Suggested actions
  
  // Alert status
  alertTriggered: boolean('alert_triggered').default(false),
  alertSent: boolean('alert_sent').default(false),
  alertLevel: text('alert_level'), // 'info', 'warning', 'critical'
  
  // Audit trail
  executedBy: integer('executed_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Dashboard configuration table
 * User-customizable dashboards
 */
export const arkiverDashboards = pgTable('arkiver_dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Dashboard details
  name: text('name').notNull(),
  description: text('description'),
  
  // Ownership
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isDefault: boolean('is_default').default(false),
  
  // Widget configuration
  widgets: jsonb('widgets').$type<Array<{
    id: string;
    type: string; // 'insight_count', 'file_count', 'recent_activity', 'top_topics', etc.
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>>().notNull().default([]),
  
  // Layout
  layout: text('layout').default('grid'), // 'grid', 'flex', 'custom'
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports for use in application code
export type ArkiverFile = typeof arkiverFiles.$inferSelect;
export type NewArkiverFile = typeof arkiverFiles.$inferInsert;

export type ArkiverInsight = typeof arkiverInsights.$inferSelect;
export type NewArkiverInsight = typeof arkiverInsights.$inferInsert;

export type ArkiverJob = typeof arkiverJobs.$inferSelect;
export type NewArkiverJob = typeof arkiverJobs.$inferInsert;

export type ArkiverIntegrityTest = typeof arkiverIntegrityTests.$inferSelect;
export type NewArkiverIntegrityTest = typeof arkiverIntegrityTests.$inferInsert;

export type ArkiverDashboard = typeof arkiverDashboards.$inferSelect;
export type NewArkiverDashboard = typeof arkiverDashboards.$inferInsert;
