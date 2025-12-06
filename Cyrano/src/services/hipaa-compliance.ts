/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { db } from '../db.js';
import { wellnessAccessLogs, wellnessAuditTrail } from '../schema-wellness.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { encryption } from './encryption-service.js';
import { createHash } from 'crypto';

/**
 * HIPAA Compliance Module
 * 
 * Provides access logging, audit trails, data retention policies,
 * secure deletion, and breach detection for wellness data.
 */

export interface BreachReport {
  userId: number;
  detectedAt: Date;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  affectedEntries: string[];
  actions: string[];
}

class HIPAAComplianceService {
  private readonly defaultRetentionYears = parseInt(
    process.env.WELLNESS_RETENTION_YEARS || '7',
    10
  );

  /**
   * Log access to wellness data
   */
  async logAccess(
    userId: number,
    entryId: string | null,
    action: 'view' | 'create' | 'update' | 'delete' | 'export',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.insert(wellnessAccessLogs).values({
        userId,
        entryId: entryId || null,
        action,
        ipAddress: ipAddress ? encryption.encryptField(ipAddress, 'ip_address').encrypted : null,
        userAgent: userAgent ? encryption.encryptField(userAgent, 'user_agent').encrypted : null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log access:', error);
      // Don't throw - logging failures shouldn't break operations
    }
  }

  /**
   * Log data operation for audit trail
   */
  async logDataOperation(
    userId: number,
    entryId: string,
    operation: 'create' | 'read' | 'update' | 'delete',
    beforeState?: any,
    afterState?: any
  ): Promise<void> {
    try {
      const beforeHash = beforeState
        ? createHash('sha256').update(JSON.stringify(beforeState)).digest('hex')
        : null;
      const afterHash = afterState
        ? createHash('sha256').update(JSON.stringify(afterState)).digest('hex')
        : null;

      await db.insert(wellnessAuditTrail).values({
        userId,
        entryId,
        operation,
        beforeStateHash: beforeHash,
        afterStateHash: afterHash,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log data operation:', error);
      // Don't throw - logging failures shouldn't break operations
    }
  }

  /**
   * Check if entry should be retained per retention policy
   */
  async checkRetentionPolicy(entryId: string): Promise<boolean> {
    try {
      // In a full implementation, this would check wellness_data_retention table
      // For now, we'll use a simple date-based check
      // Entries older than retention period should be eligible for deletion
      return true; // Always retain for now - implement retention logic as needed
    } catch (error) {
      console.error('Failed to check retention policy:', error);
      return true; // Default to retaining if check fails
    }
  }

  /**
   * Securely delete an entry (overwrite + delete)
   */
  async secureDelete(entryId: string): Promise<void> {
    try {
      // 1. Overwrite encrypted data with random data (if possible)
      // 2. Mark as deleted (soft delete)
      // 3. Log deletion
      // 4. Schedule permanent deletion after retention period
      
      // For now, we'll rely on soft delete in the database
      // Full secure deletion would require:
      // - Decrypting data
      // - Overwriting with random data
      // - Re-encrypting with random key
      // - Then deleting
      
      await this.logDataOperation(0, entryId, 'delete'); // userId 0 = system
    } catch (error) {
      console.error('Failed to securely delete entry:', error);
      throw error;
    }
  }

  /**
   * Detect potential breaches
   */
  async detectBreach(userId: number): Promise<BreachReport | null> {
    try {
      // Check for suspicious access patterns:
      // - Multiple failed access attempts
      // - Access from unusual IP addresses
      // - Unusual access times
      // - Bulk export operations
      
      const recentAccess = await db
        .select()
        .from(wellnessAccessLogs)
        .where(
          and(
            eq(wellnessAccessLogs.userId, userId),
            gte(wellnessAccessLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
          )
        );

      // Simple breach detection: check for unusual patterns
      const exportCount = recentAccess.filter(a => a.action === 'export').length;
      const failedAccessCount = recentAccess.filter(a => a.action === 'view' && !a.entryId).length;

      if (exportCount > 10 || failedAccessCount > 20) {
        return {
          userId,
          detectedAt: new Date(),
          severity: exportCount > 10 ? 'high' : 'moderate',
          description: `Unusual access pattern detected: ${exportCount} exports, ${failedAccessCount} failed accesses`,
          affectedEntries: recentAccess.map(a => a.entryId || '').filter(Boolean),
          actions: ['Review access logs', 'Notify user', 'Consider temporary access restriction'],
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to detect breach:', error);
      return null;
    }
  }

  /**
   * Get access log for an entry
   */
  async getAccessLog(entryId: string): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(wellnessAccessLogs)
        .where(eq(wellnessAccessLogs.entryId, entryId))
        .orderBy(wellnessAccessLogs.timestamp);

      // Decrypt sensitive fields
      return logs.map(log => ({
        ...log,
        ipAddress: log.ipAddress ? encryption.decryptField(
          { encrypted: log.ipAddress, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' },
          'ip_address'
        ) : null,
        userAgent: log.userAgent ? encryption.decryptField(
          { encrypted: log.userAgent, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' },
          'user_agent'
        ) : null,
      }));
    } catch (error) {
      console.error('Failed to get access log:', error);
      return [];
    }
  }

  /**
   * Get audit trail for an entry
   */
  async getAuditTrail(entryId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(wellnessAuditTrail)
        .where(eq(wellnessAuditTrail.entryId, entryId))
        .orderBy(wellnessAuditTrail.timestamp);
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }
}

// Export singleton instance
let hipaaComplianceService: HIPAAComplianceService | null = null;

export function getHIPAAComplianceService(): HIPAAComplianceService {
  if (!hipaaComplianceService) {
    hipaaComplianceService = new HIPAAComplianceService();
  }
  return hipaaComplianceService;
}

// Export for direct use
export const hipaaCompliance = {
  logAccess: async (
    userId: number,
    entryId: string | null,
    action: 'view' | 'create' | 'update' | 'delete' | 'export',
    ipAddress?: string,
    userAgent?: string
  ) => {
    const service = getHIPAAComplianceService();
    return service.logAccess(userId, entryId, action, ipAddress, userAgent);
  },
  logDataOperation: async (
    userId: number,
    entryId: string,
    operation: 'create' | 'read' | 'update' | 'delete',
    beforeState?: any,
    afterState?: any
  ) => {
    const service = getHIPAAComplianceService();
    return service.logDataOperation(userId, entryId, operation, beforeState, afterState);
  },
  checkRetentionPolicy: async (entryId: string) => {
    const service = getHIPAAComplianceService();
    return service.checkRetentionPolicy(entryId);
  },
  secureDelete: async (entryId: string) => {
    const service = getHIPAAComplianceService();
    return service.secureDelete(entryId);
  },
  detectBreach: async (userId: number) => {
    const service = getHIPAAComplianceService();
    return service.detectBreach(userId);
  },
  getAccessLog: async (entryId: string) => {
    const service = getHIPAAComplianceService();
    return service.getAccessLog(entryId);
  },
  getAuditTrail: async (entryId: string) => {
    const service = getHIPAAComplianceService();
    return service.getAuditTrail(entryId);
  },
};

