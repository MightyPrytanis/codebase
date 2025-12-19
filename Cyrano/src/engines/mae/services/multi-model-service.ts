/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { aiService, AIProvider } from '../../../services/ai-service.js';
import { ModelConfig, VerificationMode, ProviderStrategy } from '../../../services/user-verification-preferences.js';
import { getPreset } from '../../../config/model-presets.js';
import { apiValidator } from '../../../utils/api-validator.js';

export interface ModelResult {
  provider: AIProvider;
  model: string;
  role: 'fact_check' | 'trust_chain' | 'reasoning';
  response: string;
  confidence?: number; // Extracted confidence from response (0.0-1.0)
  tokensUsed?: {
    input: number;
    output: number;
  };
  cost?: number;
  latency: number;
  error?: string;
}

export interface MultiModelResult {
  factCheck: ModelResult;
  trustChain?: ModelResult;
  reasoning?: ModelResult;
  combinedConfidence: number;
  metadata: {
    mode: VerificationMode;
    providersUsed: AIProvider[];
    processingTime: number;
    totalCost: number;
    modelsExecuted: number;
    modelsFailed: number;
  };
}

export interface MultiModelConfig {
  mode: VerificationMode;
  providerStrategy: ProviderStrategy;
  primaryProvider?: AIProvider;
  customModels?: ModelConfig[];
  claim: string;
  context?: string;
  sources?: string[];
  verificationLevel?: 'basic' | 'thorough' | 'exhaustive';
}

/**
 * Multi-Model Service
 * MAE utility service for role-based parallel multi-model verification with weighted confidence scoring
 * 
 * This service is part of the MAE (Multi-Agent Engine) and provides specialized
 * multi-model execution capabilities for verification workflows. Unlike a Module,
 * this is a utility class that provides functionality but doesn't compose tools.
 */
export class MultiModelService {
  /**
   * Execute multi-model verification
   */
  async executeVerification(config: MultiModelConfig): Promise<MultiModelResult> {
    const startTime = Date.now();
    
    // Get model configurations
    const modelConfigs = this.getModelConfigs(config);
    
    // Build prompts for each model role
    const prompts = this.buildPrompts(config, modelConfigs);
    
    // Execute all models in parallel
    const results = await Promise.allSettled(
      modelConfigs.map(async (modelConfig, index) => {
        return this.executeModel(modelConfig, prompts[index], config);
      })
    );
    
    // Process results
    const modelResults: ModelResult[] = [];
    let modelsExecuted = 0;
    let modelsFailed = 0;
    let totalCost = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        modelResults.push(result.value);
        modelsExecuted++;
        if (result.value.cost) {
          totalCost += result.value.cost;
        }
      } else {
        modelsFailed++;
        // Create error result
        const modelConfig = modelConfigs[index];
        modelResults.push({
          provider: modelConfig.provider,
          model: modelConfig.model,
          role: modelConfig.role,
          response: '',
          latency: 0,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });
    
    // Extract results by role
    const factCheckResult = modelResults.find(r => r.role === 'fact_check');
    const trustChainResult = modelResults.find(r => r.role === 'trust_chain');
    const reasoningResult = modelResults.find(r => r.role === 'reasoning');
    
    if (!factCheckResult) {
      throw new Error('Fact-check model failed - at least one fact-check model must succeed');
    }
    
    // Calculate combined confidence
    const combinedConfidence = this.calculateCombinedConfidence(modelResults, modelConfigs);
    
    const processingTime = Date.now() - startTime;
    const providersUsed = [...new Set(modelResults.map(r => r.provider))];
    
    return {
      factCheck: factCheckResult,
      trustChain: trustChainResult,
      reasoning: reasoningResult,
      combinedConfidence,
      metadata: {
        mode: config.mode,
        providersUsed,
        processingTime,
        totalCost,
        modelsExecuted,
        modelsFailed,
      },
    };
  }
  
  /**
   * Get model configurations based on mode and strategy
   */
  private getModelConfigs(config: MultiModelConfig): ModelConfig[] {
    if (config.mode === 'custom' && config.customModels) {
      return config.customModels;
    }
    
    // Get preset
    const preset = getPreset(config.mode);
    if (!preset) {
      throw new Error(`Invalid verification mode: ${config.mode}`);
    }
    
    // If single provider strategy, ensure all models use the same provider
    if (config.providerStrategy === 'single') {
      const provider = config.primaryProvider || this.selectPrimaryProvider(preset.models);
      return preset.models.map(model => ({
        ...model,
        provider,
      }));
    }
    
    // Mixed provider strategy - use models as configured
    return preset.models;
  }
  
