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
import { ethicsRulesService } from './services/ethics-rules-service.js';
import { wellnessJournalTool } from '../../tools/wellness-journal.js';
import { wellness } from '../../services/wellness-service.js';

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
      // aiProviders removed - default to 'auto' (all providers available) for user sovereignty
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
                text: JSON.stringify(workflows.map(w => ({
                  id: w.id,
                  name: w.name,
                  description: w.description,
                  step_count: w.steps.length,
                })), null, 2),
              },
            ],
            isError: false,
          };

        case 'wellness_check':
          return await this.executeWorkflow('wellness_check', {
            userId: parsed.userId,
            ...(parsed.input && typeof parsed.input === 'object' ? parsed.input : {}),
          });

        // Wellness actions - delegate to wellness_journal tool
        case 'wellness_journal': {
          // Convert userId from string to number if provided
          const userIdNum = parsed.userId ? parseInt(parsed.userId, 10) : undefined;
          if (!userIdNum || isNaN(userIdNum)) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: userId is required and must be a valid number for wellness_journal action',
                },
              ],
              isError: true,
            };
          }

          // Extract action parameters from input
          const journalAction = parsed.input?.action || 'get_entries';
          const journalInput = {
            action: journalAction,
            userId: userIdNum,
            entryId: parsed.input?.entryId,
            content: parsed.input?.content,
            mood: parsed.input?.mood,
            tags: parsed.input?.tags,
            audioData: parsed.input?.audioData,
            period: parsed.input?.period,
            timeframe: parsed.input?.timeframe,
          };

          return await wellnessJournalTool.execute(journalInput);
        }

        case 'wellness_trends': {
          // Convert userId from string to number if provided
          const userIdNum = parsed.userId ? parseInt(parsed.userId, 10) : undefined;
          if (!userIdNum || isNaN(userIdNum)) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: userId is required and must be a valid number for wellness_trends action',
                },
              ],
              isError: true,
            };
          }

          // Get trends via wellness service
          const period = parsed.input?.period || 'month';
          const trends = await wellness.getWellnessTrends(userIdNum, period);
          
          if (!trends) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'No trends data available. Start journaling to generate trends.',
                    period,
                  }, null, 2),
                },
              ],
              isError: false,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(trends, null, 2),
              },
            ],
            isError: false,
          };
        }

        case 'burnout_check': {
          // Convert userId from string to number if provided
          const userIdNum = parsed.userId ? parseInt(parsed.userId, 10) : undefined;
          if (!userIdNum || isNaN(userIdNum)) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: userId is required and must be a valid number for burnout_check action',
                },
              ],
              isError: true,
            };
          }

          // Check burnout risk via wellness service
          const timeframe = parsed.input?.timeframe || 'month';
          const analysis = await wellness.detectBurnoutSignals(userIdNum, timeframe);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(analysis, null, 2),
              },
            ],
            isError: false,
            metadata: {
              riskLevel: analysis.risk,
            },
          };
        }

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
            error: (stepExecutionResult.content[0] && stepExecutionResult.content[0].type === 'text' && 'text' in stepExecutionResult.content[0]) ? stepExecutionResult.content[0].text : 'Unknown error',
            result: undefined,
          };
        } else {
          const resultText = (stepExecutionResult.content[0] && stepExecutionResult.content[0].type === 'text' && 'text' in stepExecutionResult.content[0]) ? stepExecutionResult.content[0].text : '';
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

      // Ethics check: Ensure guidance/results comply with Ten Rules
      const { checkGeneratedContent } = await import('../../services/ethics-check-helper.js');
      const workflowResult = {
        success: true,
        workflowId,
        workflowName: workflow.name,
        results: state.results,
        finalState: state,
      };
      
      const resultText = JSON.stringify(workflowResult, null, 2);
      const ethicsCheck = await checkGeneratedContent(resultText, {
        toolName: `goodcounsel_${workflowId}`,
        contentType: 'report',
        strictMode: true,
      });

      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return {
          content: [
            {
              type: 'text',
              text: 'Guidance blocked by ethics check. Does not meet Ten Rules compliance standards.',
            },
          ],
          isError: true,
        };
      }

      // Add ethics metadata
      const finalResult = {
        ...workflowResult,
        ...(ethicsCheck.ethicsCheck.warnings.length > 0 && {
          _ethicsMetadata: {
            reviewed: true,
            warnings: ethicsCheck.ethicsCheck.warnings,
            complianceScore: ethicsCheck.ethicsCheck.complianceScore,
            auditId: ethicsCheck.ethicsCheck.auditId,
          },
        }),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(finalResult, null, 2),
          },
        ],
        metadata: {
          ethicsReviewed: true,
          ethicsComplianceScore: ethicsCheck.ethicsCheck.complianceScore,
        },
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
