/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Audit Logger Service
 * 
 * Logs all agent actions, system events, and user interactions for compliance demonstration
 * and incident investigation. Enables attorneys to inspect decision trails.
 * 
 * Features:
 * - Log all agent actions (timestamps, inputs, outputs, reasoning)
 * - UI for attorneys to inspect decision trails
 * - Audit reports showing human oversight at critical junctures
 * - Log retention consistent with document retention policies
 */

export type AuditLogLevel = 'info' | 'warning' | 'error' | 'critical';
export type AuditLogCategory = 
  | 'agent_action'
  | 'user_action'
  | 'system_event'
  | 'security_event'
  | 'compliance_event'
  | 'integration_event'
  | 'ai_generation'
  | 'attorney_verification'
  | 'matter_access'
  | 'data_modification';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  level: AuditLogLevel;
  category: AuditLogCategory;
  userId?: string;
  agentId?: string;
  matterId?: string;
  action: string;
  description: string;
  inputs?: any;
  outputs?: any;
  reasoning?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log store (in-memory for now, should be database-backed in production)
 */
class AuditLogStore {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 100000; // Configurable limit

  /**
   * Add audit log entry
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.logs.push(fullEntry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return fullEntry;
  }

  /**
   * Get logs by matter ID
   */
  getLogsByMatter(matterId: string, limit?: number): AuditLogEntry[] {
    const filtered = this.logs.filter(log => log.matterId === matterId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs by user ID
   */
  getLogsByUser(userId: string, limit?: number): AuditLogEntry[] {
    const filtered = this.logs.filter(log => log.userId === userId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs by agent ID
   */
  getLogsByAgent(agentId: string, limit?: number): AuditLogEntry[] {
    const filtered = this.logs.filter(log => log.agentId === agentId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: AuditLogCategory, limit?: number): AuditLogEntry[] {
    const filtered = this.logs.filter(log => log.category === category);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate: number, endDate: number): AuditLogEntry[] {
    return this.logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  /**
   * Get all logs (with optional limit)
   */
  getAllLogs(limit?: number): AuditLogEntry[] {
    return limit ? this.logs.slice(-limit) : [...this.logs];
  }

  /**
   * Search logs
   */
  searchLogs(query: string, limit?: number): AuditLogEntry[] {
    const lowerQuery = query.toLowerCase();
    const filtered = this.logs.filter(log =>
      log.action.toLowerCase().includes(lowerQuery) ||
      log.description.toLowerCase().includes(lowerQuery) ||
      log.matterId?.toLowerCase().includes(lowerQuery) ||
      log.userId?.toLowerCase().includes(lowerQuery)
    );
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Clear old logs (older than specified timestamp)
   */
  clearOldLogs(beforeTimestamp: number): number {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= beforeTimestamp);
    return initialLength - this.logs.length;
  }
}

// Singleton audit log store
export const auditLogStore = new AuditLogStore();

/**
 * Log agent action
 */
export function logAgentAction(
  agentId: string,
  action: string,
  description: string,
  matterId?: string,
  inputs?: any,
  outputs?: any,
  reasoning?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level: 'info',
    category: 'agent_action',
    agentId,
    matterId,
    action,
    description,
    inputs,
    outputs,
    reasoning,
    metadata
  });
}

/**
 * Log user action
 */
export function logUserAction(
  userId: string,
  action: string,
  description: string,
  matterId?: string,
  inputs?: any,
  outputs?: any,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): AuditLogEntry {
  return auditLogStore.log({
    level: 'info',
    category: 'user_action',
    userId,
    matterId,
    action,
    description,
    inputs,
    outputs,
    metadata,
    ipAddress,
    userAgent
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  level: AuditLogLevel,
  action: string,
  description: string,
  userId?: string,
  matterId?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level,
    category: 'security_event',
    userId,
    matterId,
    action,
    description,
    metadata
  });
}

/**
 * Log compliance event
 */
export function logComplianceEvent(
  level: AuditLogLevel,
  action: string,
  description: string,
  userId?: string,
  matterId?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level,
    category: 'compliance_event',
    userId,
    matterId,
    action,
    description,
    metadata
  });
}

/**
 * Log AI generation
 */
export function logAIGeneration(
  agentId: string,
  action: string,
  description: string,
  matterId?: string,
  inputs?: any,
  outputs?: any,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level: 'info',
    category: 'ai_generation',
    agentId,
    matterId,
    action,
    description,
    inputs,
    outputs,
    metadata
  });
}

/**
 * Log attorney verification
 */
export function logAttorneyVerification(
  userId: string,
  workProductId: string,
  verified: boolean,
  matterId?: string,
  verificationNotes?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level: verified ? 'info' : 'warning',
    category: 'attorney_verification',
    userId,
    matterId,
    action: 'attorney_verification',
    description: `Attorney ${userId} ${verified ? 'verified' : 'rejected'} work product ${workProductId}`,
    inputs: { workProductId, verified },
    outputs: { verificationNotes },
    metadata
  });
}

/**
 * Log matter access
 */
export function logMatterAccess(
  userId: string,
  matterId: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return auditLogStore.log({
    level: 'info',
    category: 'matter_access',
    userId,
    matterId,
    action,
    description,
    metadata
  });
}

/**
 * Generate audit report
 */
export function generateAuditReport(
  matterId?: string,
  userId?: string,
  startDate?: number,
  endDate?: number
): {
  summary: {
    totalLogs: number;
    byCategory: Record<AuditLogCategory, number>;
    byLevel: Record<AuditLogLevel, number>;
  };
  logs: AuditLogEntry[];
} {
  let logs = auditLogStore.getAllLogs();

  if (matterId) {
    logs = logs.filter(log => log.matterId === matterId);
  }

  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }

  if (startDate && endDate) {
    logs = logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  const byCategory: Record<AuditLogCategory, number> = {
    agent_action: 0,
    user_action: 0,
    system_event: 0,
    security_event: 0,
    compliance_event: 0,
    integration_event: 0,
    ai_generation: 0,
    attorney_verification: 0,
    matter_access: 0,
    data_modification: 0
  };

  const byLevel: Record<AuditLogLevel, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0
  };

  for (const log of logs) {
    byCategory[log.category]++;
    byLevel[log.level]++;
  }

  return {
    summary: {
      totalLogs: logs.length,
      byCategory,
      byLevel
    },
    logs
  };
}

}
}