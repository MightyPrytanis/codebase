/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Workflow, WorkflowStep } from '../base-engine.js';
import { z } from 'zod';
import { chronometricModule } from '../../modules/chronometric/index.js';
import {
  buildExecutionPlan,
  workflowToNodes,
  validateWorkflowStructure,
  groupStepsByLevel,
  ExecutionPlan,
} from './workflow-utils.js';
import { aiProviderSelector } from '../../services/ai-provider-selector.js';
import { AIProvider } from '../../services/ai-service.js';

const MaeInputSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'create_workflow',
    'get_status',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  workflow: z.any().optional().describe('Workflow definition for creation'),
  input: z.any().optional().describe('Input data for workflow execution'),
});

/**
 * MAE Engine
 * Multi-Agent Engine - Orchestrates multiple AI assistants/agents and modules
 * 
 * This engine coordinates workflows that may involve:
 * - Multiple AI providers (OpenAI, Anthropic, etc.)
 * - Multiple modules (Chronometric, etc.)
 * - Complex multi-step processes
 */
export class MaeEngine extends BaseEngine {
  constructor() {
    super({
      name: 'mae',
      description: 'Multi-Agent Engine - Orchestrates multiple AI assistants/agents and modules for complex workflows',
      version: '1.0.0',
      modules: ['chronometric'], // Modules this engine orchestrates
      aiProviders: ['openai', 'anthropic', 'google', 'perplexity', 'xai', 'deepseek'],
    });
  }

  /**
   * Get the default provider for MAE orchestrator (user sovereignty - can be changed)
   */
  getDefaultProvider(): AIProvider {
    return aiProviderSelector.getMAEDefaultProvider();
  }

  /**
   * Set the default provider for MAE orchestrator (user sovereignty)
   */
  setDefaultProvider(provider: AIProvider): void {
    aiProviderSelector.setMAEDefaultProvider(provider);
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Register default workflows
    this.registerDefaultWorkflows();
    
    // Initialize all modules
    for (const module of this.getModules()) {
      await module.initialize();
    }
  }

