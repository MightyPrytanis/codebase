/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { clioIntegration } from './clio-integration.js';

const GapIdentifierSchema = z.object({
  start_date: z.string().describe('Start date for gap analysis (YYYY-MM-DD)'),
  end_date: z.string().describe('End date for gap analysis (YYYY-MM-DD)'),
  billing_source: z.enum(['clio', 'manual', 'both']).default('both').describe('Source of billing data'),
  minimum_hours_per_day: z.number().optional().describe('Minimum expected billable hours per day'),
  matter_id: z.string().optional().describe('Optional: Filter by specific matter ID'),
});

export const gapIdentifier = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'gap_identifier',
      description: 'Identify days or periods with missing or under-recorded billable time by comparing recorded time entries with expected patterns',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for gap analysis (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date for gap analysis (YYYY-MM-DD)',
          },
          billing_source: {
            type: 'string',
            enum: ['clio', 'manual', 'both'],
            default: 'both',
            description: 'Source of billing data to analyze',
          },
          minimum_hours_per_day: {
            type: 'number',
            description: 'Minimum expected billable hours per day (optional)',
          },
          matter_id: {
            type: 'string',
            description: 'Optional: Filter by specific matter ID',
          },
        },
        required: ['start_date', 'end_date'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { start_date, end_date, billing_source, minimum_hours_per_day, matter_id } = GapIdentifierSchema.parse(args);
      
      const gaps: any[] = [];
      const start = new Date(start_date);
      const end = new Date(end_date);
      
      // Get time entries from Clio if requested
      let timeEntries: any[] = [];
      if (billing_source === 'clio' || billing_source === 'both') {
        try {
          // Use Clio integration to get time entries
          // This is a placeholder - actual implementation would call Clio API
          const clioResult = await clioIntegration.execute({
            action: 'get_item_tracking',
            parameters: {
              start_date,
              end_date,
              matter_id,
            },
          });
          
          if (!clioResult.isError && clioResult.content) {
            // Parse Clio time entries
            // Placeholder - actual parsing would depend on Clio API response format
            timeEntries = [];
          }
        } catch (error) {
          // Continue with manual entries if Clio fails
        }
      }
      
      // Analyze each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find time entries for this day
        const dayEntries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.date || entry.created_at);
          return entryDate.toISOString().split('T')[0] === dateStr;
        });
        
        const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const expectedHours = minimum_hours_per_day || 0;
        
        // Identify gaps
        if (dayEntries.length === 0) {
          gaps.push({
            date: dateStr,
            type: 'missing',
            recorded_hours: 0,
            expected_hours: expectedHours,
            gap_hours: expectedHours,
            confidence: 'high',
          });
        } else if (expectedHours > 0 && totalHours < expectedHours) {
          gaps.push({
            date: dateStr,
            type: 'under_recorded',
            recorded_hours: totalHours,
            expected_hours: expectedHours,
            gap_hours: expectedHours - totalHours,
            confidence: 'medium',
            entries: dayEntries.length,
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Calculate total days inclusively (e.g., Jan 1 to Jan 3 = 3 days, not 2)
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = daysDiff + 1; // +1 for inclusive range
      
      const result = {
        period: { start_date, end_date },
        gaps_found: gaps.length,
        gaps: gaps,
        summary: {
          total_days: totalDays,
          days_with_gaps: gaps.length,
          total_gap_hours: gaps.reduce((sum, gap) => sum + gap.gap_hours, 0),
        },
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in gap_identifier: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
