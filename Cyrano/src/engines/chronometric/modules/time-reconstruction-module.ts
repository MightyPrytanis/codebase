/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../../../modules/base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { gapIdentifier } from '../../../tools/gap-identifier.js';
import { emailArtifactCollector } from '../../../tools/email-artifact-collector.js';
import { calendarArtifactCollector } from '../../../tools/calendar-artifact-collector.js';
import { documentArtifactCollector } from '../../../tools/document-artifact-collector.js';
import { recollectionSupport } from '../../../tools/recollection-support.js';
import { preFillLogic } from '../../../tools/pre-fill-logic.js';
import { dupeCheck } from '../../../tools/dupe-check.js';
import { provenanceTracker } from '../../../tools/provenance-tracker.js';
import { forensicReconstructionService } from '../services/forensic-reconstruction.js';
import { z } from 'zod';

const TimeReconstructionInputSchema = z.object({
  action: z.enum([
    'identify_gaps',
    'collect_artifacts',
    'reconstruct_time',
    'reconstruct_period',
    'check_duplicates',
    'recollection_support',
    'pre_fill',
    'track_provenance'
  ]).describe('Action to perform'),
  start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  include_artifacts: z.array(z.enum(['email', 'calendar', 'documents', 'calls'])).optional(),
  artifacts: z.any().optional().describe('Artifacts for reconstruction'),
  gaps: z.any().optional().describe('Gaps for pre-fill'),
  new_entries: z.any().optional().describe('New entries for duplicate check'),
  existing_entries: z.any().optional().describe('Existing entries for duplicate check'),
  time_entry: z.any().optional().describe('Time entry for provenance tracking'),
  date: z.string().optional().describe('Date for recollection support'),
  organization_mode: z.string().optional().describe('Organization mode for recollection'),
  similarity_threshold: z.number().optional().describe('Similarity threshold for duplicate check'),
  allow_repeated_tasks: z.boolean().optional().describe('Allow repeated tasks in duplicate check'),
  user_patterns: z.any().optional().describe('User patterns for pre-fill'),
  professional_norms: z.any().optional().describe('Professional norms for pre-fill'),
  patterns: z.any().optional().describe('Patterns for time reconstruction'),
});

/**
 * Time Reconstruction Module
 * Part of the Chronometric Engine
 * 
 * Handles gap identification, artifact collection, and time entry reconstruction.
 * Composes existing tools to provide structured time reconstruction capabilities.
 * 
 * Key Features:
 * - Gap Identification: Find missing or under-recorded time entries
 * - Artifact Collection: Gather evidence from emails, calendar, documents
 * - Time Reconstruction: Use AI to reconstruct time entries from artifacts
 * - Duplicate Checking: Prevent duplicate time entries
 * - Recollection Support: Organize evidence for attorney review
 * - Pre-fill Logic: Generate suggested time entries
 * - Provenance Tracking: Track source of each time entry
 */
export class TimeReconstructionModule extends BaseModule {
  constructor() {
    super({
      name: 'time_reconstruction',
      description: 'Time Reconstruction Module - Gap identification, artifact collection, and time entry reconstruction',
      version: '1.0.0',
      tools: [
        gapIdentifier,
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
          id: 'artifact_collection',
          type: 'data',
          description: 'Artifact collection service for emails, calendar, documents',
        },
      ],
      prompts: [
        {
          id: 'time_reconstruction',
          template: 'Based on the following artifacts, reconstruct billable time entries:\n\nArtifacts:\n{{artifacts}}\n\nPrevious patterns:\n{{patterns}}\n\nGenerate time entries with clear provenance.',
          variables: ['artifacts', 'patterns'],
        },
      ],
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // Module is initialized with tools in constructor
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = TimeReconstructionInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'identify_gaps':
          return await this.identifyGaps(parsed);
        
        case 'collect_artifacts':
          return await this.collectArtifacts(parsed);
        
        case 'reconstruct_time':
          return await this.reconstructTime(parsed);
        
        case 'reconstruct_period':
          return await this.reconstructPeriod(parsed);
        
        case 'check_duplicates':
          return await this.checkDuplicates(parsed);
        
        case 'recollection_support':
          return await this.recollectionSupport(parsed);
        
        case 'pre_fill':
          return await this.preFill(parsed);
        
        case 'track_provenance':
          return await this.trackProvenance(parsed);
        
        default:
          return {
            content: [{ type: 'text', text: `Unknown action: ${parsed.action}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error in time reconstruction module: ${error instanceof Error ? error.message : String(error)}`
        }],
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
        content: [{ type: 'text', text: 'Error: start_date and end_date are required for gap identification' }],
        isError: true,
      };
    }

    return await this.executeTool('gap_identifier', {
      start_date: input.start_date,
      end_date: input.end_date,
      billing_source: 'both',
      matter_id: input.matter_id,
    });
  }