  /**
   * Execute engine functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = MaeInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'execute_workflow':
          if (!parsed.workflow_id) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: workflow_id is required for execute_workflow action',
                },
              ],
              isError: true,
            };
          }
          return await this.executeWorkflow(parsed.workflow_id, parsed.input || {});
        
        case 'list_workflows':
          const workflows = await this.getWorkflows();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    step_count: w.steps.length,
                  })),
                }, null, 2),
              },
            ],
            isError: false,
          };
        
        case 'create_workflow':
          if (!parsed.workflow) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: workflow definition is required for create_workflow action',
                },
              ],
              isError: true,
            };
          }
          this.registerWorkflow(parsed.workflow as Workflow);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  workflow_id: parsed.workflow.id,
                  message: 'Workflow registered successfully',
                }, null, 2),
              },
            ],
            isError: false,
          };
        
        case 'get_status':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  engine: this.getEngineInfo(),
                  active_workflows: this.workflows.size,
                  modules: this.getModules().map(m => m.getModuleInfo()),
                }, null, 2),
              },
            ],
            isError: false,
          };
        
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action: ${parsed.action}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in MAE engine: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Execute workflow with topological sort for complex dependency graphs
   * 
   * This method uses the topological sort algorithm from SwimMeet to handle
   * workflows with complex dependencies. It's an enhanced version of the
   * base executeWorkflow that can handle parallel execution opportunities.
   * 
   * @param workflowId Workflow ID to execute
   * @param input Input data for workflow
   * @param useTopologicalSort Whether to use topological sort (default: true for complex workflows)
   */
  async executeWorkflowWithTopologicalSort(
    workflowId: string,
    input: any,
    useTopologicalSort: boolean = true
  ): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow ${workflowId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Convert workflow to node-based format for topological sort
    const { nodes, connections } = workflowToNodes(workflow);

    // Validate workflow structure
    if (useTopologicalSort) {
      const validation = validateWorkflowStructure(nodes, connections);
      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Workflow validation failed',
                errors: validation.errors,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }

    // Build execution plan with topological sort
    const executionPlan = useTopologicalSort
      ? buildExecutionPlan(nodes, connections)
      : workflow.steps.map((step, index) => ({
          step: index,
          nodeId: step.id,
          dependencies: [],
        }));

    // Group steps by level for potential parallel execution
    const levelMap = groupStepsByLevel(executionPlan);

    // Initialize context
    const context = {
      ...workflow.initialState,
      ...input,
      stepResults: {} as Record<string, any>,
    };

    const executionResults: Array<{
      stepId: string;
      status: 'completed' | 'failed';
      result?: any;
      error?: string;
    }> = [];

    // Execute steps level by level (steps at same level can run in parallel)
    const levels = Array.from(levelMap.keys()).sort((a, b) => a - b);

    for (const level of levels) {
      const stepIds = levelMap.get(level) || [];
      
      // For now, execute sequentially (parallel execution can be added later)
      for (const stepId of stepIds) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (!step) {
          continue;
        }

        // Check if dependencies are satisfied
        const planItem = executionPlan.find(p => p.nodeId === stepId);
        if (planItem) {
          const allDependenciesMet = planItem.dependencies.every(depId =>
            executionResults.some(r => r.stepId === depId && r.status === 'completed')
          );

          if (!allDependenciesMet) {
            executionResults.push({
              stepId,
              status: 'failed',
              error: 'Dependencies not satisfied',
            });
            continue;
          }
        }

        try {
          const result = await this.executeStep(step, context);
          context.stepResults[step.id] = result;

          executionResults.push({
            stepId,
            status: result.isError ? 'failed' : 'completed',
            result: result.isError ? undefined : result,
            error: result.isError ? (typeof result.content[0]?.text === 'string' ? result.content[0].text : 'Unknown error') : undefined,
          });

          // If step failed and has onFailure, continue to failure path
          if (result.isError && step.onFailure) {
            // Failure path will be handled in next level
            continue;
          }

          // If step succeeded and has onSuccess, continue to success path
          if (!result.isError && step.onSuccess) {
            // Success path will be handled in next level
            continue;
          }
        } catch (error) {
          executionResults.push({
            stepId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            workflowId,
            executionPlan: executionPlan.map(p => ({
              step: p.step,
              nodeId: p.nodeId,
              dependencies: p.dependencies,
            })),
            results: executionResults,
            finalContext: context.stepResults,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Override executeWorkflow to use topological sort for complex workflows
   */
  async executeWorkflow(workflowId: string, input: any): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow ${workflowId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Use topological sort for workflows with complex dependencies
    // Simple linear workflows can use base implementation
    const hasComplexDependencies = workflow.steps.some(step =>
      step.onSuccess && step.onFailure && step.onSuccess !== step.onFailure
    ) || workflow.steps.length > 5; // Heuristic: complex if > 5 steps

    if (hasComplexDependencies) {
      return await this.executeWorkflowWithTopologicalSort(workflowId, input, true);
    } else {
      // Use base implementation for simple workflows
      return await super.executeWorkflow(workflowId, input);
    }
  }

  /**
   * Register default workflows
   */
  private registerDefaultWorkflows(): void {
    // Time reconstruction workflow using Chronometric module
    this.registerWorkflow({
      id: 'time_reconstruction',
      name: 'Time Reconstruction Workflow',
      description: 'Complete workflow for reconstructing billable time using Chronometric module',
      steps: [
        {
          id: 'identify_gaps',
          type: 'module',
          target: 'chronometric',
          input: { action: 'identify_gaps' },
          onSuccess: 'collect_artifacts',
          onFailure: 'end',
        },
        {
          id: 'collect_artifacts',
          type: 'module',
          target: 'chronometric',
          input: { action: 'collect_artifacts' },
          onSuccess: 'recollection_support',
          onFailure: 'end',
        },
        {
          id: 'recollection_support',
          type: 'module',
          target: 'chronometric',
          input: { action: 'recollection_support' },
          onSuccess: 'pre_fill',
          onFailure: 'end',
        },
        {
          id: 'pre_fill',
          type: 'module',
          target: 'chronometric',
          input: { action: 'pre_fill' },
          onSuccess: 'check_duplicates',
          onFailure: 'end',
        },
        {
          id: 'check_duplicates',
          type: 'module',
          target: 'chronometric',
          input: { action: 'check_duplicates' },
          onSuccess: 'generate_report',
          onFailure: 'end',
        },
        {
          id: 'generate_report',
          type: 'module',
          target: 'chronometric',
          input: { action: 'generate_report' },
        },
      ],
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup all modules
    for (const module of this.getModules()) {
      await module.cleanup();
    }
    
    // Clear workflows and state
    this.workflows.clear();
    this.state.clear();
  }
}

// Export singleton instance
export const maeEngine = new MaeEngine();
