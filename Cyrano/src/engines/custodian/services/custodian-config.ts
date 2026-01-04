/*
 * Custodian Configuration Service
 * Manages Custodian settings and preferences
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { db } from '../../../db.js';
import { custodianConfig, adminContacts } from '../../../schema-custodian.js';
import { eq } from 'drizzle-orm';

export interface AdminContactPreference {
  method: 'email' | 'sms' | 'instant_message' | 'webhook' | 'console';
  contact_info: string; // email address, phone number, webhook URL, etc.
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical'; // Only send alerts of this priority or higher
}

export interface CustodianConfig {
  monitoring_interval_minutes: 10 | 20 | 30;
  admin_contacts: AdminContactPreference[];
  auto_fix_enabled: boolean;
  auto_update_enabled: boolean;
  failsafe_enabled: boolean;
  health_check_thresholds: {
    cpu_warning: number;
    cpu_critical: number;
    memory_warning: number;
    memory_critical: number;
    disk_warning: number;
    disk_critical: number;
  };
}

const DEFAULT_CONFIG: CustodianConfig = {
  monitoring_interval_minutes: 20,
  admin_contacts: [],
  auto_fix_enabled: true,
  auto_update_enabled: true,
  failsafe_enabled: true,
  health_check_thresholds: {
    cpu_warning: 80,
    cpu_critical: 90,
    memory_warning: 80,
    memory_critical: 90,
    disk_warning: 80,
    disk_critical: 90,
  },
};

class CustodianConfigService {
  private config: CustodianConfig = DEFAULT_CONFIG;
  private initialized: boolean = false;
  private configId: string | null = null;

  async initialize(): Promise<void> {
    this.initialized = true;
    // Load config from database or environment
    await this.loadConfig();
    console.log('[Custodian Config] Service initialized');
  }

  async loadConfig(): Promise<void> {
    try {
      // Try to load from database first
      if (db) {
        const [existingConfig] = await db.select().from(custodianConfig).limit(1);
        
        if (existingConfig) {
          this.configId = existingConfig.id;
          
          // Load main config
          this.config.monitoring_interval_minutes = (existingConfig.monitoringIntervalMinutes as 10 | 20 | 30) || 20;
          this.config.auto_fix_enabled = existingConfig.autoFixEnabled ?? true;
          this.config.auto_update_enabled = existingConfig.autoUpdateEnabled ?? true;
          this.config.failsafe_enabled = existingConfig.failsafeEnabled ?? true;
          
          if (existingConfig.healthCheckThresholds) {
            this.config.health_check_thresholds = existingConfig.healthCheckThresholds as any;
          }
          
          // Load admin contacts
          const contacts = await db.select().from(adminContacts).where(eq(adminContacts.configId, existingConfig.id));
          this.config.admin_contacts = contacts.map(contact => ({
            method: contact.method as AdminContactPreference['method'],
            contact_info: contact.contactInfo,
            enabled: contact.enabled,
            priority: contact.priority as AdminContactPreference['priority'],
          }));
          
          console.log('[Custodian Config] Loaded from database');
          return;
        } else {
          // Create default config in database
          const [newConfig] = await db.insert(custodianConfig).values({
            monitoringIntervalMinutes: DEFAULT_CONFIG.monitoring_interval_minutes,
            autoFixEnabled: DEFAULT_CONFIG.auto_fix_enabled,
            autoUpdateEnabled: DEFAULT_CONFIG.auto_update_enabled,
            failsafeEnabled: DEFAULT_CONFIG.failsafe_enabled,
            healthCheckThresholds: DEFAULT_CONFIG.health_check_thresholds,
          }).returning();
          
          if (newConfig) {
            this.configId = newConfig.id;
            console.log('[Custodian Config] Created default config in database');
          }
        }
      }
    } catch (error) {
      console.warn('[Custodian Config] Database not available, using environment/defaults:', error);
    }
    
    // Fallback to environment variables and defaults
    const intervalEnv = process.env.CUSTODIAN_MONITORING_INTERVAL;
    if (intervalEnv) {
      const interval = parseInt(intervalEnv, 10);
      if ([10, 20, 30].includes(interval)) {
        this.config.monitoring_interval_minutes = interval as 10 | 20 | 30;
      }
    }

    const adminContactsEnv = process.env.CUSTODIAN_ADMIN_CONTACTS;
    if (adminContactsEnv) {
      try {
        this.config.admin_contacts = JSON.parse(adminContactsEnv);
      } catch (error) {
        console.error('[Custodian Config] Failed to parse admin contacts:', error);
      }
    }

    this.config.auto_fix_enabled = process.env.CUSTODIAN_AUTO_FIX !== 'false';
    this.config.auto_update_enabled = process.env.CUSTODIAN_AUTO_UPDATE !== 'false';
    this.config.failsafe_enabled = process.env.CUSTODIAN_FAILSAFE !== 'false';
  }

  async saveConfig(config: Partial<CustodianConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    try {
      // Save to database if available
      if (db && this.configId) {
        await db.update(custodianConfig)
          .set({
            monitoringIntervalMinutes: this.config.monitoring_interval_minutes,
            autoFixEnabled: this.config.auto_fix_enabled,
            autoUpdateEnabled: this.config.auto_update_enabled,
            failsafeEnabled: this.config.failsafe_enabled,
            healthCheckThresholds: this.config.health_check_thresholds,
            updatedAt: new Date(),
          })
          .where(eq(custodianConfig.id, this.configId));
        
        // Update admin contacts
        if (config.admin_contacts !== undefined) {
          // Delete existing contacts
          await db.delete(adminContacts).where(eq(adminContacts.configId, this.configId));
          
          // Insert new contacts
          if (this.config.admin_contacts.length > 0) {
            await db.insert(adminContacts).values(
              this.config.admin_contacts.map(contact => ({
                configId: this.configId!,
                method: contact.method,
                contactInfo: contact.contact_info,
                enabled: contact.enabled,
                priority: contact.priority,
              }))
            );
          }
        }
        
        console.log('[Custodian Config] Configuration saved to database');
      } else {
        console.log('[Custodian Config] Configuration updated (in-memory only)');
      }
    } catch (error) {
      console.error('[Custodian Config] Failed to save to database:', error);
      console.log('[Custodian Config] Configuration updated (in-memory only)');
    }
  }

  getConfig(): CustodianConfig {
    return { ...this.config };
  }

  getMonitoringIntervalMs(): number {
    return this.config.monitoring_interval_minutes * 60 * 1000;
  }

  getAdminContacts(priority: 'low' | 'medium' | 'high' | 'critical' = 'low'): AdminContactPreference[] {
    return this.config.admin_contacts.filter(
      contact => contact.enabled && this.isPriorityMatch(contact.priority, priority)
    );
  }

  private isPriorityMatch(contactPriority: string, alertPriority: string): boolean {
    const priorityOrder = ['low', 'medium', 'high', 'critical'];
    const contactIndex = priorityOrder.indexOf(contactPriority);
    const alertIndex = priorityOrder.indexOf(alertPriority);
    return contactIndex >= alertIndex;
  }

  async getStatus(): Promise<{ initialized: boolean; config: CustodianConfig }> {
    return {
      initialized: this.initialized,
      config: this.getConfig(),
    };
  }
}

export const custodianConfigService = new CustodianConfigService();
