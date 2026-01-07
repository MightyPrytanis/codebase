/*
 * Custodian Alert Admin Tool
 * Send alert to administrators
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../custodian-engine.js';

const CustodianAlertAdminSchema = z.object({
  target: z.string().describe('Alert title or subject'),
  options: z.record(z.any()).optional().describe('Alert options (level, message, requires_intervention)'),
});

export const custodianAlertAdminTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_alert_admin',
      description: 'Send alert to administrators. Used for critical issues requiring human intervention. Admin-only access.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          target: {
            type: 'string',
            description: 'Alert title or subject',
          },
          options: {
            type: 'object' as const,
            description: 'Alert options',
            properties: {
              level: {
                type: 'string',
                enum: ['info', 'warning', 'error', 'critical'],
                description: 'Alert level',
              },
              message: {
                type: 'string',
                description: 'Alert message',
              },
              requires_intervention: {
                type: 'boolean',
                description: 'Whether human intervention is required',
              },
            },
            additionalProperties: true,
          },
        },
        required: ['target'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianAlertAdminSchema.parse(args);
      const result = await custodianEngine.execute({
        action: 'alert_admin',
        target: parsed.target,
        options: parsed.options,
      });
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian alert admin error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
