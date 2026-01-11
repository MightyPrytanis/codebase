/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { gapIdentifier } from '../../tools/gap-identifier.js';
import { clioIntegration } from '../../tools/clio-integration.js';
import { documentProcessor } from '../../tools/document-processor.js';
import { emailArtifactCollector } from '../../tools/email-artifact-collector.js';
import { calendarArtifactCollector } from '../../tools/calendar-artifact-collector.js';
import { documentArtifactCollector } from '../../tools/document-artifact-collector.js';
import { recollectionSupport } from '../../tools/recollection-support.js';
import { preFillLogic } from '../../tools/pre-fill-logic.js';
import { dupeCheck } from '../../tools/dupe-check.js';
import { provenanceTracker } from '../../tools/provenance-tracker.js';
import { z } from 'zod';

const ChronometricInputSchema = z.object({
  action: z.enum([
    'identify_gaps',
    'collect_artifacts',
    'reconstruct_time',
    'check_duplicates',
    'recollection_support',
    'pre_fill',
    'track_provenance',
    'generate_report'
  ]).describe('Action to perform'),
  start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  include_artifacts: z.array(z.enum(['email', 'calendar', 'documents', 'calls'])).optional(),
});

/**
 * Chronometric Module
 * Forensic Time Capture Module - assists attorneys in retrospectively reconstructing lost or unentered billable time
 * 
 * Workflow:
 * 1. Gap Identification - Find missing/under-recorded time
 * 2. Artifact Collection - Gather evidence (emails, calendar, documents)
 * 3. Recollection Support - Organize evidence for attorney review
 * 4. Pre-fill - Generate time entries for review
 * 5. DupeCheck - Check for duplicate entries
 * 6. Transparency - Show provenance of each entry
 * 7. User Review - Require explicit approval
 */
