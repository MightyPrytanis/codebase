/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { engineRegistry } from '../engines/registry.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { AIProvider } from '../services/ai-service.js';

const MaeEngineSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'create_workflow',
    'get_status',
    'get_default_provider',
    'set_default_provider',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  workflow: z.any().optional().describe('Workflow definition for creation'),
  input: z.any().optional().describe('Input data for workflow execution'),
  provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek']).optional().describe('Provider to set as default for MAE orchestrator'),
});

/**
 * MAE Engine Wrapper Tool
 * Exposes the MAE engine functionality through MCP
 */
export const maeEngineTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'mae_engine',
      description: 'Multi-Agent Engine - Orchestrates multiple AI assistants/agents and modules for complex workflows',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['execute_workflow', 'list_workflows', 'create_workflow', 'get_status', 'get_default_provider', 'set_default_provider'],
            description: 'Action to perform',
          },
          provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'],
            description: 'Provider to set as default for MAE orchestrator (for set_default_provider action)',
          },
          workflow_id: {
            type: 'string',
            description: 'Workflow ID for execution',
          },
          workflow: {
            type: 'object' as const,
            description: 'Workflow definition for creation',
          },
          input: {
            type: 'object' as const,
            description: 'Input data for workflow execution',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = MaeEngineSchema.parse(args);
      
      // Handle provider management actions
      if (parsed.action === 'get_default_provider') {
        const provider = aiProviderSelector.getMAEDefaultProvider();
        return this.createSuccessResult(JSON.stringify({
          default_provider: provider,
          message: `MAE default provider is ${provider}. This is used when no provider is specified for auto-select.`,
        }, null, 2));
      }
      
      if (parsed.action === 'set_default_provider') {
        if (!parsed.provider) {
          return this.createErrorResult('Provider is required for set_default_provider action');
        }
        aiProviderSelector.setMAEDefaultProvider(parsed.provider as AIProvider);
        return this.createSuccessResult(JSON.stringify({
          success: true,
          default_provider: parsed.provider,
          message: `MAE default provider set to ${parsed.provider}. This will be used when no provider is specified for auto-select.`,
        }, null, 2));
      }
      
      // Get the MAE engine from registry
      const engine = engineRegistry.get('mae');
      if (!engine) {
        return this.createErrorResult('MAE engine not found in registry');
      }
      
      // Execute the engine with the parsed input
      return await engine.execute(parsed);
    } catch (error) {
      return this.createErrorResult(
        `Error in mae_engine: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}
}
}