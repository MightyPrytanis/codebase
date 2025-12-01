/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Document Drafter Tool
 * Integrates with Microsoft Office and Adobe Acrobat to draft legal documents
 */

import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { officeIntegration } from '../services/office-integration.js';
import { AIService, AIProvider } from '../services/ai-service.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { apiValidator } from '../utils/api-validator.js';

const DocumentDrafterSchema = z.object({
  prompt: z.string().describe('Description of the document to draft'),
  documentType: z.enum(['motion', 'brief', 'letter', 'contract', 'pleading']).describe('Type of legal document'),
  format: z.enum(['docx', 'pdf']).default('docx').describe('Output format'),
  caseContext: z.string().optional().describe('Case context or case name'),
  jurisdiction: z.string().optional().describe('Jurisdiction for formatting rules'),
  aiProvider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use for drafting (default: auto-select)'),
});

export class DocumentDrafterTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'document_drafter',
      description: 'Draft legal documents using AI and generate in Microsoft Office (Word) or Adobe Acrobat (PDF) format',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Description of the document to draft',
          },
          documentType: {
            type: 'string',
            enum: ['motion', 'brief', 'letter', 'contract', 'pleading'],
            description: 'Type of legal document',
          },
          format: {
            type: 'string',
            enum: ['docx', 'pdf'],
            default: 'docx',
            description: 'Output format (Word or PDF)',
          },
          caseContext: {
            type: 'string',
            description: 'Case context or case name',
          },
          jurisdiction: {
            type: 'string',
            description: 'Jurisdiction for formatting rules',
          },
          aiProvider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto'],
            default: 'auto',
            description: 'AI provider to use for drafting (default: auto-select based on task and performance)',
          },
        },
        required: ['prompt', 'documentType'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const validated = DocumentDrafterSchema.parse(args);
      
      // Resolve provider (handle 'auto' mode with user sovereignty)
      let provider: AIProvider;
      if (validated.aiProvider === 'auto' || !validated.aiProvider) {
        // Use auto-select based on task profile
        provider = aiProviderSelector.getProviderForTask({
          taskType: 'document_drafting',
          subjectMatter: validated.jurisdiction,
          complexity: validated.documentType === 'brief' || validated.documentType === 'contract' ? 'high' : 'medium',
          preferredProvider: 'auto',
          balanceQualitySpeed: 'quality', // Prioritize quality for document drafting
        });
      } else {
        // User explicitly selected a provider (user sovereignty)
        const validation = apiValidator.validateProvider(validated.aiProvider as AIProvider);
        if (!validation.valid) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Selected AI provider ${validated.aiProvider} is not configured: ${validation.error}`,
                }),
              },
            ],
            isError: true,
          };
        }
        provider = validated.aiProvider as AIProvider;
      }
      
      // Use AI to generate document content
      const aiService = new AIService();
      const aiPrompt = `Draft a ${validated.documentType} legal document. ${validated.prompt}${validated.caseContext ? ` Case: ${validated.caseContext}` : ''}${validated.jurisdiction ? ` Jurisdiction: ${validated.jurisdiction}` : ''}. Format as a professional legal document with proper structure, headings, and sections.`;

      const aiResponse = await aiService.call(provider, aiPrompt, {
        maxTokens: 2000,
      });

      if (!aiResponse || typeof aiResponse !== 'string') {
        return this.createErrorResult('AI service failed to generate document content');
      }

      const documentContent = aiResponse;
      
      // Generate document in requested format
      const result = await officeIntegration.draftDocument(
        documentContent,
        validated.documentType,
        validated.format
      );

      if (!result.success) {
        return this.createErrorResult(result.error || 'Failed to generate document file');
      }

      return this.createSuccessResult(
        JSON.stringify({
          success: true,
          filePath: result.filePath,
          format: validated.format,
          documentType: validated.documentType,
          message: `Document generated successfully at ${result.filePath}`,
        })
      );
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Failed to draft document',
        'DocumentDrafterTool.execute'
      );
    }
  }
}



