/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import OpenAI from 'openai';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private defaultModel = 'text-embedding-3-small';
  private fallbackModel = 'text-embedding-ada-002';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Embedding generation requires OPENAI_API_KEY.');
    }

    const targetModel = model || this.defaultModel;

    try {
      const response = await this.openai.embeddings.create({
        model: targetModel,
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        dimensions: response.data[0].embedding.length,
      };
    } catch (error) {
      // Try fallback model if default fails
      if (targetModel === this.defaultModel && this.fallbackModel) {
        try {
          const response = await this.openai.embeddings.create({
            model: this.fallbackModel,
            input: text,
          });

          return {
            embedding: response.data[0].embedding,
            model: response.model,
            dimensions: response.data[0].embedding.length,
          };
        } catch (fallbackError) {
          throw new Error(`Embedding generation failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
        }
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Embedding generation requires OPENAI_API_KEY.');
    }

    const targetModel = model || this.defaultModel;
    const results: EmbeddingResult[] = [];

    // OpenAI supports up to 2048 inputs per batch
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        const response = await this.openai.embeddings.create({
          model: targetModel,
          input: batch,
        });

        results.push(...response.data.map(item => ({
          embedding: item.embedding,
          model: response.model,
          dimensions: item.embedding.length,
        })));
      } catch (error) {
        // Try fallback model if default fails
        if (targetModel === this.defaultModel && this.fallbackModel) {
          try {
            const response = await this.openai.embeddings.create({
              model: this.fallbackModel,
              input: batch,
            });

            results.push(...response.data.map(item => ({
              embedding: item.embedding,
              model: response.model,
              dimensions: item.embedding.length,
            })));
          } catch (fallbackError) {
            throw new Error(`Batch embedding generation failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
          }
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Check if embedding service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    if (!this.openai) {
      return [];
    }
    return [this.defaultModel, this.fallbackModel];
}
}