export class ChronometricModule extends BaseModule {
  constructor() {
    super({
      name: 'chronometric',
      description: 'Forensic Time Capture Module - assists attorneys in retrospectively reconstructing lost or unentered billable time',
      version: '1.0.0',
      tools: [
        gapIdentifier,
        clioIntegration,
        documentProcessor,
        emailArtifactCollector,
        calendarArtifactCollector,
        documentArtifactCollector,
        recollectionSupport,
        preFillLogic,
        dupeCheck,
        provenanceTracker,
      ],
      resources: [
        {
          id: 'clio_config',
          type: 'api',
          description: 'Clio API configuration',
        },
      ],
      prompts: [
        {
          id: 'time_reconstruction',
          template: 'Based on the following artifacts, reconstruct billable time entries:\n\nArtifacts:\n{{artifacts}}\n\nPrevious patterns:\n{{patterns}}\n\nGenerate time entries with clear provenance.',
          variables: ['artifacts', 'patterns'],
        },
        {
          id: 'evidence_organization',
          template: 'Organize the following evidence for attorney review:\n\n{{evidence}}\n\nCategorize by:\n- Direct evidence (sent documents, filed motions)\n- Circumstantial evidence (calendar, call logs, draft saves)',
          variables: ['evidence'],
        },
      ],
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // Module is initialized with tools, resources, and prompts in constructor
    // Additional setup can be done here if needed
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = ChronometricInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'identify_gaps':
          return await this.identifyGaps(parsed);
        
        case 'collect_artifacts':
          return await this.collectArtifacts(parsed);
        
        case 'reconstruct_time':
          return await this.reconstructTime(parsed);
        
        case 'check_duplicates':
          return await this.checkDuplicates(parsed);
        
        case 'recollection_support':
          return await this.recollectionSupport(parsed);
        
        case 'pre_fill':
          return await this.preFill(parsed);
        
        case 'track_provenance':
          return await this.trackProvenance(parsed);
        
        case 'generate_report':
          return await this.generateReport(parsed);
        
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
            text: `Error in chronometric module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Identify gaps in time recording
   */
  private async identifyGaps(input: any): Promise<CallToolResult> {
    if (!input.start_date || !input.end_date) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: start_date and end_date are required for gap identification',
          },
        ],
        isError: true,
      };
    }

    const result = await this.executeTool('gap_identifier', {
      start_date: input.start_date,
      end_date: input.end_date,
      billing_source: 'both',
      matter_id: input.matter_id,
    });

    return result;
  }

  /**
   * Collect artifacts (emails, calendar, documents)
   */
  private async collectArtifacts(input: any): Promise<CallToolResult> {
    if (!input.start_date || !input.end_date) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: start_date and end_date are required for artifact collection',
          },
        ],
        isError: true,
      };
    }

    const artifacts: any = {
      emails: [],
      calendar: [],
      documents: [],
      calls: [],
    };

    const include = input.include_artifacts || ['email', 'calendar', 'documents'];

    // Collect email artifacts
    if (include.includes('email')) {
      const emailTool = this.getTool('email_artifact_collector');
      if (emailTool) {
        const emailResult = await emailTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
          matter_id: input.matter_id,
        });
        if (!emailResult.isError && emailResult.content[0]?.type === 'text' && emailResult.content[0].text) {
          artifacts.emails = JSON.parse(emailResult.content[0].text);
        }
      }
    }

    // Collect calendar artifacts
    if (include.includes('calendar')) {
      const calendarTool = this.getTool('calendar_artifact_collector');
      if (calendarTool) {
        const calendarResult = await calendarTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
        });
        if (!calendarResult.isError && calendarResult.content[0]?.type === 'text' && calendarResult.content[0].text) {
          artifacts.calendar = JSON.parse(calendarResult.content[0].text);
        }
      }
    }

    // Collect document artifacts
    if (include.includes('documents')) {
      const docTool = this.getTool('document_artifact_collector');
      if (docTool) {
        const docResult = await docTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
          matter_id: input.matter_id,
        });
        if (!docResult.isError && docResult.content[0]?.type === 'text' && docResult.content[0].text) {
          artifacts.documents = JSON.parse(docResult.content[0].text);
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            period: { start_date: input.start_date, end_date: input.end_date },
            artifacts,
            summary: {
              total_emails: artifacts.emails.length,
              total_calendar_events: artifacts.calendar.length,
              total_documents: artifacts.documents.length,
            },
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Reconstruct time entries from artifacts
   */
  private async reconstructTime(input: any): Promise<CallToolResult> {
    const prompt = this.getPrompt('time_reconstruction');
    if (!prompt) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Time reconstruction prompt not found',
          },
        ],
        isError: true,
      };
    }

    const rendered = this.renderPrompt('time_reconstruction', {
      artifacts: JSON.stringify(input.artifacts || {}),
      patterns: JSON.stringify(input.patterns || {}),
    });

    // Use AI service to analyze artifacts and reconstruct time entries
    try {
      const { AIService } = await import('../../services/ai-service.js');
      const aiService = new AIService();
      
      // Get available providers
      const availableProviders = aiService.getAvailableProviders();
      if (availableProviders.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                reconstructed_entries: [],
                confidence: 'low',
                note: 'No AI providers configured. Time reconstruction requires AI analysis.',
              }, null, 2),
            },
          ],
          isError: false,
        };
      }

      // Use first available provider
      const provider = availableProviders[0];
      const aiResponse = await aiService.call(provider, rendered, {
        systemPrompt: 'You are a legal time tracking assistant. Analyze the provided artifacts (emails, calendar events, documents) and reconstruct billable time entries. Return a JSON array of time entries with: date, hours, description, source (email/calendar/document), and confidence level.',
        maxTokens: 2000,
        temperature: 0.3,
      });

      // Parse AI response to extract time entries
      let reconstructedEntries: any[] = [];
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(aiResponse);
        if (Array.isArray(parsed)) {
          reconstructedEntries = parsed;
        } else if (parsed.entries && Array.isArray(parsed.entries)) {
          reconstructedEntries = parsed.entries;
        } else if (parsed.reconstructed_entries && Array.isArray(parsed.reconstructed_entries)) {
          reconstructedEntries = parsed.reconstructed_entries;
        }
      } catch {
        // If not JSON, try to extract structured data from text
        const entryMatches = aiResponse.match(/\{[^}]+\}/g);
        if (entryMatches) {
          reconstructedEntries = entryMatches.map(match => {
            try {
              return JSON.parse(match);
            } catch {
              return null;
            }
          }).filter(Boolean);
        }
      }

      // Calculate confidence based on artifact quality and AI response
      const artifactCount = (input.artifacts?.emails?.length || 0) + 
                           (input.artifacts?.calendar?.length || 0) + 
                           (input.artifacts?.documents?.length || 0);
      const confidence = artifactCount > 10 ? 'high' : artifactCount > 5 ? 'medium' : 'low';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              reconstructed_entries: reconstructedEntries,
              confidence,
              total_entries: reconstructedEntries.length,
              total_hours: reconstructedEntries.reduce((sum, e) => sum + (e.hours || 0), 0),
              ai_provider: provider,
              note: reconstructedEntries.length > 0 
                ? 'Time entries reconstructed from artifacts using AI analysis'
                : 'No time entries could be reconstructed from artifacts',
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              reconstructed_entries: [],
              confidence: 'low',
              error: `AI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
              note: 'Time reconstruction failed. Please check AI provider configuration.',
            }, null, 2),
          },
        ],
        isError: false,
      };
    }
  }

  /**
   * Check for duplicate time entries
   */
  private async checkDuplicates(input: any): Promise<CallToolResult> {
    if (!input.new_entries || !input.existing_entries) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: new_entries and existing_entries are required for duplicate checking',
          },
        ],
        isError: true,
      };
    }

    const result = await this.executeTool('dupe_check', {
      new_entries: input.new_entries,
      existing_entries: input.existing_entries,
      similarity_threshold: input.similarity_threshold || 0.8,
      allow_repeated_tasks: input.allow_repeated_tasks !== false,
    });

    return result;
  }

  /**
   * Organize artifacts for recollection support
   */
  private async recollectionSupport(input: any): Promise<CallToolResult> {
    if (!input.artifacts || !input.date) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: artifacts and date are required for recollection support',
          },
        ],
        isError: true,
      };
    }

    const result = await this.executeTool('recollection_support', {
      artifacts: input.artifacts,
      date: input.date,
      matter_id: input.matter_id,
      organization_mode: input.organization_mode || 'chronological',
    });

    return result;
  }

  /**
   * Pre-fill time entries based on evidence
   */
  private async preFill(input: any): Promise<CallToolResult> {
    if (!input.gaps || !input.artifacts) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: gaps and artifacts are required for pre-fill',
          },
        ],
        isError: true,
      };
    }

    const result = await this.executeTool('pre_fill_logic', {
      gaps: input.gaps,
      artifacts: input.artifacts,
      user_patterns: input.user_patterns,
      professional_norms: input.professional_norms,
    });

    return result;
  }

  /**
   * Track provenance for time entries
   */
  private async trackProvenance(input: any): Promise<CallToolResult> {
    if (!input.time_entry) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: time_entry is required for provenance tracking',
          },
        ],
        isError: true,
      };
    }

    const result = await this.executeTool('provenance_tracker', {
      time_entry: input.time_entry,
      artifacts: input.artifacts,
    });

    return result;
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(input: any): Promise<CallToolResult> {
    // Generate a comprehensive report with gaps, artifacts, and recommendations
    const gaps = await this.identifyGaps(input);
    const artifacts = await this.collectArtifacts(input);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            report_type: 'chronometric_analysis',
            period: { start_date: input.start_date, end_date: input.end_date },
            gaps: gaps.isError || !gaps.content[0] || gaps.content[0].type !== 'text' || !('text' in gaps.content[0]) ? null : JSON.parse(gaps.content[0].text),
            artifacts: artifacts.isError || !artifacts.content[0] || artifacts.content[0].type !== 'text' || !('text' in artifacts.content[0]) ? null : JSON.parse(artifacts.content[0].text),
            recommendations: [
              'Review identified gaps',
              'Examine collected artifacts',
              'Reconstruct time entries with evidence',
              'Check for duplicates before finalizing',
            ],
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources, connections, etc.
  }

// Export singleton instance
export const chronometricModule = new ChronometricModule();

}
}
}
}