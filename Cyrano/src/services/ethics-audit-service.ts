/**
 * Ethics Audit Service
 * 
 * Provides audit trail logging for all ethics checks.
 * Tracks compliance scores, violations, and improvements over time.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { ethicsReviewer } from '../engines/goodcounsel/tools/ethics-reviewer.js';
import { ethicalAIGuard, GuardResult } from '../tools/ethical-ai-guard.js';
import { EthicsReviewResult } from '../engines/goodcounsel/services/ethics-rules-service.js';

export interface EthicsAuditEntry {
  id: string;
  timestamp: string;
  toolName: string;
  engine?: string;
  app?: string;
  actionType: 'recommendation' | 'suggestion' | 'content_generation' | 'data_processing';
  content: string;
  ethicsCheckType: 'ethics_reviewer' | 'ethical_ai_guard' | 'ten_rules_checker';
  checkResult: EthicsReviewResult | GuardResult | any;
  decision: 'allow' | 'allow_with_warnings' | 'block' | 'modified';
  complianceScore: number;
  violations: number;
  warnings: number;
  metadata?: Record<string, any>;
}

class EthicsAuditService {
  private auditLog: EthicsAuditEntry[] = [];
  private maxLogSize: number = 10000; // Keep last 10k entries in memory

  /**
   * Log an ethics check
   */
  async logEthicsCheck(
    toolName: string,
    actionType: EthicsAuditEntry['actionType'],
    content: string,
    checkResult: EthicsReviewResult | GuardResult | any,
    checkType: EthicsAuditEntry['ethicsCheckType'],
    metadata?: {
      engine?: string;
      app?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const entry: EthicsAuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      toolName,
      engine: metadata?.engine,
      app: metadata?.app,
      actionType,
      content: content.substring(0, 1000), // Truncate for storage
      ethicsCheckType: checkType,
      checkResult,
      decision: this.extractDecision(checkResult),
      complianceScore: this.extractComplianceScore(checkResult),
      violations: this.extractViolationCount(checkResult),
      warnings: this.extractWarningCount(checkResult),
      metadata: metadata ? { ...metadata, engine: undefined, app: undefined } : undefined,
    };

    this.auditLog.push(entry);
    
    // Trim log if too large
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }

    // In production, this would also write to database/file
    // For now, we keep in memory
    this.logToConsole(entry);

    return entry.id;
  }

  /**
   * Get audit entries
   */
  getAuditEntries(filters?: {
    toolName?: string;
    engine?: string;
    app?: string;
    startDate?: string;
    endDate?: string;
    minComplianceScore?: number;
    hasViolations?: boolean;
  }): EthicsAuditEntry[] {
    let entries = [...this.auditLog];

    if (filters) {
      if (filters.toolName) {
        entries = entries.filter(e => e.toolName === filters.toolName);
      }
      if (filters.engine) {
        entries = entries.filter(e => e.engine === filters.engine);
      }
      if (filters.app) {
        entries = entries.filter(e => e.app === filters.app);
      }
      if (filters.startDate) {
        entries = entries.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.minComplianceScore !== undefined) {
        entries = entries.filter(e => e.complianceScore >= filters.minComplianceScore!);
      }
      if (filters.hasViolations !== undefined) {
        entries = entries.filter(e => 
          filters.hasViolations ? e.violations > 0 : e.violations === 0
        );
      }
    }

    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Get compliance statistics
   */
  getComplianceStats(filters?: {
    toolName?: string;
    engine?: string;
    app?: string;
    startDate?: string;
    endDate?: string;
  }): {
    totalChecks: number;
    averageComplianceScore: number;
    totalViolations: number;
    totalWarnings: number;
    blockedCount: number;
    allowedWithWarningsCount: number;
    allowedCount: number;
    byTool: Record<string, {
      count: number;
      averageScore: number;
      violations: number;
    }>;
  } {
    const entries = this.getAuditEntries(filters);

    const stats = {
      totalChecks: entries.length,
      averageComplianceScore: 0,
      totalViolations: 0,
      totalWarnings: 0,
      blockedCount: 0,
      allowedWithWarningsCount: 0,
      allowedCount: 0,
      byTool: {} as Record<string, { count: number; averageScore: number; violations: number }>,
    };

    if (entries.length === 0) {
      return stats;
    }

    let totalScore = 0;
    for (const entry of entries) {
      totalScore += entry.complianceScore;
      stats.totalViolations += entry.violations;
      stats.totalWarnings += entry.warnings;

      if (entry.decision === 'block') {
        stats.blockedCount++;
      } else if (entry.decision === 'allow_with_warnings') {
        stats.allowedWithWarningsCount++;
      } else {
        stats.allowedCount++;
      }

      if (!stats.byTool[entry.toolName]) {
        stats.byTool[entry.toolName] = { count: 0, averageScore: 0, violations: 0 };
      }
      stats.byTool[entry.toolName].count++;
      stats.byTool[entry.toolName].violations += entry.violations;
    }

    stats.averageComplianceScore = totalScore / entries.length;

    // Calculate average scores per tool
    for (const toolName in stats.byTool) {
      const toolEntries = entries.filter(e => e.toolName === toolName);
      const toolTotalScore = toolEntries.reduce((sum, e) => sum + e.complianceScore, 0);
      stats.byTool[toolName].averageScore = toolTotalScore / toolEntries.length;
    }

    return stats;
  }

  /**
   * Extract decision from check result
   */
  private extractDecision(result: any): EthicsAuditEntry['decision'] {
    if (result.decision) {
      // From ethicalAIGuard
      if (result.decision === 'block') return 'block';
      if (result.decision === 'allow_with_warnings') return 'allow_with_warnings';
      return 'allow';
    }
    if (result.compliance) {
      // From ethicsReviewer or tenRulesChecker
      if (result.compliance.status === 'non_compliant') return 'block';
      if (result.compliance.status === 'needs_review') return 'allow_with_warnings';
      return 'allow';
    }
    return 'allow';
  }

  /**
   * Extract compliance score from check result
   */
  private extractComplianceScore(result: any): number {
    if (result.complianceScore !== undefined) {
      return result.complianceScore;
    }
    if (result.compliance?.score !== undefined) {
      return result.compliance.score;
    }
    return 100; // Default to compliant if no score
  }

  /**
   * Extract violation count from check result
   */
  private extractViolationCount(result: any): number {
    if (result.violations) {
      return Array.isArray(result.violations) ? result.violations.length : 0;
    }
    return 0;
  }

  /**
   * Extract warning count from check result
   */
  private extractWarningCount(result: any): number {
    if (result.warnings) {
      return Array.isArray(result.warnings) ? result.warnings.length : 0;
    }
    return 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ethics_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to console (in production, this would be a proper logger)
   */
  private logToConsole(entry: EthicsAuditEntry): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ethics Audit] ${entry.toolName} - ${entry.decision} - Score: ${entry.complianceScore} - Violations: ${entry.violations} - Warnings: ${entry.warnings}`);
    }
  }
}

/**
 * Export singleton instance
 */
export const ethicsAuditService = new EthicsAuditService();
