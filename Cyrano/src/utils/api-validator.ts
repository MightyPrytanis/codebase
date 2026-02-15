/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';

/**
 * API Configuration and Validation
 * 
 * Validates that required API keys are present and properly formatted
 */

export interface APIConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  gemini?: string;
  perplexity?: string;
  xai?: string;
  deepseek?: string;
  openrouter?: string;
}

export class APIValidator {
  private static instance: APIValidator;
  private config: APIConfig = {};
  private validated: boolean = false;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): APIValidator {
    if (!APIValidator.instance) {
      APIValidator.instance = new APIValidator();
    }
    return APIValidator.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   * This allows tests to reload config with different environment variables
   */
  public static resetInstance(): void {
    APIValidator.instance = undefined as any;
  }

  private loadConfig(): void {
    this.config = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
      xai: process.env.XAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };
  }

  public validateProvider(provider: string): { valid: boolean; error?: string } {
    switch (provider.toLowerCase()) {
      case 'openai':
      case 'gpt-4':
      case 'gpt-3.5':
        if (!this.config.openai) {
          return { valid: false, error: 'OPENAI_API_KEY environment variable is required for OpenAI integration' };
        }
        if (!this.config.openai.startsWith('sk-')) {
          return { valid: false, error: 'Invalid OpenAI API key format (must start with sk-)' };
        }
        return { valid: true };

      case 'anthropic':
      case 'claude':
        if (!this.config.anthropic) {
          return { valid: false, error: 'ANTHROPIC_API_KEY environment variable is required for Claude integration' };
        }
        if (!this.config.anthropic.startsWith('sk-ant-')) {
          return { valid: false, error: 'Invalid Anthropic API key format (must start with sk-ant-)' };
        }
        return { valid: true };

      case 'google':
      case 'gemini':
        if (!this.config.google && !this.config.gemini) {
          return { valid: false, error: 'GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required for Google AI integration' };
        }
        return { valid: true };

      case 'perplexity':
        if (!this.config.perplexity) {
          return { valid: false, error: 'PERPLEXITY_API_KEY environment variable is required for Perplexity integration' };
        }
        if (!this.config.perplexity.startsWith('pplx-')) {
          return { valid: false, error: 'Invalid Perplexity API key format (must start with pplx-)' };
        }
        return { valid: true };

      case 'xai':
      case 'grok':
        if (!this.config.xai) {
          return { valid: false, error: 'XAI_API_KEY environment variable is required for xAI Grok integration' };
        }
        if (!this.config.xai.startsWith('xai-')) {
          return { valid: false, error: 'Invalid xAI API key format (must start with xai-)' };
        }
        return { valid: true };

      case 'deepseek':
        if (!this.config.deepseek) {
          return { valid: false, error: 'DEEPSEEK_API_KEY environment variable is required for DeepSeek integration' };
        }
        if (!this.config.deepseek.startsWith('sk-')) {
          return { valid: false, error: 'Invalid DeepSeek API key format (must start with sk-)' };
        }
        return { valid: true };

      case 'openrouter':
        if (!this.config.openrouter) {
          return { valid: false, error: 'OPENROUTER_API_KEY environment variable is required for OpenRouter integration' };
        }
        // OpenRouter keys can start with various prefixes, so we just check it exists
        if (!this.config.openrouter || this.config.openrouter.length < 10) {
          return { valid: false, error: 'Invalid OpenRouter API key format' };
        }
        return { valid: true };

      default:
        return { valid: false, error: `Unknown AI provider: ${provider}. Supported providers: openai, anthropic, google, perplexity, xai, deepseek, openrouter` };
    }
  }

  public validateAllProviders(providers: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const provider of providers) {
      const result = this.validateProvider(provider);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public getAvailableProviders(): string[] {
    const available: string[] = [];

    if (this.config.openai) available.push('openai');
    if (this.config.anthropic) available.push('anthropic');
    if (this.config.google || this.config.gemini) available.push('google');
    if (this.config.perplexity) available.push('perplexity');
    if (this.config.xai) available.push('xai');
    if (this.config.deepseek) available.push('deepseek');

    return available;
  }

  public hasAnyValidProviders(): boolean {
    return this.getAvailableProviders().length > 0;
  }

  public getConfigSummary(): { configured: string[]; missing: string[]; total: number } {
    const allProviders = ['openai', 'anthropic', 'google', 'perplexity', 'xai', 'deepseek', 'openrouter'];
    const configured = this.getAvailableProviders();
    const missing = allProviders.filter(p => !configured.includes(p));
    
    return {
      configured,
      missing,
      total: allProviders.length
    };
  }

  /**
   * Reload configuration from environment variables
   * Useful when .env file is loaded after module import
   */
  public reloadConfig(): void {
    this.loadConfig();
    this.validated = false;
  }
}

export const apiValidator = APIValidator.getInstance();
