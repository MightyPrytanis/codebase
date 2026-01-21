/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../../../modules/base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { gapIdentifier } from '../../../tools/gap-identifier.js';
import { timeValueBilling } from '../../../tools/time-value-billing.js';
import * as baselineConfigService from '../services/baseline-config.js';
import * as patternLearningService from '../services/pattern-learning.js';
import * as profitabilityAnalyzerService from '../services/profitability-analyzer.js';

const PatternLearningInputSchema = z.object({
  action: z.enum([
    'setup_baseline',
    'get_baseline',
    'learn_patterns',
    'get_patterns',
    'analyze_profitability',
    'get_at_risk_matters',
    'get_profitability_summary',
    'add_time_entries',
  ]).describe('Action to perform'),
  userId: z.string().describe('User ID'),
  minimumHoursPerWeek: z.number().optional().describe('Minimum hours per week'),
  minimumHoursPerDay: z.number().optional().describe('Minimum hours per day'),
  typicalSchedule: z.record(z.string(), z.number()).optional().describe('Typical schedule by day of week'),
  offDays: z.array(z.string()).optional().describe('Off days (YYYY-MM-DD)'),
  useBaselineUntilDataAvailable: z.boolean().optional().describe('Use baseline until enough data available'),
  matterId: z.string().optional().describe('Matter ID for profitability analysis'),
  timeEntries: z.array(z.object({
    date: z.string(),
    hours: z.number(),
    matterId: z.string().optional(),
  })).optional().describe('Time entries for pattern learning'),
});

/**
 * Pattern Learning & Analytics Module
 * 
 * Baseline setup, pattern learning, and profitability intelligence
 * 
 * Composes:
 * - gapIdentifier (uses patterns when available)
 * - time_value_billing
 * 
 * Services:
 * - baseline-config: User baseline configuration
 * - pattern-learning: Learn from historical time entries
 * - profitability-analyzer: Track matter profitability
 */
export class PatternLearningModule extends BaseModule {
  constructor() {
    super({
      name: 'pattern_learning',
      description: 'Pattern Learning & Analytics Module - Baseline setup, pattern learning, profitability intelligence',
      version: '1.0.0',
      tools: [
        gapIdentifier,
        timeValueBilling,
      ],
    });
  }

  async initialize(): Promise<void> {
    // Module is initialized with tools in constructor
    // Services are imported and used directly
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for stateless services
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = PatternLearningInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'setup_baseline':
          return await this.setupBaseline(parsed);
        
        case 'get_baseline':
          return await this.getBaseline(parsed);
        
        case 'learn_patterns':
          return await this.learnPatterns(parsed);
        
        case 'get_patterns':
          return await this.getPatterns(parsed);
        
        case 'analyze_profitability':
          return await this.analyzeProfitability(parsed);
        
        case 'get_at_risk_matters':
          return await this.getAtRiskMatters(parsed);
        
        case 'get_profitability_summary':
          return await this.getProfitabilitySummary(parsed);
        
        case 'add_time_entries':
          return await this.addTimeEntries(parsed);
        
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action: ${parsed.action}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in pattern learning module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async setupBaseline(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    if (!parsed.minimumHoursPerWeek) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: minimumHoursPerWeek is required for setup_baseline',
          },
        ],
        isError: true,
      };
    }

    const config = await baselineConfigService.saveBaselineConfig({
      userId: parsed.userId,
      minimumHoursPerWeek: parsed.minimumHoursPerWeek,
      minimumHoursPerDay: parsed.minimumHoursPerDay,
      typicalSchedule: parsed.typicalSchedule,
      offDays: parsed.offDays,
      useBaselineUntilDataAvailable: parsed.useBaselineUntilDataAvailable ?? true,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            config,
          }, null, 2),
        },
      ],
    };
  }

  private async getBaseline(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    const config = await baselineConfigService.getBaselineConfig(parsed.userId);
    
    if (!config) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No baseline configuration found',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            config,
          }, null, 2),
        },
      ],
    };
  }

  private async learnPatterns(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    const pattern = await patternLearningService.learnPatterns(parsed.userId);
    
    if (!pattern) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'Not enough data for pattern learning (requires 30+ days)',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pattern,
          }, null, 2),
        },
      ],
    };
  }

  private async getPatterns(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    const pattern = await patternLearningService.getLearnedPatterns(parsed.userId);
    
    if (!pattern) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No learned patterns found',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pattern,
          }, null, 2),
        },
      ],
    };
  }

  private async analyzeProfitability(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    if (!parsed.matterId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: matterId is required for analyze_profitability',
          },
        ],
        isError: true,
      };
    }

    const metrics = await profitabilityAnalyzerService.calculateProfitabilityMetrics(
      parsed.matterId,
      parsed.userId
    );

    if (!metrics) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No budget found for matter',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            metrics,
          }, null, 2),
        },
      ],
    };
  }

  private async getAtRiskMatters(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    const atRisk = await profitabilityAnalyzerService.getAtRiskMatters(parsed.userId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            atRiskMatters: atRisk,
            count: atRisk.length,
          }, null, 2),
        },
      ],
    };
  }

  private async getProfitabilitySummary(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    const summary = await profitabilityAnalyzerService.getProfitabilitySummary(parsed.userId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            summary,
          }, null, 2),
        },
      ],
    };
  }

  private async addTimeEntries(parsed: z.infer<typeof PatternLearningInputSchema>): Promise<CallToolResult> {
    if (!parsed.timeEntries) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: timeEntries is required for add_time_entries',
          },
        ],
        isError: true,
      };
    }

    const entries = parsed.timeEntries.map(e => ({
      date: e.date,
      hours: e.hours,
      matterId: e.matterId,
      userId: parsed.userId,
    }));

    await patternLearningService.addTimeEntries(parsed.userId, entries);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Added ${entries.length} time entries`,
            entriesAdded: entries.length,
          }, null, 2),
        },
      ],
    };
  }
}

// Export singleton instance
export const patternLearningModule = new PatternLearningModule();
