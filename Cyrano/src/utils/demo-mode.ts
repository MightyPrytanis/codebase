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
 * Demo mode is OPT-IN ONLY - enabled ONLY when:
 * 1. DEMO_MODE environment variable is explicitly set to 'true'
 * 
 * Demo mode is NOT auto-enabled when API keys are missing.
 * Missing credentials should return errors or N/A status, not mock data.
 */
export function isDemoModeEnabled(): boolean {
  // Explicit demo mode flag ONLY - no auto-enable
  return process.env.DEMO_MODE === 'true';
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
      ? 'Explicitly enabled via DEMO_MODE environment variable (opt-in only)'
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
