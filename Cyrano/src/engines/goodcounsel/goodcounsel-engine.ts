/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine, Workflow } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { clientRecommendationsTool } from './tools/client-recommendations.js';
import { ethicsReviewer } from './tools/ethics-reviewer.js';
import { ethicsRulesModule } from './services/ethics-rules-module.js';
// Wellness features - temporarily disabled for build
// import { wellnessJournalTool } from '../tools/wellness-journal.js';
// import { wellness } from '../services/wellness-service.js';

const GoodCounselInputSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'wellness_check',
    'wellness_journal',
    'wellness_trends',
    'burnout_check',
    'ethics_review',
    'client_recommendations',
    'crisis_support',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow execution'),
  userId: z.string().optional().describe('User ID for wellness/ethics operations'),
});

/**
 * GoodCounsel℠
 * Legal Professional Ethics and Wellness Engine
 * 
 * Promotes attorney health, wellness, ethical decision-making, and holistic
 * professional and personal growth. Provides context-aware reminders, wellness
 * support, ethics guidance, and crisis support.
 * 
 * Key Features:
 * - Wellness Support: Automated, context-aware reminders for physical, mental, and social health
 * - Ethics & Professional Growth: Tools for tracking ethical obligations and personal development
 * - Workflow Awareness: Integration with LexFiat components to balance workflow and wellness
 * - Crisis Support: Pathways to help and advocacy with strict privacy controls
 */
export class GoodcounselEngine extends BaseEngine {
  constructor() {
    super({
      name: 'goodcounsel',
      description: 'Ethics and Wellness Engine - Promotes attorney health, wellness, and ethical decision-making',
      version: '1.0.0',
      aiProviders: ['openai', 'anthropic'], // AI providers for wellness recommendations
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
    // Wellness Check Workflow
    this.registerWorkflow({
      id: 'wellness_check',
      name: 'Wellness Check',
      description: 'Performs a comprehensive wellness assessment for an attorney',
      steps: [
        {
          id: 'assess_workload',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Assess attorney workload and stress indicators' },
          onSuccess: 'check_metrics',
        },
        {
          id: 'check_metrics',
          type: 'tool',
          target: 'wellness_metrics',
          input: {},
          onSuccess: 'generate_recommendations',
        },
        {
          id: 'generate_recommendations',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate personalized wellness recommendations' },
        },
      ],
    });

    // Ethics Review Workflow
    this.registerWorkflow({
      id: 'ethics_review',
      name: 'Ethics Review',
      description: 'Reviews ethical obligations and compliance status',
      steps: [
        {
          id: 'check_ethics_rules',
          type: 'tool',
          target: 'ethics_checker',
          input: {},
          onSuccess: 'assess_compliance',
        },
        {
          id: 'assess_compliance',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Assess ethics compliance and identify potential issues' },
          onSuccess: 'generate_guidance',
        },
        {
          id: 'generate_guidance',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate ethics guidance and recommendations' },
        },
      ],
    });

    // Client Relationship Recommendations Workflow
    this.registerWorkflow({
      id: 'client_recommendations',
      name: 'Client Relationship Recommendations',
      description: 'Generates recommendations for client relationship management using Cosmos pattern',
      steps: [
        {
          id: 'get_client_recommendations',
          type: 'tool',
          target: 'client_recommendations',
          input: {},
          onSuccess: 'prioritize_recommendations',
        },
        {
          id: 'prioritize_recommendations',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Prioritize and contextualize client relationship recommendations' },
        },
      ],
    });

    // Crisis Support Workflow
    this.registerWorkflow({
      id: 'crisis_support',
      name: 'Crisis Support',
      description: 'Provides pathways to help and advocacy in crisis situations',
      steps: [
        {
          id: 'assess_situation',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Assess crisis situation and urgency level' },
          onSuccess: 'identify_resources',
        },
        {
          id: 'identify_resources',
          type: 'tool',
          target: 'resource_matcher',
          input: {},
          onSuccess: 'generate_pathways',
        },
        {
          id: 'generate_pathways',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate stepwise support pathways with privacy considerations' },
        },
      ],
    });
  }

  /**
   * Execute engine functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = GoodCounselInputSchema.parse(input);

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
          };

        case 'wellness_check':
          return await this.executeWorkflow('wellness_check', {
            userId: parsed.userId,
            ...(parsed.input && typeof parsed.input === 'object' ? parsed.input : {}),
          });

        case 'wellness_journal':
          // Wellness journal - feature in development
          return {
            content: [{ type: 'text', text: 'Wellness journal feature is currently in development' }],
            isError: false,
          };

        case 'wellness_trends':
          // Wellness trends - feature in development
          return {
            content: [{ type: 'text', text: 'Wellness trends feature is currently in development' }],
            isError: false,
          };

        case 'burnout_check':
          // Burnout check - feature in development
          return {
            content: [{ type: 'text', text: 'Burnout check feature is currently in development' }],
            isError: false,
          };

        case 'ethics_review':
          // Use ethics reviewer tool directly for rule-based evaluation
          if (parsed.input?.facts) {
            return await ethicsReviewer.execute({
              userId: parsed.userId,
              facts: parsed.input.facts,
              includeWarnings: parsed.input.includeWarnings !== false,
            });
          }
          // Fallback to workflow if no facts provided
          return await this.executeWorkflow('ethics_review', {
            userId: parsed.userId,
            ...(parsed.input && typeof parsed.input === 'object' ? parsed.input : {}),
          });

        case 'client_recommendations':
          // Use the client recommendations tool directly for faster response
          if (parsed.userId || parsed.input) {
            return await clientRecommendationsTool.execute({
              userId: parsed.userId,
              ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
            });
          }
          return await this.executeWorkflow('client_recommendations', {
            userId: parsed.userId,
            ...(parsed.input && typeof parsed.input === 'object' ? parsed.input : {}),
          });

        case 'crisis_support':
          return await this.executeWorkflow('crisis_support', {
            userId: parsed.userId,
            ...(parsed.input && typeof parsed.input === 'object' ? parsed.input : {}),
          });

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Error: Unknown action: ${parsed.action}`,
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
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get available workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(workflowId: string, input: any): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow '${workflowId}' not found`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Initialize workflow state
      const state = {
        ...workflow.initialState,
        ...input,
        workflowId,
        currentStep: 0,
        results: [],
      };

      // Execute workflow steps
      for (const step of workflow.steps) {
        // Check condition if present
        if (step.condition && !step.condition(state)) {
          if (step.onFailure) {
            // Skip to failure step
            const failureStep = workflow.steps.find(s => s.id === step.onFailure);
            if (failureStep) {
              continue;
            }
          }
          continue;
        }

        // Use BaseEngine's executeStep method for real implementations
        const stepExecutionResult = await this.executeStep(step, state);
        
        // Convert CallToolResult to step result format
        let stepResult: any;
        if (stepExecutionResult.isError) {
          stepResult = {
            type: step.type,
            target: step.target,
            error: stepExecutionResult.content[0]?.text || 'Unknown error',
            result: undefined,
          };
        } else {
          const resultText = stepExecutionResult.content[0]?.text || '';
          stepResult = {
            type: step.type,
            target: step.target,
            result: resultText,
          };
        }

        state.results.push({
          stepId: step.id,
          result: stepResult,
        });
        state.currentStep++;

        // Update state with step result
        Object.assign(state, stepResult);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              workflowId,
              workflowName: workflow.name,
              results: state.results,
              finalState: state,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear workflows and state
    this.workflows.clear();
    this.state.clear();
  }
}

// Export singleton instance
export const goodcounselEngine = new GoodcounselEngine();
