/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const PreFillLogicSchema = z.object({
  gaps: z.array(z.any()).describe('Identified time gaps'),
  artifacts: z.any().describe('Collected artifacts for the gap period'),
  user_patterns: z.any().optional().describe('Historical user work patterns and billing data'),
  professional_norms: z.any().optional().describe('Professional time allocation norms'),
});

export const preFillLogic = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'pre_fill_logic',
      description: 'Pre-populate time entries based on evidence, work patterns, and professional norms for attorney review',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gaps: {
            type: 'array',
            items: { type: 'object' },
            description: 'Identified time gaps',
          },
          artifacts: {
            type: 'object' as const,
            description: 'Collected artifacts for the gap period',
          },
          user_patterns: {
            type: 'object' as const,
            description: 'Historical user work patterns and billing data',
          },
          professional_norms: {
            type: 'object' as const,
            description: 'Professional time allocation norms',
          },
        },
        required: ['gaps', 'artifacts'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { gaps, artifacts, user_patterns, professional_norms } = PreFillLogicSchema.parse(args);
      
      const preFilledEntries: any[] = [];
      
      // For each gap, generate suggested time entries
      gaps.forEach((gap: any) => {
        const date = gap.date;
        const gapHours = gap.gap_hours || 0;
        
        // Analyze artifacts for this date
        const dayArtifacts = {
          emails: (artifacts.emails || []).filter((e: any) => e.date === date),
          documents: (artifacts.documents || []).filter((d: any) => d.date === date),
          calendar: (artifacts.calendar || []).filter((c: any) => c.date === date),
        };
        
        // Generate suggested entries based on artifacts
        const suggestions: any[] = [];
        
        // Document work
        dayArtifacts.documents.forEach((doc: any) => {
          if (doc.type === 'motion' || doc.type === 'brief') {
            suggestions.push({
              date,
              description: `${doc.type}: ${doc.title || 'Document'}`,
              hours: 2.0, // Default for document work
              evidence_type: 'direct',
              evidence: [doc],
              confidence: 'high',
            });
          }
        });
        
        // Email correspondence
        const emailCount = dayArtifacts.emails.length;
        if (emailCount > 0) {
          suggestions.push({
            date,
            description: `Email correspondence (${emailCount} emails)`,
            hours: Math.min(emailCount * 0.25, 2.0), // 15 min per email, max 2 hours
            evidence_type: 'direct',
            evidence: dayArtifacts.emails,
            confidence: 'medium',
          });
        }
        
        // Calendar events
        dayArtifacts.calendar.forEach((event: any) => {
          const duration = event.duration || 1.0;
          suggestions.push({
            date,
            description: `Meeting: ${event.title || 'Calendar event'}`,
            hours: duration,
            evidence_type: 'circumstantial',
            evidence: [event],
            confidence: 'medium',
          });
        });
        
        // If no specific artifacts, suggest general work based on patterns
        if (suggestions.length === 0 && gapHours > 0) {
          suggestions.push({
            date,
            description: 'General legal work (reconstruction)',
            hours: gapHours,
            evidence_type: 'pattern',
            evidence: [],
            confidence: 'low',
            note: 'No specific artifacts found. Based on gap analysis and work patterns.',
          });
        }
        
        preFilledEntries.push(...suggestions);
      });
      
      const result = {
        pre_filled_entries: preFilledEntries,
        total_entries: preFilledEntries.length,
        total_hours: preFilledEntries.reduce((sum, e) => sum + (e.hours || 0), 0),
        summary: {
          high_confidence: preFilledEntries.filter(e => e.confidence === 'high').length,
          medium_confidence: preFilledEntries.filter(e => e.confidence === 'medium').length,
          low_confidence: preFilledEntries.filter(e => e.confidence === 'low').length,
        },
        note: 'All entries require attorney review and approval before finalization.',
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in pre_fill_logic: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}
}
}