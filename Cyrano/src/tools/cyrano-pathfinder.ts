/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai-service.js';
import { apiValidator } from '../utils/api-validator.js';
import { ragQuery } from './rag-query.js';
import { workflowManager } from './workflow-manager.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';
import {
  arkiverTextProcessor,
  arkiverEmailProcessor,
  arkiverEntityProcessor,
  arkiverInsightProcessor,
  arkiverTimelineProcessor,
} from './arkiver-processor-tools.js';
import { skillExecutor } from './skill-executor.js';
import { skillRegistry } from '../skills/skill-registry.js';
import { betaTestSupport } from './beta-test-support.js';

const CyranoPathfinderSchema = z.object({
  message: z.string().describe('User message to the Cyrano Pathfinder'),
  context: z.record(z.string(), z.any()).optional().describe('Optional context (app, page, matter, document, etc.)'),
  model: z.enum(['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek'])
    .default('perplexity')
    .describe('AI model to use (default: perplexity)'),
  app: z.enum(['lexfiat', 'arkiver']).optional().describe('Application context (LexFiat or Arkiver)'),
  mode: z.enum(['guide', 'execute'])
    .default('guide')
    .describe('Mode: "guide" for Q&A only, "execute" to call MCP tools when needed'),
});

export const cyranoPathfinder = new (class extends BaseTool {
  // Track telemetry
  public telemetryLog: Array<{
    timestamp: string;
    provider: AIProvider;
    app?: string;
    mode: string;
    toolsCalled?: string[];
    success: boolean;
    error?: string;
  }> = [];

  getToolDefinition() {
    return {
      name: 'cyrano_pathfinder',
      description: `The Cyrano Pathfinder - Unified chat interface for MCP server that helps users navigate and operate LexFiat and Arkiver applications.

Features:
- Guided Q&A and workflow navigation
- Cross-app tool orchestration
- RAG-enhanced responses with source attribution
- Model selection (Perplexity default, or Anthropic, OpenAI, Google, XAI, DeepSeek)
- Two modes: "guide" (Q&A only) and "execute" (calls MCP tools when actions are requested)

The Cyrano Pathfinder is the autonomous assistant of the Cyrano MCP server, providing transparent and truthful guidance while preferring tool usage for actions.`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          message: {
            type: 'string',
            description: 'User message to the Cyrano Pathfinder',
          },
          context: {
            type: 'object' as const,
            description: 'Optional context (app, page, matter, document, user role, etc.)',
          },
          model: {
            type: 'string',
            enum: ['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek'],
            default: 'perplexity',
            description: 'AI model to use (default: perplexity)',
          },
          app: {
            type: 'string',
            enum: ['lexfiat', 'arkiver'],
            description: 'Application context (LexFiat or Arkiver)',
          },
          mode: {
            type: 'string',
            enum: ['guide', 'execute'],
            default: 'guide',
            description: 'Mode: "guide" for Q&A only, "execute" to call MCP tools when needed',
          },
        },
        required: ['message'],
      },
    };
  }

  async execute(args: any) {
    const startTime = Date.now();
    const toolsCalled: string[] = [];
    
    try {
      const { message, context, model, app, mode } = CyranoPathfinderSchema.parse(args);

      // Validate provider availability
      const validation = apiValidator.validateProvider(model);
      if (!validation.valid) {
        const availableProviders = apiValidator.getAvailableProviders();
        
        // Log telemetry for failure
        this.logTelemetry(model, app, mode, toolsCalled, false, validation.error);
        
        return this.createErrorResult(
          `AI provider "${model}" is not configured.\n\n` +
          `Available providers: ${availableProviders.length > 0 ? availableProviders.join(', ') : 'none'}\n\n` +
          `Please configure API keys in environment variables:\n` +
          `- PERPLEXITY_API_KEY (starts with pplx-)\n` +
          `- ANTHROPIC_API_KEY (starts with sk-ant-)\n` +
          `- OPENAI_API_KEY (starts with sk-)\n` +
          `- GEMINI_API_KEY or GOOGLE_API_KEY\n` +
          `- XAI_API_KEY (starts with xai-)\n` +
          `- DEEPSEEK_API_KEY (starts with sk-)\n\n` +
          `Error: ${validation.error}`
        );
      }

      // Build system prompt with Cyrano Pathfinder branding
      let systemPrompt = this.buildSystemPrompt(app, mode, context);
      
      // Inject Ten Rules into system prompt
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');

      // Build full prompt with context
      const fullPrompt = this.buildPrompt(message, context, mode);

      // In execute mode, check if the message implies an action
      let response: string;
      if (mode === 'execute' && this.shouldExecuteTools(message)) {
        // Try to execute tools based on the user's request
        response = await this.executeWithTools(message, context, model, systemPrompt, toolsCalled);
      } else {
        // Guide mode or no tools needed - just answer the question
        response = await aiService.call(model, fullPrompt, {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 4000,
        });
      }

      // Log successful telemetry
      this.logTelemetry(model, app, mode, toolsCalled, true);

      return this.createSuccessResult(
        JSON.stringify({
          response,
          metadata: {
            model,
            app,
            mode,
            toolsCalled: toolsCalled.length > 0 ? toolsCalled : undefined,
            executionTimeMs: Date.now() - startTime,
          },
        }, null, 2)
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log telemetry for error
      const { model, app, mode } = args;
      this.logTelemetry(model || 'perplexity', app, mode || 'guide', toolsCalled, false, errorMessage);

      // Check for rate limit errors
      if (this.isRateLimitError(errorMessage)) {
        return this.createErrorResult(
          `🚦 Rate limit reached for the selected AI provider.\n\n` +
          `Please try again in a few moments, or switch to a different model in the chat settings.\n\n` +
          `Tip: Each AI provider has different rate limits. Consider upgrading your API plan if you frequently hit limits.`
        );
      }

      return this.createErrorResult(
        `Cyrano Pathfinder error: ${errorMessage}\n\n` +
        `If this issue persists, please try:\n` +
        `1. Switching to a different AI model\n` +
        `2. Checking your API key configuration\n` +
        `3. Verifying your network connection`
      );
    }
  }

  /**
   * Build the Cyrano Pathfinder system prompt
   */
  public buildSystemPrompt(app?: string, mode?: string, context?: any): string {
    const appName = app === 'lexfiat' ? 'LexFiat' : app === 'arkiver' ? 'Arkiver' : 'the Cyrano ecosystem';
    
    let prompt = `You are the Cyrano Pathfinder, the autonomous assistant of the Cyrano Model Context Protocol (MCP) server.

Your mission: Help users navigate and operate ${appName}. Be transparent, truthful, and explicit about your capabilities and limitations.

Key principles:
1. **Tool Preference**: When users request actions, prefer using available MCP tools/modules/engines over just describing what to do.
2. **Autonomous Expertise**: Automatically identify and apply relevant expertise modules (skills) when they match user requests. Skills are invisible to users - they are automatically selected and executed based on the task at hand.
3. **Source Attribution**: Always cite sources when you retrieve information from RAG or other tools.
4. **Transparency**: Be clear about which AI model you are using and what tools you're calling.
5. **User Guidance**: Provide clear, concise guidance for navigating workflows and features.
6. **Error Clarity**: If something goes wrong, explain it clearly and suggest alternatives.

Current mode: ${mode === 'execute' ? 'EXECUTE (can call tools)' : 'GUIDE (Q&A only)'}`;

    if (context) {
      prompt += `\n\nContext provided:`;
      if (context.page) prompt += `\n- Current page: ${context.page}`;
      if (context.matter) prompt += `\n- Current matter: ${context.matter}`;
      if (context.document) prompt += `\n- Current document: ${context.document}`;
      if (context.userRole) prompt += `\n- User role: ${context.userRole}`;
    }

    return prompt;
  }

  /**
   * Build the full prompt with message and context
   */
  public buildPrompt(message: string, context?: any, mode?: string): string {
    let prompt = message;

    if (context && Object.keys(context).length > 0) {
      prompt += `\n\n[Context: ${JSON.stringify(context)}]`;
    }

    if (mode === 'execute') {
      prompt += `\n\n[Note: You can call MCP tools if this request requires an action. Available tools include: rag_query, workflow_manager, arkiver processors, and more.]`;
    }

    return prompt;
  }

  /**
   * Check if the message should trigger tool execution
   */
  public shouldExecuteTools(message: string): boolean {
    const actionKeywords = [
      'search', 'find', 'query', 'retrieve', 'get', 'show me',
      'analyze', 'process', 'extract', 'run', 'execute',
      'start', 'create', 'generate', 'draft', 'build',
      'compare', 'check', 'verify', 'validate',
    ];

    const lowerMessage = message.toLowerCase();
    return actionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Find relevant skills for a user query (autonomous skill selection)
   */
  async findRelevantSkills(message: string, context: any): Promise<any[]> {
    try {
      const allSkills = skillRegistry.getAll();
      if (allSkills.length === 0) return [];

      // Build skill catalog for AI selection
      const skillCatalog = allSkills.map(skill => ({
        id: skill.skill.skillId,
        name: skill.frontmatter.name,
        description: skill.frontmatter.description,
        domain: skill.frontmatter.domain,
        proficiency: skill.frontmatter.proficiency || [],
        usage_policy: skill.frontmatter.usage_policy,
      }));

      // Use AI to identify relevant skills
      const skillSelectionPrompt = `User request: "${message}"\n\nContext: ${JSON.stringify(context || {})}\n\nAvailable skills/expertise modules:\n${JSON.stringify(skillCatalog, null, 2)}\n\nWhich skills are relevant to this request? Respond with JSON: {"skills": [{"id": "skill_id", "reasoning": "why this skill is relevant", "confidence": 0.0-1.0}], "reasoning": "overall assessment"}`;

      const { aiService } = await import('../services/ai-service.js');
      const selectionResponse = await aiService.call('perplexity', skillSelectionPrompt, {
        systemPrompt: 'You are identifying relevant expertise modules (skills) for user requests. Return valid JSON only.',
        temperature: 0.3,
        maxTokens: 2000,
      });

      // Parse skill selection
      try {
        const jsonMatch = selectionResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const selection = JSON.parse(jsonMatch[0]);
          if (selection.skills && Array.isArray(selection.skills)) {
            // Filter by confidence threshold (0.6) and return top matches
            return selection.skills
              .filter((s: any) => s.confidence >= 0.6)
              .sort((a: any, b: any) => b.confidence - a.confidence)
              .slice(0, 3); // Top 3 most relevant skills
          }
        }
      } catch (parseError) {
        // Fall back to keyword-based matching
        return this.heuristicSkillSelection(message, allSkills);
      }

      return [];
    } catch (error) {
      // Fall back to heuristic selection
      return this.heuristicSkillSelection(message, skillRegistry.getAll());
    }
  }

  /**
   * Heuristic-based skill selection when AI selection fails
   */
  heuristicSkillSelection(message: string, skills: any[]): any[] {
    const lowerMessage = message.toLowerCase();
    const relevantSkills: any[] = [];

    for (const skill of skills) {
      const skillText = `${skill.frontmatter.name} ${skill.frontmatter.description} ${(skill.frontmatter.proficiency || []).join(' ')}`.toLowerCase();
      
      // Check for keyword matches
      const keywords = lowerMessage.split(/\s+/);
      const matches = keywords.filter(k => skillText.includes(k)).length;
      
      if (matches > 0) {
        relevantSkills.push({
          id: skill.skill.skillId,
          confidence: matches / keywords.length,
        });
      }
    }

    return relevantSkills
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Execute with tools based on the user's request
   */
  public async executeWithTools(
    message: string,
    context: any,
    model: AIProvider,
    systemPrompt: string,
    toolsCalled: string[]
  ): Promise<string> {
    // AUTONOMOUS SKILL SELECTION: Find relevant skills/expertise modules
    const relevantSkills = await this.findRelevantSkills(message, context);
    
    // Build available tools list including skills
    let availableToolsList = `- rag_query: Query document database\n- workflow_manager: Execute workflows\n- arkiver_text_processor: Extract text from documents\n- arkiver_email_processor: Process emails\n- arkiver_entity_processor: Extract entities\n- arkiver_timeline_processor: Create timelines\n- skill_executor: Execute expertise modules (skills)\n- beta_test_support: Beta test support (registration, onboarding, installation, feedback, troubleshooting)`;
    
    if (relevantSkills.length > 0) {
      availableToolsList += `\n\nRelevant expertise modules (skills) automatically identified:\n${relevantSkills.map((s: any) => `- ${s.id} (confidence: ${(s.confidence || 0).toFixed(2)})`).join('\n')}`;
    }

    // First, ask the AI what tools to use
    const planningPrompt = `User request: "${message}"\n\nContext: ${JSON.stringify(context || {})}\n\nWhat MCP tools should be called to fulfill this request? Available tools:\n${availableToolsList}\n\nIf relevant skills are identified above, consider using skill_executor with the appropriate skill_id. Respond with JSON: {"tools": [{"name": "tool_name", "args": {...}}], "reasoning": "why these tools"}`;

    const planResponse = await aiService.call(model, planningPrompt, {
      systemPrompt: systemPrompt + '\n\nYou are planning tool execution. Return valid JSON only.',
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Try to parse the tool plan
    let toolPlan: any;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        toolPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      // If planning fails, fall back to heuristic-based tool selection
      toolPlan = this.heuristicToolSelection(message, context);
    }

    // Execute the planned tools
    const toolResults: any[] = [];
    
    if (toolPlan.tools && Array.isArray(toolPlan.tools)) {
      for (const tool of toolPlan.tools) {
        try {
          const result = await this.callTool(tool.name, tool.args);
          toolResults.push({
            tool: tool.name,
            success: true,
            result,
          });
          toolsCalled.push(tool.name);
        } catch (error) {
          toolResults.push({
            tool: tool.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Now synthesize the final response with tool results
    const synthesisPrompt = `User request: "${message}"\n\nTools executed:\n${JSON.stringify(toolResults, null, 2)}\n\nProvide a clear, helpful response to the user based on these tool results. Include source citations where applicable.`;

    const finalResponse = await aiService.call(model, synthesisPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    return finalResponse;
  }

  /**
   * Heuristic-based tool selection when AI planning fails
   */
  public heuristicToolSelection(message: string, context: any): any {
    const lowerMessage = message.toLowerCase();
    const tools: any[] = [];

    // Check for RAG query keywords
    if (lowerMessage.match(/search|find|query|retrieve|what|who|when|where|document/)) {
      tools.push({
        name: 'rag_query',
        args: {
          action: 'query',
          query: message,
          topK: 5,
        },
      });
    }

    // Check for workflow keywords
    if (lowerMessage.match(/workflow|process|execute|run|start/)) {
      tools.push({
        name: 'workflow_manager',
        args: {
          action: 'execute',
          workflow_type: 'custom',
        },
      });
    }

    return {
      tools,
      reasoning: 'Heuristic-based tool selection',
    };
  }

  /**
   * Call a specific MCP tool
   */
  public async callTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'rag_query':
        return await ragQuery.execute(args);
      
      case 'workflow_manager':
        return await workflowManager.execute(args);
      
      case 'arkiver_text_processor':
        return await arkiverTextProcessor.execute(args);
      
      case 'arkiver_email_processor':
        return await arkiverEmailProcessor.execute(args);
      
      case 'arkiver_entity_processor':
        return await arkiverEntityProcessor.execute(args);
      
      case 'arkiver_insight_processor':
        return await arkiverInsightProcessor.execute(args);
      
      case 'arkiver_timeline_processor':
        return await arkiverTimelineProcessor.execute(args);
      
      case 'skill_executor':
        return await skillExecutor.execute(args);
      
      case 'beta_test_support':
        return await betaTestSupport.execute(args);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Check if an error is a rate limit error
   */
  public isRateLimitError(errorMessage: string): boolean {
    const rateLimitKeywords = [
      'rate limit',
      'rate_limit',
      'too many requests',
      '429',
      'quota exceeded',
      'quota_exceeded',
    ];

    const lowerError = errorMessage.toLowerCase();
    return rateLimitKeywords.some(keyword => lowerError.includes(keyword));
  }

  /**
   * Log telemetry for provider choices and tool calls
   */
  public logTelemetry(
    provider: AIProvider,
    app: string | undefined,
    mode: string,
    toolsCalled: string[],
    success: boolean,
    error?: string
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      provider,
      app,
      mode,
      toolsCalled: toolsCalled.length > 0 ? toolsCalled : undefined,
      success,
      error,
    };

    this.telemetryLog.push(entry);

    // Keep only last 1000 entries to prevent memory leak
    if (this.telemetryLog.length > 1000) {
      this.telemetryLog.shift();
    }

    // Log to console for debugging (can be replaced with proper logging service)
    console.log('[Cyrano Pathfinder Telemetry]', JSON.stringify(entry));
  }

  /**
   * Get telemetry statistics
   */
  public getTelemetryStats(): any {
    const stats = {
      totalCalls: this.telemetryLog.length,
      successRate: 0,
      providerUsage: {} as Record<string, number>,
      appUsage: {} as Record<string, number>,
      modeUsage: {} as Record<string, number>,
      toolUsage: {} as Record<string, number>,
    };

    let successCount = 0;

    for (const entry of this.telemetryLog) {
      if (entry.success) successCount++;

      // Count provider usage
      stats.providerUsage[entry.provider] = (stats.providerUsage[entry.provider] || 0) + 1;

      // Count app usage
      if (entry.app) {
        stats.appUsage[entry.app] = (stats.appUsage[entry.app] || 0) + 1;
      }

      // Count mode usage
      stats.modeUsage[entry.mode] = (stats.modeUsage[entry.mode] || 0) + 1;

      // Count tool usage
      if (entry.toolsCalled) {
        for (const tool of entry.toolsCalled) {
          stats.toolUsage[tool] = (stats.toolUsage[tool] || 0) + 1;
        }
      }
    }

    stats.successRate = stats.totalCalls > 0 ? (successCount / stats.totalCalls) * 100 : 0;

    return stats;
  }
}();

)
}
}
}
}
)