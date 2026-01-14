/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  arkiverEntityProcessor,
  arkiverInsightProcessor,
  arkiverTimelineProcessor,
} from '../../tools/arkiver-processor-tools.js';
import {
  claimExtractor,
  citationChecker,
  sourceVerifier,
  consistencyChecker,
} from '../../tools/verification/index.js';

const ArkAnalystInputSchema = z.object({
  action: z.enum([
    'extract_entities',
    'generate_insights',
    'extract_timeline',
  ]).describe('Action to perform'),
  content: z.string().optional().describe('Content to analyze'),
  source: z.string().optional().describe('Source identifier'),
  extractionMode: z.enum(['standard', 'deep', 'fast']).optional().describe('Extraction mode'),
  insightType: z.enum(['general', 'legal', 'medical', 'business']).optional().describe('Type of insights'),
  customPrompt: z.string().optional().describe('Custom prompt for insight extraction'),
  jurisdiction: z.string().optional().describe('Jurisdiction for legal analysis'),
});

/**
 * ArkAnalyst Module
 * Content Analysis Module - Analyzes processed content for entities, insights, and timelines
 * 
 * Composes analysis tools for:
 * - Entity extraction (parties, attorneys, judges, dates, etc.)
 * - Insight generation (AI-powered analysis)
 * - Timeline extraction (chronological events)
 * 
 * Includes shared verification tools:
 * - Claim extraction
 * - Citation checking
 * - Source verification
 * - Consistency checking
 */
export class ArkAnalystModule extends BaseModule {
  constructor() {
    super({
      name: 'ark_analyst',
      description: 'Content Analysis Module - Analyzes processed content for entities, insights, and timelines',
      version: '1.0.0',
      tools: [
        arkiverEntityProcessor,
        arkiverInsightProcessor,
        arkiverTimelineProcessor,
        // Shared verification tools
        claimExtractor,
        citationChecker,
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
      const { action, ...args } = ArkAnalystInputSchema.parse(input);

      switch (action) {
        case 'extract_entities':
          return await arkiverEntityProcessor.execute({
            content: args.content,
            source: args.source,
            extractionMode: args.extractionMode,
          });

        case 'generate_insights':
          return await arkiverInsightProcessor.execute({
            content: args.content,
            source: args.source,
            extractionMode: args.extractionMode,
            insightType: args.insightType,
            customPrompt: args.customPrompt,
            jurisdiction: args.jurisdiction,
          });

        case 'extract_timeline':
          return await arkiverTimelineProcessor.execute({
            content: args.content,
            source: args.source,
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `ArkAnalyst module error: ${error instanceof Error ? error.message : String(error)}`
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

export const arkAnalystModule = new ArkAnalystModule();


}
}
}
}