/*
 * Custodian Status Tool
 * Get Custodian engine status
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../custodian-engine.js';

const CustodianStatusSchema = z.object({});

export const custodianStatusTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_status',
      description: 'Get status of the Custodian engine. Returns monitoring status, service health, and recent activity. Admin-only access.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianStatusSchema.parse(args);
      const result = await custodianEngine.execute({ action: 'status' });
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian status error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}