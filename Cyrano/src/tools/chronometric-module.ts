/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { moduleRegistry } from '../modules/registry.js';

const ChronometricModuleSchema = z.object({
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
  // Additional fields for specific actions
  gaps: z.any().optional(),
  artifacts: z.any().optional(),
  new_entries: z.any().optional(),
  existing_entries: z.any().optional(),
  time_entry: z.any().optional(),
});

/**
 * Chronometric Module Wrapper Tool
 * Exposes the Chronometric module functionality through MCP
 */
export const chronometricModuleTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'chronometric_module',
      description: 'Forensic Time Capture Module - assists attorneys in retrospectively reconstructing lost or unentered billable time',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
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
      const parsed = ChronometricModuleSchema.parse(args);
      
      // Get the Chronometric module from registry
      const module = moduleRegistry.get('chronometric');
      if (!module) {
        return this.createErrorResult('Chronometric module not found in registry');
      }
      
      // Execute the module with the parsed input
      return await module.execute(parsed);
    } catch (error) {
      return this.createErrorResult(
        `Error in chronometric_module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
