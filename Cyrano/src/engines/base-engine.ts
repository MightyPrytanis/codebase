/**
 * Base Engine Class
 * 
 * Engines are higher-level orchestrators that coordinate multiple modules
 * and possibly multiple AI models or agents. They deliver mission-critical,
 * core app logic (e.g., compliance, legal strategy, multi-stage automation).
 * 
 * Engines aggregate and/or orchestrate modules (and when appropriate,
 * individual primitives) for the performance of core/mission-critical
 * functions of an app.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../modules/base-module.js';
import { BaseTool } from '../tools/base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { moduleRegistry } from '../modules/registry.js';
import { systemicEthicsService } from '../services/systemic-ethics-service.js';
import { responsibilityService } from '../services/responsibility-service.js';
import { logicAuditService } from '../services/logic-audit-service.js';

export interface EngineConfig {
  name: string;
  description: string;
  version: string;
  modules?: string[]; // Module names to orchestrate
  tools?: BaseTool[]; // Direct tools (if needed)
  aiProviders?: string[]; // AI providers this engine uses
  expertiseContext?: {
    skillId?: string;
    domain?: string;
    proficiency?: string[];
  };
}

export interface WorkflowStep {
  id: string;
  type: 'module' | 'tool' | 'ai' | 'condition' | 'engine';
  target: string; // Module name, tool name, AI provider, or engine name
  input?: any;
  condition?: (context: any) => boolean;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  initialState?: any;
}

export abstract class BaseEngine {
  protected config: EngineConfig;
  protected modules: Map<string, BaseModule>;
  protected tools: Map<string, BaseTool>;
  protected workflows: Map<string, Workflow>;
  protected state: Map<string, any>;

  constructor(config: EngineConfig) {
    this.config = config;
    this.modules = new Map();
    this.tools = new Map();
    this.workflows = new Map();
    this.state = new Map();

    // Load modules from registry
    if (config.modules) {
      config.modules.forEach(moduleName => {
        const module = moduleRegistry.get(moduleName);
        if (module) {
          this.modules.set(moduleName, module);
        }
      });
    }

    // Register provided tools
    if (config.tools) {
      config.tools.forEach(tool => {
        const definition = tool.getToolDefinition();
        this.tools.set(definition.name, tool);
      });
    }
  }

  /**
   * Initialize the engine
   * Set up modules, connections, etc.
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute engine functionality
   * Main entry point for engine operations
   */
  abstract execute(input: any): Promise<CallToolResult>;

  /**
   * Get engine metadata
   */
  getEngineInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      version: this.config.version,
      moduleCount: this.modules.size,
      toolCount: this.tools.size,
      workflowCount: this.workflows.size,
      aiProviders: this.config.aiProviders || [],
    };
  }

  /**
   * Get all modules in this engine
   */
  getModules(): BaseModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get a specific module by name
   */
  getModule(name: string): BaseModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Register a module
   */
  registerModule(module: BaseModule): void {
    const info = module.getModuleInfo();
    this.modules.set(info.name, module);
  }

  /**
   * Get all tools in this engine
   */
  getTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Register a tool
   */
  registerTool(tool: BaseTool): void {
    const definition = tool.getToolDefinition();
    this.tools.set(definition.name, tool);
  }

  /**
   * Get available workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Get a specific workflow
   */
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Execute a workflow
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

    const context = {
      ...workflow.initialState,
      ...input,
      stepResults: {},
    };

    let currentStepId: string | undefined = workflow.steps[0]?.id;
    const executedSteps = new Set<string>();

    while (currentStepId) {
      if (executedSteps.has(currentStepId)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Circular workflow detected at step ${currentStepId}`,
            },
          ],
          isError: true,
        };
      }

      executedSteps.add(currentStepId);
      const step = workflow.steps.find(s => s.id === currentStepId);

      if (!step) {
        break;
      }

      try {
        const result = await this.executeStep(step, context);
        context.stepResults[step.id] = result;

        if (result.isError) {
          // Capture reasoning state on failure
          await logicAuditService.capture({
            timestamp: new Date().toISOString(),
            engine: this.config.name,
            stepId: step.id,
            input: step.input || context,
            error: this.extractText(result),
            metadata: { workflowId },
          });
          currentStepId = step.onFailure || undefined;
        } else {
          // If onSuccess is not defined, automatically proceed to next step in sequence
          if (step.onSuccess) {
            currentStepId = step.onSuccess;
          } else {
            // Find current step index and get next step
            const currentIndex = workflow.steps.findIndex(s => s.id === currentStepId);
            const nextStep = workflow.steps[currentIndex + 1];
            currentStepId = nextStep?.id || undefined;
          }
        }
      } catch (error) {
        await logicAuditService.capture({
          timestamp: new Date().toISOString(),
          engine: this.config.name,
          stepId: step.id,
          input: step.input || context,
          error: error instanceof Error ? error.message : String(error),
          metadata: { workflowId },
        });
        return {
          content: [
            {
              type: 'text',
              text: `Error executing workflow step ${step.id}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    // Ethics check: Ensure workflow results comply with Ten Rules
    const workflowResult = context.stepResults;
    const resultText = JSON.stringify(workflowResult, null, 2);
    
    // Check if this workflow generates recommendations or content that needs ethics review
    const hasRecommendations = resultText.toLowerCase().includes('recommendation') || 
                              resultText.toLowerCase().includes('suggestion') ||
                              resultText.toLowerCase().includes('guidance');
    
    if (hasRecommendations) {
      const { checkGeneratedContent } = await import('../services/ethics-check-helper.js');
      const ethicsCheck = await checkGeneratedContent(resultText, {
        toolName: `${this.config.name}_workflow`,
        contentType: 'report',
        strictMode: true,
      });

      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return {
          content: [
            {
              type: 'text',
              text: 'Workflow result blocked by ethics check. Does not meet Ten Rules compliance standards.',
            },
          ],
          isError: true,
          metadata: { ethicsCheck: ethicsCheck.ethicsCheck },
        };
      }

      // Add ethics metadata if warnings
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
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(workflowResult, null, 2),
        },
      ],
    };
  }

  /**
   * Execute a workflow step
   */
  protected async executeStep(step: WorkflowStep, context: any): Promise<CallToolResult> {
    switch (step.type) {
      case 'module':
        const module = this.modules.get(step.target);
        if (!module) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Module ${step.target} not found`,
              },
            ],
            isError: true,
          };
        }
        // Merge step.input with context to ensure context variables are available
        // Empty objects are truthy, so we need to check if step.input exists and merge properly
        const moduleInput = step.input !== undefined 
          ? { ...context, ...step.input }
          : context;
        return await module.execute(moduleInput);

      case 'tool':
        // Execute tool by name
        try {
          // Try to get tool from registry first
          const tool = this.tools.get(step.target);
          if (tool) {
            // Merge step.input with context to ensure context variables are available
            // Empty objects are truthy, so we need to check if step.input exists and merge properly
            const toolInput = step.input !== undefined 
              ? { ...context, ...step.input }
              : context;
            return await tool.execute(toolInput);
          }

          // If not in registry, try to import and execute directly
          // This allows engines to use tools that aren't in their registry
          // For now, return error - tools should be registered
          return {
            content: [
              {
                type: 'text',
                text: `Error: Tool ${step.target} not found in engine tool registry`,
              },
            ],
            isError: true,
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }

      case 'condition':
        if (step.condition) {
          const result = step.condition(context);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ condition: result }),
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Condition function not provided',
            },
          ],
          isError: true,
        };

      case 'ai':
        // Execute AI provider call with auto-select support
        try {
          const { AIService } = await import('../services/ai-service.js');
          type AIProvider = 'openai' | 'anthropic' | 'perplexity' | 'google' | 'xai' | 'deepseek' | 'openrouter';
          const { aiProviderSelector } = await import('../services/ai-provider-selector.js');
          const aiService = new AIService();
          
          // Extract prompt from step input
          const prompt = step.input?.prompt || step.input?.message || JSON.stringify(step.input);
          const providerOrAuto = step.target as AIProvider | 'auto';
          
          // Resolve provider (handle 'auto' mode)
          let provider: AIProvider;
          
          if (providerOrAuto === 'auto') {
            // Use auto-select based on task profile
            const taskProfile = {
              taskType: step.input?.taskType || 'general',
              subjectMatter: step.input?.subjectMatter,
              complexity: step.input?.complexity,
              requiresRealTimeData: step.input?.requiresRealTimeData,
              requiresCodeGeneration: step.input?.requiresCodeGeneration,
              requiresLongContext: step.input?.requiresLongContext,
              requiresSafety: step.input?.requiresSafety,
              preferredProvider: 'auto' as const,
              balanceQualitySpeed: step.input?.balanceQualitySpeed || 'balanced',
            };
            
            provider = aiProviderSelector.getProviderForTask(taskProfile);
          } else {
            provider = providerOrAuto as AIProvider;
          }
          
          // Check if provider is available
          if (!aiService.isProviderAvailable(provider)) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: `AI provider ${provider} is not configured`,
                    availableProviders: aiService.getAvailableProviders(),
                    message: 'Please configure API keys in environment variables',
                  }, null, 2),
                },
              ],
              isError: true,
            };
          }

          // Inject Ten Rules into system prompt
          let systemPrompt = step.input?.systemPrompt || '';
          if (systemPrompt || !step.input?.systemPrompt) {
            const { injectTenRulesIntoSystemPrompt } = await import('../services/ethics-prompt-injector.js');
            systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt || 'You are an expert AI assistant.', 'summary');
          }

          // Make AI call
          // Note: BaseEngine already injects Ten Rules and checks outputs, so skip duplicate checks in ai-service
          const aiResponse = await aiService.call(provider, prompt, {
            model: step.input?.model,
            maxTokens: step.input?.maxTokens,
            temperature: step.input?.temperature,
            systemPrompt, // Already has Ten Rules injected
            metadata: {
              toolName: step.id,
              engine: this.config.name,
              actionType: 'content_generation',
              skipEthicsCheck: true, // BaseEngine handles ethics checks separately
            },
          });

          // Extract actual AI response text for ethics checks
          // aiResponse is the actual text content, not a wrapper object
          const aiResponseText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);

          // Systemic ethics check on output (check actual AI response, not wrapper)
          const ethicsCheck = await systemicEthicsService.checkOutput(aiResponseText);
          if (ethicsCheck.blocked) {
            await logicAuditService.capture({
              timestamp: new Date().toISOString(),
              engine: this.config.name,
              stepId: step.id,
              input: step.input || context,
              error: 'Systemic ethics blocked output',
              metadata: ethicsCheck.details,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Output blocked by systemic ethics service. See metadata for details.',
                },
              ],
              isError: true,
              metadata: { ethicsCheck },
            };
          }

          // Professional duty check (if facts provided)
          // Check actual AI response, not wrapper
          if (step.input?.facts) {
            const dutyCheck = await responsibilityService.checkOutput(aiResponseText, step.input.facts);
            if (dutyCheck.blocked) {
              await logicAuditService.capture({
                timestamp: new Date().toISOString(),
                engine: this.config.name,
                stepId: step.id,
                input: step.input || context,
                error: 'Professional duty check failed',
                metadata: dutyCheck.details,
              });
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Output blocked by professional responsibility service.',
                  },
                ],
                isError: true,
                metadata: { dutyCheck },
              };
            }
          }

          // Create response wrapper for return value (after ethics checks pass)
          const responseText = JSON.stringify({
            response: aiResponse,
            provider: provider, // Include which provider was used
            wasAutoSelected: providerOrAuto === 'auto',
          }, null, 2);

          return {
            content: [
              {
                type: 'text',
                text: responseText,
              },
            ],
            metadata: {
              provider,
              wasAutoSelected: providerOrAuto === 'auto',
              ethicsWarnings: ethicsCheck.warnings,
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `AI execution failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Unknown step type ${step.type}`,
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Get engine state
   */
  getState(key?: string): any {
    if (key) {
      return this.state.get(key);
    }
    return Object.fromEntries(this.state);
  }

  /**
   * Extract first text content from CallToolResult
   */
  protected extractText(result: CallToolResult): string {
    const first = result.content?.[0];
    if (first && first.type === 'text' && 'text' in first) {
      return first.text;
    }
    return '';
  }

  /**
   * Set engine state
   */
  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;
}

