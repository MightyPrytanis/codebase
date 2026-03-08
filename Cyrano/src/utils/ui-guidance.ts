/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { VerificationMode, ProviderStrategy } from '../services/user-verification-preferences.js';

export interface GuidanceInfo {
  title: string;
  description: string;
  recommendation: string;
  whenToUse: string[];
  warnings?: string[];
  estimatedImpact: {
    accuracy: 'low' | 'medium' | 'high';
    speed: 'fast' | 'medium' | 'slow';
    cost: 'low' | 'medium' | 'high';
  };
}

/**
 * UI Guidance for Verification Modes
 * Provides contextual help and recommendations for users
 */
export const VERIFICATION_MODE_GUIDANCE: Record<VerificationMode, GuidanceInfo> = {
  simple: {
    title: 'Simple Verification',
    description: 'Single model fact-checking for quick verification',
    recommendation: 'Use for routine fact-checks and low-stakes claims',
    whenToUse: [
      'Quick verification of basic facts',
      'Low-stakes legal claims',
      'Cost-sensitive scenarios',
      'Routine document review'
    ],
    estimatedImpact: { 
      accuracy: 'medium', 
      speed: 'fast', 
      cost: 'low' 
    }
  },
  standard: {
    title: 'Standard Verification',
    description: 'Balanced accuracy with trust chain analysis using two models',
    recommendation: 'Recommended for most legal fact-checking scenarios',
    whenToUse: [
      'Most legal fact-checking scenarios',
      'Standard verification workflows',
      'Balanced accuracy and speed',
      'General document analysis'
    ],
    estimatedImpact: { 
      accuracy: 'high', 
      speed: 'medium', 
      cost: 'medium' 
    }
  },
  comprehensive: {
    title: 'Comprehensive Verification',
    description: 'Maximum accuracy with full analysis using three specialized models',
    recommendation: 'Use for critical legal claims requiring maximum verification',
    whenToUse: [
      'Critical legal claims',
      'High-stakes verification',
      'Maximum accuracy required',
      'Complex fact-checking scenarios'
    ],
    warnings: [
      'Higher cost due to multiple model calls',
      'Longer processing time (3-6 seconds)',
      'May be overkill for simple claims'
    ],
    estimatedImpact: { 
      accuracy: 'high' as const, 
      speed: 'slow' as const, 
      cost: 'high' as const
    }
  },
  custom: {
    title: 'Custom Verification',
    description: 'User-defined model combinations for specific requirements',
    recommendation: 'For advanced users with specific verification needs',
    whenToUse: [
      'Specific model requirements',
      'Custom provider combinations',
      'Fine-tuned verification workflows',
      'Advanced use cases'
    ],
    warnings: [
      'Requires understanding of model capabilities',
      'May require testing to optimize',
      'Cost and time depend on configuration'
    ],
    estimatedImpact: { 
      accuracy: 'medium' as const, 
      speed: 'medium' as const, 
      cost: 'medium' as const
    }
  },
};

/**
 * UI Guidance for Provider Strategies
 */
export const PROVIDER_STRATEGY_GUIDANCE: Record<ProviderStrategy, GuidanceInfo> = {
  single: {
    title: 'Single Provider',
    description: 'Use models from a single AI provider',
    recommendation: 'Recommended: Simpler, faster, and more consistent',
    whenToUse: [
      'Most verification scenarios',
      'Consistent API behavior needed',
      'Simplified error handling',
      'Standard workflows'
    ],
    estimatedImpact: { 
      accuracy: 'high', 
      speed: 'fast', 
      cost: 'medium' 
    }
  },
  mixed: {
    title: 'Mixed Providers',
    description: 'Combine models from different AI providers',
    recommendation: 'Advanced: Use when you need specific capabilities from different providers',
    whenToUse: [
      'Need specific capabilities from different providers',
      'Comparing provider responses',
      'Advanced verification workflows',
      'Custom provider combinations'
    ],
    warnings: [
      'May increase cost and processing time',
      'Different providers may have inconsistent response formats',
      'More complex error handling required',
      'Requires multiple API keys'
    ],
    estimatedImpact: { 
      accuracy: 'medium' as const, 
      speed: 'slow' as const, 
      cost: 'high' as const
    }
  },
};

/**
 * Get guidance for a verification mode
 */
export function getModeGuidance(mode: VerificationMode): GuidanceInfo {
  return VERIFICATION_MODE_GUIDANCE[mode] || VERIFICATION_MODE_GUIDANCE.standard;
}

/**
 * Get guidance for a provider strategy
 */
export function getStrategyGuidance(strategy: ProviderStrategy): GuidanceInfo {
  return PROVIDER_STRATEGY_GUIDANCE[strategy];
}

/**
 * Get recommendation text for UI display
 */
export function getRecommendationText(mode: VerificationMode, isUserPreference: boolean = false): string {
  const guidance = getModeGuidance(mode);
  
  if (isUserPreference) {
    return `Using your saved preference: ${guidance.title}`;
  }
  
  if (mode === 'standard') {
    return `✓ Recommended: ${guidance.recommendation}`;
  }
  
  return guidance.recommendation;
}

