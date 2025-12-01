/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { AIProvider } from './ai-service.js';

export interface ProviderPerformanceMetrics {
  provider: AIProvider;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number; // milliseconds
  minLatency: number;
  maxLatency: number;
  totalCost: number; // estimated cost in USD
  totalInputTokens: number;
  totalOutputTokens: number;
  lastUsed: Date | null;
  averageLatency: number;
  successRate: number;
  costPerRequest: number;
}

export interface TaskProfile {
  taskType: string;
  subjectMatter?: string;
  complexity?: 'low' | 'medium' | 'high';
  requiresRealTimeData?: boolean;
  requiresCodeGeneration?: boolean;
  requiresLongContext?: boolean;
  requiresSafety?: boolean;
}

export interface ProviderRecommendation {
  provider: AIProvider;
  score: number;
  reasons: string[];
  estimatedLatency: number;
  estimatedCost: number;
}

/**
 * AI Performance Tracker
 * Tracks performance metrics for AI providers and provides recommendations
 */
export class AIPerformanceTracker {
  private static instance: AIPerformanceTracker;
  private metrics: Map<AIProvider, ProviderPerformanceMetrics>;
  private readonly maxHistorySize = 1000; // Keep last 1000 requests per provider

  private constructor() {
    this.metrics = new Map();
    this.initializeMetrics();
  }

  public static getInstance(): AIPerformanceTracker {
    if (!AIPerformanceTracker.instance) {
      AIPerformanceTracker.instance = new AIPerformanceTracker();
    }
    return AIPerformanceTracker.instance;
  }

  private initializeMetrics(): void {
    const providers: AIProvider[] = ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'];
    providers.forEach(provider => {
      this.metrics.set(provider, {
        provider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        lastUsed: null,
        averageLatency: 0,
        successRate: 0,
        costPerRequest: 0,
      });
    });
  }

  /**
   * Record a successful AI request
   */
  public recordSuccess(
    provider: AIProvider,
    latency: number,
    inputTokens: number,
    outputTokens: number,
    cost?: number
  ): void {
    const metrics = this.metrics.get(provider);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.totalLatency += latency;
    metrics.minLatency = Math.min(metrics.minLatency, latency);
    metrics.maxLatency = Math.max(metrics.maxLatency, latency);
    metrics.totalInputTokens += inputTokens;
    metrics.totalOutputTokens += outputTokens;
    if (cost !== undefined) {
      metrics.totalCost += cost;
    }
    metrics.lastUsed = new Date();

    this.updateDerivedMetrics(metrics);
  }

  /**
   * Record a failed AI request
   */
  public recordFailure(provider: AIProvider, latency: number): void {
    const metrics = this.metrics.get(provider);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.totalLatency += latency;
    metrics.lastUsed = new Date();

    this.updateDerivedMetrics(metrics);
  }

  private updateDerivedMetrics(metrics: ProviderPerformanceMetrics): void {
    if (metrics.totalRequests > 0) {
      metrics.averageLatency = metrics.totalLatency / metrics.totalRequests;
      metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
      metrics.costPerRequest = metrics.totalCost / metrics.totalRequests;
    }
  }

  /**
   * Get performance metrics for a provider
   */
  public getMetrics(provider: AIProvider): ProviderPerformanceMetrics | undefined {
    return this.metrics.get(provider);
  }

  /**
   * Get all performance metrics
   */
  public getAllMetrics(): Map<AIProvider, ProviderPerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get recommended provider for a task profile
   */
  public getRecommendedProvider(
    taskProfile: TaskProfile,
    availableProviders: AIProvider[]
  ): ProviderRecommendation[] {
    const recommendations: ProviderRecommendation[] = [];

    for (const provider of availableProviders) {
      const metrics = this.metrics.get(provider);
      if (!metrics || metrics.totalRequests === 0) {
        // No data yet - use default scores
        recommendations.push({
          provider,
          score: this.calculateDefaultScore(provider, taskProfile),
          reasons: ['No performance data available - using default recommendations'],
          estimatedLatency: this.getDefaultLatency(provider),
          estimatedCost: this.getDefaultCost(provider),
        });
        continue;
      }

      const score = this.calculateScore(metrics, taskProfile);
      const reasons = this.getRecommendationReasons(metrics, taskProfile);

      recommendations.push({
        provider,
        score,
        reasons,
        estimatedLatency: metrics.averageLatency,
        estimatedCost: metrics.costPerRequest,
      });
    }

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    metrics: ProviderPerformanceMetrics,
    taskProfile: TaskProfile
  ): number {
    let score = 0;

    // Success rate (0-40 points)
    score += metrics.successRate * 40;

    // Latency (0-30 points) - lower latency = higher score
    const latencyScore = Math.max(0, 30 - (metrics.averageLatency / 100)); // Penalize latency over 3 seconds
    score += latencyScore;

    // Cost efficiency (0-20 points) - lower cost = higher score
    const costScore = Math.max(0, 20 - (metrics.costPerRequest * 1000)); // Penalize high cost
    score += costScore;

    // Task-specific bonuses (0-10 points)
    score += this.getTaskSpecificBonus(metrics.provider, taskProfile);

    return score;
  }

