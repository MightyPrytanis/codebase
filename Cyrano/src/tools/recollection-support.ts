/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const RecollectionSupportSchema = z.object({
  artifacts: z.any().describe('Collected artifacts (emails, calendar, documents)'),
  date: z.string().describe('Date to reconstruct (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  organization_mode: z.enum(['chronological', 'by_type', 'by_importance']).default('chronological').describe('How to organize evidence'),
});

export const recollectionSupport = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'recollection_support',
      description: 'Organize collected artifacts to prompt attorney memory and support time reconstruction',
      inputSchema: {
        type: 'object' as const,
        properties: {
          artifacts: {
            type: 'object' as const,
            description: 'Collected artifacts (emails, calendar, documents)',
          },
          date: {
            type: 'string',
            description: 'Date to reconstruct (YYYY-MM-DD)',
          },
          matter_id: {
            type: 'string',
            description: 'Optional matter ID',
          },
          organization_mode: {
            type: 'string',
            enum: ['chronological', 'by_type', 'by_importance'],
            default: 'chronological',
            description: 'How to organize evidence',
          },
        },
        required: ['artifacts', 'date'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { artifacts, date, matter_id, organization_mode } = RecollectionSupportSchema.parse(args);
      
      // Organize artifacts for attorney review
      const organized: any = {
        date,
        matter_id: matter_id || null,
        organization_mode,
        direct_evidence: [],
        circumstantial_evidence: [],
        timeline: [],
      };
      
      // Categorize artifacts
      if (artifacts.emails && Array.isArray(artifacts.emails)) {
        artifacts.emails.forEach((email: any) => {
          if (email.sent) {
            organized.direct_evidence.push({
              type: 'email_sent',
              ...email,
            });
          } else {
            organized.circumstantial_evidence.push({
              type: 'email_received',
              ...email,
            });
          }
        });
      }
      
      if (artifacts.documents && Array.isArray(artifacts.documents)) {
        artifacts.documents.forEach((doc: any) => {
          if (doc.filed || doc.sent) {
            organized.direct_evidence.push({
              type: 'document',
              ...doc,
            });
          } else {
            organized.circumstantial_evidence.push({
              type: 'draft',
              ...doc,
            });
          }
        });
      }
      
      if (artifacts.calendar && Array.isArray(artifacts.calendar)) {
        artifacts.calendar.forEach((event: any) => {
          organized.circumstantial_evidence.push({
            type: 'calendar_event',
            ...event,
          });
        });
      }
      
      // Create timeline
      const allItems = [...organized.direct_evidence, ...organized.circumstantial_evidence];
      if (organization_mode === 'chronological') {
        organized.timeline = allItems.sort((a, b) => {
          const timeA = a.start_time || a.time || '00:00';
          const timeB = b.start_time || b.time || '00:00';
          return timeA.localeCompare(timeB);
        });
      } else if (organization_mode === 'by_type') {
        organized.timeline = allItems.sort((a, b) => a.type.localeCompare(b.type));
      } else {
        // by_importance - direct evidence first
        organized.timeline = [...organized.direct_evidence, ...organized.circumstantial_evidence];
      }
      
      const result = {
        date,
        organized_evidence: organized,
        summary: {
          total_items: allItems.length,
          direct_evidence_count: organized.direct_evidence.length,
          circumstantial_evidence_count: organized.circumstantial_evidence.length,
        },
        note: 'Evidence organized to prompt attorney memory. Review and confirm time entries.',
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in recollection_support: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();