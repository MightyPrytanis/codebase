/**
 * Cosmos Next Action AI Integration
 * Provides intelligent next-action recommendations for legal workflow optimization
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface NextActionRecommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'follow_up' | 'risk_mitigation' | 'opportunity' | 'compliance' | 'performance';
  action: string;
  reasoning: string;
  estimatedImpact: string;
  timeframe: 'immediate' | 'this_week' | 'this_month';
  dependencies?: string[];
}

export class CosmosIntegration {
  /**
   * Generate next action recommendations for legal workflow optimization
   * Based on Cosmos Next Action AI logic adapted for legal practice
   */
  async getNextActions(context: {
    caseContext: string;
    userState?: string;
    timePressure: 'low' | 'medium' | 'high' | 'critical';
    ethicalConcerns?: string[];
  }): Promise<NextActionRecommendation[]> {
    const recommendations: NextActionRecommendation[] = [];

    // Analyze time pressure and generate appropriate recommendations
    if (context.timePressure === 'critical' || context.timePressure === 'high') {
      recommendations.push({
        priority: 'urgent',
        category: 'risk_mitigation',
        action: 'Triage immediate deadline conflicts - review calendar for next 48 hours',
        reasoning: 'High time pressure detected. Critical deadlines require immediate attention to prevent missed filings or court dates.',
        estimatedImpact: 'Prevents potential malpractice exposure and client relationship damage',
        timeframe: 'immediate',
      });
    }

    // Analyze user state for focus recommendations
    if (context.userState && (context.userState.toLowerCase().includes('tired') || context.userState.toLowerCase().includes('overwhelmed'))) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        action: 'Delegate routine tasks to paralegal/associate - focus on strategic work requiring your expertise',
        reasoning: 'Fatigue detected. Prioritize high-value work that requires your judgment while delegating routine tasks.',
        estimatedImpact: 'Improves work quality, reduces errors, maintains client satisfaction',
        timeframe: 'immediate',
        dependencies: ['Available paralegal/associate capacity'],
      });
    }

    // Analyze ethical concerns
    if (context.ethicalConcerns && context.ethicalConcerns.length > 0) {
      recommendations.push({
        priority: 'urgent',
        category: 'compliance',
        action: 'Document ethical considerations and consult state bar ethics hotline if needed',
        reasoning: 'Ethical concerns identified. Professional responsibility requires immediate documentation and potential consultation.',
        estimatedImpact: 'Protects professional license, ensures client interests are properly represented',
        timeframe: 'immediate',
      });
    }

    // Context-specific recommendations based on legal workflow patterns
    const lowerContext = context.caseContext.toLowerCase();

    // Discovery phase recommendations
    if (lowerContext.includes('discovery') || lowerContext.includes('interrogator')) {
      recommendations.push({
        priority: 'high',
        category: 'follow_up',
        action: 'Review and respond to outstanding discovery requests - create timeline for responses',
        reasoning: 'Discovery phase activity detected. Missing or delayed responses can result in sanctions.',
        estimatedImpact: 'Ensures compliance with court rules, maintains strategic advantage',
        timeframe: 'this_week',
      });
    }

    // Trial preparation recommendations
    if (lowerContext.includes('trial') || lowerContext.includes('hearing')) {
      recommendations.push({
        priority: 'urgent',
        category: 'performance',
        action: 'Conduct witness preparation sessions and finalize exhibit list',
        reasoning: 'Trial/hearing approaching. Thorough preparation is critical for successful outcomes.',
        estimatedImpact: 'Increases likelihood of favorable verdict, demonstrates professionalism',
        timeframe: 'immediate',
      });
    }

    // Client communication recommendations
    if (lowerContext.includes('client') && context.timePressure !== 'low') {
      recommendations.push({
        priority: 'medium',
        category: 'follow_up',
        action: 'Send proactive status update to client - even if no major developments',
        reasoning: 'Client communication maintains trust and prevents anxiety-driven calls that disrupt workflow.',
        estimatedImpact: 'Strengthens client relationship, reduces reactive communication burden',
        timeframe: 'this_week',
      });
    }

    // Compliance and risk management
    if (lowerContext.includes('deadline') || lowerContext.includes('statute of limitations')) {
      recommendations.push({
        priority: 'urgent',
        category: 'risk_mitigation',
        action: 'Add all critical dates to calendar with multiple reminders - verify calculation of deadlines',
        reasoning: 'Deadline-related language detected. Missing statute of limitations is a leading cause of malpractice claims.',
        estimatedImpact: 'Prevents catastrophic malpractice exposure',
        timeframe: 'immediate',
      });
    }

    // Opportunity identification
    if (lowerContext.includes('settlement') || lowerContext.includes('negotiat')) {
      recommendations.push({
        priority: 'high',
        category: 'opportunity',
        action: 'Prepare detailed settlement analysis with best/worst/likely scenarios',
        reasoning: 'Settlement discussion identified. Comprehensive analysis enables informed client decision-making.',
        estimatedImpact: 'Improves settlement outcomes, demonstrates value to client',
        timeframe: 'this_week',
      });
    }

    // Default general recommendation if no specific patterns detected
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Review active matters and prioritize next 3 critical tasks',
        reasoning: 'General workflow optimization. Clear prioritization improves efficiency and reduces decision fatigue.',
        estimatedImpact: 'Increases daily productivity by 15-20%',
        timeframe: 'immediate',
      });
    }

    // Sort by priority and timeframe
    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const timeframeOrder = { immediate: 0, this_week: 1, this_month: 2 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return timeframeOrder[a.timeframe] - timeframeOrder[b.timeframe];
    });
  }

  /**
   * Get automated task recommendations for delegation
   */
  getAutomationOpportunities(context: string): string[] {
    const opportunities: string[] = [];
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes('research') || lowerContext.includes('case law')) {
      opportunities.push('Legal research automation using AI-powered case law analysis');
    }

    if (lowerContext.includes('document') || lowerContext.includes('draft')) {
      opportunities.push('Document assembly automation for routine pleadings and correspondence');
    }

    if (lowerContext.includes('schedule') || lowerContext.includes('calendar')) {
      opportunities.push('Automated calendar management and deadline tracking');
    }

    if (lowerContext.includes('client') && lowerContext.includes('update')) {
      opportunities.push('Automated client status updates for routine case developments');
    }

    return opportunities;
