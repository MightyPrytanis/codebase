/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const ProvenanceTrackerSchema = z.object({
  time_entry: z.any().describe('Time entry to track provenance for'),
  artifacts: z.any().optional().describe('Related artifacts'),
});

export const provenanceTracker = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'provenance_tracker',
      description: 'Track and display provenance (supporting evidence) for time entries, distinguishing direct from circumstantial evidence',
      inputSchema: {
        type: 'object' as const,
        properties: {
          time_entry: {
            type: 'object' as const,
            description: 'Time entry to track provenance for',
          },
          artifacts: {
            type: 'object' as const,
            description: 'Related artifacts',
          },
        },
        required: ['time_entry'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { time_entry, artifacts } = ProvenanceTrackerSchema.parse(args);
      
      const provenance: any = {
        time_entry_id: time_entry.id || time_entry.date,
        date: time_entry.date,
        description: time_entry.description,
        hours: time_entry.hours,
        direct_evidence: [],
        circumstantial_evidence: [],
        evidence_summary: {
          direct_count: 0,
          circumstantial_count: 0,
          confidence_level: 'unknown',
        },
      };
      
      // If artifacts provided, link them to the entry
      if (artifacts) {
        // Link direct evidence
        if (artifacts.documents) {
          artifacts.documents.forEach((doc: any) => {
            if (doc.date === time_entry.date && (doc.filed || doc.sent)) {
              provenance.direct_evidence.push({
                type: 'document',
                id: doc.id,
                title: doc.title,
                evidence_type: 'direct',
                source: 'document_artifact_collector',
                timestamp: doc.date,
              });
            }
          });
        }
        
        if (artifacts.emails) {
          artifacts.emails.forEach((email: any) => {
            if (email.date === time_entry.date && email.sent) {
              const evidenceEntry: any = {
                type: 'email',
                id: email.id,
                subject: email.subject,
                evidence_type: email.evidence_type || 'direct',
                source: 'email_artifact_collector',
                timestamp: email.date,
              };
              
              // Include court filing confirmation metadata if present (emails FROM MiFile/courts, not API integration)
              if (email.mifile_confirmation) {
                evidenceEntry.mifile_confirmation = true;
                evidenceEntry.confirmation_type = email.confirmation_type;
                evidenceEntry.case_number = email.case_number;
                evidenceEntry.chronometric_priority = email.chronometric_priority || 'high';
              }
              
              provenance.direct_evidence.push(evidenceEntry);
            }
          });
        }
        
        // Link circumstantial evidence
        if (artifacts.calendar) {
          artifacts.calendar.forEach((event: any) => {
            if (event.date === time_entry.date) {
              provenance.circumstantial_evidence.push({
                type: 'calendar_event',
                id: event.id,
                title: event.title,
                evidence_type: 'circumstantial',
                source: 'calendar_artifact_collector',
                timestamp: event.date,
              });
            }
          });
        }
        
        if (artifacts.emails) {
          artifacts.emails.forEach((email: any) => {
            if (email.date === time_entry.date && !email.sent) {
              provenance.circumstantial_evidence.push({
                type: 'email_received',
                id: email.id,
                subject: email.subject,
                evidence_type: 'circumstantial',
                source: 'email_artifact_collector',
                timestamp: email.date,
              });
            }
          });
        }
      }
      
      // Calculate confidence level
      provenance.evidence_summary.direct_count = provenance.direct_evidence.length;
      provenance.evidence_summary.circumstantial_count = provenance.circumstantial_evidence.length;
      
      if (provenance.direct_evidence.length > 0) {
        provenance.evidence_summary.confidence_level = 'high';
      } else if (provenance.circumstantial_evidence.length > 0) {
        provenance.evidence_summary.confidence_level = 'medium';
      } else {
        provenance.evidence_summary.confidence_level = 'low';
      }
      
      // Add metadata
      provenance.metadata = {
        created_at: new Date().toISOString(),
        evidence_sources: Array.from(new Set([
          ...provenance.direct_evidence.map((e: any) => e.source),
          ...provenance.circumstantial_evidence.map((e: any) => e.source),
        ])),
        transparency_note: 'This entry shows all supporting evidence. Direct evidence (sent documents, filed motions) provides stronger support than circumstantial evidence (calendar, received emails).',
      };
      
      const result = {
        provenance,
        display_format: {
          entry: `${time_entry.description} - ${time_entry.hours} hours`,
          evidence_summary: `${provenance.direct_evidence.length} direct, ${provenance.circumstantial_evidence.length} circumstantial`,
          confidence: provenance.evidence_summary.confidence_level,
        },
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in provenance_tracker: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();