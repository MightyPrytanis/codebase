/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { workflowArchaeologyService, ArtifactSource } from '../services/workflow-archaeology.js';

const WorkflowArchaeologySchema = z.object({
  start_time: z.string().describe('Start time (ISO 8601)'),
  end_time: z.string().describe('End time (ISO 8601)'),
  granularity: z.enum(['hour', 'day', 'week']).optional().describe('Time granularity (auto-detected if not provided)'),
  context: z.record(z.any()).optional().describe('Additional context (matter_id, user_id, etc.)'),
  artifacts: z.array(z.object({
    type: z.enum(['email', 'calendar', 'document', 'call', 'other']),
    id: z.string(),
    timestamp: z.string(),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })).describe('Array of artifact sources'),
});

/**
 * Workflow Archaeology Tool
 * MCP tool for forensic reconstruction of past workflows and timelines
 * 
 * Usable by both LexFiat (time tracking) and Arkiver (workflow/document history).
 * Provides structured timeline reconstruction with evidence chains.
 */
export const workflowArchaeology = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'workflow_archaeology',
      description: 'Workflow Archaeology - Reconstruct past hours, days, or weeks using artifact analysis. Provides forensic timeline reconstruction with evidence chains. Usable for both time tracking (LexFiat) and workflow history (Arkiver).',
      inputSchema: {
        type: 'object',
        properties: {
          start_time: {
            type: 'string',
            description: 'Start time in ISO 8601 format (e.g., "2024-01-15T09:00:00Z")',
          },
          end_time: {
            type: 'string',
            description: 'End time in ISO 8601 format',
          },
          granularity: {
            type: 'string',
            enum: ['hour', 'day', 'week'],
            description: 'Time granularity (auto-detected if not provided based on duration)',
          },
          context: {
            type: 'object',
            description: 'Additional context (matter_id, user_id, project_id, etc.)',
          },
          artifacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['email', 'calendar', 'document', 'call', 'other'],
                  description: 'Type of artifact',
                },
                id: {
                  type: 'string',
                  description: 'Unique artifact identifier',
                },
                timestamp: {
                  type: 'string',
                  description: 'Artifact timestamp (ISO 8601)',
                },
                content: {
                  type: 'string',
                  description: 'Optional artifact content/summary',
                },
                metadata: {
                  type: 'object',
                  description: 'Optional artifact metadata',
                },
              },
              required: ['type', 'id', 'timestamp'],
            },
            description: 'Array of artifacts for reconstruction',
          },
        },
        required: ['start_time', 'end_time', 'artifacts'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = WorkflowArchaeologySchema.parse(args);
      
      // Validate artifacts array
      if (parsed.artifacts.length === 0) {
        return this.createErrorResult('No artifacts provided. At least one artifact is required for reconstruction.');
      }

      // Convert to ArtifactSource format
      const artifactSources: ArtifactSource[] = parsed.artifacts.map(a => ({
        type: a.type,
        id: a.id,
        timestamp: a.timestamp,
        content: a.content,
        metadata: a.metadata,
      }));

      // Perform reconstruction
      const result = await workflowArchaeologyService.reconstructTimePeriod(
        parsed.start_time,
        parsed.end_time,
        parsed.context || {},
        artifactSources
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            workflow_archaeology_result: result,
            usage_note: {
              lexfiat: 'Use timeline events for time entry suggestions',
              arkiver: 'Use timeline events for document processing workflow history',
            },
            note: result.confidence === 'low' 
              ? 'Low confidence: Consider collecting more artifacts for better reconstruction'
              : `Reconstruction confidence: ${result.confidence}`,
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return this.createErrorResult(
        `Error in workflow archaeology: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
