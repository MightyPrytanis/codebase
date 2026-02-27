/*
 * Cyrano Custodian Engine
 * Persistent, AI-powered maintenance agent for Cyrano instances
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseEngine } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { healthMonitorService } from './services/health-monitor.js';
import { dependencyManagerService } from './services/dependency-manager.js';
import { autoFixService } from './services/auto-fix.js';
import { securityMonitorService } from './services/security-monitor.js';
import { alertService } from './services/alert.js';
import { failsafeService } from './services/failsafe.js';
import { tenRulesComplianceService } from './services/ten-rules-compliance.js';
import { renderIntegrationService } from './services/render-integration.js';
import { custodianConfigService } from './services/custodian-config.js';
import { custodianStatusTool } from './tools/custodian-status.js';
import { custodianHealthCheckTool } from './tools/custodian-health-check.js';
import { custodianUpdateDependenciesTool } from './tools/custodian-update-dependencies.js';
import { custodianApplyFixTool } from './tools/custodian-apply-fix.js';
import { custodianAlertAdminTool } from './tools/custodian-alert-admin.js';
import { custodianFailsafeTool } from './tools/custodian-failsafe.js';

const CustodianInputSchema = z.object({
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
    'get_config',
    'update_config',
  ]).describe('Action to perform'),
  target: z.string().optional().describe('Target for action (service, dependency, etc.)'),
  options: z.record(z.string(), z.any()).optional().describe('Additional options for action'),
});

/**
 * Custodian Engine
 * 
 * Persistent, AI-powered maintenance agent that:
 * - Monitors Cyrano instances for trouble
 * - Updates dependencies automatically
 * - Applies basic fixes
 * - Alerts admin when intervention needed
 * - Includes FAILSAFE protocol for security breaches
 * - Always Ten Rules compliant
 * 
 * The Custodian operates continuously in the background and is only
 * visible to administrators. Non-admin users cannot access Custodian
 * functionality.
 */
export class CustodianEngine extends BaseEngine {
  private monitoringActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date | null = null;

  constructor() {
    super({
      name: 'custodian',
      description: 'Persistent, AI-powered maintenance agent for Cyrano instances - monitors, updates, fixes, and alerts',
      version: '1.0.0',
      modules: [],
      tools: [
        custodianStatusTool,
        custodianHealthCheckTool,
        custodianUpdateDependenciesTool,
        custodianApplyFixTool,
        custodianAlertAdminTool,
        custodianFailsafeTool,
      ],
    });
  }

  /**
   * Initialize the Custodian engine
   */
  async initialize(): Promise<void> {
    // Initialize all services
    await custodianConfigService.initialize();
    await renderIntegrationService.initialize();
    await healthMonitorService.initialize();
    await dependencyManagerService.initialize();
    await autoFixService.initialize();
    await securityMonitorService.initialize();
    await alertService.initialize();
    await failsafeService.initialize();
    await tenRulesComplianceService.initialize();

    // Start background monitoring
    await this.startMonitoring();

    console.log('[Custodian] Engine initialized and monitoring started');
  }