  /**
   * Select primary provider for single-provider strategy
   */
  private selectPrimaryProvider(models: ModelConfig[]): AIProvider {
    // Prefer Perplexity for fact-checking (real-time data)
    if (apiValidator.validateProvider('perplexity').valid) {
      return 'perplexity';
    }
    
    // Fall back to first available provider
    const availableProviders = apiValidator.getAvailableProviders() as AIProvider[];
    if (availableProviders.length > 0) {
      return availableProviders[0];
    }
    
    throw new Error('No AI providers configured');
  }
  
  /**
   * Build prompts for each model role
   */
  private buildPrompts(config: MultiModelConfig, modelConfigs: ModelConfig[]): string[] {
    return modelConfigs.map(modelConfig => {
      const basePrompt = this.buildBasePrompt(config);
      
      switch (modelConfig.role) {
        case 'fact_check':
          return this.buildFactCheckPrompt(basePrompt, config);
        case 'trust_chain':
          return this.buildTrustChainPrompt(basePrompt, config);
        case 'reasoning':
          return this.buildReasoningPrompt(basePrompt, config);
        default:
          return basePrompt;
      }
    });
  }
  
  /**
   * Build base prompt from claim and context
   */
  private buildBasePrompt(config: MultiModelConfig): string {
    let prompt = `Fact-check the following claim: "${config.claim}"\n\n`;
    
    if (config.context) {
      prompt += `Context: ${config.context}\n\n`;
    }
    
    if (config.sources && config.sources.length > 0) {
      prompt += `Please verify against these sources:\n${config.sources.map(s => `- ${s}`).join('\n')}\n\n`;
    }
    
    return prompt;
  }
  
  /**
   * Build fact-checking prompt
   */
  private buildFactCheckPrompt(basePrompt: string, config: MultiModelConfig): string {
    const level = config.verificationLevel || 'thorough';
    
    let prompt = basePrompt;
    prompt += `Verification level: ${level}\n\n`;
    
    if (level === 'exhaustive') {
      prompt += `Provide a comprehensive fact-check including:
- Verification status (VERIFIED, LIKELY_TRUE, UNCERTAIN, LIKELY_FALSE, UNVERIFIED)
- Supporting evidence found
- Contradictory evidence found
- Confidence level (0-1)
- Specific sources that support or contradict the claim
- Recommendations for further verification if needed`;
    } else if (level === 'thorough') {
      prompt += `Provide a thorough fact-check including:
- Verification status
- Key evidence found
- Confidence level (0-1)
- Main sources`;
    } else {
      prompt += `Provide a basic fact-check including:
- Verification status
- Brief summary
- Confidence level (0-1)`;
    }
    
    return prompt;
  }
  
  /**
   * Build trust chain analysis prompt
   */
  private buildTrustChainPrompt(basePrompt: string, config: MultiModelConfig): string {
    return basePrompt + `Analyze the trust chain and source credibility:
- Trace the origin of the claim
- Assess the reliability of sources
- Identify potential bias or conflicts of interest
- Evaluate the credibility chain
- Provide confidence in source reliability (0-1)`;
  }
  
  /**
   * Build Socratic reasoning prompt
   */
  private buildReasoningPrompt(basePrompt: string, config: MultiModelConfig): string {
    return basePrompt + `Apply Socratic reasoning to evaluate the claim:
- Question the assumptions underlying the claim
- Examine logical consistency
- Identify potential fallacies
- Evaluate the strength of reasoning
- Provide logical confidence score (0-1)`;
  }
  