  private calculateDefaultScore(provider: AIProvider, taskProfile: TaskProfile): number {
    let score = 50; // Base score for unknown providers

    // Task-specific defaults
    if (taskProfile.requiresRealTimeData && provider === 'perplexity') {
      score += 20; // Perplexity excels at real-time data
    }

    if (taskProfile.requiresSafety && provider === 'anthropic') {
      score += 15; // Anthropic focuses on safety
    }

    if (taskProfile.requiresCodeGeneration && provider === 'openai') {
      score += 10; // OpenAI good for code
    }

    if (taskProfile.requiresLongContext && provider === 'google') {
      score += 10; // Google has long context models
    }

    return score;
  }

  private getTaskSpecificBonus(provider: AIProvider, taskProfile: TaskProfile): number {
    let bonus = 0;

    if (taskProfile.requiresRealTimeData && provider === 'perplexity') {
      bonus += 5;
    }

    if (taskProfile.requiresSafety && provider === 'anthropic') {
      bonus += 5;
    }

    if (taskProfile.requiresCodeGeneration && (provider === 'openai' || provider === 'deepseek')) {
      bonus += 3;
    }

    if (taskProfile.requiresLongContext && (provider === 'google' || provider === 'anthropic')) {
      bonus += 3;
    }

    return bonus;
  }

  private getRecommendationReasons(
    metrics: ProviderPerformanceMetrics,
    taskProfile: TaskProfile
  ): string[] {
    const reasons: string[] = [];

    if (metrics.successRate > 0.95) {
      reasons.push(`High success rate (${(metrics.successRate * 100).toFixed(1)}%)`);
    }

    if (metrics.averageLatency < 2000) {
      reasons.push(`Fast response time (${metrics.averageLatency.toFixed(0)}ms avg)`);
    }

    if (metrics.costPerRequest < 0.01) {
      reasons.push(`Cost efficient ($${metrics.costPerRequest.toFixed(4)} per request)`);
    }

    if (taskProfile.requiresRealTimeData && metrics.provider === 'perplexity') {
      reasons.push('Excellent for real-time data and research');
    }

    if (taskProfile.requiresSafety && metrics.provider === 'anthropic') {
      reasons.push('Strong safety and ethics focus');
    }

    return reasons;
  }

  private getDefaultLatency(provider: AIProvider): number {
    // Default latencies in milliseconds (rough estimates)
    const defaults: Record<AIProvider, number> = {
      perplexity: 2000,
      openai: 1500,
      anthropic: 2000,
      google: 1800,
      xai: 2500,
      deepseek: 1500,
    };
    return defaults[provider] || 2000;
  }

  private getDefaultCost(provider: AIProvider): number {
    // Default costs per request (rough estimates in USD)
    const defaults: Record<AIProvider, number> = {
      perplexity: 0.002,
      openai: 0.01,
      anthropic: 0.015,
      google: 0.001,
      xai: 0.005,
      deepseek: 0.001,
    };
    return defaults[provider] || 0.01;
  }

  /**
   * Reset metrics for a provider
   */
  public resetMetrics(provider: AIProvider): void {
    this.initializeMetrics();
  }

  /**
   * Get summary statistics
   */
  public getSummary(): {
    totalRequests: number;
    totalCost: number;
    averageLatency: number;
    providers: AIProvider[];
  } {
    let totalRequests = 0;
    let totalCost = 0;
    let totalLatency = 0;
    const providers: AIProvider[] = [];

    this.metrics.forEach((metrics, provider) => {
      if (metrics.totalRequests > 0) {
        totalRequests += metrics.totalRequests;
        totalCost += metrics.totalCost;
        totalLatency += metrics.totalLatency;
        providers.push(provider);
      }
    });

    return {
      totalRequests,
      totalCost,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      providers,
    };
  }
}

export const aiPerformanceTracker = AIPerformanceTracker.getInstance();


