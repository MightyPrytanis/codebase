import { z } from 'zod';
import { PartnerAnalyzer } from '../services/partnerAnalyzer';
import { CallToolRequestSchema, CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

// Input schema for the recommend_next_action tool
const NextActionInputSchema = z.object({
  partnerId: z.string().optional().describe('Specific partner ID to analyze'),
  timeframe: z.enum(['immediate', 'this_week', 'this_month']).optional().describe('Time horizon for recommendations'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().describe('Filter by priority level'),
  category: z.string().optional().describe('Filter by recommendation category'),
  limit: z.number().min(1).max(20).optional().describe('Maximum number of recommendations to return')
});

export class NextActionTool {
  private partnerAnalyzer: PartnerAnalyzer;

  constructor() {
    this.partnerAnalyzer = new PartnerAnalyzer();
  }

  /**
   * Get tool definition for MCP registration
   */
  getToolDefinition() {
    return {
      name: 'recommend_next_action',
      description: 'Generate AI-powered next action recommendations for mortgage partner management. Analyzes partner performance, compliance, and business metrics to suggest specific actions that improve revenue, reduce risk, and optimize relationships.',
      inputSchema: {
        type: 'object',
        properties: {
          partnerId: {
            type: 'string',
            description: 'Specific partner ID to analyze (optional - if not provided, analyzes all partners)'
          },
          timeframe: {
            type: 'string',
            enum: ['immediate', 'this_week', 'this_month'],
            description: 'Time horizon for recommendations (default: this_week)'
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low'],
            description: 'Filter recommendations by priority level'
          },
          category: {
            type: 'string',
            description: 'Filter by category: follow_up, risk_mitigation, opportunity, compliance, or performance'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            description: 'Maximum number of recommendations to return (default: 10)'
          }
        }
      }
    };
  }

  /**
   * Execute the recommend_next_action tool
   */
  async execute(request: CallToolRequest) {
    try {
      // Validate input parameters
      const input = NextActionInputSchema.parse(request.params.arguments || {});
      
      let recommendations;
      
      if (input.partnerId) {
        // Get recommendations for specific partner
        recommendations = await this.partnerAnalyzer.getNextActions(input.partnerId);
      } else if (input.timeframe === 'immediate' || input.priority === 'urgent') {
        // Get urgent recommendations
        recommendations = await this.partnerAnalyzer.getUrgentRecommendations();
      } else {
        // Get all recommendations with filters
        recommendations = await this.partnerAnalyzer.getAllRecommendations({
          timeframe: input.timeframe,
          priority: input.priority,
          category: input.category,
          limit: input.limit || 10
        });
      }

      // Format response with business context
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        requestedFilters: input,
        totalRecommendations: recommendations.length,
        recommendations: recommendations.map(rec => ({
          partner: {
            id: rec.partnerId,
            name: rec.partnerName
          },
          priority: rec.priority,
          category: rec.category,
          action: rec.action,
          reasoning: rec.reasoning,
          expectedOutcome: rec.expectedOutcome,
          timeframe: rec.timeframe,
          estimatedROI: rec.estimatedROI,
          contactInfo: rec.contactInfo
        })),
        summary: this.generateSummary(recommendations)
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('Error in recommend_next_action tool:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  private generateSummary(recommendations: any[]) {
    const priorityCounts = recommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {});

    return {
      priorityBreakdown: priorityCounts,
      categoryBreakdown: categoryCounts,
      urgentActionsCount: priorityCounts.urgent || 0,
      totalPartners: new Set(recommendations.map(r => r.partnerId)).size
    };
  }
}
