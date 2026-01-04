/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine, Workflow } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const ChronometricInputSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'execute_module',
    'list_workflows',
    'identify_gaps',
    'collect_artifacts',
    'reconstruct_time',
    'check_duplicates',
    'recollection_support',
    'pre_fill',
    'track_provenance',
    'generate_report'
  ]).describe('Action to perform'),
  module_name: z.string().optional().describe('Module name for execute_module action'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow/module execution'),
  start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  include_artifacts: z.array(z.enum(['email', 'calendar', 'documents', 'calls'])).optional(),
});

/**
 * Chronometric Engine
 * Forensic Time Capture and Workflow Archaeology Engine
 * 
 * Promotes attorney time tracking accuracy through forensic reconstruction
 * of lost or unentered billable time. Provides workflow archaeology for
 * reconstructing past hours, days, or weeks when details have been forgotten.
 * 
 * Key Features:
 * - Time Reconstruction: Identify gaps, collect artifacts, reconstruct time entries
 * - Pattern Learning: Learn from historical data to improve accuracy
 * - Cost Estimation: Predictive cost estimation for planning and proposals
 * - Workflow Archaeology: Reconstruct past workflows using artifact analysis
 * 
 * Architecture:
 * - Engine coordinates three specialized modules:
 *   1. Time Reconstruction Module - Gap identification and artifact collection
 *   2. Pattern Learning & Analytics Module - Baseline setup and profitability
 *   3. Cost Estimation Module - Predictive cost estimation
 */
export class ChronometricEngine extends BaseEngine {
  constructor() {
    super({
      name: 'chronometric',
      description: 'Forensic Time Capture and Workflow Archaeology Engine - assists attorneys in retrospectively reconstructing lost or unentered billable time',
      version: '1.0.0',
      modules: ['time_reconstruction', 'pattern_learning', 'cost_estimation'], // All three modules: time_reconstruction, pattern_learning, cost_estimation
      tools: [], // Tools are now in modules
      aiProviders: [], // Auto provider selection
    });
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Register default workflows
    this.registerDefaultWorkflows();
  }

  /**
   * Register default workflows
   */
  private registerDefaultWorkflows(): void {
    // Time Reconstruction Workflow
    this.registerWorkflow({
      id: 'time_reconstruction',
      name: 'Time Reconstruction Workflow',
      description: 'Complete time reconstruction process: identify gaps, collect artifacts, reconstruct time entries',
      steps: [
        {
          id: 'identify_gaps',
          type: 'tool',
          target: 'gap_identifier',
          input: {},
          onSuccess: 'collect_artifacts',
        },
        {
          id: 'collect_artifacts',
          type: 'module',
          target: 'time_reconstruction',
          input: { action: 'collect_artifacts' },
          onSuccess: 'reconstruct_time',
        },
        {
          id: 'reconstruct_time',
          type: 'module',
          target: 'time_reconstruction',
          input: { action: 'reconstruct_time' },
          onSuccess: 'check_duplicates',
        },
        {
          id: 'check_duplicates',
          type: 'tool',
          target: 'dupe_check',
          input: {},
        },
      ],
    });

    // Forensic Reconstruction Workflow (Workflow Archaeology)
    this.registerWorkflow({
      id: 'forensic_reconstruction',
      name: 'Forensic Reconstruction Workflow',
      description: 'Reconstruct past workflows and activities using artifact analysis',
      steps: [
        {
          id: 'collect_forensic_artifacts',
          type: 'module',
          target: 'time_reconstruction',
          input: { action: 'collect_artifacts' },
          onSuccess: 'analyze_patterns',
        },
        {
          id: 'analyze_patterns',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Analyze workflow patterns from collected artifacts' },
          onSuccess: 'reconstruct_timeline',
        },
        {
          id: 'reconstruct_timeline',
          type: 'tool',
          target: 'workflow_archaeology',
          input: {},
        },
      ],
    });

    // Pattern Learning Workflow
    this.registerWorkflow({
      id: 'pattern_learning',
      name: 'Pattern Learning Workflow',
      description: 'Learn from historical time entries to improve gap detection accuracy',
      steps: [
        {
          id: 'setup_baseline',
          type: 'module',
          target: 'pattern_learning',
          input: { action: 'setup_baseline' },
          onSuccess: 'learn_patterns',
        },
        {
          id: 'learn_patterns',
          type: 'module',
          target: 'pattern_learning',
          input: { action: 'learn_patterns' },
        },
      ],
    });

    // Cost Estimation Workflow
    this.registerWorkflow({
      id: 'cost_estimation',
      name: 'Cost Estimation Workflow',
      description: 'Estimate costs and hours for new matters based on historical data',
      steps: [
        {
          id: 'learn_from_matter',
          type: 'module',
          target: 'cost_estimation',
          input: { action: 'learn_from_matter' },
          onSuccess: 'estimate_cost',
        },
        {
          id: 'estimate_cost',
          type: 'module',
          target: 'cost_estimation',
          input: { action: 'estimate_cost' },
          onSuccess: 'generate_proposal',
        },
        {
          id: 'generate_proposal',
          type: 'module',
          target: 'cost_estimation',
          input: { action: 'generate_proposal' },
        },
      ],
    });
  }

