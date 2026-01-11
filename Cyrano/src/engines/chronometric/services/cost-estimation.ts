/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Cost Estimation Service
 * Part of the Chronometric Engine
 * 
 * Learns from historical matter data to estimate costs and hours for new matters.
 * Provides predictive cost estimation for planning, budgeting, and client proposals.
 * 
 * Key Features:
 * - Learning from completed matters
 * - Cost/hour estimation based on matter type, complexity, and attorney performance
 * - Seed data system (manual entry, Clio import, CSV)
 * - Proposal generation for client-facing documents
 */

export interface MatterData {
  matter_id: string;
  matter_type: string;
  complexity: 'simple' | 'medium' | 'complex';
  attorney_id: string;
  actual_hours: number;
  actual_cost: number;
  completion_date: string;
  outcome?: string;
  metadata?: Record<string, any>;
}

export interface CostEstimate {
  estimated_hours: number;
  estimated_cost: number;
  confidence: 'low' | 'medium' | 'high';
  range: {
    min_hours: number;
    max_hours: number;
    min_cost: number;
    max_cost: number;
  };
  comparable_matters: string[];
  factors: string[];
}

export interface ProposalData {
  matter_type: string;
  complexity: 'simple' | 'medium' | 'complex';
  attorney_id: string;
  client_name?: string;
  description?: string;
  estimated_hours: number;
  estimated_cost: number;
  hourly_rate: number;
  payment_terms?: string;
  scope_of_work?: string[];
}

/**
 * Cost Estimation Service
 * Learns from historical data and provides cost estimates
 */
export class CostEstimationService {
  private matters: Map<string, MatterData> = new Map();
  private learning_enabled: boolean = true;

  /**
   * Add a completed matter to the learning dataset
   */
  async learnFromMatter(matter: MatterData): Promise<void> {
    if (!this.learning_enabled) {
      return;
    }

    this.matters.set(matter.matter_id, matter);
    
    // TODO: Persist to database
    // await db.insert('cost_estimation_matters', matter);
  }

  /**
   * Load matters from seed data
   */
  async loadSeedData(matters: MatterData[]): Promise<void> {
    for (const matter of matters) {
      await this.learnFromMatter(matter);
    }
  }

  /**
   * Estimate cost for a new matter
   */
  async estimateCost(
    matter_type: string,
    complexity: 'simple' | 'medium' | 'complex',
    attorney_id?: string
  ): Promise<CostEstimate> {
    // Find comparable matters
    const comparableMatters = Array.from(this.matters.values()).filter(
      m => m.matter_type === matter_type && m.complexity === complexity
    );

    // Filter by attorney if specified
    const relevantMatters = attorney_id
      ? comparableMatters.filter(m => m.attorney_id === attorney_id)
      : comparableMatters;

    if (relevantMatters.length === 0) {
      // No historical data - provide generic estimates
      return this.getGenericEstimate(matter_type, complexity);
    }

    // Calculate averages
    const totalHours = relevantMatters.reduce((sum, m) => sum + m.actual_hours, 0);
    const totalCost = relevantMatters.reduce((sum, m) => sum + m.actual_cost, 0);
    const avgHours = totalHours / relevantMatters.length;
    const avgCost = totalCost / relevantMatters.length;

    // Calculate standard deviation for range
    const hourVariances = relevantMatters.map(m => Math.pow(m.actual_hours - avgHours, 2));
    const costVariances = relevantMatters.map(m => Math.pow(m.actual_cost - avgCost, 2));
    const hourStdDev = Math.sqrt(hourVariances.reduce((a, b) => a + b, 0) / relevantMatters.length);
    const costStdDev = Math.sqrt(costVariances.reduce((a, b) => a + b, 0) / relevantMatters.length);

    // Determine confidence based on sample size
    const confidence: 'low' | 'medium' | 'high' =
      relevantMatters.length >= 10 ? 'high' :
      relevantMatters.length >= 5 ? 'medium' : 'low';

    return {
      estimated_hours: Math.round(avgHours * 10) / 10,
      estimated_cost: Math.round(avgCost * 100) / 100,
      confidence,
      range: {
        min_hours: Math.max(0, Math.round((avgHours - hourStdDev) * 10) / 10),
        max_hours: Math.round((avgHours + hourStdDev) * 10) / 10,
        min_cost: Math.max(0, Math.round((avgCost - costStdDev) * 100) / 100),
        max_cost: Math.round((avgCost + costStdDev) * 100) / 100,
      },
      comparable_matters: relevantMatters.map(m => m.matter_id),
      factors: [
        `Based on ${relevantMatters.length} comparable ${matter_type} matters`,
        `Complexity: ${complexity}`,
        attorney_id ? `Attorney-specific estimates` : `Firm-wide estimates`,
      ],
    };
  }

