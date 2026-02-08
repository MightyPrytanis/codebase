/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { engineRegistry } from '../engines/registry.js';

const PotemkinEngineSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'verify_document',
    'detect_bias',
    'monitor_integrity',
    'test_opinion_drift',
    'assess_honesty',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow execution'),
  documentId: z.string().optional().describe('Document ID for verification'),
  content: z.string().optional().describe('Content to verify/analyze'),
});

/**
 * Potemkin Engine Wrapper Tool
 * Exposes the Potemkin engine functionality through MCP
 */
export const potemkinEngineTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'potemkin_engine',
      description: 'Potemkin Engine - Verification and Integrity Engine for truth and logic verification of AI-generated content',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'execute_workflow',
              'list_workflows',
              'verify_document',
              'detect_bias',
              'monitor_integrity',
              'test_opinion_drift',
              'assess_honesty',
            ],
            description: 'Action to perform',
          },
          workflow_id: {
            type: 'string',
            description: 'Workflow ID for execution',
          },
          input: {
            type: 'object' as const,
            description: 'Input data for workflow execution',
          },
          documentId: {
            type: 'string',
            description: 'Document ID for verification',
          },
          content: {
            type: 'string',
            description: 'Content to verify/analyze',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = PotemkinEngineSchema.parse(args);
      
      // Get the Potemkin engine from registry
      const engine = engineRegistry.get('potemkin');
      if (!engine) {
        return this.createErrorResult('Potemkin engine not found in registry');
      }
      
      // Initialize engine if not already initialized
      if (!engine.getEngineInfo().workflowCount || engine.getEngineInfo().workflowCount === 0) {
        await engine.initialize();
      }
      
      // Execute the engine with the parsed input
      return await engine.execute(parsed);
    } catch (error) {
      return this.createErrorResult(
        `Error in potemkin_engine: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}