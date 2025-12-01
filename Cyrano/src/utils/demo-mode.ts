/**
 * Demo Mode Utility
 * 
 * Provides centralized demo mode detection and configuration
 * Used to mark mock implementations and provide demo data when real APIs are unavailable
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface DemoModeConfig {
  enabled: boolean;
  reason?: string;
  apiKeysConfigured: boolean;
}

/**
 * Check if demo mode should be enabled
 * Demo mode is enabled when:
 * 1. DEMO_MODE environment variable is set to 'true'
 * 2. Required API keys are missing
 */
export function isDemoModeEnabled(): boolean {
  // Explicit demo mode flag
  if (process.env.DEMO_MODE === 'true') {
    return true;
  }
  
  // Auto-enable if critical API keys are missing
  const hasAnyApiKey = !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.PERPLEXITY_API_KEY ||
    process.env.CLIO_API_KEY
  );
  
  // If no API keys at all, enable demo mode
  return !hasAnyApiKey;
}

/**
 * Get demo mode configuration
 */
export function getDemoModeConfig(): DemoModeConfig {
  const enabled = isDemoModeEnabled();
  const apiKeysConfigured = !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.PERPLEXITY_API_KEY ||
    process.env.CLIO_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY
  );
  
  return {
    enabled,
    reason: enabled 
      ? (process.env.DEMO_MODE === 'true' 
          ? 'Explicitly enabled via DEMO_MODE environment variable'
          : 'Auto-enabled: No API keys configured')
      : undefined,
    apiKeysConfigured,
  };
}

/**
 * Get demo mode warning message
 */
export function getDemoModeWarning(toolName: string): string {
  const config = getDemoModeConfig();
  if (!config.enabled) return '';
  
  return `⚠️  ${toolName} is operating in DEMO MODE. Responses are simulated for demonstration purposes only. ${config.reason || ''}`;
}

/**
 * Mark response as demo/mock data
 */
export function markAsDemo<T>(data: T, toolName: string): T & { _demo: boolean; _demoWarning: string } {
  return {
    ...data,
    _demo: true,
    _demoWarning: getDemoModeWarning(toolName),
  } as T & { _demo: boolean; _demoWarning: string };
}

