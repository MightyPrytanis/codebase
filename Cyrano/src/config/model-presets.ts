/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { ModelConfig } from '../services/user-verification-preferences.js';

export interface VerificationPreset {
  models: ModelConfig[];
  description: string;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedTime: string;
  useCase: string[];
}

/**
 * Verification Mode Presets
 * Pre-configured model combinations for different verification depths
 */
export const VERIFICATION_PRESETS: Record<string, VerificationPreset> = {
  simple: {
    models: [
      { 
        provider: 'perplexity', 
        model: 'sonar', 
        role: 'fact_check', 
        weight: 1.0 
      }
    ],
    description: 'Fast, single-model verification',
    estimatedCost: 'low',
    estimatedTime: '1-2s',
    useCase: [
      'Quick verification of basic facts',
      'Low-stakes legal claims',
      'Cost-sensitive scenarios',
      'Routine fact-checks'
    ],
  },
  standard: {
    models: [
      { 
        provider: 'perplexity', 
        model: 'sonar', 
        role: 'fact_check', 
        weight: 0.35 
      },
      { 
        provider: 'perplexity', 
        model: 'sonar-deep-research', 
        role: 'trust_chain', 
        weight: 0.25 
      }
    ],
    description: 'Balanced accuracy with trust chain analysis',
    estimatedCost: 'medium',
    estimatedTime: '2-4s',
    useCase: [
      'Most legal fact-checking scenarios',
      'Standard verification workflows',
      'Balanced accuracy and speed',
      'Recommended for general use'
    ],
  },
  comprehensive: {
    models: [
      { 
        provider: 'perplexity', 
        model: 'sonar', 
        role: 'fact_check', 
        weight: 0.35 
      },
      { 
        provider: 'perplexity', 
        model: 'sonar-deep-research', 
        role: 'trust_chain', 
        weight: 0.25 
      },
      { 
        provider: 'perplexity', 
        model: 'sonar-reasoning', 
        role: 'reasoning', 
        weight: 0.20 
      }
    ],
    description: 'Maximum accuracy with full analysis',
    estimatedCost: 'high',
    estimatedTime: '3-6s',
    useCase: [
      'Critical legal claims',
      'High-stakes verification',
      'Maximum accuracy required',
      'Complex fact-checking scenarios'
    ],
  },
};

/**
 * Get preset by mode name
 */
export function getPreset(mode: string): VerificationPreset | undefined {
  return VERIFICATION_PRESETS[mode];
}

/**
 * Get all available presets
 */
export function getAllPresets(): Record<string, VerificationPreset> {
  return VERIFICATION_PRESETS;
}

/**
 * Validate that a preset exists
 */
export function isValidPreset(mode: string): boolean {
  return mode in VERIFICATION_PRESETS;
}