  /**
   * Collect artifacts (emails, calendar, documents)
   */
  private async collectArtifacts(input: any): Promise<CallToolResult> {
    if (!input.start_date || !input.end_date) {
      return {
        content: [{ type: 'text', text: 'Error: start_date and end_date are required for artifact collection' }],
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
      content: [{
        type: 'text',
        text: JSON.stringify({
          period: { start_date: input.start_date, end_date: input.end_date },
          artifacts,
          summary: {
            total_emails: artifacts.emails.length,
            total_calendar_events: artifacts.calendar.length,
            total_documents: artifacts.documents.length,
          },
        }, null, 2)
      }],
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
        content: [{ type: 'text', text: 'Error: Time reconstruction prompt not found' }],
        isError: true,
      };
    }

    const rendered = this.renderPrompt('time_reconstruction', {
      artifacts: JSON.stringify(input.artifacts || {}),
      patterns: JSON.stringify(input.patterns || {}),
    });

    // Use AI service to analyze artifacts and reconstruct time entries
    try {
      const { AIService } = await import('../../../services/ai-service.js');
      const aiService = new AIService();
      
      const availableProviders = aiService.getAvailableProviders();
      if (availableProviders.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              reconstructed_entries: [],
              confidence: 'low',
              note: 'No AI providers configured. Time reconstruction requires AI analysis.',
            }, null, 2)
          }],
          isError: false,
        };
      }

      const provider = availableProviders[0];
      const aiResponse = await aiService.call(provider, rendered, {
        systemPrompt: 'You are a legal time tracking assistant. Analyze the provided artifacts (emails, calendar events, documents) and reconstruct billable time entries. Return a JSON array of time entries with: date, hours, description, source (email/calendar/document), and confidence level.',
        maxTokens: 2000,
        temperature: 0.3,
      });

      let reconstructedEntries: any[] = [];
      try {
        const parsed = JSON.parse(aiResponse);
        if (Array.isArray(parsed)) {
          reconstructedEntries = parsed;
        } else if (parsed.entries && Array.isArray(parsed.entries)) {
          reconstructedEntries = parsed.entries;
        } else if (parsed.reconstructed_entries && Array.isArray(parsed.reconstructed_entries)) {
          reconstructedEntries = parsed.reconstructed_entries;
        }
      } catch {
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

      const artifactCount = (input.artifacts?.emails?.length || 0) + 
                           (input.artifacts?.calendar?.length || 0) + 
                           (input.artifacts?.documents?.length || 0);
      const confidence = artifactCount > 10 ? 'high' : artifactCount > 5 ? 'medium' : 'low';

      return {
        content: [{
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
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            reconstructed_entries: [],
            confidence: 'low',
            error: `AI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
            note: 'Time reconstruction failed. Please check AI provider configuration.',
          }, null, 2)
        }],
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
        content: [{ type: 'text', text: 'Error: new_entries and existing_entries are required for duplicate checking' }],
        isError: true,
      };
    }

    return await this.executeTool('dupe_check', {
      new_entries: input.new_entries,
      existing_entries: input.existing_entries,
      similarity_threshold: input.similarity_threshold || 0.8,
      allow_repeated_tasks: input.allow_repeated_tasks !== false,
    });
  }

  /**
   * Organize artifacts for recollection support
   */
  private async recollectionSupport(input: any): Promise<CallToolResult> {
    if (!input.artifacts || !input.date) {
      return {
        content: [{ type: 'text', text: 'Error: artifacts and date are required for recollection support' }],
        isError: true,
      };
    }

    return await this.executeTool('recollection_support', {
      artifacts: input.artifacts,
      date: input.date,
      matter_id: input.matter_id,
      organization_mode: input.organization_mode || 'chronological',
    });
  }

  /**
   * Pre-fill time entries based on evidence
   */
  private async preFill(input: any): Promise<CallToolResult> {
    if (!input.gaps || !input.artifacts) {
      return {
        content: [{ type: 'text', text: 'Error: gaps and artifacts are required for pre-fill' }],
        isError: true,
      };
    }

    return await this.executeTool('pre_fill_logic', {
      gaps: input.gaps,
      artifacts: input.artifacts,
      user_patterns: input.user_patterns,
      professional_norms: input.professional_norms,
    });
  }

  /**
   * Track provenance for time entries
   */
  private async trackProvenance(input: any): Promise<CallToolResult> {
    if (!input.time_entry) {
      return {
        content: [{ type: 'text', text: 'Error: time_entry is required for provenance tracking' }],
        isError: true,
      };
    }

    return await this.executeTool('provenance_tracker', {
      time_entry: input.time_entry,
      artifacts: input.artifacts,
    });
  }

  /**
   * Reconstruct a time period using forensic reconstruction (Workflow Archaeology)
   */
  private async reconstructPeriod(input: any): Promise<CallToolResult> {
    if (!input.start_date || !input.end_date) {
      return {
        content: [{ type: 'text', text: 'Error: start_date and end_date are required for period reconstruction' }],
        isError: true,
      };
    }

    if (!input.artifacts || !Array.isArray(input.artifacts)) {
      return {
        content: [{ type: 'text', text: 'Error: artifacts array is required for period reconstruction' }],
        isError: true,
      };
    }

    try {
      // Convert date strings to ISO format
      const startTime = new Date(input.start_date).toISOString();
      const endTime = new Date(input.end_date).toISOString();

      // Use forensic reconstruction service
      const result = await forensicReconstructionService.reconstructWithTimeEntries(
        startTime,
        endTime,
        { matter_id: input.matter_id },
        input.artifacts
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            forensic_reconstruction: result,
            note: 'Forensic reconstruction complete using Workflow Archaeology service',
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error in period reconstruction: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources
  }
}

// Export singleton instance
export const timeReconstructionModule = new TimeReconstructionModule();
