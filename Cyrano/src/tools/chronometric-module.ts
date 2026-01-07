/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { engineRegistry } from '../engines/registry.js';

const ChronometricEngineSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'execute_module',
    'list_workflows',
    'identify_gaps',
    'collect_artifacts',
    'reconstruct_time',
    'check_duplicates',
    'recollection_support',
    'pre_fill',
    'track_provenance',
    'generate_report'
  ]).describe('Action to perform'),
  module_name: z.string().optional().describe('Module name for execute_module action'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow/module execution'),
  start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  include_artifacts: z.array(z.enum(['email', 'calendar', 'documents', 'calls'])).optional(),
  // Additional fields for specific actions
  gaps: z.any().optional(),
  artifacts: z.any().optional(),
  new_entries: z.any().optional(),
  existing_entries: z.any().optional(),
  time_entry: z.any().optional(),
});

/**
 * Chronometric Engine Wrapper Tool
 * Exposes the Chronometric engine functionality through MCP
 * Note: Chronometric has been promoted from Module to Engine status
 */
export const chronometricModuleTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'chronometric_module',
      description: 'Chronometric Engine - Forensic Time Capture and Workflow Archaeology. Assists attorneys in retrospectively reconstructing lost or unentered billable time.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'execute_workflow',
              'execute_module',
              'list_workflows',
              'identify_gaps',
              'collect_artifacts',
              'reconstruct_time',
              'check_duplicates',
              'recollection_support',
              'pre_fill',
              'track_provenance',
              'generate_report'
            ],
            description: 'Action to perform',
          },
          module_name: {
            type: 'string',
            description: 'Module name for execute_module action',
          },
          workflow_id: {
            type: 'string',
            description: 'Workflow ID for execute_workflow action',
          },
          input: {
            type: 'object' as const,
            description: 'Input data for workflow/module execution',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          matter_id: {
            type: 'string',
            description: 'Optional matter ID',
          },
          include_artifacts: {
            type: 'array',
            items: { type: 'string', enum: ['email', 'calendar', 'documents', 'calls'] },
            description: 'Types of artifacts to collect',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = ChronometricEngineSchema.parse(args);
      
      // Get the Chronometric engine from registry
      const engine = engineRegistry.get('chronometric');
      if (!engine) {
        return this.createErrorResult('Chronometric engine not found in registry');
      }
      
      // Execute the engine with the parsed input
      return await engine.execute(parsed);
    } catch (error) {
      return this.createErrorResult(
        `Error in chronometric engine: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
