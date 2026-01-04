/**
 * Ethics Reviewer Tool
 * 
 * PROFESSIONAL RESPONSIBILITY REVIEWER (NOT AI Ethics)
 * 
 * Uses JSON Rules Engine to evaluate compliance with PROFESSIONAL ETHICS RULES:
 * - Model Rules of Professional Conduct (MRPC)
 * - State bar ethics rules
 * - Attorney-client relationship rules
 * - Conflict of interest rules
 * - Confidentiality and privilege rules
 * 
 * This tool evaluates ATTORNEY BEHAVIOR, not AI behavior.
 * For AI Ethics evaluation (Ten Rules), use ethical_ai_guard tool.
 * 
 * Integrates with GoodCounsel engine
 * 
 * Created: 2025-11-26
 * Updated: 2025-12-21 (clarified distinction from AI Ethics)
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from '../../../tools/base-tool.js';
import { z } from 'zod';
import { ethicsRulesService, EthicsReviewResult } from '../services/ethics-rules-service.js';

const EthicsReviewerSchema = z.object({
  userId: z.string().optional().describe('User ID for ethics review'),
  facts: z.record(z.string(), z.any()).describe('Facts to evaluate against ethics rules'),
  includeWarnings: z.boolean().default(true).describe('Include warnings in results'),
});

export const ethicsReviewer = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ethics_reviewer',
      description: 'Review ethical compliance using rule-based evaluation. Evaluates facts against ethics rules and returns violations, warnings, and compliance status.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User ID for ethics review',
          },
          facts: {
            type: 'object',
            description: 'Facts to evaluate against ethics rules (e.g., hasExistingClient, newClientInterests, clientInfoDisclosed, etc.)',
            additionalProperties: true,
          },
          includeWarnings: {
            type: 'boolean',
            default: true,
            description: 'Include warnings in results',
          },
        },
        required: ['facts'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { userId, facts, includeWarnings } = EthicsReviewerSchema.parse(args);

      // Run ethics review
      const result: EthicsReviewResult = await ethicsRulesService.runReview(facts, userId);

      // Filter warnings if not requested
      const filteredResult = includeWarnings
        ? result
        : {
            ...result,
            warnings: [],
          };

      return this.createSuccessResult(JSON.stringify(filteredResult, null, 2), filteredResult);
    } catch (error) {
      return this.createErrorResult(
        `Ethics review failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

