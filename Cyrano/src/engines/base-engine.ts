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

export interface EngineConfig {
  name: string;
  description: string;
  version: string;
  modules?: string[]; // Module names to orchestrate
  tools?: BaseTool[]; // Direct tools (if needed)
  aiProviders?: string[]; // AI providers this engine uses
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.stepResults, null, 2),
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
        return await module.execute(step.input || context);

      case 'tool':
        // Execute tool by name
        try {
          // Try to get tool from registry first
          const tool = this.tools.get(step.target);
          if (tool) {
            return await tool.execute(step.input || context);
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
          const { aiProviderSelector } = await import('../services/ai-provider-selector.js');
          const aiService = new AIService();
          
          // Extract prompt from step input
          const prompt = step.input?.prompt || step.input?.message || JSON.stringify(step.input);
          const providerOrAuto = step.target as 'openai' | 'anthropic' | 'perplexity' | 'google' | 'xai' | 'deepseek' | 'auto';
          
          // Resolve provider (handle 'auto' mode)
          let provider: 'openai' | 'anthropic' | 'perplexity' | 'google' | 'xai' | 'deepseek';
          
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
            provider = providerOrAuto;
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

          // Make AI call
          const aiResponse = await aiService.call(provider, prompt, {
            model: step.input?.model,
            maxTokens: step.input?.maxTokens,
            temperature: step.input?.temperature,
            systemPrompt: step.input?.systemPrompt,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  response: aiResponse,
                  provider: provider, // Include which provider was used
                  wasAutoSelected: providerOrAuto === 'auto',
                }, null, 2),
              },
            ],
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

