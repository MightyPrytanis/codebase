/**
 * History Retriever - Potemkin Tool
 * 
 * Retrieves historical insights for a target LLM, filtered by topic and date range.
 * Splits insights into early and recent groups for opinion drift analysis.
 * 
 * Source: Base44 ArkiverMJ specifications (lines 1532-1545)
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
import { db } from '../../../db.js';
import { arkiverInsights } from '../../../modules/arkiver/schema.js';
import { eq, and, gte, lte, like, desc } from 'drizzle-orm';

/**
 * Insight interface (matches arkiverInsights schema)
 */
export interface Insight {
  id: string;
  title: string;
  content: string;
  sourceLLM: string | null;
  createdAt: Date | null;
  aiGeneratedSummary?: string | null;
  topic?: string | null;
}

/**
 * Input schema
 */
export const HistoryRetrieverParamsSchema = z.object({
  targetLLM: z.string().describe('Target LLM to filter insights (e.g., "ChatGPT", "Claude", "Gemini")'),
  topic: z.string().optional().describe('Optional topic to filter insights'),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional().describe('Optional date range filter'),
  minInsights: z.number().int().min(1).default(3).describe('Minimum number of insights required'),
  splitRatio: z.number().min(0).max(1).default(0.33).describe('Ratio for splitting early/recent groups (default: 0.33 = first 1/3 and last 1/3)'),
});

export type HistoryRetrieverParams = z.infer<typeof HistoryRetrieverParamsSchema>;

/**
 * Output schema
 */
export interface HistoryRetrieverResult {
  earlyInsights: Insight[];
  recentInsights: Insight[];
  totalInsights: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * History Retriever Tool
 */
export class HistoryRetriever extends BaseTool {
  getToolDefinition() {
    return {
      name: 'history_retriever',
      description: 'Retrieves historical insights for a target LLM, filtered by topic and date range. Splits insights into early and recent groups for opinion drift analysis.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          targetLLM: {
            type: 'string',
            description: 'Target LLM to filter insights (e.g., "ChatGPT", "Claude", "Gemini")',
          },
          topic: {
            type: 'string',
            description: 'Optional topic to filter insights',
          },
          dateRange: {
            type: 'object' as const,
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
            description: 'Optional date range filter',
          },
          minInsights: {
            type: 'number',
            description: 'Minimum number of insights required (default: 3)',
            default: 3,
          },
          splitRatio: {
            type: 'number',
            description: 'Ratio for splitting early/recent groups (default: 0.33)',
            default: 0.33,
          },
        },
        required: ['targetLLM'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const params = HistoryRetrieverParamsSchema.parse(args);

      // Build query conditions
      const conditions = [eq(arkiverInsights.sourceLLM, params.targetLLM)];

      // Add topic filter if provided (search in title or content)
      if (params.topic) {
        const topicPattern = `%${params.topic}%`;
        conditions.push(
          like(arkiverInsights.title, topicPattern)
        );
        // Note: Drizzle doesn't support OR easily, so we'll filter in memory for content
      }

      // Add date range filter if provided
      if (params.dateRange?.start) {
        conditions.push(gte(arkiverInsights.createdAt, new Date(params.dateRange.start)));
      }
      if (params.dateRange?.end) {
        conditions.push(lte(arkiverInsights.createdAt, new Date(params.dateRange.end)));
      }

      // Query insights from database
      let allInsights = await db
        .select()
        .from(arkiverInsights)
        .where(and(...conditions))
        .orderBy(desc(arkiverInsights.createdAt));

      // Filter by topic in content if topic provided (since Drizzle OR is complex)
      if (params.topic) {
        const topicLower = params.topic.toLowerCase();
        allInsights = allInsights.filter(
          (insight) =>
            insight.content?.toLowerCase().includes(topicLower) ||
            insight.title?.toLowerCase().includes(topicLower)
        );
      }

      // Check minimum insights requirement
      if (allInsights.length < params.minInsights) {
        return this.createErrorResult(
          `Need at least ${params.minInsights} insights from ${params.targetLLM}, but found ${allInsights.length}`
        );
      }

      // Sort chronologically (oldest first)
      allInsights.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      // Split into early and recent groups
      const splitIndex = Math.ceil(allInsights.length * params.splitRatio);
      const earlyInsights = allInsights.slice(0, splitIndex);
      const recentInsights = allInsights.slice(-splitIndex);

      // Map to Insight interface
      const mapToInsight = (row: any): Insight => ({
        id: row.id,
        title: row.title || 'Untitled',
        content: row.content || '',
        sourceLLM: row.sourceLLM,
        createdAt: row.createdAt ? new Date(row.createdAt) : null,
        aiGeneratedSummary: row.structuredData?.ai_generated_summary || null,
        topic: params.topic || null,
      });

      const result: HistoryRetrieverResult = {
        earlyInsights: earlyInsights.map(mapToInsight),
        recentInsights: recentInsights.map(mapToInsight),
        totalInsights: allInsights.length,
        dateRange: {
          start: allInsights.length > 0 && allInsights[0].createdAt
            ? new Date(allInsights[0].createdAt).toISOString()
            : null,
          end: allInsights.length > 0 && allInsights[allInsights.length - 1].createdAt
            ? new Date(allInsights[allInsights.length - 1].createdAt).toISOString()
            : null,
        },
      };

      return this.createSuccessResult(JSON.stringify(result, null, 2), result);
    } catch (error) {
      return this.createErrorResult(
        `History retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Export singleton instance
export const historyRetriever = new HistoryRetriever();

