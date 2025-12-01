/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, varchar } from 'drizzle-orm/pg-core';
import { users } from './schema.js';

/**
 * Email Drafts Table
 * Stores legal email drafts with version history
 */
export const emailDrafts = pgTable('email_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Draft metadata
  subject: text('subject').notNull(),
  recipientType: text('recipient_type').notNull(),
  recipientName: text('recipient_name'),
  recipientEmail: text('recipient_email'),
  
  // Content
  body: text('body').notNull(),
  bodyHtml: text('body_html'), // Optional HTML version
  
  // Email configuration
  to: text('to').notNull(),
  cc: jsonb('cc').$type<string[]>().default([]),
  bcc: jsonb('bcc').$type<string[]>().default([]),
  
  // Context
  caseId: varchar('case_id'), // Link to case if applicable
  purpose: text('purpose').notNull(),
  tone: text('tone').notNull().default('professional'),
  
  // Attorney info
  attorneyName: text('attorney_name'),
  attorneyEmail: text('attorney_email'),
  barNumber: text('bar_number'),
  firmName: text('firm_name'),
  
  // Attachments
  attachments: jsonb('attachments').$type<Array<{
    filename: string;
    description?: string;
    fileId?: string;
  }>>().default([]),
  
  // Template info
  templateUsed: text('template_used'),
  customTemplate: text('custom_template'),
  jurisdiction: text('jurisdiction'),
  
  // Status and workflow
  status: text('status').notNull().default('draft'), // 'draft', 'pending_approval', 'approved', 'sent', 'scheduled'
  approvalStatus: text('approval_status').default('pending'), // 'pending', 'approved', 'rejected', 'needs_revision'
  scheduledSendAt: timestamp('scheduled_send_at'),
  sentAt: timestamp('sent_at'),
  
  // Versioning
  version: integer('version').notNull().default(1),
  parentDraftId: uuid('parent_draft_id'), // For version history
  changeSummary: text('change_summary'), // What changed in this version
  
  // Ownership and collaboration
  createdBy: integer('created_by').references(() => users.id).notNull(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
  
  // Review and collaboration
  reviewers: jsonb('reviewers').$type<Array<{
    userId: number;
    status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
    comments?: string;
    reviewedAt?: string;
  }>>().default([]),
  
  // Threading
  threadId: text('thread_id'), // Email thread ID if replying
  inReplyTo: text('in_reply_to'), // Message ID this is replying to
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  aiProvider: text('ai_provider'),
  validationResults: jsonb('validation_results').$type<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Email Sent History Table
 * Tracks sent emails for analytics
 */
export const emailSentHistory = pgTable('email_sent_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => emailDrafts.id),
  
  // Sent email details
  to: text('to').notNull(),
  cc: jsonb('cc').$type<string[]>().default([]),
  bcc: jsonb('bcc').$type<string[]>().default([]),
  subject: text('subject').notNull(),
  
  // Provider info
  emailProvider: text('email_provider').notNull(), // 'gmail' | 'outlook'
  messageId: text('message_id'), // Provider's message ID
  
  // Response tracking
  openedAt: timestamp('opened_at'),
  repliedAt: timestamp('replied_at'),
  responseTime: integer('response_time'), // Hours to response
  
  sentBy: integer('sent_by').references(() => users.id).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

