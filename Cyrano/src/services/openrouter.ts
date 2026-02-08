/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import OpenAI from 'openai';

export interface OpenRouterConfig {
  apiKey: string;
  baseURL?: string;
  siteUrl?: string;
  siteName?: string;
  timeout?: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

/**
 * Popular OpenRouter Models
 * See https://openrouter.ai/models for full list
 */
export const OPENROUTER_MODELS = {
  // Free models
  GEMMA_2_9B_FREE: 'google/gemma-2-9b-it:free',
  MISTRAL_7B_FREE: 'mistralai/mistral-7b-instruct:free',
  
  // Paid models (low cost)
  GEMINI_2_FLASH: 'google/gemini-2.0-flash-001',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct',
  LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct',
  
  // High performance models
  GPT_4O: 'openai/gpt-4o',
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  GEMINI_PRO: 'google/gemini-pro',
} as const;

export type OpenRouterModel = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS] | string;

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private client: OpenAI;
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    
    // OpenRouter is OpenAI-compatible, so we use the OpenAI SDK
    this.client = new OpenAI({
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      apiKey: config.apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.siteUrl || 'https://cyrano.legal',
        'X-Title': config.siteName || 'Cyrano Legal AI',
      },
    });
  }

  /**
   * Make a request to OpenRouter API
   */
  async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as any,
        max_tokens: request.max_tokens,
        temperature: request.temperature,
        top_p: request.top_p,
        stream: request.stream,
      });

      // Handle streaming vs non-streaming responses
      if (request.stream && 'Symbol' in completion && (completion as any)[Symbol.asyncIterator]) {
        // Streaming response - return a simplified response
        return {
          id: 'stream-' + Date.now(),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };
      }

      // Non-streaming response
      const nonStreamCompletion = completion as any;
      return {
        id: nonStreamCompletion.id || 'unknown',
        object: nonStreamCompletion.object || 'chat.completion',
        created: nonStreamCompletion.created || Math.floor(Date.now() / 1000),
        model: nonStreamCompletion.model || request.model,
        choices: (nonStreamCompletion.choices || []).map((choice: any) => ({
          index: choice.index || 0,
          message: {
            role: choice.message?.role || 'assistant',
            content: choice.message?.content || '',
          },
          finish_reason: choice.finish_reason || 'stop',
        })),
        usage: {
          prompt_tokens: nonStreamCompletion.usage?.prompt_tokens || 0,
          completion_tokens: nonStreamCompletion.usage?.completion_tokens || 0,
          total_tokens: nonStreamCompletion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
      throw new Error('OpenRouter API error: Unknown error occurred');
    }
  }

  /**
   * Simple chat completion
   */
  async chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  }): Promise<string> {
    const request: OpenRouterRequest = {
      model: options?.model || OPENROUTER_MODELS.GEMMA_2_9B_FREE,
      messages,
      max_tokens: options?.max_tokens,
      temperature: options?.temperature,
    };

    const response = await this.makeRequest(request);
    return response.choices[0]?.message?.content || 'AI response failed';
}
}

}
}
}
}
}
)
}