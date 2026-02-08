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
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';
import { checkGeneratedContent } from '../services/ethics-check-helper.js';
import { mcrComplianceService, DocumentMetadata } from '../services/mcr-compliance-service.js';
import { hipaaCompliance } from '../services/hipaa-compliance.js';

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
        type: 'object' as const,
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
      
      // Extract user context for audit logging
      const userId = (args as any).userId || (args as any).user_id || null;
      const ipAddress = (args as any).ipAddress || (args as any).ip_address;
      const userAgent = (args as any).userAgent || (args as any).user_agent;
      const documentId = (args as any).documentId || (args as any).document_id || `draft_${Date.now()}`;
      
      // Log privileged document access (document drafting accesses client data)
      if (userId) {
        try {
          await hipaaCompliance.logAccess(
            userId,
            documentId,
            'create', // Drafting creates a new document
            ipAddress,
            userAgent
          );
        } catch (auditError) {
          // Don't fail the operation if audit logging fails
          console.warn('Failed to log document drafter access:', auditError);
        }
      }
      
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
      
      // Use AI to generate document content
      const aiService = new AIService();
      const aiPrompt = `Draft a ${validated.documentType} legal document. ${validated.prompt}${validated.caseContext ? ` Case: ${validated.caseContext}` : ''}${validated.jurisdiction ? ` Jurisdiction: ${validated.jurisdiction}` : ''}. Format as a professional legal document with proper structure, headings, and sections.`;

      // Prepare system prompt with Ten Rules injection
      let systemPrompt = `You are an expert legal document drafter. Create accurate, well-structured legal documents.`;
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');

      // Note: ai-service now automatically injects Ten Rules and checks outputs
      // We still do our own check for tool-specific validation, but pass metadata for audit trail
      const aiResponse = await aiService.call(provider, aiPrompt, {
        systemPrompt, // Already has Ten Rules injected
        maxTokens: 2000,
        metadata: {
          toolName: 'document_drafter',
          actionType: 'content_generation',
          skipEthicsCheck: false, // Let ai-service do initial check, we'll do tool-specific check after
        },
      });

      if (!aiResponse || typeof aiResponse !== 'string') {
        return this.createErrorResult('AI service failed to generate document content');
      }

      // Tool-specific ethics check: Ensure drafted content complies with Ten Rules
      // (ai-service already checked, but we do additional tool-specific validation)
      const ethicsCheck = await checkGeneratedContent(aiResponse, {
        toolName: 'document_drafter',
        contentType: 'draft',
        strictMode: true, // Strict for legal documents
      });

      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return this.createErrorResult(
          'Document draft blocked by ethics check. Draft does not meet Ten Rules compliance standards.'
        );
      }

      const documentContent = aiResponse;
      
      // MCR Compliance Validation before finalization
      // Map documentType to filingType (letter/contract map to other)
      const filingTypeMap: Record<string, DocumentMetadata['filingType']> = {
        motion: 'motion',
        brief: 'brief',
        pleading: 'pleading',
        order: 'order',
        letter: 'other',
        contract: 'other',
      };

      const metadata: DocumentMetadata = {
        title: validated.prompt.substring(0, 100),
        caseNumber: validated.caseContext,
        court: validated.jurisdiction ? `${validated.jurisdiction} Court` : undefined,
        filingType: filingTypeMap[validated.documentType] || 'other',
        format: validated.format,
      };

      const mcrValidation = mcrComplianceService.validateDocument(documentContent, metadata, {
        checkFormat: true,
        checkEFiling: validated.format === 'pdf',
        checkCitations: true,
      });

      // Collect warnings and violations
      const warnings: string[] = [];
      const violations: string[] = [];

      if (mcrValidation.overall.violations.length > 0) {
        mcrValidation.overall.violations.forEach(v => {
          violations.push(`[${v.rule}] ${v.description}${v.fix ? ` - Fix: ${v.fix}` : ''}`);
        });
      }

      if (mcrValidation.overall.warnings.length > 0) {
        mcrValidation.overall.warnings.forEach(w => {
          warnings.push(`[${w.rule}] ${w.description} - ${w.recommendation}`);
        });
      }

      // If critical violations exist, include them in response but don't block
      // (Attorney review will catch these, but we flag them)
      const mcrStatus = {
        compliant: mcrValidation.overall.compliant,
        violations: violations,
        warnings: warnings,
        recommendations: mcrValidation.overall.recommendations,
      };
      
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
          mcrCompliance: mcrStatus,
          attorneyReviewRequired: !mcrValidation.overall.compliant || violations.length > 0,
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

// Export pre-instantiated tool instance (standard pattern)
export const documentDrafterTool = new DocumentDrafterTool();

}
}
}