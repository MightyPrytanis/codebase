/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { RAGService } from '../services/rag-service.js';
import { checkGeneratedContent } from '../services/ethics-check-helper.js';
import { systemicEthicsService } from '../services/systemic-ethics-service.js';
import { hipaaCompliance } from '../services/hipaa-compliance.js';

const RAGQuerySchema = z.object({
  action: z.enum(['query', 'ingest', 'ingest_batch', 'get_context', 'get_stats']).describe('Action to perform'),
  query: z.string().optional().describe('Query string for RAG search'),
  document: z.object({
    id: z.string(),
    text: z.string(),
    type: z.string().optional(),
    source: z.string().optional().describe('Data source identifier (e.g., "user-upload", "clio", "email")'),
    sourceType: z.enum(['user-upload', 'email', 'clio', 'courtlistener', 'westlaw', 'manual']).optional(),
  }).optional().describe('Document to ingest'),
  documents: z.array(z.object({
    id: z.string(),
    text: z.string(),
    type: z.string().optional(),
    source: z.string().optional().describe('Data source identifier (e.g., "user-upload", "clio", "email")'),
    sourceType: z.enum(['user-upload', 'email', 'clio', 'courtlistener', 'westlaw', 'manual']).optional(),
  })).optional().describe('Array of documents to ingest in batch'),
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
            enum: ['query', 'ingest', 'ingest_batch', 'get_context', 'get_stats'],
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
            description: 'Document to ingest (for ingest action)',
          },
          documents: {
            type: 'array',
            items: {
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
            },
            description: 'Array of documents to ingest in batch (for ingest_batch action)',
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
      const { action, query, document, documents, topK, minScore, filterByType, expandQuery, rerank, includeSourceInfo } = RAGQuerySchema.parse(args);

      // Extract user context for audit logging
      const userId = (args as any).userId || (args as any).user_id || null;
      const ipAddress = (args as any).ipAddress || (args as any).ip_address;
      const userAgent = (args as any).userAgent || (args as any).user_agent;

      switch (action) {
        case 'query':
          if (!query) {
            return this.createErrorResult('Query string is required for query action');
          }
          
          // Log privileged document access (RAG queries access client documents)
          if (userId) {
            try {
              await hipaaCompliance.logAccess(
                userId,
                null, // RAG queries may access multiple documents, so no specific entryId
                'view',
                ipAddress,
                userAgent
              );
            } catch (auditError) {
              // Don't fail the operation if audit logging fails
              console.warn('Failed to log RAG query access:', auditError);
            }
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
          
          // Format result with source notice (Rule 4: Foundation of Factual Claims - ensure source attribution)
          const formattedResult = {
            ...result,
            notice: result.sourceNotice || 'Data source information is available in citations.',
          };
          
          // Ethics check: Ensure source attribution is present (Rule 4 compliance)
          const resultText = JSON.stringify(formattedResult, null, 2);
          const ethicsCheck = await checkGeneratedContent(resultText, {
            toolName: 'rag_query',
            contentType: 'answer',
            strictMode: false, // RAG results have sources, so less strict
          });
          
          // If blocked, return error; if warnings, add to result
          if (ethicsCheck.ethicsCheck.blocked) {
            return this.createErrorResult(
              'Query result blocked by ethics check. Please ensure all sources are properly attributed.'
            );
          }
          
          // Add ethics metadata if warnings
          const finalResult = {
            ...formattedResult,
            ...(ethicsCheck.ethicsCheck.warnings.length > 0 && {
              _ethicsMetadata: {
                reviewed: true,
                warnings: ethicsCheck.ethicsCheck.warnings,
                complianceScore: ethicsCheck.ethicsCheck.complianceScore,
                auditId: ethicsCheck.ethicsCheck.auditId,
              },
            }),
          };
          
          return this.createSuccessResult(JSON.stringify(finalResult, null, 2));

        case 'ingest':
          if (!document) {
            return this.createErrorResult('Document is required for ingest action');
          }
          
          // Log privileged document access (ingesting client documents)
          if (userId) {
            try {
              await hipaaCompliance.logAccess(
                userId,
                document.id,
                'create', // Ingesting is creating a new entry in the RAG system
                ipAddress,
                userAgent
              );
            } catch (auditError) {
              // Don't fail the operation if audit logging fails
              console.warn('Failed to log RAG ingest access:', auditError);
            }
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

        case 'ingest_batch':
          if (!documents || documents.length === 0) {
            return this.createErrorResult('Documents array is required for ingest_batch action and must not be empty');
          }
          
          // Log privileged document access for batch ingest
          if (userId) {
            try {
              // Log access for each document in the batch
              await Promise.all(
                documents.map(doc =>
                  hipaaCompliance.logAccess(
                    userId,
                    doc.id,
                    'create',
                    ipAddress,
                    userAgent
                  )
                )
              );
            } catch (auditError) {
              // Don't fail the operation if audit logging fails
              console.warn('Failed to log RAG batch ingest access:', auditError);
            }
          }
          
          // Process documents in parallel with Promise.allSettled to handle individual failures
          const results = await Promise.allSettled(
            documents.map(doc => 
              this.ragService.ingestDocument({
                id: doc.id,
                text: doc.text,
                type: doc.type,
                source: doc.source,
                sourceType: doc.sourceType,
              })
            )
          );
          
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          const detailedResults = results.map((r, i) => ({
            documentId: documents[i].id,
            status: r.status === 'fulfilled' ? 'success' : 'failed',
            chunkIds: r.status === 'fulfilled' ? r.value : null,
            chunkCount: r.status === 'fulfilled' ? r.value.length : 0,
            error: r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : null,
            source: documents[i].source || 'unknown',
            sourceType: documents[i].sourceType || 'manual',
          }));
          
          return this.createSuccessResult(JSON.stringify({
            success: true,
            total: documents.length,
            successful,
            failed,
            results: detailedResults,
            notice: `Batch ingestion complete: ${successful} of ${documents.length} documents ingested successfully. ` +
                   `${failed > 0 ? `${failed} documents failed. ` : ''}` +
                   `All successful documents are now available for retrieval in RAG queries.`,
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