  /**
   * Execute a single model
   */
  private async executeModel(
    modelConfig: ModelConfig,
    prompt: string,
    config: MultiModelConfig
  ): Promise<ModelResult> {
    const startTime = Date.now();
    
    // Validate provider is available
    const validation = apiValidator.validateProvider(modelConfig.provider);
    if (!validation.valid) {
      throw new Error(`Provider ${modelConfig.provider} not configured: ${validation.error}`);
    }
    
    // Build system prompt based on role
    const systemPrompt = this.getSystemPrompt(modelConfig.role, config.verificationLevel);
    
    // Make AI call
    const response = await aiService.call(modelConfig.provider, prompt, {
      model: modelConfig.model,
      systemPrompt,
      temperature: 0.3, // Lower temperature for factual accuracy
      maxTokens: this.getMaxTokensForRole(modelConfig.role),
    });
    
    const latency = Date.now() - startTime;
    
    // Extract confidence from response
    const confidence = this.extractConfidence(response);
    
    // Estimate tokens and cost (rough estimates)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    const cost = this.estimateCost(modelConfig.provider, inputTokens, outputTokens);
    
    return {
      provider: modelConfig.provider,
      model: modelConfig.model,
      role: modelConfig.role,
      response,
      confidence,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
      },
      cost,
      latency,
    };
  }
  
  /**
   * Get system prompt for a model role
   */
  private getSystemPrompt(role: 'fact_check' | 'trust_chain' | 'reasoning', level?: string): string {
    switch (role) {
      case 'fact_check':
        if (level === 'exhaustive') {
          return 'You are an expert fact-checker with access to real-time information. Provide comprehensive, accurate fact-checking with detailed evidence and sources.';
        }
        return 'You are an expert fact-checker. Provide accurate fact-checking with evidence and sources.';
        
      case 'trust_chain':
        return 'You are a source credibility analyst. Analyze the trust chain and evaluate the reliability of sources and information pathways.';
        
      case 'reasoning':
        return 'You are a logical reasoning specialist. Apply Socratic questioning to evaluate claims for logical consistency and sound reasoning.';
        
      default:
        return 'You are a helpful AI assistant providing accurate and useful information.';
    }
  }
  
  /**
   * Get max tokens for a model role
   */
  private getMaxTokensForRole(role: 'fact_check' | 'trust_chain' | 'reasoning'): number {
    switch (role) {
      case 'fact_check':
        return 4000;
      case 'trust_chain':
        return 2500;
      case 'reasoning':
        return 4000;
      default:
        return 4000;
    }
  }
  
  /**
   * Extract confidence score from response
   */
  private extractConfidence(response: string): number {
    // Look for explicit confidence scores
    const confidencePatterns = [
      /confidence[:\s]+(0?\.\d+|\d+%)/i,
      /confidence[:\s]+(\d+(?:\.\d+)?)\s*out\s*of\s*1/i,
      /(\d+(?:\.\d+)?)\s*confidence/i,
    ];
    
    for (const pattern of confidencePatterns) {
      const match = response.match(pattern);
      if (match) {
        let value = parseFloat(match[1]);
        if (match[1].includes('%')) {
          value = value / 100;
        }
        if (value > 1) {
          value = value / 10; // Assume scale of 10 if > 1
        }
        return Math.max(0, Math.min(1, value));
      }
    }
    
    // Look for verification status keywords
    const statusPatterns = [
      { pattern: /verified|true|accurate|confirmed|correct/i, score: 0.9 },
      { pattern: /likely\s+true|probably\s+true|appears\s+true/i, score: 0.7 },
      { pattern: /uncertain|unclear|cannot\s+verify/i, score: 0.5 },
      { pattern: /likely\s+false|probably\s+false|appears\s+false/i, score: 0.3 },
      { pattern: /false|incorrect|inaccurate|contradicted/i, score: 0.1 },
    ];
    
    for (const { pattern, score } of statusPatterns) {
      if (pattern.test(response)) {
        return score;
      }
    }
    
    // Default confidence
    return 0.5;
  }
  
  /**
   * Calculate combined confidence from all model results
   */
  private calculateCombinedConfidence(
    results: ModelResult[],
    modelConfigs: ModelConfig[]
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    results.forEach((result, index) => {
      if (!result.error && result.confidence !== undefined) {
        const weight = modelConfigs[index].weight;
        weightedSum += result.confidence * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight === 0) {
      return 0.5; // Default confidence if no valid results
    }
    
    return weightedSum / totalWeight;
  }
  
  /**
   * Estimate cost for a provider (rough estimates)
   */
  private estimateCost(provider: AIProvider, inputTokens: number, outputTokens: number): number {
    // Rough cost estimates per 1M tokens (in USD)
    const costs: Record<AIProvider, { input: number; output: number }> = {
      perplexity: { input: 0.2, output: 1.0 },
      openai: { input: 5.0, output: 15.0 },
      anthropic: { input: 15.0, output: 75.0 },
      google: { input: 0.075, output: 0.3 },
      xai: { input: 2.0, output: 10.0 },
      deepseek: { input: 0.14, output: 0.28 },
    };
    
    const providerCosts = costs[provider] || costs.perplexity;
    return (inputTokens / 1_000_000) * providerCosts.input + (outputTokens / 1_000_000) * providerCosts.output;
  }
}

export const multiModelService = new MultiModelService();

