/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { RAGService } from '../services/rag-service.js';

const RAGQuerySchema = z.object({
  action: z.enum(['query', 'ingest', 'get_context', 'get_stats']).describe('Action to perform'),
  query: z.string().optional().describe('Query string for RAG search'),
  document: z.object({
    id: z.string(),
    text: z.string(),
    type: z.string().optional(),
    source: z.string().optional().describe('Data source identifier (e.g., "user-upload", "clio", "email")'),
    sourceType: z.enum(['user-upload', 'email', 'clio', 'courtlistener', 'westlaw', 'manual']).optional(),
  }).optional().describe('Document to ingest'),
  topK: z.number().optional().default(5).describe('Number of chunks to retrieve'),
  minScore: z.number().optional().default(0.0).describe('Minimum similarity score'),
  filterByType: z.array(z.string()).optional().describe('Filter documents by type'),
  expandQuery: z.boolean().optional().default(true).describe('Enable query expansion'),
  rerank: z.boolean().optional().default(true).describe('Enable reranking'),
  includeSourceInfo: z.boolean().optional().default(true).describe('Include data source information in results'),
});

export const ragQuery = new (class extends BaseTool {
  public ragService: RAGService;

  constructor() {
    super();
    this.ragService = new RAGService();
  }

  getToolDefinition() {
    return {
      name: 'rag_query',
      description: `Query the RAG (Retrieval-Augmented Generation) system to retrieve relevant context from ingested documents.

DATA SOURCE NOTICE: This tool retrieves information from documents that have been ingested into the system. 
Sources may include:
- User-uploaded documents
- Email attachments processed by the system
- Documents from Clio practice management integration
- Public legal documents from CourtListener
- Legal research from Westlaw
- Manually entered documents

All retrieved information includes source attribution for transparency and verification.`,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['query', 'ingest', 'get_context', 'get_stats'],
            description: 'Action to perform',
          },
          query: {
            type: 'string',
            description: 'Query string for RAG search',
          },
          document: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              type: { type: 'string' },
              source: { type: 'string', description: 'Data source identifier' },
              sourceType: { 
                type: 'string', 
                enum: ['user-upload', 'email', 'clio', 'courtlistener', 'westlaw', 'manual'],
                description: 'Type of data source'
              },
            },
            description: 'Document to ingest',
          },
          topK: {
            type: 'number',
            default: 5,
            description: 'Number of chunks to retrieve',
          },
          minScore: {
            type: 'number',
            default: 0.0,
            description: 'Minimum similarity score',
          },
          filterByType: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter documents by type',
          },
          expandQuery: {
            type: 'boolean',
            default: true,
            description: 'Enable query expansion with synonyms and related terms',
          },
          rerank: {
            type: 'boolean',
            default: true,
            description: 'Enable reranking of results for better relevance',
          },
          includeSourceInfo: {
            type: 'boolean',
            default: true,
            description: 'Include data source information in results',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, query, document, topK, minScore, filterByType, expandQuery, rerank, includeSourceInfo } = RAGQuerySchema.parse(args);

      switch (action) {
        case 'query':
          if (!query) {
            return this.createErrorResult('Query string is required for query action');
          }
          const result = await this.ragService.query(query, {
            topK,
            minScore,
            filterByType,
            expandQuery,
            rerank,
            includeMetadata: true,
            includeSourceInfo,
          });
          
          // Format result with source notice
          const formattedResult = {
            ...result,
            notice: result.sourceNotice || 'Data source information is available in citations.',
          };
          
          return this.createSuccessResult(JSON.stringify(formattedResult, null, 2));

        case 'ingest':
          if (!document) {
            return this.createErrorResult('Document is required for ingest action');
          }
          const chunkIds = await this.ragService.ingestDocument({
            id: document.id,
            text: document.text,
            type: document.type,
            source: document.source,
            sourceType: document.sourceType,
          });
          return this.createSuccessResult(JSON.stringify({
            success: true,
            documentId: document.id,
            chunkIds,
            chunkCount: chunkIds.length,
            source: document.source || 'unknown',
            sourceType: document.sourceType || 'manual',
            notice: `Document ingested from source: ${document.source || document.sourceType || 'unknown'}. ` +
                   `This document will be available for retrieval in RAG queries.`,
          }, null, 2));

        case 'get_context':
          if (!query) {
            return this.createErrorResult('Query string is required for get_context action');
          }
          const contextResult = await this.ragService.query(query, {
            topK,
            expandQuery,
            rerank,
            includeSourceInfo: true,
          });
          return this.createSuccessResult(JSON.stringify({
            query,
            context: contextResult.context,
            topK,
            dataSources: contextResult.dataSources,
            sourceNotice: contextResult.sourceNotice,
          }, null, 2));

        case 'get_stats':
          const stats = this.ragService.getStats();
          return this.createSuccessResult(JSON.stringify({
            ...stats,
            notice: `RAG system contains ${stats.documentCount} documents from ${stats.dataSources.length} data sources: ${stats.dataSources.join(', ')}.`,
          }, null, 2));

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(`RAG query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
})();
