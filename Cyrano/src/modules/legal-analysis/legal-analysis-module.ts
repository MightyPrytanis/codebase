/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { documentAnalyzer } from '../../tools/document-analyzer.js';
import { contractComparator } from '../../tools/contract-comparator.js';
import { legalReviewer } from '../../tools/legal-reviewer.js';
import { complianceChecker } from '../../tools/compliance-checker.js';
import { qualityAssessor } from '../../tools/quality-assessor.js';
import { redFlagFinder } from '../../tools/red-flag-finder.js';

const LegalAnalysisModuleInputSchema = z.object({
  action: z.enum([
    'analyze_document',
    'compare_contracts',
    'review_legal',
    'check_compliance',
    'assess_quality',
    'find_red_flags',
  ]).describe('Action to perform'),
  document_text: z.string().optional().describe('Document text to analyze'),
  analysis_type: z.enum(['comprehensive', 'summary', 'key_points', 'metadata']).optional().describe('Analysis type'),
  focus_areas: z.array(z.string()).optional().describe('Focus areas for analysis'),
  contract_a: z.string().optional().describe('First contract text'),
  contract_b: z.string().optional().describe('Second contract text'),
  legal_document: z.string().optional().describe('Legal document to review'),
  compliance_standard: z.string().optional().describe('Compliance standard to check'),
  document: z.string().optional().describe('Document to assess quality'),
  matter_id: z.string().optional().describe('Matter ID for red flag checking'),
  date_range: z.object({
    start: z.string(),
    end: z.string(),
  }).optional().describe('Date range for red flag checking'),
});

/**
 * Legal Analysis Module
 * Comprehensive Legal Analysis Module - Legal document analysis, review, and assessment
 * 
 * Composes legal analysis tools:
 * - Document analysis (comprehensive, summary, key points, metadata)
 * - Contract comparison
 * - Legal review
 * - Compliance checking
 * - Quality assessment
 * - Red flag finding
 */
export class LegalAnalysisModule extends BaseModule {
  constructor() {
    super({
      name: 'legal_analysis',
      description: 'Legal Analysis Module - Comprehensive legal document analysis, review, and assessment',
      version: '1.0.0',
      tools: [
        documentAnalyzer,
        contractComparator,
        legalReviewer,
        complianceChecker,
        qualityAssessor,
        redFlagFinder,
      ],
    });
  }

  async initialize(): Promise<void> {
    // Module is initialized with tools in constructor
  }

  async cleanup(): Promise<void> {
    // Cleanup if needed
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const { action, ...args } = LegalAnalysisModuleInputSchema.parse(input);

      switch (action) {
        case 'analyze_document':
          return await documentAnalyzer.execute({
            document_text: args.document_text,
            analysis_type: args.analysis_type,
            focus_areas: args.focus_areas,
          });

        case 'compare_contracts':
          return await contractComparator.execute({
            contract_a: args.contract_a,
            contract_b: args.contract_b,
          });

        case 'review_legal':
          return await legalReviewer.execute({
            legal_document: args.legal_document,
          });

        case 'check_compliance':
          return await complianceChecker.execute({
            document_text: args.document_text,
            compliance_standard: args.compliance_standard,
          });

        case 'assess_quality':
          return await qualityAssessor.execute({
            document: args.document,
          });

        case 'find_red_flags':
          return await redFlagFinder.execute({
            matter_id: args.matter_id,
            date_range: args.date_range,
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `LegalAnalysis module error: ${error instanceof Error ? error.message : String(error)}`
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

export const legalAnalysisModule = new LegalAnalysisModule();

}
}
}
}