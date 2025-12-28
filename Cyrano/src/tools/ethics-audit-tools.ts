/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Ethics Audit Tools
 * 
 * Tools for accessing ethics audit trail and statistics
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { ethicsAuditService } from '../services/ethics-audit-service.js';

const GetEthicsAuditSchema = z.object({
  userId: z.string().optional().describe('User ID to filter by'),
  toolName: z.string().optional().describe('Tool name to filter by'),
  engine: z.string().optional().describe('Engine to filter by'),
  app: z.string().optional().describe('App to filter by'),
  startDate: z.string().optional().describe('Start date (ISO string)'),
  endDate: z.string().optional().describe('End date (ISO string)'),
  minComplianceScore: z.number().optional().describe('Minimum compliance score'),
  hasViolations: z.boolean().optional().describe('Filter by violations'),
  limit: z.number().optional().default(100).describe('Maximum number of entries to return'),
});

const GetEthicsStatsSchema = z.object({
  userId: z.string().optional().describe('User ID to filter by'),
  toolName: z.string().optional().describe('Tool name to filter by'),
  engine: z.string().optional().describe('Engine to filter by'),
  app: z.string().optional().describe('App to filter by'),
  startDate: z.string().optional().describe('Start date (ISO string)'),
  endDate: z.string().optional().describe('End date (ISO string)'),
});

/**
 * Get Ethics Audit Trail Tool
 */
export const getEthicsAuditTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'get_ethics_audit',
      description: 'Get ethics audit trail entries with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'User ID to filter by' },
          toolName: { type: 'string', description: 'Tool name to filter by' },
          engine: { type: 'string', description: 'Engine to filter by' },
          app: { type: 'string', description: 'App to filter by' },
          startDate: { type: 'string', description: 'Start date (ISO string)' },
          endDate: { type: 'string', description: 'End date (ISO string)' },
          minComplianceScore: { type: 'number', description: 'Minimum compliance score' },
          hasViolations: { type: 'boolean', description: 'Filter by violations' },
          limit: { type: 'number', description: 'Maximum number of entries to return', default: 100 },
        },
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = GetEthicsAuditSchema.parse(args);
      
      const entries = ethicsAuditService.getAuditEntries({
        toolName: parsed.toolName,
        engine: parsed.engine,
        app: parsed.app,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        minComplianceScore: parsed.minComplianceScore,
        hasViolations: parsed.hasViolations,
      });

      // Limit results
      const limitedEntries = entries.slice(0, parsed.limit || 100);

      return this.createSuccessResult(JSON.stringify({
        checks: limitedEntries,
        total: entries.length,
        returned: limitedEntries.length,
      }, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error getting ethics audit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

/**
 * Get Ethics Statistics Tool
 */
export const getEthicsStatsTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'get_ethics_stats',
      description: 'Get ethics compliance statistics',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'User ID to filter by' },
          toolName: { type: 'string', description: 'Tool name to filter by' },
          engine: { type: 'string', description: 'Engine to filter by' },
          app: { type: 'string', description: 'App to filter by' },
          startDate: { type: 'string', description: 'Start date (ISO string)' },
          endDate: { type: 'string', description: 'End date (ISO string)' },
        },
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = GetEthicsStatsSchema.parse(args);
      
      const entries = ethicsAuditService.getAuditEntries({
        toolName: parsed.toolName,
        engine: parsed.engine,
        app: parsed.app,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
      });

      // Calculate statistics
      const totalChecks = entries.length;
      const passedChecks = entries.filter(e => e.decision === 'allow').length;
      const blockedChecks = entries.filter(e => e.decision === 'block').length;
      const warningChecks = entries.filter(e => e.decision === 'allow_with_warnings').length;
      
      const scores = entries.map(e => e.complianceScore);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 100;
      
      const recentScore = entries.length > 0 ? entries[0].complianceScore : 100;
      
      const totalViolations = entries.reduce((sum, e) => sum + e.violations, 0);
      const totalWarnings = entries.reduce((sum, e) => sum + e.warnings, 0);

      return this.createSuccessResult(JSON.stringify({
        totalChecks,
        passedChecks,
        blockedChecks,
        warningChecks,
        averageScore,
        recentScore,
        totalViolations,
        totalWarnings,
        passRate: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100,
      }, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error getting ethics stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
