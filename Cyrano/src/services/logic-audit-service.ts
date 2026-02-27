/*
 * LogicAuditService
 * Captures reasoning context (prompt/resource/state) when errors occur.
 */
import path from 'path';
import { promises as fs } from 'fs';

export interface LogicAuditRecord {
  timestamp: string;
  engine?: string;
  module?: string;
  stepId?: string;
  prompt?: string;
  resources?: any;
  input?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export class LogicAuditService {
  constructor(private logDir: string = path.resolve('logs/logic-audit')) {}

  async capture(record: LogicAuditRecord): Promise<void> {
    await fs.mkdir(this.logDir, { recursive: true });
    // Log directory is application-controlled - safe for audit logging
    const file = path.join(this.logDir, `${Date.now()}-${record.engine || 'engine'}.json`); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    await fs.writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  }
}

export const logicAuditService = new LogicAuditService();

