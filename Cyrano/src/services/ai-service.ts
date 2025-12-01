/**
 * AI Service
 * 
 * Centralized service for making AI provider calls.
 * Used by engines and tools to interact with various AI providers.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { PerplexityService } from './perplexity.js';
import { APIValidator } from '../utils/api-validator.js';
import { aiPerformanceTracker } from './ai-performance-tracker.js';

export type AIProvider = 'openai' | 'anthropic' | 'perplexity' | 'google' | 'xai' | 'deepseek';

export interface AICallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export class AIService {
  private apiValidator: APIValidator;

  constructor() {
    this.apiValidator = APIValidator.getInstance();
  }

  /**
   * Call an AI provider with a prompt
   * Tracks performance metrics automatically
   */
  async call(
    provider: AIProvider,
    prompt: string,
    options: AICallOptions = {}
  ): Promise<string> {
    // Validate provider
    const validation = this.apiValidator.validateProvider(provider);
    if (!validation.valid) {
      throw new Error(`AI provider ${provider} not configured: ${validation.error}`);
    }

    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let cost = 0;

    try {
      let result: string;
      
      switch (provider) {
        case 'anthropic':
          result = await this.callAnthropic(prompt, options);
          // Estimate tokens (rough: ~4 chars per token)
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $15 per 1M input tokens, $75 per 1M output tokens
          cost = (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
          break;
        
        case 'openai':
          result = await this.callOpenAI(prompt, options);
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $5 per 1M input tokens, $15 per 1M output tokens (gpt-4o)
          cost = (inputTokens / 1_000_000) * 5 + (outputTokens / 1_000_000) * 15;
          break;
        
        case 'perplexity':
          result = await this.callPerplexity(prompt, options);
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $0.20 per 1M input tokens, $1.00 per 1M output tokens
          cost = (inputTokens / 1_000_000) * 0.2 + (outputTokens / 1_000_000) * 1.0;
          break;
        
        case 'google':
          result = await this.callGoogle(prompt, options);
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $0.075 per 1M input tokens, $0.30 per 1M output tokens (flash)
          cost = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.3;
          break;
        
        case 'xai':
          result = await this.callXAI(prompt, options);
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $2 per 1M input tokens, $10 per 1M output tokens
          cost = (inputTokens / 1_000_000) * 2 + (outputTokens / 1_000_000) * 10;
          break;
        
        case 'deepseek':
          result = await this.callDeepSeek(prompt, options);
          inputTokens = Math.ceil(prompt.length / 4);
          outputTokens = Math.ceil(result.length / 4);
          // Rough cost estimate: $0.14 per 1M input tokens, $0.28 per 1M output tokens
          cost = (inputTokens / 1_000_000) * 0.14 + (outputTokens / 1_000_000) * 0.28;
          break;
        
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      const latency = Date.now() - startTime;
      
      // Record successful request
      aiPerformanceTracker.recordSuccess(
        provider,
        latency,
        inputTokens,
        outputTokens,
        cost
      );

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Record failed request
      aiPerformanceTracker.recordFailure(provider, latency);
      
      throw new Error(
        `AI call to ${provider} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Call Anthropic Claude
   */
  private async callAnthropic(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({ apiKey });
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'user',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await anthropic.messages.create({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature,
      messages: messages as any,
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'AI response failed';
  }

  /**
   * Call OpenAI GPT
   */
  private async callOpenAI(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature,
    });

    return response.choices[0].message.content || 'AI response failed';
  }

  /**
   * Call Perplexity
   */
  private async callPerplexity(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    const perplexityService = new PerplexityService({ apiKey });
    
    const systemPrompt = options.systemPrompt || 
      'You are a helpful AI assistant providing accurate and useful information.';

    const request = {
      model: options.model || 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature,
    };

    const response = await perplexityService.makeRequest(request);
    return response.choices[0]?.message?.content || 'AI response failed';
  }

  /**
   * Call Google Gemini
   */
  private async callGoogle(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY not configured');
    }

    const model = options.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt,
        }],
      }],
    };

    if (options.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{
          text: options.systemPrompt,
        }],
      };
    }

    if (options.maxTokens) {
      requestBody.generationConfig = {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      };
    } else if (options.temperature !== undefined) {
      requestBody.generationConfig = {
        temperature: options.temperature,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Gemini API error: ${response.status} ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI response failed';
  }

  /**
   * Call xAI Grok
   */
  private async callXAI(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const url = 'https://api.x.ai/v1/chat/completions';
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });

    const requestBody = {
      model: options.model || 'grok-beta',
      messages: messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error: ${response.status} ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'AI response failed';
  }

  /**
   * Call DeepSeek
   */
  private async callDeepSeek(prompt: string, options: AICallOptions): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const url = 'https://api.deepseek.com/v1/chat/completions';
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });

    const requestBody = {
      model: options.model || 'deepseek-chat',
      messages: messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'AI response failed';
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    const validation = this.apiValidator.validateProvider(provider);
    return validation.valid;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const allProviders: AIProvider[] = ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'];
    return allProviders.filter(p => this.isProviderAvailable(p));
  }
}

// Export singleton instance
export const aiService = new AIService();

