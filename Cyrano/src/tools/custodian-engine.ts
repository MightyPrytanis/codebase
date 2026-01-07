/*
 * Custodian Engine Tool
 * MCP-callable tool for Custodian engine
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { custodianEngine } from '../engines/custodian/index.js';

const CustodianEngineSchema = z.object({
  action: z.enum([
    'status',
    'health_check',
    'update_dependencies',
    'apply_fix',
    'alert_admin',
    'failsafe_activate',
    'failsafe_deactivate',
    'start_monitoring',
    'stop_monitoring',
  ]).describe('Action to perform'),
  target: z.string().optional().describe('Target for action'),
  options: z.record(z.any()).optional().describe('Additional options'),
});

export const custodianEngineTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'custodian_engine',
      description: `Custodian Engine - Persistent, AI-powered maintenance agent for Cyrano instances. Monitors health, updates dependencies, applies fixes, and alerts administrators. Includes FAILSAFE protocol for security breaches. Always Ten Rules compliant. Admin-only access.

Available actions:
- status: Get Custodian status
- health_check: Run health check
- update_dependencies: Update dependencies
- apply_fix: Apply automatic fix
- alert_admin: Send alert to administrators
- failsafe_activate: Activate FAILSAFE protocol
- failsafe_deactivate: Deactivate FAILSAFE protocol (requires admin authorization)
- start_monitoring: Start background monitoring
- stop_monitoring: Stop background monitoring
- get_config: Get Custodian configuration
- update_config: Update Custodian configuration (monitoring interval, admin contacts, etc.)

The Custodian operates continuously in the background and is only visible to administrators.`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'status',
              'health_check',
              'update_dependencies',
              'apply_fix',
              'alert_admin',
              'failsafe_activate',
              'failsafe_deactivate',
              'start_monitoring',
              'stop_monitoring',
              'get_config',
              'update_config',
            ],
            description: 'Action to perform',
          },
          target: {
            type: 'string',
            description: 'Target for action (service, dependency, fix type, etc.)',
          },
          options: {
            type: 'object' as const,
            description: 'Additional options for action',
            additionalProperties: true,
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = CustodianEngineSchema.parse(args);
      const result = await custodianEngine.execute(parsed);
      return result;
    } catch (error) {
      return this.createErrorResult(
        `Custodian engine error: ${error instanceof Error ? error.message : String(error)}`,
        'CUSTODIAN_ERROR'
      );
    }
  }
})();
