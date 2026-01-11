/*
 * Custodian Update Dependencies Tool
 * Update dependencies automatically
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../custodian-engine.js';

const CustodianUpdateDependenciesSchema = z.object({
  target: z.string().optional().describe('Specific package to update (optional, updates all if not specified)'),
  options: z.record(z.string(), z.any()).optional().describe('Additional options for update'),
});

export const custodianUpdateDependenciesTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_update_dependencies',
      description: 'Update dependencies automatically. Can update specific package or all dependencies. Includes rollback capability. Admin-only access.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          target: {
            type: 'string',
            description: 'Specific package to update (optional)',
          },
          options: {
            type: 'object' as const,
            description: 'Additional options for update',
            additionalProperties: true,
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianUpdateDependenciesSchema.parse(args);
      const result = await custodianEngine.execute({
        action: 'update_dependencies',
        target: parsed.target,
        options: parsed.options,
      });
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian update dependencies error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
