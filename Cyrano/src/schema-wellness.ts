/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { pgTable, uuid, text, integer, timestamp, jsonb, real } from 'drizzle-orm/pg-core';
import { users } from './schema.js';

/**
 * Wellness Journal Entries Table
 * Stores encrypted journal entries (text and voice) with metadata
 */
export const wellnessJournalEntries = pgTable('wellness_journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Entry content (encrypted)
  contentEncrypted: text('content_encrypted').notNull(), // Encrypted journal text
  contentType: text('content_type').notNull().default('text'), // 'text' | 'voice' | 'both'
  
  // Emotional/metadata (encrypted)
  mood: text('mood'), // User-provided mood (encrypted)
  tags: jsonb('tags').$type<string[]>().default([]), // Tags (encrypted array)
  
  // Voice recording (if applicable)
  voiceAudioPath: text('voice_audio_path'), // Path to encrypted audio file (encrypted)
  transcriptionEncrypted: text('transcription_encrypted'), // Encrypted transcription
  
  // AI analysis
  sentimentScore: real('sentiment_score'), // -1.0 to 1.0
  stressIndicators: jsonb('stress_indicators').$type<string[]>(),
  burnoutSignals: jsonb('burnout_signals').$type<string[]>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete for HIPAA retention
});

/**
 * Wellness Feedback Table
 * Stores AI-generated feedback and insights for journal entries
 */
export const wellnessFeedback = pgTable('wellness_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id').references(() => wellnessJournalEntries.id, { onDelete: 'cascade' }).notNull(),
  
  // Feedback content (encrypted)
  insightsEncrypted: jsonb('insights_encrypted').$type<string[]>().notNull(),
  patternsEncrypted: jsonb('patterns_encrypted').$type<string[]>().default([]),
  suggestionsEncrypted: jsonb('suggestions_encrypted').$type<string[]>().default([]),
  encouragementEncrypted: text('encouragement_encrypted'),
  
  // Wellness recommendations (encrypted)
  wellnessRecommendationsEncrypted: jsonb('wellness_recommendations_encrypted').$type<{
    type: 'physical' | 'mental' | 'social' | 'professional';
    action: string;
    priority: 'low' | 'medium' | 'high';
  }[]>(),
  
  // Burnout/stress alerts (encrypted)
  alertsEncrypted: jsonb('alerts_encrypted').$type<{
    type: 'burnout' | 'stress' | 'overwork' | 'isolation';
    severity: 'mild' | 'moderate' | 'severe';
    message: string;
    recommendations: string[];
  }[]>(),
  
  // Hume emotion data (encrypted)
  humeEmotionDataEncrypted: jsonb('hume_emotion_data_encrypted'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Wellness Trends Table
 * Aggregated wellness trends and patterns over time
 */
export const wellnessTrends = pgTable('wellness_trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Time period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  periodType: text('period_type').notNull(), // 'week' | 'month'
  
  // Aggregated metrics
  avgSentiment: real('avg_sentiment'),
  stressLevel: text('stress_level'), // 'low' | 'moderate' | 'high' | 'critical'
  burnoutRisk: text('burnout_risk'), // 'low' | 'moderate' | 'high'
  
  // Patterns detected (encrypted)
  commonThemesEncrypted: jsonb('common_themes_encrypted').$type<{ theme: string; frequency: number }[]>(),
  moodTrendsEncrypted: jsonb('mood_trends_encrypted').$type<{ date: string; mood: string; score: number }[]>(),
  
  // AI-generated insights (encrypted)
  insightsEncrypted: jsonb('insights_encrypted').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Wellness Access Logs Table (HIPAA Compliance)
 * Logs all access to wellness data
 */
export const wellnessAccessLogs = pgTable('wellness_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  entryId: uuid('entry_id'), // Nullable for general access logs
  
  action: text('action').notNull(), // 'view' | 'create' | 'update' | 'delete' | 'export'
  ipAddress: text('ip_address'), // Encrypted
  userAgent: text('user_agent'), // Encrypted
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

/**
 * Wellness Audit Trail Table (HIPAA Compliance)
 * Complete audit trail of all CRUD operations
 */
export const wellnessAuditTrail = pgTable('wellness_audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id).notNull(),
  entryId: uuid('entry_id').notNull(),
  
  operation: text('operation').notNull(), // 'create' | 'read' | 'update' | 'delete'
  beforeStateHash: text('before_state_hash'), // SHA-256 hash of data before operation
  afterStateHash: text('after_state_hash'), // SHA-256 hash of data after operation
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});


