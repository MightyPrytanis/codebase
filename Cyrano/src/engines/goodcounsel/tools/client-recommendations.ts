/**
 * Client Recommendations Tool
 * 
 * Adapted from Legacy/Cosmos/src/tools/nextAction.ts
 * MCP tool for generating client relationship and wellness recommendations
 * for GoodCounsel engine.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from '../../../tools/base-tool.js';
import { ClientAnalyzer, AnalysisRequest } from '../services/client-analyzer.js';
import { checkRecommendations } from '../../../services/ethics-check-helper.js';

const ClientRecommendationsInputSchema = z.object({
  userId: z.string().optional().describe('Specific user/client ID to analyze'),
  timeframe: z.enum(['immediate', 'this_week', 'this_month']).optional()
    .describe('Time horizon for recommendations'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional()
    .describe('Filter by priority level'),
  category: z.string().optional()
    .describe('Filter by category: wellness_check, ethics_review, client_followup, etc.'),
  limit: z.number().min(1).max(20).optional()
    .describe('Maximum number of recommendations to return'),
});

/**
 * Client Recommendations Tool
 * 
 * Generates AI-powered recommendations for client relationships,
 * wellness, ethics, and professional development.
 */
class ClientRecommendationsTool extends BaseTool {
  private clientAnalyzer: ClientAnalyzer;

  constructor() {
    super();
    this.clientAnalyzer = new ClientAnalyzer();
  }

  getToolDefinition() {
    return {
      name: 'client_recommendations',
      description: 'Generate AI-powered recommendations for client relationships, attorney wellness, ethics compliance, and professional development. Analyzes client data to suggest specific actions that improve wellness, reduce risk, and optimize professional relationships.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          userId: {
            type: 'string',
            description: 'Specific user/client ID to analyze (optional - if not provided, analyzes all clients)',
          },
          timeframe: {
            type: 'string',
            enum: ['immediate', 'this_week', 'this_month'],
            description: 'Time horizon for recommendations (default: this_week)',
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low'],
            description: 'Filter recommendations by priority level',
          },
          category: {
            type: 'string',
            description: 'Filter by category: wellness_check, ethics_review, client_followup, self_care, habit_alert, professional_development, work_life_balance',
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            description: 'Maximum number of recommendations to return (default: 10)',
          },
        },
      },
    };
  }

  async execute(args: any) {
    try {
      const input = ClientRecommendationsInputSchema.parse(args);
      
      let recommendations;
      
      if (input.userId) {
        // Get recommendations for specific user
        recommendations = await this.clientAnalyzer.getNextActions(input.userId);
      } else if (input.timeframe === 'immediate' || input.priority === 'urgent') {
        // Get urgent recommendations
        recommendations = await this.clientAnalyzer.getUrgentRecommendations();
      } else {
        // Get all recommendations with filters
        const request: AnalysisRequest = {
          timeframe: input.timeframe,
          priority: input.priority,
          category: input.category,
          limit: input.limit || 10,
        };
        recommendations = await this.clientAnalyzer.getAllRecommendations(request);
      }

      // Format recommendations
      const formattedRecommendations = recommendations.map(rec => ({
        user: {
          id: rec.userId,
          name: rec.userName,
        },
        priority: rec.priority,
        category: rec.category,
        action: rec.action,
        reasoning: rec.reasoning,
        expectedOutcome: rec.expectedOutcome,
        timeframe: rec.timeframe,
        ethicsRule: rec.ethicsRule,
        wellnessImpact: rec.wellnessImpact,
        contactInfo: rec.contactInfo,
      }));

      // Automatic ethics check before returning recommendations
      const ethicsCheckResult = await checkRecommendations(formattedRecommendations, {
        toolName: 'client_recommendations',
        engine: 'goodcounsel',
        facts: {
          // Add any relevant facts for professional ethics rules
          hasClientData: formattedRecommendations.length > 0,
        },
      });

      // Format response with ethics check metadata
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        requestedFilters: input,
        totalRecommendations: ethicsCheckResult.recommendations.length,
        recommendations: ethicsCheckResult.recommendations,
        summary: this.generateSummary(ethicsCheckResult.recommendations),
        ethicsCheck: {
          reviewed: true,
          passed: ethicsCheckResult.ethicsCheck.passed,
          complianceScore: ethicsCheckResult.ethicsCheck.complianceScore,
          warnings: ethicsCheckResult.ethicsCheck.warnings,
          auditId: ethicsCheckResult.ethicsCheck.auditId,
        },
      };

      return this.createSuccessResult(JSON.stringify(response, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in client_recommendations: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private generateSummary(recommendations: any[]) {
    const priorityCounts = recommendations.reduce((acc: any, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = recommendations.reduce((acc: any, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {});

    return {
      priorityBreakdown: priorityCounts,
      categoryBreakdown: categoryCounts,
      urgentActionsCount: priorityCounts.urgent || 0,
      totalUsers: new Set(recommendations.map((r: any) => r.userId)).size,
    };
  }
}

export const clientRecommendationsTool = new ClientRecommendationsTool();


}
}