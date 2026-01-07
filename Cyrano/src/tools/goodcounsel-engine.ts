/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { engineRegistry } from '../engines/registry.js';

const GoodCounselEngineSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'wellness_check',
    'ethics_review',
    'client_recommendations',
    'crisis_support',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow execution'),
  userId: z.string().optional().describe('User ID for wellness/ethics operations'),
});

/**
 * GoodCounsel Engine Wrapper Tool
 * Exposes the GoodCounsel engine functionality through MCP
 * 
 * Note: wellness_journal, wellness_trends, and burnout_check are available
 * via the wellness_journal MCP tool (use that tool directly instead)
 */
export const goodcounselEngineTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'goodcounsel_engine',
      description: 'GoodCounsel Engine - Ethics and Wellness Engine promoting attorney health, wellness, and ethical decision-making',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'execute_workflow',
              'list_workflows',
              'wellness_check',
              'ethics_review',
              'client_recommendations',
              'crisis_support',
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
          userId: {
            type: 'string',
            description: 'User ID for wellness/ethics operations',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = GoodCounselEngineSchema.parse(args);
      
      // Get the GoodCounsel engine from registry
      const engine = engineRegistry.get('goodcounsel');
      if (!engine) {
        return this.createErrorResult('GoodCounsel engine not found in registry');
      }
      
      // Initialize engine if not already initialized
      if (!engine.getEngineInfo().workflowCount || engine.getEngineInfo().workflowCount === 0) {
        await engine.initialize();
      }
      
      // Execute the engine with the parsed input
      return await engine.execute(parsed);
    } catch (error) {
      return this.createErrorResult(
        `Error in goodcounsel_engine: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

