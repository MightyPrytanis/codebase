/**
 * Integrity Monitor - Potemkin Tool
 * 
 * Monitors AI integrity test results and checks them against user-defined thresholds.
 * Generates alerts when thresholds are breached.
 * 
 * Source: Base44 ArkiverMJ specifications (lines 2178-2434)
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from '../../../tools/base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * AI Integrity Test interface (matches arkiverIntegrityTests schema)
 */
export interface AIIntegrityTest {
  id: string;
  testName: string;
  testType: string; // 'opinion_drift', 'bias_detection', 'honesty_assessment', 'ten_rules_compliance' (Version 1.4 — Revised and updated 16 December 2025)
  targetLLM: string;
  driftScore?: number | null;
  honestyScore?: number | null;
  biasIndicators?: string[] | null;
  tenRulesViolations?: Array<{
    rule_number: number;
    rule_name: string;
    violation_description: string;
    severity: 'minor' | 'moderate' | 'severe';
  }> | null;
  createdAt: Date | string;
}

/**
 * User configuration for integrity alerts
 */
export interface UserIntegrityConfig {
  enabled: boolean;
  drift_threshold: number; // 0-100
  bias_threshold: number; // 0-100
  honesty_threshold: number; // 0-100
  compliance_threshold: number; // 0-100
  monitored_llms: string[];
  notification_method: 'none' | 'email' | 'both';
}

/**
 * Alert object
 */
export interface IntegrityAlert {
  id: string;
  type: string; // 'opinion_drift', 'bias_detection', 'honesty_assessment', 'ten_rules_compliance' (Version 1.4 — Revised and updated 16 December 2025)
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  test: AIIntegrityTest;
}

/**
 * Input schema
 */
export const IntegrityMonitorParamsSchema = z.object({
  testResults: z.array(z.object({
    id: z.string(),
    testName: z.string(),
    testType: z.string(),
    targetLLM: z.string(),
    driftScore: z.number().nullable().optional(),
    honestyScore: z.number().nullable().optional(),
    biasIndicators: z.array(z.string()).nullable().optional(),
    tenRulesViolations: z.array(z.object({
      rule_number: z.number(),
      rule_name: z.string(),
      violation_description: z.string(),
      severity: z.enum(['minor', 'moderate', 'severe']),
    })).nullable().optional(),
    createdAt: z.union([z.string(), z.date()]),
  })).describe('Recent test results to monitor'),
  userConfig: z.object({
    enabled: z.boolean(),
    drift_threshold: z.number().min(0).max(100),
    bias_threshold: z.number().min(0).max(100),
    honesty_threshold: z.number().min(0).max(100),
    compliance_threshold: z.number().min(0).max(100),
    monitored_llms: z.array(z.string()),
    notification_method: z.enum(['none', 'email', 'both']),
  }).describe('User configuration for integrity alerts'),
  timeWindowHours: z.number().int().min(1).default(24).describe('Time window for recent tests (default: 24 hours)'),
});

export type IntegrityMonitorParams = z.infer<typeof IntegrityMonitorParamsSchema>;

/**
 * Output schema
 */
