/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ragQuery } from '../../tools/rag-query.js';

const RagModuleInputSchema = z.object({
  action: z.enum([
    'query',
    'ingest',
    'ingest_batch',
    'get_context',
    'get_stats',
  ]).describe('Action to perform'),
  query: z.string().optional().describe('Query string for RAG search'),
  document: z.any().optional().describe('Document to ingest'),
  documents: z.array(z.any()).optional().describe('Array of documents to ingest in batch'),
  topK: z.number().optional().describe('Number of chunks to retrieve'),
  minScore: z.number().optional().describe('Minimum similarity score'),
  filterByType: z.array(z.string()).optional().describe('Filter documents by type'),
  expandQuery: z.boolean().optional().describe('Enable query expansion'),
  rerank: z.boolean().optional().describe('Enable reranking'),
  includeSourceInfo: z.boolean().optional().describe('Include data source information'),
});

/**
 * RAG Module
 * Retrieval-Augmented Generation Module - Document search and knowledge retrieval
 * 
 * Composes RAG tool and resources:
 * - RAG Query tool for document search and ingestion
 * - Resources are managed internally by ragQuery service
 */
export class RagModule extends BaseModule {

  constructor() {
    super({
      name: 'rag',
      description: 'RAG Module - Retrieval-Augmented Generation for document search and knowledge retrieval',
      version: '1.0.0',
      tools: [ragQuery],
      resources: [],
    });
  }

  async initialize(): Promise<void> {
    // Module is initialized with tools and resources in constructor
  }

  async cleanup(): Promise<void> {
    // Cleanup if needed
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const { action, ...args } = RagModuleInputSchema.parse(input);

      // Validate required fields before delegating to ragQuery
      switch (action) {
        case 'query':
          if (!args.query) {
            return this.createErrorResult('query is required for query action');
          }
          return await ragQuery.execute({
            action,
            ...args,
          });

        case 'ingest':
          if (!args.document) {
            return this.createErrorResult('document is required for ingest action');
          }
          return await ragQuery.execute({
            action,
            ...args,
          });

        case 'ingest_batch':
          if (!args.documents || args.documents.length === 0) {
            return this.createErrorResult('documents array is required for ingest_batch action and must not be empty');
          }
          return await ragQuery.execute({
            action,
            ...args,
          });

        case 'get_context':
          if (!args.query) {
            return this.createErrorResult('query is required for get_context action');
          }
          return await ragQuery.execute({
            action,
            ...args,
          });

        case 'get_stats':
          return await ragQuery.execute({
            action,
            ...args,
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `RAG module error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private createErrorResult(message: string): CallToolResult {
    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }
}

export const ragModule = new RagModule();
