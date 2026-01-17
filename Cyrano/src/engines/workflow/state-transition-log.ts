/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * State Transition Audit Log
 * Logs all state transitions for audit purposes
 */

import { DocumentState, StateTransition } from './document-state-machine';

export interface AuditLogEntry {
  id: string;
  documentId: string;
  transition: StateTransition;
  metadata?: Record<string, any>;
}

/**
 * In-memory audit log (in production, this would be persisted to database)
 */
const auditLog: AuditLogEntry[] = [];

/**
 * Log a state transition
 */
export function logStateTransition(
  documentId: string,
  transition: StateTransition,
  metadata?: Record<string, any>
): void {
  const entry: AuditLogEntry = {
    id: `${documentId}-${transition.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    documentId,
    transition,
    metadata,
  };

  auditLog.push(entry);
  
  // In production, persist to database
  console.log('[Audit Log]', entry);
}

/**
 * Get audit log for a document
 */
export function getDocumentAuditLog(documentId: string): AuditLogEntry[] {
  return auditLog.filter(entry => entry.documentId === documentId);
}

/**
 * Get all audit logs
 */
export function getAllAuditLogs(): AuditLogEntry[] {
  return [...auditLog];
}