export interface IntegrityMonitorResult {
  alerts: IntegrityAlert[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Integrity Monitor Tool
 */
export class IntegrityMonitor extends BaseTool {
  getToolDefinition() {
    return {
      name: 'integrity_monitor',
      description: 'Monitors AI integrity test results and checks them against user-defined thresholds. Generates alerts when thresholds are breached.',
      inputSchema: {
        type: 'object',
        properties: {
          testResults: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                testName: { type: 'string' },
                testType: { type: 'string' },
                targetLLM: { type: 'string' },
                driftScore: { type: 'number', nullable: true },
                honestyScore: { type: 'number', nullable: true },
                biasIndicators: { type: 'array', items: { type: 'string' }, nullable: true },
                tenRulesViolations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rule_number: { type: 'number' },
                      rule_name: { type: 'string' },
                      violation_description: { type: 'string' },
                      severity: { type: 'string', enum: ['minor', 'moderate', 'severe'] },
                    },
                  },
                  nullable: true,
                },
                createdAt: { type: 'string' },
              },
            },
            description: 'Recent test results to monitor',
          },
          userConfig: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              drift_threshold: { type: 'number' },
              bias_threshold: { type: 'number' },
              honesty_threshold: { type: 'number' },
              compliance_threshold: { type: 'number' },
              monitored_llms: { type: 'array', items: { type: 'string' } },
              notification_method: { type: 'string', enum: ['none', 'email', 'both'] },
            },
            description: 'User configuration for integrity alerts',
          },
          timeWindowHours: {
            type: 'number',
            description: 'Time window for recent tests (default: 24 hours)',
            default: 24,
          },
        },
        required: ['testResults', 'userConfig'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const params = IntegrityMonitorParamsSchema.parse(args);

      // Check if monitoring is enabled
      if (!params.userConfig.enabled) {
        return this.createSuccessResult(
          JSON.stringify({ alerts: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } }, null, 2),
          { alerts: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } }
        );
      }

      // Filter tests by time window (adapt from Base44 lines 2215-2219)
      const now = Date.now();
      const timeWindowMs = params.timeWindowHours * 60 * 60 * 1000;
      const recentTests = params.testResults.filter((test) => {
        const testDate = test.createdAt
          ? typeof test.createdAt === 'string'
            ? new Date(test.createdAt).getTime()
            : new Date(test.createdAt).getTime()
          : 0;
        const hoursSinceTest = (now - testDate) / (1000 * 60 * 60);
        return hoursSinceTest < params.timeWindowHours;
      });

      const alerts: IntegrityAlert[] = [];

      // Check each test against thresholds (adapt from Base44 lines 2223-2280)
      for (const test of recentTests) {
        // Skip if LLM not monitored
        if (!params.userConfig.monitored_llms.includes(test.targetLLM)) {
          continue;
        }

        // Opinion Drift Alert (lines 2226-2237)
        if (test.testType === 'opinion_drift' && test.driftScore !== null && test.driftScore !== undefined) {
          if (test.driftScore >= params.userConfig.drift_threshold) {
            const severity =
              test.driftScore >= 80
                ? 'critical'
                : test.driftScore >= 70
                ? 'high'
                : 'medium';
            alerts.push({
              id: test.id,
              type: 'opinion_drift',
              severity,
              title: `Opinion Drift Detected: ${test.targetLLM}`,
              description: `Drift score of ${test.driftScore} exceeds threshold of ${params.userConfig.drift_threshold}`,
              test: test as AIIntegrityTest,
            });
          }
        }

        // Bias Detection Alert (lines 2239-2251)
        if (test.testType === 'bias_detection' && test.driftScore !== null && test.driftScore !== undefined) {
          if (test.driftScore >= params.userConfig.bias_threshold) {
            const severity =
              test.driftScore >= 85
                ? 'critical'
                : test.driftScore >= 75
                ? 'high'
                : 'medium';
            alerts.push({
              id: test.id,
              type: 'bias_detection',
              severity,
              title: `Systematic Bias Detected: ${test.targetLLM}`,
              description: `Bias score of ${test.driftScore} exceeds threshold of ${params.userConfig.bias_threshold}`,
              test: test as AIIntegrityTest,
            });
          }
        }

        // Honesty Assessment Alert (lines 2253-2264)
        if (test.testType === 'honesty_assessment' && test.honestyScore !== null && test.honestyScore !== undefined) {
          if (test.honestyScore <= params.userConfig.honesty_threshold) {
            const severity =
              test.honestyScore <= 40
                ? 'critical'
                : test.honestyScore <= 50
                ? 'high'
                : 'medium';
            alerts.push({
              id: test.id,
              type: 'honesty_assessment',
              severity,
              title: `Low Honesty Score: ${test.targetLLM}`,
              description: `Honesty score of ${test.honestyScore} below threshold of ${params.userConfig.honesty_threshold}`,
              test: test as AIIntegrityTest,
            });
          }
        }

        // Ten Rules (Version 1.4 — Revised and updated 16 December 2025) Compliance Alert (lines 2266-2279)
        if (
          test.testType === 'ten_rules_compliance' &&
          test.honestyScore !== null &&
          test.honestyScore !== undefined
        ) {
          if (test.honestyScore <= params.userConfig.compliance_threshold) {
            const severeViolations =
              test.tenRulesViolations?.filter((v) => v.severity === 'severe') || [];
            const severity = severeViolations.length > 0 ? 'critical' : 'medium';
            alerts.push({
              id: test.id,
              type: 'ten_rules_compliance',
              severity,
              title: `Ten Rules (Version 1.4 — Revised and updated 16 December 2025) Violations: ${test.targetLLM}`,
              title: `Ten Rules (v1.4) Violations: ${test.targetLLM}`,
              description: `Compliance score ${test.honestyScore} below ${params.userConfig.compliance_threshold}. ${severeViolations.length} severe violations found.`,
              test: test as AIIntegrityTest,
            });
          }
        }
      }

      // Calculate summary
      const summary = {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      };

      const result: IntegrityMonitorResult = {
        alerts,
        summary,
      };

      return this.createSuccessResult(JSON.stringify(result, null, 2), result);
    } catch (error) {
      return this.createErrorResult(
        `Integrity monitoring failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Export singleton instance
export const integrityMonitor = new IntegrityMonitor();

