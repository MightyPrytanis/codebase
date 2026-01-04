/**
 * MiCourt Query Tool
 * 
 * User-initiated docket query tool for LexFiat integration.
 * Light footprint - no automated scraping or routine updates.
 * 
 * Created: 2025-12-21
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * MiCourt Query Tool
 * 
 * Light footprint integration for user-initiated docket queries
 * NO automated scraping or routine wide-net updates
 * See: docs/MICOURT_INTEGRATION.md for details
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { MiCourtService } from '../services/micourt-service.js';

const MiCourtQuerySchema = z.object({
  action: z.enum(['query_case', 'search_cases']).describe('Action to perform'),
  caseNumber: z.string().optional().describe('Case number to query'),
  lastName: z.string().optional().describe('Party last name to search for'),
  firstName: z.string().optional().describe('Party first name to search for'),
  court: z.string().optional().describe('Court name or code'),
  caseType: z.string().optional().describe('Case type (e.g., CV, FC, PC)'),
  portal: z.enum(['micourt', 'odyssey', 'court-explorer', 'auto']).optional().default('auto').describe('Court portal to use (auto selects based on court)'),
});

export const micourtQuery: BaseTool = new (class extends BaseTool {
  private micourtService: MiCourtService;

  constructor() {
    super();
    this.micourtService = new MiCourtService();
  }

  getToolDefinition() {
    return {
      name: 'micourt_query',
      description: 'Query Michigan court docket information. User-initiated queries only - no automated scraping. Light footprint integration for on-demand case lookups from LexFiat.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['query_case', 'search_cases'],
            description: 'Action to perform: query_case for specific case number, search_cases for broader search',
          },
          caseNumber: {
            type: 'string',
            description: 'Case number to query (required for query_case action)',
          },
          lastName: {
            type: 'string',
            description: 'Party last name to search for (required for search_cases if no case number)',
          },
          firstName: {
            type: 'string',
            description: 'Party first name to search for (optional)',
          },
          court: {
            type: 'string',
            description: 'Court name or code (optional filter)',
          },
          caseType: {
            type: 'string',
            description: 'Case type (e.g., CV, FC, PC) (optional filter)',
          },
          portal: {
            type: 'string',
            enum: ['micourt', 'odyssey', 'court-explorer', 'auto'],
            description: 'Court portal to use (auto selects based on court)',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, caseNumber, lastName, firstName, court, caseType, portal } = MiCourtQuerySchema.parse(args);

      if (action === 'query_case') {
        if (!caseNumber && !lastName) {
          return this.createErrorResult('Either case number or party name is required for query_case action');
        }

        const caseInfo = await this.micourtService.queryCase({
          caseNumber,
          lastName,
          firstName,
          court,
          caseType,
          portal,
        });
        return this.createSuccessResult(JSON.stringify(caseInfo, null, 2), {
          caseNumber: caseInfo.caseNumber,
          court: caseInfo.court,
          status: caseInfo.status,
        });
      }

      if (action === 'search_cases') {
        if (!caseNumber && !lastName) {
          return this.createErrorResult('Either case number or party name is required for search_cases action');
        }

        const cases = await this.micourtService.searchCases({
          caseNumber,
          lastName,
          firstName,
          court,
          caseType,
          portal,
        });

        return this.createSuccessResult(JSON.stringify(cases, null, 2), {
          resultCount: cases.length,
          criteria: { caseNumber, lastName, firstName, court },
        });
      }

      return this.createErrorResult(`Unknown action: ${action}`);
    } catch (error) {
      return this.createErrorResult(
        `MiCourt query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
