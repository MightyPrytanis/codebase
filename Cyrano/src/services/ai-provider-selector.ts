/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { AIProvider } from './ai-service.js';
import { apiValidator } from '../utils/api-validator.js';
import { aiPerformanceTracker, TaskProfile, ProviderRecommendation } from './ai-performance-tracker.js';

export interface ProviderSelectionOptions {
  taskType: string;
  subjectMatter?: string;
  complexity?: 'low' | 'medium' | 'high';
  requiresRealTimeData?: boolean;
  requiresCodeGeneration?: boolean;
  requiresLongContext?: boolean;
  requiresSafety?: boolean;
  preferredProvider?: AIProvider | 'auto';
  balanceQualitySpeed?: 'quality' | 'speed' | 'balanced';
}

/**
 * AI Provider Selector
 * Implements user sovereignty and auto-select logic for AI provider selection
 */
export class AIProviderSelector {
  private static instance: AIProviderSelector;
  private maeDefaultProvider: AIProvider = 'perplexity'; // Hardcoded default for MAE (user can change)

  private constructor() {
    // Load user preference for MAE default from config if available
    // For now, use perplexity as default
  }

  public static getInstance(): AIProviderSelector {
    if (!AIProviderSelector.instance) {
      AIProviderSelector.instance = new AIProviderSelector();
    }
    return AIProviderSelector.instance;
  }

  /**
   * Get the default provider for MAE orchestrator
   */
  public getMAEDefaultProvider(): AIProvider {
    return this.maeDefaultProvider;
  }

  /**
   * Set the default provider for MAE orchestrator (user sovereignty)
   */
  public setMAEDefaultProvider(provider: AIProvider): void {
    this.maeDefaultProvider = provider;
    // TODO: Persist to user config/database
  }

  /**
   * Select provider based on options
   * Returns 'auto' if auto-select is requested, otherwise returns the selected provider
   */
  public selectProvider(options: ProviderSelectionOptions): AIProvider | 'auto' {
    // If user explicitly selected a provider (not 'auto'), respect that choice
    if (options.preferredProvider && options.preferredProvider !== 'auto') {
      // Validate provider is available
      const validation = apiValidator.validateProvider(options.preferredProvider);
      if (validation.valid) {
        return options.preferredProvider;
      }
      // If preferred provider not available, fall back to auto
      console.warn(`Preferred provider ${options.preferredProvider} not available, using auto-select`);
    }

    // If 'auto' is requested or no preference, use auto-select
    if (options.preferredProvider === 'auto' || !options.preferredProvider) {
      return 'auto';
    }

    // Fallback to auto if we get here
    return 'auto';
  }

  /**
   * Resolve 'auto' to a specific provider based on task profile and performance
   */
  public resolveAutoProvider(options: ProviderSelectionOptions): AIProvider {
    const availableProviders = apiValidator.getAvailableProviders() as AIProvider[];
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured');
    }

    // Build task profile
    const taskProfile: TaskProfile = {
      taskType: options.taskType,
      subjectMatter: options.subjectMatter,
      complexity: options.complexity,
      requiresRealTimeData: options.requiresRealTimeData,
      requiresCodeGeneration: options.requiresCodeGeneration,
      requiresLongContext: options.requiresLongContext,
      requiresSafety: options.requiresSafety,
    };

    // Get recommendations from performance tracker
    const recommendations = aiPerformanceTracker.getRecommendedProvider(
      taskProfile,
      availableProviders
    );

    if (recommendations.length === 0) {
      // Fallback to first available provider
      return availableProviders[0];
    }

    // Apply quality/speed balance
    let selectedRecommendation = recommendations[0]; // Best overall score

    if (options.balanceQualitySpeed === 'speed') {
      // Prefer faster providers
      selectedRecommendation = recommendations.reduce((best, current) => {
        return current.estimatedLatency < best.estimatedLatency ? current : best;
      });
    } else if (options.balanceQualitySpeed === 'quality') {
      // Prefer higher-scoring providers (already sorted, but ensure we're not just picking fastest)
      selectedRecommendation = recommendations[0];
    } else {
      // Balanced: consider both score and latency
      selectedRecommendation = recommendations.reduce((best, current) => {
        const bestScore = best.score / (best.estimatedLatency / 1000); // Score per second
        const currentScore = current.score / (current.estimatedLatency / 1000);
        return currentScore > bestScore ? current : best;
      });
    }

    return selectedRecommendation.provider;
  }

  /**
   * Get provider for a specific task with full auto-select resolution
   */
  public getProviderForTask(options: ProviderSelectionOptions): AIProvider {
    const selected = this.selectProvider(options);
    
    if (selected === 'auto') {
      return this.resolveAutoProvider(options);
    }

    return selected;
  }

  /**
   * Get recommendations for a task (for UI display)
   */
  public getRecommendations(options: ProviderSelectionOptions): ProviderRecommendation[] {
    const availableProviders = apiValidator.getAvailableProviders() as AIProvider[];
    
    const taskProfile: TaskProfile = {
      taskType: options.taskType,
      subjectMatter: options.subjectMatter,
      complexity: options.complexity,
      requiresRealTimeData: options.requiresRealTimeData,
      requiresCodeGeneration: options.requiresCodeGeneration,
      requiresLongContext: options.requiresLongContext,
      requiresSafety: options.requiresSafety,
    };

    return aiPerformanceTracker.getRecommendedProvider(taskProfile, availableProviders);
  }
}

export const aiProviderSelector = AIProviderSelector.getInstance();





