/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  claimExtractor,
  citationChecker,
  citationFormatter,
  sourceVerifier,
  consistencyChecker,
} from '../../tools/verification/index.js';

const VerificationModuleInputSchema = z.object({
  action: z.enum([
    'extract_claims',
    'check_citations',
    'format_citations',
    'verify_sources',
    'check_consistency',
  ]).describe('Action to perform'),
  text: z.string().optional().describe('Text content to verify'),
  citations: z.array(z.string()).optional().describe('Citations to check or format'),
  claims: z.array(z.any()).optional().describe('Claims to check for consistency'),
  jurisdiction: z.string().optional().describe('Jurisdiction for citation formatting'),
  sources: z.array(z.string()).optional().describe('Sources to verify'),
});

/**
 * Verification Module
 * Shared Verification Module - Shared verification tools for claims, citations, sources, and consistency
 * 
 * Composes verification tools:
 * - Claim extraction
 * - Citation checking
 * - Citation formatting (jurisdiction-specific)
 * - Source verification
 * - Consistency checking
 */
export class VerificationModule extends BaseModule {
  constructor() {
    super({
      name: 'verification',
      description: 'Verification Module - Shared verification tools for claims, citations, sources, and consistency',
      version: '1.0.0',
      tools: [
        claimExtractor,
        citationChecker,
        citationFormatter,
        sourceVerifier,
        consistencyChecker,
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
      const { action, ...args } = VerificationModuleInputSchema.parse(input);

      switch (action) {
        case 'extract_claims':
          return await claimExtractor.execute({
            text: args.text,
          });

        case 'check_citations':
          return await citationChecker.execute({
            citations: args.citations || [],
            jurisdiction: args.jurisdiction,
          });

        case 'format_citations':
          return await citationFormatter.execute({
            citations: args.citations || [],
            jurisdiction: args.jurisdiction,
          });

        case 'verify_sources':
          return await sourceVerifier.execute({
            sources: args.sources || [],
          });

        case 'check_consistency':
          return await consistencyChecker.execute({
            claims: args.claims || [],
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `Verification module error: ${error instanceof Error ? error.message : String(error)}`
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

export const verificationModule = new VerificationModule();

