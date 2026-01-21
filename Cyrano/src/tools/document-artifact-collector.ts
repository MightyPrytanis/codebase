/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const DocumentArtifactCollectorSchema = z.object({
  start_date: z.string().describe('Start date for document collection (YYYY-MM-DD)'),
  end_date: z.string().describe('End date for document collection (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID to filter documents'),
  document_types: z.array(z.enum(['motion', 'brief', 'letter', 'email', 'filing', 'other'])).optional().describe('Types of documents to collect'),
  include_drafts: z.boolean().default(false).describe('Include draft documents'),
});

export const documentArtifactCollector = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'document_artifact_collector',
      description: 'Collect document artifacts (sent documents, filed motions, drafts) as direct evidence for time reconstruction',
      inputSchema: {
        type: 'object' as const,
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for document collection (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date for document collection (YYYY-MM-DD)',
          },
          matter_id: {
            type: 'string',
            description: 'Optional matter ID to filter documents',
          },
          document_types: {
            type: 'array',
            items: { type: 'string', enum: ['motion', 'brief', 'letter', 'email', 'filing', 'other'] },
            description: 'Types of documents to collect',
          },
          include_drafts: {
            type: 'boolean',
            default: false,
            description: 'Include draft documents',
          },
        },
        required: ['start_date', 'end_date'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { start_date, end_date, matter_id, document_types, include_drafts } = DocumentArtifactCollectorSchema.parse(args);
      
      // Collect documents from available sources
      const documents: any[] = [];
      
      // Try Clio integration if available
      if (process.env.CLIO_API_KEY) {
        try {
          const { clioIntegration } = await import('./clio-integration.js');
          const clioResult = await clioIntegration.execute({
            action: 'search_documents',
            parameters: {
              start_date: start_date,
              end_date: end_date,
              matter_id: matter_id,
            },
          });
          
          const text = (clioResult.content?.[0] && clioResult.content[0].type === 'text' && 'text' in clioResult.content[0]) ? clioResult.content[0].text : '';
          if (!clioResult.isError && text) {
            if (typeof text === 'string') {
              const parsed = JSON.parse(text);
              if (parsed.documents && Array.isArray(parsed.documents)) {
                documents.push(...parsed.documents.map((doc: any) => ({
                  id: doc.id || `clio_${doc.document_id}`,
                  date: doc.created_at || doc.date || start_date,
                  type: this.inferDocumentType(doc.name || doc.title || ''),
                  title: doc.name || doc.title || 'Untitled Document',
                  filed: doc.filed || false,
                  evidence_type: doc.filed ? 'direct' : 'circumstantial',
                  matter_id: doc.matter_id || matter_id || null,
                  source: 'clio',
                  url: doc.url,
                })));
              }
            }
          }
        } catch (error) {
          console.warn('Clio document collection failed:', error);
        }
      }
      
      // Could also integrate with local filesystem, cloud storage, etc. here
      
      const result = {
        period: { start_date, end_date },
        matter_id: matter_id || null,
        documents_found: documents.length,
        documents: documents,
        sources_checked: ['clio'],
        note: documents.length > 0 
          ? `Collected ${documents.length} documents from Clio`
          : 'No documents found. Clio integration may not be configured or no documents match criteria.',
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in document_artifact_collector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public inferDocumentType(filename: string): 'motion' | 'brief' | 'letter' | 'email' | 'filing' | 'other' {
    const lower = filename.toLowerCase();
    if (lower.includes('motion')) return 'motion';
    if (lower.includes('brief')) return 'brief';
    if (lower.includes('letter') || lower.includes('correspondence')) return 'letter';
    if (lower.includes('email') || lower.includes('.eml')) return 'email';
    if (lower.includes('filing') || lower.includes('filed')) return 'filing';
    return 'other';
  }
})();