  /**
   * Get generic estimate when no historical data available
   */
  private getGenericEstimate(
    matter_type: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): CostEstimate {
    // Generic estimates based on matter type and complexity
    const baseHours = {
      simple: 10,
      medium: 25,
      complex: 50,
    };

    const baseCost = {
      simple: 2500,
      medium: 6250,
      complex: 12500,
    };

    const hours = baseHours[complexity];
    const cost = baseCost[complexity];

    return {
      estimated_hours: hours,
      estimated_cost: cost,
      confidence: 'low',
      range: {
        min_hours: hours * 0.7,
        max_hours: hours * 1.5,
        min_cost: cost * 0.7,
        max_cost: cost * 1.5,
      },
      comparable_matters: [],
      factors: [
        'No historical data available',
        'Using generic industry estimates',
        `Complexity: ${complexity}`,
      ],
    };
  }

  /**
   * Generate proposal document
   */
  async generateProposal(data: ProposalData): Promise<string> {
    const estimate = await this.estimateCost(
      data.matter_type,
      data.complexity,
      data.attorney_id
    );

    // Generate proposal text
    const proposal = `
LEGAL SERVICES PROPOSAL

Client: ${data.client_name || '[Client Name]'}
Matter Type: ${data.matter_type}
Complexity: ${data.complexity}

SCOPE OF WORK:
${data.scope_of_work ? data.scope_of_work.map(item => `- ${item}`).join('\n') : '- [Define scope of work]'}

${data.description ? `\nDescription:\n${data.description}\n` : ''}

COST ESTIMATE:

Estimated Hours: ${estimate.estimated_hours} hours
Hourly Rate: $${data.hourly_rate.toFixed(2)}
Estimated Total Cost: $${estimate.estimated_cost.toFixed(2)}

Range: $${estimate.range.min_cost.toFixed(2)} - $${estimate.range.max_cost.toFixed(2)}
Confidence Level: ${estimate.confidence}

This estimate is based on:
${estimate.factors.map(f => `- ${f}`).join('\n')}

PAYMENT TERMS:
${data.payment_terms || '[Define payment terms]'}

---
Generated by Cyrano Chronometric Engine
Cost Estimation Module
${new Date().toISOString().split('T')[0]}
    `.trim();

    return proposal;
  }

  /**
   * Get all matters for a specific attorney
   */
  async getAttorneyMatters(attorney_id: string): Promise<MatterData[]> {
    return Array.from(this.matters.values()).filter(
      m => m.attorney_id === attorney_id
    );
  }

  /**
   * Get statistics for cost estimation
   */
  async getStats(): Promise<{
    total_matters: number;
    matter_types: string[];
    avg_hours_by_complexity: Record<string, number>;
    avg_cost_by_complexity: Record<string, number>;
  }> {
    const allMatters = Array.from(this.matters.values());
    const matterTypes = Array.from(new Set(allMatters.map(m => m.matter_type)));

    const calculateAvg = (complexity: string, field: 'actual_hours' | 'actual_cost') => {
      const filtered = allMatters.filter(m => m.complexity === complexity);
      if (filtered.length === 0) return 0;
      return filtered.reduce((sum, m) => sum + m[field], 0) / filtered.length;
    };

    return {
      total_matters: allMatters.length,
      matter_types: matterTypes,
      avg_hours_by_complexity: {
        simple: calculateAvg('simple', 'actual_hours'),
        medium: calculateAvg('medium', 'actual_hours'),
        complex: calculateAvg('complex', 'actual_hours'),
      },
      avg_cost_by_complexity: {
        simple: calculateAvg('simple', 'actual_cost'),
        medium: calculateAvg('medium', 'actual_cost'),
        complex: calculateAvg('complex', 'actual_cost'),
      },
    };
  }

  /**
   * Enable or disable learning
   */
  setLearningEnabled(enabled: boolean): void {
    this.learning_enabled = enabled;
  }

  /**
   * Clear all matter data (for testing)
   */
  clearData(): void {
    this.matters.clear();
  }

// Export singleton instance
export const costEstimationService = new CostEstimationService();

}
}
}
}
)
}
}
}
}
)
}
}
)
}
}