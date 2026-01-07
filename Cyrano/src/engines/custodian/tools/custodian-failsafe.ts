/*
 * Custodian FAILSAFE Tool
 * Activate or deactivate FAILSAFE protocol
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../custodian-engine.js';

const CustodianFailsafeSchema = z.object({
  action: z.enum(['activate', 'deactivate']).describe('FAILSAFE action'),
  options: z.record(z.string(), z.any()).optional().describe('Options (reason, admin_authorized for deactivate)'),
});

export const custodianFailsafeTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_failsafe',
      description: 'Activate or deactivate FAILSAFE protocol. FAILSAFE locks down system on security breach. Deactivation requires admin authorization. Admin-only access.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['activate', 'deactivate'],
            description: 'FAILSAFE action',
          },
          options: {
            type: 'object',
            description: 'Options for FAILSAFE action',
            properties: {
              reason: {
                type: 'string',
                description: 'Reason for activation/deactivation',
              },
              admin_authorized: {
                type: 'boolean',
                description: 'Admin authorization (required for deactivation)',
              },
            },
            additionalProperties: true,
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianFailsafeSchema.parse(args);
      const action = parsed.action === 'activate' ? 'failsafe_activate' : 'failsafe_deactivate';
      const result = await custodianEngine.execute({
        action,
        options: parsed.options,
      });
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian FAILSAFE error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
