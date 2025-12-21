/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../../../modules/base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { costEstimationService, MatterData, ProposalData } from '../services/cost-estimation.js';
import { z } from 'zod';

const CostEstimationInputSchema = z.object({
  action: z.enum([
    'estimate_cost',
    'learn_from_matter',
    'generate_proposal',
    'get_stats',
    'load_seed_data'
  ]).describe('Action to perform'),
  matter_type: z.string().optional().describe('Type of matter'),
  complexity: z.enum(['simple', 'medium', 'complex']).optional().describe('Matter complexity'),
  attorney_id: z.string().optional().describe('Attorney ID'),
  matter_data: z.any().optional().describe('Matter data for learning'),
  proposal_data: z.any().optional().describe('Proposal data'),
  seed_data: z.array(z.any()).optional().describe('Seed data array'),
});

/**
 * Cost Estimation Module
 * Part of the Chronometric Engine
 * 
 * Provides predictive cost estimation for planning, budgeting, and client proposals.
 * Learns from historical matter data to improve accuracy over time.
 * 
 * Key Features:
 * - Cost/Hour Estimation: Based on matter type, complexity, and attorney performance
 * - Learning Algorithm: Learns from completed matters
 * - Proposal Generation: Creates client-facing proposals
 * - Seed Data System: Import from Clio, CSV, or manual entry
 */
export class CostEstimationModule extends BaseModule {
  constructor() {
    super({
      name: 'cost_estimation',
      description: 'Cost Estimation Module - Predictive cost estimation for planning, budgeting, and client proposals',
      version: '1.0.0',
      tools: [], // Uses cost estimation service directly
      resources: [
        {
          id: 'cost_estimation_service',
          type: 'service',
          description: 'Cost estimation service with learning algorithm',
        },
      ],
      prompts: [
        {
          id: 'proposal_generation',
          template: 'Generate a professional legal services proposal for:\n\nMatter Type: {{matter_type}}\nComplexity: {{complexity}}\nEstimated Hours: {{estimated_hours}}\nEstimated Cost: {{estimated_cost}}\n\nInclude scope of work, payment terms, and confidence level.',
          variables: ['matter_type', 'complexity', 'estimated_hours', 'estimated_cost'],
        },
      ],
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // Module is initialized with service in constructor
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = CostEstimationInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'estimate_cost':
          return await this.estimateCost(parsed);
        
        case 'learn_from_matter':
          return await this.learnFromMatter(parsed);
        
        case 'generate_proposal':
          return await this.generateProposal(parsed);
        
        case 'get_stats':
          return await this.getStats();
        
        case 'load_seed_data':
          return await this.loadSeedData(parsed);
        
        default:
          return {
            content: [{ type: 'text', text: `Unknown action: ${parsed.action}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error in cost estimation module: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Estimate cost for a new matter
   */
  private async estimateCost(input: any): Promise<CallToolResult> {
    if (!input.matter_type || !input.complexity) {
      return {
        content: [{ type: 'text', text: 'Error: matter_type and complexity are required for cost estimation' }],
        isError: true,
      };
    }

    try {
      const estimate = await costEstimationService.estimateCost(
        input.matter_type,
        input.complexity,
        input.attorney_id
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            matter_type: input.matter_type,
            complexity: input.complexity,
            attorney_id: input.attorney_id || 'firm-wide',
            estimate,
            note: estimate.confidence === 'low' 
              ? 'Low confidence: Consider adding more historical data for better estimates'
              : `Confidence: ${estimate.confidence}`,
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error estimating cost: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Learn from a completed matter
   */
  private async learnFromMatter(input: any): Promise<CallToolResult> {
    if (!input.matter_data) {
      return {
        content: [{ type: 'text', text: 'Error: matter_data is required for learning' }],
        isError: true,
      };
    }

    try {
      const matterData: MatterData = input.matter_data;
      
      // Validate required fields
      if (!matterData.matter_id || !matterData.matter_type || !matterData.complexity) {
        return {
          content: [{ type: 'text', text: 'Error: matter_data must include matter_id, matter_type, and complexity' }],
          isError: true,
        };
      }

      await costEstimationService.learnFromMatter(matterData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Matter data added to learning dataset',
            matter_id: matterData.matter_id,
            matter_type: matterData.matter_type,
            complexity: matterData.complexity,
            actual_hours: matterData.actual_hours,
            actual_cost: matterData.actual_cost,
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error learning from matter: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Generate a proposal for a new matter
   */
  private async generateProposal(input: any): Promise<CallToolResult> {
    if (!input.proposal_data) {
      return {
        content: [{ type: 'text', text: 'Error: proposal_data is required for proposal generation' }],
        isError: true,
      };
    }

    try {
      const proposalData: ProposalData = input.proposal_data;
      
      // Validate required fields
      if (!proposalData.matter_type || !proposalData.complexity || !proposalData.hourly_rate) {
        return {
          content: [{ type: 'text', text: 'Error: proposal_data must include matter_type, complexity, and hourly_rate' }],
          isError: true,
        };
      }

      // Get cost estimate if not provided
      if (!proposalData.estimated_hours || !proposalData.estimated_cost) {
        const estimate = await costEstimationService.estimateCost(
          proposalData.matter_type,
          proposalData.complexity,
          proposalData.attorney_id
        );
        proposalData.estimated_hours = estimate.estimated_hours;
        proposalData.estimated_cost = estimate.estimated_cost;
      }

      const proposal = await costEstimationService.generateProposal(proposalData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            proposal,
            metadata: {
              matter_type: proposalData.matter_type,
              complexity: proposalData.complexity,
              estimated_hours: proposalData.estimated_hours,
              estimated_cost: proposalData.estimated_cost,
              generated_at: new Date().toISOString(),
            },
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating proposal: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Get cost estimation statistics
   */
  private async getStats(): Promise<CallToolResult> {
    try {
      const stats = await costEstimationService.getStats();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            cost_estimation_stats: stats,
            note: stats.total_matters === 0 
              ? 'No historical data available. Add completed matters to improve estimates.'
              : `${stats.total_matters} matters in learning dataset`,
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting stats: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Load seed data from external source
   */
  private async loadSeedData(input: any): Promise<CallToolResult> {
    if (!input.seed_data || !Array.isArray(input.seed_data)) {
      return {
        content: [{ type: 'text', text: 'Error: seed_data must be an array of matter data' }],
        isError: true,
      };
    }

    try {
      await costEstimationService.loadSeedData(input.seed_data);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Seed data loaded successfully',
            matters_loaded: input.seed_data.length,
          }, null, 2)
        }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error loading seed data: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources
  }
}

// Export singleton instance
export const costEstimationModule = new CostEstimationModule();