  /**
   * Execute engine functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = ChronometricInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'execute_workflow':
          if (!parsed.workflow_id) {
            return {
              content: [{ type: 'text', text: 'Error: workflow_id is required for execute_workflow action' }],
              isError: true,
            };
          }
          return await this.executeWorkflow(parsed.workflow_id, parsed.input || {});
        
        case 'execute_module': {
          if (!parsed.module_name) {
            return {
              content: [{ type: 'text', text: 'Error: module_name is required for execute_module action' }],
              isError: true,
            };
          }
          const module = this.modules.get(parsed.module_name);
          if (!module) {
            return {
              content: [{ type: 'text', text: `Error: Module '${parsed.module_name}' not found` }],
              isError: true,
            };
          }
          return await module.execute(parsed.input || {});
        }
        
        case 'list_workflows':
          return this.listWorkflows();
        
        // Legacy direct actions (delegate to time_reconstruction module for backward compatibility)
        case 'identify_gaps':
        case 'collect_artifacts':
        case 'reconstruct_time':
        case 'check_duplicates':
        case 'recollection_support':
        case 'pre_fill':
        case 'track_provenance': {
          // Delegate to time_reconstruction module
          const timeReconModule = this.modules.get('time_reconstruction');
          if (timeReconModule) {
            return await timeReconModule.execute({
              action: parsed.action,
              start_date: parsed.start_date,
              end_date: parsed.end_date,
              matter_id: parsed.matter_id,
              include_artifacts: parsed.include_artifacts,
              // Pass through any additional input
              ...(parsed.input || {}),
            });
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'time_reconstruction module not available',
                available_modules: Array.from(this.modules.keys()),
              }, null, 2)
            }],
            isError: true,
          };
        }
        
        case 'generate_report': {
          // Delegate to billing_reconciliation module
          const { moduleRegistry } = await import('../../modules/registry.js');
          const billingModule = moduleRegistry.get('billing_reconciliation');
          if (billingModule) {
            return await billingModule.execute({
              action: 'generate_reconciliation_report',
              start_date: parsed.start_date,
              end_date: parsed.end_date,
              matter_id: parsed.matter_id,
              include_artifacts: parsed.include_artifacts,
            });
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'billing_reconciliation module not available',
              }, null, 2)
            }],
            isError: true,
          };
        }
        
        default:
          return {
            content: [{ type: 'text', text: `Unknown action: ${parsed.action}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error in chronometric engine: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * List available workflows
   */
  private listWorkflows(): CallToolResult {
    const workflowList = Array.from(this.workflows.values()).map(wf => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      steps: wf.steps.length,
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          engine: 'chronometric',
          workflows: workflowList,
          modules: Array.from(this.modules.keys()),
          note: 'Use execute_workflow action with workflow_id to execute a workflow',
        }, null, 2)
      }],
      isError: false,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources, connections, etc.
    for (const module of this.modules.values()) {
      await module.cleanup();
    }
  }
}

// Export singleton instance
export const chronometricEngine = new ChronometricEngine();
