/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * MCR Validator Tool
 * Validates documents for Michigan Court Rules compliance
 */

import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { mcrComplianceService, DocumentMetadata } from '../services/mcr-compliance-service.js';

const MCRValidatorSchema = z.object({
  document: z.string().describe('Document text to validate'),
  documentType: z.enum(['motion', 'brief', 'letter', 'contract', 'pleading', 'order', 'other']).optional().describe('Type of legal document'),
  caseNumber: z.string().optional().describe('Case number'),
  court: z.string().optional().describe('Court name'),
  format: z.enum(['docx', 'pdf', 'txt']).optional().describe('Document format'),
  checkFormat: z.boolean().default(true).describe('Check document formatting (MCR 2.113)'),
  checkEFiling: z.boolean().default(false).describe('Check e-filing specifications (MCR 1.109)'),
  checkService: z.boolean().default(false).describe('Check service of process (MCR 2.105)'),
  checkCitations: z.boolean().default(true).describe('Check citation formatting'),
});

export const mcrValidator = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'mcr_validator',
      description: 'Validate legal documents for Michigan Court Rules (MCR) compliance. Checks document formatting (MCR 2.113), e-filing specifications (MCR 1.109), service of process (MCR 2.105), and citation formatting per Michigan Appellate Opinions Manual.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document: {
            type: 'string',
            description: 'Document text to validate',
          },
          documentType: {
            type: 'string',
            enum: ['motion', 'brief', 'letter', 'contract', 'pleading', 'order', 'other'],
            description: 'Type of legal document',
          },
          caseNumber: {
            type: 'string',
            description: 'Case number',
          },
          court: {
            type: 'string',
            description: 'Court name',
          },
          format: {
            type: 'string',
            enum: ['docx', 'pdf', 'txt'],
            description: 'Document format',
          },
          checkFormat: {
            type: 'boolean',
            default: true,
            description: 'Check document formatting (MCR 2.113)',
          },
          checkEFiling: {
            type: 'boolean',
            default: false,
            description: 'Check e-filing specifications (MCR 1.109)',
          },
          checkService: {
            type: 'boolean',
            default: false,
            description: 'Check service of process (MCR 2.105)',
          },
          checkCitations: {
            type: 'boolean',
            default: true,
            description: 'Check citation formatting',
          },
        },
        required: ['document'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const validated = MCRValidatorSchema.parse(args);

      // Map documentType to filingType
      const filingTypeMap: Record<string, DocumentMetadata['filingType']> = {
        motion: 'motion',
        brief: 'brief',
        pleading: 'pleading',
        order: 'order',
      };

      const metadata: DocumentMetadata = {
        filingType: validated.documentType ? (filingTypeMap[validated.documentType] || 'other') : undefined,
        caseNumber: validated.caseNumber,
        court: validated.court,
        format: validated.format,
      };

      const validation = mcrComplianceService.validateDocument(
        validated.document,
        metadata,
        {
          checkFormat: validated.checkFormat,
          checkEFiling: validated.checkEFiling,
          checkService: validated.checkService,
          checkCitations: validated.checkCitations,
        }
      );

      return this.createSuccessResult(
        JSON.stringify({
          compliant: validation.overall.compliant,
          violations: validation.overall.violations.map(v => ({
            rule: v.rule,
            description: v.description,
            severity: v.severity,
            fix: v.fix,
          })),
          warnings: validation.overall.warnings.map(w => ({
            rule: w.rule,
            description: w.description,
            recommendation: w.recommendation,
          })),
          recommendations: validation.overall.recommendations,
          details: {
            format: validation.format,
            eFiling: validation.eFiling,
            service: validation.service,
            citations: validation.citations,
          },
          attorneyReviewRequired: !validation.overall.compliant || validation.overall.violations.length > 0,
        }, null, 2)
      );
    } catch (error) {
      return this.createErrorResult(
        `MCR validation error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}