  /**
   * Execute Custodian functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      // ALWAYS verify Ten Rules compliance before any action
      const complianceCheck = await tenRulesComplianceService.verifyAction(input);
      if (!complianceCheck.compliant) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Ten Rules compliance violation: ${complianceCheck.reason}. Action blocked.`,
            },
          ],
        };
      }

      const parsed = CustodianInputSchema.parse(input);
      const { action, target, options } = parsed;

      switch (action) {
        case 'status':
          return await this.getStatus();

        case 'health_check':
          return await this.runHealthCheck(target);

        case 'update_dependencies':
          return await this.updateDependencies(target, options);

        case 'apply_fix':
          return await this.applyFix(target || '', options);

        case 'alert_admin':
          return await this.alertAdmin(target || '', options);

        case 'failsafe_activate':
          return await this.activateFailsafe(options);

        case 'failsafe_deactivate':
          return await this.deactivateFailsafe(options);

        case 'start_monitoring':
          return await this.startMonitoring();

        case 'stop_monitoring':
          return await this.stopMonitoring();

        case 'get_config':
          return await this.getConfig();

        case 'update_config':
          return await this.updateConfig(options);

        default:
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Unknown action: ${action}`,
              },
            ],
          };
      }
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Custodian error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Get Custodian status
   */
  private async getStatus(): Promise<CallToolResult> {
    const status = {
      engine: 'custodian',
      version: this.config.version,
      monitoring_active: this.monitoringActive,
      last_health_check: this.lastHealthCheck?.toISOString() || null,
      services: {
        health_monitor: await healthMonitorService.getStatus(),
        dependency_manager: await dependencyManagerService.getStatus(),
        auto_fix: await autoFixService.getStatus(),
        security_monitor: await securityMonitorService.getStatus(),
        alert: await alertService.getStatus(),
        failsafe: await failsafeService.getStatus(),
      },
    };

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  /**
   * Run health check
   */
  private async runHealthCheck(target?: string): Promise<CallToolResult> {
    this.lastHealthCheck = new Date();
    const result = await healthMonitorService.checkHealth(target);

    // Auto-fix if issues detected and fixable
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        if (issue.auto_fixable) {
          await autoFixService.applyFix(issue.type, issue.details);
        } else {
          // Alert admin if not auto-fixable
          await alertService.sendAlert({
            level: issue.severity,
            title: `Health Check Issue: ${issue.type}`,
            message: issue.description,
            requires_intervention: true,
          });
        }
      }
    }

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Update dependencies
   */
  private async updateDependencies(target?: string, options?: any): Promise<CallToolResult> {
    const result = await dependencyManagerService.updateDependencies(target, options);

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Apply fix
   */
  private async applyFix(target: string, options?: any): Promise<CallToolResult> {
    // Verify Ten Rules compliance for fix
    const complianceCheck = await tenRulesComplianceService.verifyFix(target, options);
    if (!complianceCheck.compliant) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Ten Rules compliance violation: ${complianceCheck.reason}. Fix blocked.`,
          },
        ],
      };
    }

    const result = await autoFixService.applyFix(target, options);

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Alert admin
   */
  private async alertAdmin(target: string, options?: any): Promise<CallToolResult> {
    const result = await alertService.sendAlert({
      level: options?.level || 'info',
      title: target,
      message: options?.message || 'Admin alert from Custodian',
      requires_intervention: options?.requires_intervention || false,
    });

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Activate FAILSAFE protocol
   */
  private async activateFailsafe(options?: any): Promise<CallToolResult> {
    const result = await failsafeService.activate(options?.reason || 'Manual activation');

    // Immediately alert all admins
    await alertService.sendAlert({
      level: 'critical',
      title: 'FAILSAFE Protocol Activated',
      message: `FAILSAFE protocol has been activated. Reason: ${options?.reason || 'Manual activation'}`,
      requires_intervention: true,
    });

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Deactivate FAILSAFE protocol
   */
  private async deactivateFailsafe(options?: any): Promise<CallToolResult> {
    // Verify admin authorization
    if (!options?.admin_authorized) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'FAILSAFE deactivation requires admin authorization',
          },
        ],
      };
    }

    const result = await failsafeService.deactivate(options?.reason || 'Admin deactivation');

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Start background monitoring
   */
  private async startMonitoring(): Promise<CallToolResult> {
    if (this.monitoringActive) {
      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: 'Monitoring already active',
          },
        ],
      };
    }

    this.monitoringActive = true;

    // Get monitoring interval from config
    const intervalMs = custodianConfigService.getMonitoringIntervalMs();
    
    // Run health check at configured interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runHealthCheck();
        
        // Check security
        const securityStatus = await securityMonitorService.checkSecurity();
        if (securityStatus.threat_detected) {
          await this.activateFailsafe({ reason: securityStatus.threat_description });
        }

        // Check for dependency updates
        const updateCheck = await dependencyManagerService.checkForUpdates();
        if (updateCheck.updates_available && updateCheck.auto_update_safe) {
          await this.updateDependencies();
        }
      } catch (error) {
        console.error('[Custodian] Monitoring error:', error);
        await alertService.sendAlert({
          level: 'error',
          title: 'Custodian Monitoring Error',
          message: `Monitoring error: ${error instanceof Error ? error.message : String(error)}`,
          requires_intervention: false,
        });
      }
    }, intervalMs); // Configurable interval (10/20/30 minutes)

    // Run initial health check
    await this.runHealthCheck();

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: 'Monitoring started',
        },
      ],
    };
  }

  /**
   * Stop background monitoring
   */
  private async stopMonitoring(): Promise<CallToolResult> {
    if (!this.monitoringActive) {
      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: 'Monitoring not active',
          },
        ],
      };
    }

    this.monitoringActive = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: 'Monitoring stopped',
        },
      ],
    };
  }

  /**
   * Get Custodian configuration
   */
  private async getConfig(): Promise<CallToolResult> {
    const config = custodianConfigService.getConfig();
    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }

  /**
   * Update Custodian configuration
   */
  private async updateConfig(options?: any): Promise<CallToolResult> {
    try {
      if (!options) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Configuration options required',
            },
          ],
        };
      }

      await custodianConfigService.saveConfig(options);

      // If monitoring interval changed, restart monitoring
      if (options.monitoring_interval_minutes) {
        if (this.monitoringActive) {
          await this.stopMonitoring();
          await this.startMonitoring();
        }
      }

      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: 'Configuration updated successfully',
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Get engine info
   */
  getEngineInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      version: this.config.version,
      moduleCount: this.modules.size,
      toolCount: this.tools.size,
      workflowCount: this.workflows.size,
      aiProviders: [],
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopMonitoring();
    console.log('[Custodian] Engine cleaned up');
  }
}

// Export singleton instance
export const custodianEngine = new CustodianEngine();

