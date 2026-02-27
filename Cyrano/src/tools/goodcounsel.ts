/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { AIService, AIProvider } from '../services/ai-service.js';
import { PerplexityService } from '../services/perplexity.js';
import { CosmosIntegration } from '../services/cosmos-integration.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';

const GoodCounselSchema = z.object({
  context: z.string().describe('Current case context, workflow status, or situation requiring guidance'),
  user_state: z.string().optional().describe('Current user mental/emotional state or focus level'),
  time_pressure: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Time pressure level'),
  ethical_concerns: z.array(z.string()).optional().describe('Any ethical issues or concerns'),
  ai_provider: z.enum(['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek']).default('perplexity').describe('AI provider to use for guidance (user choice)'),
});

export const goodCounsel = new (class extends BaseTool {
  public cosmosIntegration: CosmosIntegration;

  constructor() {
    super();
    this.cosmosIntegration = new CosmosIntegration();
  }

  getToolDefinition() {
    return {
      name: 'good_counsel',
      description: 'AI-powered ethical guidance and workflow optimization for legal practice - focuses on "things that matter" while automating routine tasks',
      inputSchema: {
        type: 'object' as const,
        properties: {
          context: {
            type: 'string',
            description: 'Current case context, workflow status, or situation requiring guidance',
          },
          user_state: {
            type: 'string',
            description: 'Current user mental/emotional state or focus level',
          },
          time_pressure: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            description: 'Time pressure level',
          },
          ethical_concerns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Any ethical issues or concerns',
          },
          ai_provider: {
            type: 'string',
            enum: ['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek'],
            default: 'perplexity',
            description: 'AI provider to use for guidance (user choice - Perplexity is recommended default)',
          },
        },
        required: ['context'],
      },
    };
  }

  async execute(input: any) {
    try {
      const { context, user_state, time_pressure, ethical_concerns, ai_provider } = GoodCounselSchema.parse(input);

      // Validate API keys based on selected provider
      const perplexityKey = process.env.PERPLEXITY_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      const xaiKey = process.env.XAI_API_KEY;
      const deepseekKey = process.env.DEEPSEEK_API_KEY;

      // Check if the selected provider has a valid API key
      const hasRequiredKey = (
        (ai_provider === 'perplexity' && perplexityKey) ||
        (ai_provider === 'openai' && openaiKey) ||
        (ai_provider === 'anthropic' && anthropicKey) ||
        (ai_provider === 'google' && geminiKey) ||
        (ai_provider === 'xai' && xaiKey) ||
        (ai_provider === 'deepseek' && deepseekKey)
      );

      if (!hasRequiredKey) {
        const availableProviders: string[] = [];
        if (perplexityKey) availableProviders.push('perplexity');
        if (openaiKey) availableProviders.push('openai');
        if (anthropicKey) availableProviders.push('anthropic');
        if (geminiKey) availableProviders.push('google');
        if (xaiKey) availableProviders.push('xai');
        if (deepseekKey) availableProviders.push('deepseek');

        if (availableProviders.length === 0) {
          return this.createErrorResult('No AI API keys configured. Please set at least one API key: PERPLEXITY_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY, or DEEPSEEK_API_KEY environment variables.');
        }

        return this.createErrorResult(`Selected AI provider '${ai_provider}' is not available. Available providers: ${availableProviders.join(', ')}. Please choose from available options or configure the required API key.`);
      }

      // Use the user-selected provider
      let guidance;
      try {
        guidance = await this.performRealGuidance(ai_provider, context, user_state, time_pressure, ethical_concerns);
      } catch (aiError) {
        return this.createErrorResult(`AI guidance failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      }

      return this.createSuccessResult(JSON.stringify(guidance, null, 2), {
        context_length: context.length,
        user_state_provided: !!user_state,
        time_pressure,
        ethical_concerns_count: ethical_concerns?.length || 0,
        ai_provider,
      });
    } catch (error) {
      return this.createErrorResult(`Good counsel guidance failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async performRealGuidance(
    provider: 'perplexity' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek',
    context: string,
    userState?: string,
    timePressure: string = 'medium',
    ethicalConcerns?: string[]
  ): Promise<any> {
    // Build guidance prompt
    const prompt = this.buildGuidancePrompt(context, userState, timePressure, ethicalConcerns);

    // Get AI response
    const aiResponse = await this.callAIProvider(prompt, provider);

    // Get Cosmos Next Action recommendations
    const nextActions = await this.cosmosIntegration.getNextActions({
      caseContext: context,
      userState: userState,
      timePressure: timePressure as 'low' | 'medium' | 'high' | 'critical',
      ethicalConcerns: ethicalConcerns,
    });

    // Get automation opportunities
    const automationOpportunities = this.cosmosIntegration.getAutomationOpportunities(context);

    // Extract recommendations
    const extractedRecommendations = this.extractRecommendations(aiResponse);
    
    // Automatic ethics check on recommendations
    const { checkRecommendations } = await import('../services/ethics-check-helper.js');
    const ethicsCheckResult = await checkRecommendations(extractedRecommendations, {
      toolName: 'goodcounsel',
      provider: provider,
      facts: {
        hasEthicalConcerns: (ethicalConcerns?.length || 0) > 0,
        timePressure: timePressure,
      },
    });

    // Parse and structure the guidance
    return {
      context_analysis: this.analyzeContext(context),
      user_state_assessment: userState ? this.assessUserState(userState) : undefined,
      time_pressure_level: timePressure,
      ethical_considerations: ethicalConcerns || [],
      ai_guidance: aiResponse,
      next_actions: nextActions,  // Cosmos integration
      automation_opportunities: automationOpportunities,  // Cosmos integration
      recommendations: ethicsCheckResult.recommendations,
      habit_insights: this.identifyHabitPatterns(context, userState),
      workflow_optimization: this.generateWorkflowOptimizations(aiResponse, timePressure),
      timestamp: new Date().toISOString(),
      ai_provider: provider,
      ethicsCheck: {
        reviewed: true,
        passed: ethicsCheckResult.ethicsCheck.passed,
        complianceScore: ethicsCheckResult.ethicsCheck.complianceScore,
        warnings: ethicsCheckResult.ethicsCheck.warnings,
        auditId: ethicsCheckResult.ethicsCheck.auditId,
      },
    };
  }

  public buildGuidancePrompt(context: string, userState?: string, timePressure: string = 'medium', ethicalConcerns?: string[]): string {
    let systemPrompt = `You are an expert legal practice counselor providing AI-powered ethical guidance and workflow optimization.`;
    
    // Inject Ten Rules into system prompt
    systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
    
    let prompt = `${systemPrompt}

Current Situation:
${context}

`;

    if (userState) {
      prompt += `User State: ${userState}\n\n`;
    }

    prompt += `Time Pressure: ${timePressure}\n\n`;

    if (ethicalConcerns && ethicalConcerns.length > 0) {
      prompt += `Ethical Concerns: ${ethicalConcerns.join(', ')}\n\n`;
    }

    prompt += `Please provide comprehensive guidance that:
1. Analyzes the current legal context and identifies key issues
2. Considers the user's mental/emotional state and time pressure
3. Addresses any ethical concerns raised
4. Provides specific, actionable recommendations
5. Identifies potential habit patterns that might be affecting productivity
6. Suggests workflow optimizations to improve efficiency
7. Focuses on "things that matter" while automating routine tasks
8. Maintains the highest ethical standards

Structure your response as a JSON object with these keys:
- analysis: Brief analysis of the situation
- recommendations: Array of specific actionable recommendations
- habit_insights: Array of identified habit patterns and interventions
- workflow_tips: Array of workflow optimization suggestions
- ethical_guidance: Any ethical considerations or advice
- priority_actions: Array of immediate next steps ranked by importance

Be specific, practical, and focused on improving legal practice effectiveness while maintaining professional ethics.`;

    return prompt;
  }

  public async callAIProvider(prompt: string, provider: 'perplexity' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek'): Promise<string> {
    // ETHICS ENFORCEMENT: Use ai-service.call() for automatic Ten Rules injection, output checking, and audit logging
    const aiService = new AIService();
    
    // Perplexity has special handling via PerplexityService (which should also use ai-service internally)
    // For now, we'll use ai-service for all providers to ensure ethics enforcement
    if (provider === 'perplexity') {
      // PerplexityService.generateGoodCounselInsights should be updated to use ai-service internally
      // For now, use ai-service directly to ensure ethics enforcement
      const systemPrompt = injectTenRulesIntoSystemPrompt(
        'You are an expert ethical guide providing practical, actionable guidance for legal practice.',
        'summary'
      );
      
      return await aiService.call('perplexity', prompt, {
        systemPrompt,
        maxTokens: 4000,
        temperature: 0.1,
        metadata: {
          toolName: 'good_counsel',
          actionType: 'recommendation',
        },
      });
    }
    
    // All other providers use ai-service.call() - automatically enforces ethics at service layer
    const systemPrompt = injectTenRulesIntoSystemPrompt(
      'You are an expert ethical guide providing practical, actionable guidance for legal practice.',
      'summary'
    );
    
    return await aiService.call(provider as AIProvider, prompt, {
      systemPrompt, // Already has Ten Rules injected
      maxTokens: 4000,
      temperature: 0.1,
      metadata: {
        toolName: 'good_counsel',
        actionType: 'recommendation',
      },
    });
  }

  public analyzeContext(context: string): any {
    return {
      legal_complexity: this.assessComplexity(context),
      key_issues: this.extractKeyIssues(context),
      stakeholders: this.identifyStakeholders(context),
      urgency_indicators: this.detectUrgency(context),
    };
  }

  public assessComplexity(text: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = ['complex', 'complicated', 'intricate', 'sophisticated', 'multiple parties', 'conflicting interests'];
    const matches = complexityIndicators.filter(indicator => text.toLowerCase().includes(indicator)).length;
    if (matches >= 3) return 'high';
    if (matches >= 1) return 'medium';
    return 'low';
  }

  public extractKeyIssues(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  public identifyStakeholders(text: string): string[] {
    const stakeholders: string[] = [];
    if (text.toLowerCase().includes('client')) stakeholders.push('client');
    if (text.toLowerCase().includes('court')) stakeholders.push('court');
    if (text.toLowerCase().includes('opposing counsel')) stakeholders.push('opposing counsel');
    if (text.toLowerCase().includes('judge')) stakeholders.push('judge');
    return stakeholders;
  }

  public detectUrgency(text: string): string[] {
    const urgencyWords = ['deadline', 'urgent', 'immediate', 'asap', 'rush', 'critical', 'time-sensitive'];
    return urgencyWords.filter(word => text.toLowerCase().includes(word));
  }

  public assessUserState(userState: string): any {
    return {
      fatigue_level: this.detectFatigue(userState),
      focus_level: this.assessFocus(userState),
      stress_indicators: this.detectStress(userState),
      recommendations: this.generateStateRecommendations(userState),
    };
  }

  public detectFatigue(text: string): 'low' | 'medium' | 'high' {
    const fatigueWords = ['tired', 'exhausted', 'fatigued', 'drained', 'overwhelmed', 'burned out'];
    const matches = fatigueWords.filter(word => text.toLowerCase().includes(word)).length;
    if (matches >= 2) return 'high';
    if (matches >= 1) return 'medium';
    return 'low';
  }

  public assessFocus(text: string): 'low' | 'medium' | 'high' {
    const distracted = ['distracted', 'unfocused', 'scattered'].some(word => text.toLowerCase().includes(word));
    const focused = ['concentrated', 'focused', 'sharp'].some(word => text.toLowerCase().includes(word));

    if (distracted) return 'low';
    if (focused) return 'high';
    return 'medium';
  }

  public detectStress(text: string): string[] {
    const stressWords = ['stressed', 'anxious', 'worried', 'overwhelmed', 'pressure', 'tense'];
    return stressWords.filter(word => text.toLowerCase().includes(word));
  }

  public generateStateRecommendations(userState: string): string[] {
    const recommendations: string[] = [];

    if (userState.toLowerCase().includes('tired')) {
      recommendations.push('Take scheduled breaks throughout the day');
      recommendations.push('Prioritize high-impact tasks for morning hours');
    }

    if (userState.toLowerCase().includes('stressed')) {
      recommendations.push('Practice deep breathing or mindfulness exercises');
      recommendations.push('Break complex tasks into smaller, manageable steps');
    }

    if (userState.toLowerCase().includes('distracted')) {
      recommendations.push('Use time-blocking techniques');
      recommendations.push('Minimize notifications during focused work');
    }

    return recommendations;
  }

  public extractRecommendations(aiResponse: string): string[] {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.recommendations || [];
    } catch {
      const lines = aiResponse.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
      return lines.map(line => line.trim().replace(/^[-•]\s*/, '')).slice(0, 5);
    }
  }

  public identifyHabitPatterns(context: string, userState?: string): any[] {
    const insights: { habit: string; trigger: string; consequence: string; intervention: string; }[] = [];

    if (context.toLowerCase().includes('multiple') && context.toLowerCase().includes('task')) {
      insights.push({
        habit: 'Multitasking',
        trigger: 'Multiple notifications or open tasks',
        consequence: 'Reduced quality and increased errors',
        intervention: 'Implement focused work blocks with notification management',
      });
    }

    if (context.toLowerCase().includes('email') || context.toLowerCase().includes('communication')) {
      insights.push({
        habit: 'Reactive communication',
        trigger: 'Incoming emails and messages',
        consequence: 'Constant context switching',
        intervention: 'Batch email processing and scheduled communication times',
      });
    }

    if (userState && userState.toLowerCase().includes('tired')) {
      insights.push({
        habit: 'Late-night work',
        trigger: 'Accumulated workload',
        consequence: 'Reduced cognitive performance',
        intervention: 'Establish work boundaries and morning priority sessions',
      });
    }

    return insights;
  }

  public generateWorkflowOptimizations(aiResponse: string, timePressure: string): any {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        immediate_actions: parsed.priority_actions || [],
        time_management: this.generateTimeManagementTips(timePressure),
        automation_opportunities: this.identifyAutomationOpportunities(aiResponse),
        delegation_candidates: this.suggestDelegationTasks(aiResponse),
      };
    } catch {
      return {
        immediate_actions: [],
        time_management: this.generateTimeManagementTips(timePressure),
        automation_opportunities: [],
        delegation_candidates: [],
      };
    }
  }

  public generateTimeManagementTips(pressure: string): string[] {
        const tips: string[] = [];    switch (pressure) {
      case 'critical':
        tips.push('Use Pomodoro technique: 25 minutes focused work + 5 minute breaks');
        tips.push('Prioritize tasks using Eisenhower matrix');
        tips.push('Delegate routine tasks immediately');
        break;
      case 'high':
        tips.push('Block calendar for deep work sessions');
        tips.push('Use task batching for similar activities');
        tips.push('Set clear boundaries with clients and colleagues');
        break;
      case 'medium':
        tips.push('Plan tomorrow\'s priorities tonight');
        tips.push('Use time-tracking to identify inefficiencies');
        tips.push('Build buffer time between meetings');
        break;
      case 'low':
        tips.push('Focus on strategic planning and professional development');
        tips.push('Conduct thorough quality reviews');
        tips.push('Mentor junior team members');
        break;
    }

    return tips;
  }

  public identifyAutomationOpportunities(aiResponse: string): string[] {
    const opportunities: string[] = [];

    if (aiResponse.toLowerCase().includes('document') && aiResponse.toLowerCase().includes('review')) {
      opportunities.push('Document assembly automation');
      opportunities.push('Contract analysis AI tools');
    }

    if (aiResponse.toLowerCase().includes('calendar') || aiResponse.toLowerCase().includes('schedule')) {
      opportunities.push('Automated calendar management');
      opportunities.push('Meeting scheduling optimization');
    }

    if (aiResponse.toLowerCase().includes('research')) {
      opportunities.push('Legal research automation');
      opportunities.push('Case law analysis tools');
    }

    return opportunities;
  }

  public suggestDelegationTasks(aiResponse: string): string[] {
    const tasks: string[] = [];

    if (aiResponse.toLowerCase().includes('research')) {
      tasks.push('Initial legal research');
      tasks.push('Case law gathering');
    }

    if (aiResponse.toLowerCase().includes('document')) {
      tasks.push('Document preparation');
      tasks.push('Form completion');
    }

    if (aiResponse.toLowerCase().includes('communication')) {
      tasks.push('Client updates');
      tasks.push('Routine correspondence');
    }

    return tasks;
  }
});

