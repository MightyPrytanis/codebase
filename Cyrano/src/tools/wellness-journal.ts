/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import { wellness } from '../services/wellness-service.js';

const WellnessJournalSchema = z.object({
  action: z.enum([
    'create_entry',
    'get_entries',
    'get_feedback',
    'get_trends',
    'check_burnout_risk',
    'get_recommendations',
    'delete_entry',
  ]).describe('Action to perform'),
  userId: z.number().describe('User ID'),
  entryId: z.string().optional().describe('Entry ID (for get/update/delete operations)'),
  content: z.string().optional().describe('Journal entry content (text)'),
  mood: z.string().optional().describe('User-provided mood'),
  tags: z.array(z.string()).optional().describe('Tags for the entry'),
  audioData: z.string().optional().describe('Base64-encoded audio data (for voice journaling)'),
  period: z.enum(['week', 'month']).optional().describe('Time period for trends'),
  timeframe: z.string().optional().describe('Timeframe for burnout analysis'),
});

export const wellnessJournalTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'wellness_journal',
      description: 'Wellness journaling tool for creating entries, getting feedback, tracking trends, and detecting burnout. Supports both text and voice journaling with HIPAA-compliant encryption.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create_entry', 'get_entries', 'get_feedback', 'get_trends', 'check_burnout_risk', 'get_recommendations', 'delete_entry'],
            description: 'Action to perform',
          },
          userId: {
            type: 'number',
            description: 'User ID',
          },
          entryId: {
            type: 'string',
            description: 'Entry ID (for get/update/delete operations)',
          },
          content: {
            type: 'string',
            description: 'Journal entry content (text)',
          },
          mood: {
            type: 'string',
            description: 'User-provided mood',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for the entry',
          },
          audioData: {
            type: 'string',
            description: 'Base64-encoded audio data (for voice journaling)',
          },
          period: {
            type: 'string',
            enum: ['week', 'month'],
            description: 'Time period for trends',
          },
          timeframe: {
            type: 'string',
            enum: ['week', 'month'],
            description: 'Timeframe for burnout analysis',
          },
        },
        required: ['action', 'userId'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = WellnessJournalSchema.parse(args);
      const { action, userId, entryId, content, mood, tags, audioData, period, timeframe } = parsed;

      // Extract IP and user agent from request context if available
      const ipAddress = (args as any).ipAddress;
      const userAgent = (args as any).userAgent;

      switch (action) {
        case 'create_entry': {
          if (!content && !audioData) {
            return this.createErrorResult('Either content or audioData must be provided');
          }

          // Decode audio if provided
          let audioBuffer: Buffer | undefined;
          if (audioData) {
            try {
              audioBuffer = Buffer.from(audioData, 'base64');
            } catch (error) {
              return this.createErrorResult('Invalid audio data format');
            }
          }

          const entry = await wellness.createJournalEntry(
            userId,
            {
              content: content || '',
              mood,
              tags,
              audioBuffer,
            },
            ipAddress,
            userAgent
          );

          return this.createSuccessResult(JSON.stringify(entry, null, 2), {
            entryId: entry.id,
            contentType: entry.contentType,
          });
        }

        case 'get_entries': {
          const limit = (args as any).limit || 10;
          const offset = (args as any).offset || 0;
          const entries = await wellness.getUserEntries(userId, limit, offset, ipAddress, userAgent);
          return this.createSuccessResult(JSON.stringify(entries, null, 2), {
            count: entries.length,
          });
        }

        case 'get_feedback': {
          if (!entryId) {
            return this.createErrorResult('entryId is required for get_feedback');
          }

          const feedback = await wellness.getFeedback(entryId);
          if (!feedback) {
            return this.createErrorResult('Feedback not found for this entry');
          }

          return this.createSuccessResult(JSON.stringify(feedback, null, 2));
        }

        case 'get_trends': {
          const trends = await wellness.getWellnessTrends(userId, period || 'month');
          if (!trends) {
            return this.createErrorResult('No trends data available');
          }

          return this.createSuccessResult(JSON.stringify(trends, null, 2));
        }

        case 'check_burnout_risk': {
          const analysis = await wellness.detectBurnoutSignals(userId, (timeframe as 'week' | 'month') || 'month');
          return this.createSuccessResult(JSON.stringify(analysis, null, 2), {
            riskLevel: analysis.risk,
          });
        }

        case 'get_recommendations': {
          // Get recent feedback and extract recommendations
          const entries = await wellness.getUserEntries(userId, 5, 0);
          if (entries.length === 0) {
            return this.createSuccessResult(JSON.stringify({
              recommendations: [],
              message: 'No journal entries found. Start journaling to get personalized recommendations.',
            }, null, 2));
          }

          // Get feedback for most recent entry
          const latestEntry = entries[0];
          const feedback = await wellness.getFeedback(latestEntry.id);

          const recommendations = feedback?.wellnessRecommendations || [];

          // Ethics check: Wellness recommendations must comply with Ten Rules
          const { checkRecommendations } = await import('../services/ethics-check-helper.js');
          const ethicsCheckResult = await checkRecommendations(recommendations, {
            toolName: 'wellness_journal',
            facts: {
              hasUserData: !!userId,
              wellnessContext: true,
            },
          });

          // If blocked, return empty recommendations
          if (ethicsCheckResult.ethicsCheck.blocked) {
            return this.createSuccessResult(JSON.stringify({
              recommendations: [],
              source: 'latest_entry_feedback',
              message: 'Recommendations blocked by ethics check.',
            }, null, 2));
          }

          return this.createSuccessResult(JSON.stringify({
            recommendations: ethicsCheckResult.recommendations,
            source: 'latest_entry_feedback',
            ethicsReviewed: true,
            ethicsComplianceScore: ethicsCheckResult.ethicsCheck.complianceScore,
          }, null, 2));
        }

        case 'delete_entry': {
          if (!entryId) {
            return this.createErrorResult('entryId is required for delete_entry');
          }

          const deleted = await wellness.deleteJournalEntry(userId, entryId, ipAddress, userAgent);
          if (!deleted) {
            return this.createErrorResult('Entry not found or access denied');
          }

          return this.createSuccessResult('Entry deleted successfully');
        }

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(`Wellness journal operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
})();


