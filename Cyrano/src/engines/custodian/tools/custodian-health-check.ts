/*
 * Custodian Health Check Tool
 * Run health check on Cyrano instance
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../custodian-engine.js';

const CustodianHealthCheckSchema = z.object({
  target: z.string().optional().describe('Specific service or component to check'),
});

export const custodianHealthCheckTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_health_check',
      description: 'Run health check on Cyrano instance. Checks system metrics, service health, and identifies issues. Admin-only access.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          target: {
            type: 'string',
            description: 'Specific service or component to check (optional)',
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianHealthCheckSchema.parse(args);
      const result = await custodianEngine.execute({
        action: 'health_check',
        target: parsed.target,
      });
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian health check error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
