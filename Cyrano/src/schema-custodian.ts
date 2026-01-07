/*
 * Custodian Database Schema
 * Stores Custodian configuration and alert history
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { pgTable, text, jsonb, boolean, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Custodian Configuration Table
 * Stores system-wide Custodian settings
 */
export const custodianConfig = pgTable('custodian_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Monitoring settings
  monitoringIntervalMinutes: integer('monitoring_interval_minutes').notNull().default(20),
  
  // Feature toggles
  autoFixEnabled: boolean('auto_fix_enabled').notNull().default(true),
  autoUpdateEnabled: boolean('auto_update_enabled').notNull().default(true),
  failsafeEnabled: boolean('failsafe_enabled').notNull().default(true),
  
  // Health check thresholds
  healthCheckThresholds: jsonb('health_check_thresholds').$type<{
    cpu_warning: number;
    cpu_critical: number;
    memory_warning: number;
    memory_critical: number;
    disk_warning: number;
    disk_critical: number;
  }>().default({
    cpu_warning: 80,
    cpu_critical: 90,
    memory_warning: 80,
    memory_critical: 90,
    disk_warning: 80,
    disk_critical: 90,
  }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Admin Contact Preferences Table
 * Stores admin contact methods and preferences
 */
export const adminContacts = pgTable('admin_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  configId: uuid('config_id').references(() => custodianConfig.id, { onDelete: 'cascade' }).notNull(),
  
  // Contact method
  method: text('method').notNull(), // 'email' | 'sms' | 'instant_message' | 'webhook' | 'console'
  contactInfo: text('contact_info').notNull(), // email address, phone number, webhook URL, etc.
  
  // Preferences
  enabled: boolean('enabled').notNull().default(true),
  priority: text('priority').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Alert History Table
 * Stores all alerts sent by Custodian
 */
export const custodianAlerts = pgTable('custodian_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Alert details
  level: text('level').notNull(), // 'info' | 'warning' | 'error' | 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  requiresIntervention: boolean('requires_intervention').notNull().default(false),
  priority: text('priority'), // 'low' | 'medium' | 'high' | 'critical'
  
  // Delivery information
  deliveryMethods: jsonb('delivery_methods').$type<string[]>().default([]),
  deliveredAt: timestamp('delivered_at'),
  
  // Metadata
  metadata: jsonb('metadata').$type<any>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
