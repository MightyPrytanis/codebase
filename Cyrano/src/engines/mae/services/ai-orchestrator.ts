/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { apiValidator } from '../../../utils/api-validator.js';
import { aiService, AIProvider } from '../../../services/ai-service.js';
import { injectTenRulesIntoSystemPrompt } from '../../../services/ethics-prompt-injector.js';

const AIOrchestratorSchema = z.object({
  task_description: z.string().describe('Description of the task to orchestrate'),
  ai_providers: z.array(z.string()).optional().describe('AI providers to use'),
  orchestration_mode: z.enum(['sequential', 'parallel', 'collaborative']).default('collaborative'),
  parameters: z.record(z.string(), z.any()).optional().describe('Orchestration parameters'),
});

/**
 * AI Orchestrator Service
 * MAE Service for generic multi-provider orchestration (sequential, parallel, collaborative execution)
 * 
 * This service is part of the MAE (Multi-Agent Engine) and provides orchestration
 * capabilities for coordinating multiple AI providers in complex workflows.
 * 
 * Note: This extends BaseTool for MCP registration, but it's a MAE service utility class.
 */
export const aiOrchestrator = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ai_orchestrator',
      description: 'Orchestrate multiple AI providers for complex legal tasks',
      inputSchema: {
        type: 'object' as const,
        properties: {
          task_description: {
            type: 'string',
            description: 'Description of the task to orchestrate',
          },
          ai_providers: {
            type: 'array',
            items: { type: 'string' },
            description: 'AI providers to use',
          },
          orchestration_mode: {
            type: 'string',
            enum: ['sequential', 'parallel', 'collaborative'],
            default: 'collaborative',
            description: 'Mode of AI orchestration',
          },
          parameters: {
            type: 'object' as const,
            description: 'Orchestration parameters',
          },
        },
        required: ['task_description'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { task_description, ai_providers, orchestration_mode, parameters } = AIOrchestratorSchema.parse(args);
      
      // Validate API providers before orchestration
      const providersToUse = ai_providers || ['perplexity', 'openai', 'anthropic', 'google', 'xai', 'deepseek'];
      const validation = apiValidator.validateAllProviders(providersToUse);
      
      if (!validation.valid) {
        const configSummary = apiValidator.getConfigSummary();
        return this.createErrorResult(
          `AI orchestration failed - API configuration issues:\n` +
          `${validation.errors.join('\n')}\n\n` +
          `Available providers: ${configSummary.configured.join(', ') || 'none'}\n` +
          `Missing providers: ${configSummary.missing.join(', ')}\n\n` +
          `Please configure API keys in environment variables to enable AI integration.`
        );
      }
      
      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          `No AI providers configured. Please set API keys for at least one provider:\n` +
          `- PERPLEXITY_API_KEY (starts with pplx-)\n` +
          `- OPENAI_API_KEY (starts with sk-)\n` +
          `- ANTHROPIC_API_KEY (starts with sk-ant-)\n` +
          `- GEMINI_API_KEY\n` +
          `- XAI_API_KEY (starts with xai-)\n` +
          `- DEEPSEEK_API_KEY (starts with sk-)`
        );
      }
      
      // Get available providers and filter to only those that are configured
      const availableProviders = aiService.getAvailableProviders();
      const validProviders = providersToUse
        .map(p => this.normalizeProviderName(p))
        .filter(p => availableProviders.includes(p as AIProvider)) as AIProvider[];
      
      if (validProviders.length === 0) {
        return this.createErrorResult(
          `None of the requested providers are configured. Available providers: ${availableProviders.join(', ')}`
        );
      }
      
      // Execute real orchestration with actual AI calls
      const orchestration = await this.executeOrchestration(
        task_description, 
        orchestration_mode, 
        validProviders, 
        parameters
      );
      
      return this.createSuccessResult(JSON.stringify(orchestration, null, 2));
    } catch (error) {
      return this.createErrorResult(`AI orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute orchestration with real AI calls
   */
  public async executeOrchestration(
    task: string, 
    mode: string, 
    providers: AIProvider[], 
    parameters?: any
  ): Promise<any> {
    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];

    try {
      switch (mode) {
        case 'sequential':
          return await this.executeSequential(task, providers, parameters, results, errors);
        
        case 'parallel':
          return await this.executeParallel(task, providers, parameters, results, errors);
        
        case 'collaborative':
          return await this.executeCollaborative(task, providers, parameters, results, errors);
        
        default:
          return await this.executeCollaborative(task, providers, parameters, results, errors);
      }
    } catch (error) {
      return {
        metadata: {
          task_description: task,
          ai_providers: providers,
          orchestration_mode: mode,
          timestamp: new Date().toISOString(),
          parameters: parameters || {},
        },
        execution_status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        partial_results: results,
        errors: errors,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute sequential orchestration
   */
  public async executeSequential(
    task: string,
    providers: AIProvider[],
    parameters: any,
    results: any[],
    errors: any[]
  ): Promise<any> {
    let previousResult = task;
    
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const stepPrompt = i === 0 
        ? task 
        : `Based on the previous analysis: ${JSON.stringify(previousResult)}\n\nContinue with: ${task}`;
      
      try {
        let systemPrompt = this.getSystemPrompt(provider, 'sequential', i);
        systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
        const response = await aiService.call(provider, stepPrompt, {
          systemPrompt,
          temperature: parameters?.temperature || 0.7,
          maxTokens: parameters?.maxTokens || 4000,
        });
        
        const stepResult = {
          step: i + 1,
          provider: provider,
          prompt: stepPrompt,
          response: response,
          timestamp: new Date().toISOString(),
        };
        
        results.push(stepResult);
        previousResult = response;
      } catch (error) {
        errors.push({
          step: i + 1,
          provider: provider,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      metadata: {
        task_description: task,
        ai_providers: providers,
        orchestration_mode: 'sequential',
        timestamp: new Date().toISOString(),
        parameters: parameters || {},
      },
      execution_status: errors.length === 0 ? 'completed' : 'partial',
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      final_result: results[results.length - 1]?.response,
    };
  }

  /**
   * Execute parallel orchestration
   */
  public async executeParallel(
    task: string,
    providers: AIProvider[],
    parameters: any,
    results: any[],
    errors: any[]
  ): Promise<any> {
    const promises = providers.map(async (provider, index) => {
      try {
        let systemPrompt = this.getSystemPrompt(provider, 'parallel', index);
        systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
        const response = await aiService.call(provider, task, {
          systemPrompt,
          temperature: parameters?.temperature || 0.7,
          maxTokens: parameters?.maxTokens || 4000,
        });
        
        return {
          step: index + 1,
          provider: provider,
          prompt: task,
          response: response,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        errors.push({
          step: index + 1,
          provider: provider,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    });

    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults.filter(r => r !== null));

    return {
      metadata: {
        task_description: task,
        ai_providers: providers,
        orchestration_mode: 'parallel',
        timestamp: new Date().toISOString(),
        parameters: parameters || {},
      },
      execution_status: errors.length === 0 ? 'completed' : 'partial',
      results: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Execute collaborative orchestration
   */
  public async executeCollaborative(
    task: string,
    providers: AIProvider[],
    parameters: any,
    results: any[],
    errors: any[]
  ): Promise<any> {
    // Phase 1: Analysis
    const analysisProviders = providers.slice(0, Math.min(2, providers.length));
    const analysisPromises = analysisProviders.map(async (provider, index) => {
      try {
        let systemPrompt = 'You are an expert analyst. Provide a detailed analysis.';
        systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
        const response = await aiService.call(provider, `Analyze the following task: ${task}`, {
          systemPrompt,
          temperature: parameters?.temperature || 0.7,
          maxTokens: parameters?.maxTokens || 4000,
        });
        
        return {
          phase: 'analysis',
          provider: provider,
          response: response,
        };
      } catch (error) {
        errors.push({
          phase: 'analysis',
          provider: provider,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    });

    const analysisResults = await Promise.all(analysisPromises);
    const validAnalysis = analysisResults.filter(r => r !== null);
    results.push(...validAnalysis);

    // Phase 2: Verification (if we have enough providers)
    const verificationResults: any[] = [];
    if (providers.length >= 2 && validAnalysis.length > 0) {
      const verificationProvider = providers[providers.length - 1];
      const analysisSummary = validAnalysis.map(r => r.response).join('\n\n');
      
      try {
        let systemPrompt = 'You are a critical reviewer. Identify strengths and weaknesses.';
        systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
        const verification = await aiService.call(verificationProvider, 
          `Verify and critique the following analysis:\n\n${analysisSummary}`, {
          systemPrompt,
          temperature: parameters?.temperature || 0.7,
          maxTokens: parameters?.maxTokens || 4000,
        });
        
        verificationResults.push({
          phase: 'verification',
          provider: verificationProvider,
          response: verification,
        });
        results.push(...verificationResults);
      } catch (error) {
        errors.push({
          phase: 'verification',
          provider: verificationProvider,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Phase 3: Synthesis
    const synthesisProvider = providers[0];
    const allInputs = [
      ...validAnalysis.map(r => r.response),
      ...verificationResults.map(r => r.response),
    ].join('\n\n---\n\n');

    let synthesis: string | null = null;
    try {
      let systemPrompt = 'You are a synthesis expert. Combine insights into a coherent final answer.';
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
      synthesis = await aiService.call(synthesisProvider,
        `Synthesize the following analyses into a comprehensive final answer:\n\n${allInputs}\n\nOriginal task: ${task}`, {
        systemPrompt,
        temperature: parameters?.temperature || 0.7,
        maxTokens: parameters?.maxTokens || 4000,
      });
      
      results.push({
        phase: 'synthesis',
        provider: synthesisProvider,
        response: synthesis,
      });
    } catch (error) {
      errors.push({
        phase: 'synthesis',
        provider: synthesisProvider,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      metadata: {
        task_description: task,
        ai_providers: providers,
        orchestration_mode: 'collaborative',
        timestamp: new Date().toISOString(),
        parameters: parameters || {},
      },
      execution_status: errors.length === 0 ? 'completed' : 'partial',
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      final_result: synthesis,
    };
  }

  /**
   * Get system prompt for provider based on mode
   */
  public getSystemPrompt(provider: AIProvider, mode: string, step: number): string {
    const prompts: Record<string, string> = {
      'anthropic': 'You are Claude, an expert AI assistant specializing in legal analysis and reasoning.',
      'openai': 'You are GPT-4, an expert AI assistant specializing in legal research and fact-checking.',
      'perplexity': 'You are Perplexity, an expert AI assistant with real-time web search capabilities for legal research.',
      'google': 'You are Gemini, an expert AI assistant specializing in data processing and pattern recognition.',
      'xai': 'You are Grok, an expert AI assistant with a direct and insightful approach to legal analysis.',
      'deepseek': 'You are DeepSeek, an expert AI assistant specializing in comprehensive legal analysis.',
    };
    
    const basePrompt = prompts[provider] || 'You are an expert AI assistant.';
    // Ten Rules will be injected at call site
    return basePrompt;
  }

  /**
   * Normalize provider name to match AIProvider type
   */
  public normalizeProviderName(provider: string): AIProvider {
    const mapping: Record<string, AIProvider> = {
      'claude': 'anthropic',
      'anthropic': 'anthropic',
      'gpt-4': 'openai',
      'openai': 'openai',
      'perplexity': 'perplexity',
      'gemini': 'google',
      'google': 'google',
      'grok': 'xai',
      'xai': 'xai',
      'deepseek': 'deepseek',
    };
    
    const normalized = mapping[provider.toLowerCase()];
    if (!normalized) {
      throw new Error(`Unknown AI provider: ${provider}. Valid providers are: ${Object.keys(mapping).join(', ')}`);
    }
    
    return normalized;
  }

  public createOrchestrationPlan(task: string, mode: string, providers?: string[]): any {
    const availableProviders = providers || ['claude', 'gpt-4', 'gemini'];
    
    switch (mode) {
      case 'sequential':
        return this.createSequentialPlan(task, availableProviders);
      case 'parallel':
        return this.createParallelPlan(task, availableProviders);
      case 'collaborative':
        return this.createCollaborativePlan(task, availableProviders);
      default:
        return this.createCollaborativePlan(task, availableProviders);
    }
  }

  public createSequentialPlan(task: string, providers: string[]): any {
    return {
      mode: 'sequential',
      steps: providers.map((provider, index) => ({
        step: index + 1,
        provider: provider,
        task: this.getProviderTask(task, provider, index),
        dependencies: index > 0 ? [index] : [],
      })),
    };
  }

  public createParallelPlan(task: string, providers: string[]): any {
    return {
      mode: 'parallel',
      steps: providers.map((provider, index) => ({
        step: index + 1,
        provider: provider,
        task: this.getProviderTask(task, provider, index),
        dependencies: [],
        parallel: true,
      })),
    };
  }

  public createCollaborativePlan(task: string, providers: string[]): any {
    return {
      mode: 'collaborative',
      phases: [
        {
          phase: 'analysis',
          providers: providers.slice(0, 2),
          task: `Analyze: ${task}`,
        },
        {
          phase: 'verification',
          providers: providers.slice(1, 3),
          task: `Verify analysis results`,
        },
        {
          phase: 'synthesis',
          providers: providers,
          task: `Synthesize final result`,
        },
      ],
    };
  }

  public getProviderTask(task: string, provider: string, index: number): string {
    const providerTasks: Record<string, string[]> = {
      claude: ['Deep analysis', 'Legal reasoning', 'Compliance checking'],
      'gpt-4': ['Fact checking', 'Research', 'Drafting'],
      gemini: ['Data processing', 'Pattern recognition', 'Quality assessment'],
    };

    const tasks = providerTasks[provider] || ['General processing'];
    return tasks[index % tasks.length];
  }

  public estimateDuration(task: string, mode: string): string {
    const baseMinutes = task.length > 1000 ? 10 : 5;
    
    switch (mode) {
      case 'sequential':
        return `${baseMinutes * 2}-${baseMinutes * 3} minutes`;
      case 'parallel':
        return `${baseMinutes}-${baseMinutes * 2} minutes`;
      case 'collaborative':
        return `${baseMinutes * 1.5}-${baseMinutes * 2.5} minutes`;
      default:
        return `${baseMinutes}-${baseMinutes * 2} minutes`;
    }
  }

  public calculateResourceRequirements(task: string, providers?: string[]): any {
    const providerCount = providers?.length || 3;
    const taskComplexity = this.assessTaskComplexity(task);
    
    return {
      ai_calls_estimated: providerCount * (taskComplexity === 'high' ? 3 : 2),
      processing_time_estimated: taskComplexity === 'high' ? '10-15 minutes' : '5-10 minutes',
      memory_requirements: 'moderate',
      api_quota_usage: 'low',
    };
  }

  public assessTaskComplexity(task: string): string {
    const complexityIndicators = [
      'complex', 'comprehensive', 'detailed', 'thorough', 'extensive',
      'multiple', 'various', 'different', 'several', 'numerous'
    ];
    
    const indicatorCount = complexityIndicators.filter(indicator => 
      task.toLowerCase().includes(indicator)
    ).length;
    
    if (indicatorCount >= 3) return 'high';
    if (indicatorCount >= 1) return 'medium';
    return 'low';
  }
})();

)
}
}
}
}
)
}
}
}
}
)
}
}
}
}
}
}