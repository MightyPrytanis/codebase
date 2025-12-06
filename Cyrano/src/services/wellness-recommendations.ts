/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { wellness } from './wellness-service.js';
import { burnoutDetector } from './burnout-detector.js';

/**
 * Wellness Recommendations Engine
 * 
 * Generates personalized wellness recommendations based on journal patterns,
 * burnout analysis, and attorney profession context.
 */

export interface WellnessRecommendation {
  type: 'physical' | 'mental' | 'social' | 'professional';
  action: string;
  priority: 'low' | 'medium' | 'high';
  rationale: string;
  timeframe: 'immediate' | 'this_week' | 'this_month';
}

class WellnessRecommendationsService {
  /**
   * Get personalized wellness recommendations for a user
   */
  async getRecommendations(
    userId: number,
    period: 'week' | 'month' = 'month'
  ): Promise<WellnessRecommendation[]> {
    // Get wellness data
    const trends = await wellness.getWellnessTrends(userId, period);
    const burnoutAnalysis = await burnoutDetector.analyzeBurnoutRisk(userId, period);

    const recommendations: WellnessRecommendation[] = [];

    // Physical recommendations
    recommendations.push(...this.getPhysicalRecommendations(trends, burnoutAnalysis));

    // Mental recommendations
    recommendations.push(...this.getMentalRecommendations(trends, burnoutAnalysis));

    // Social recommendations
    recommendations.push(...this.getSocialRecommendations(trends, burnoutAnalysis));

    // Professional recommendations
    recommendations.push(...this.getProfessionalRecommendations(trends, burnoutAnalysis));

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get physical wellness recommendations
   */
  private getPhysicalRecommendations(trends: any, burnout: any): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    if (burnout.factors.workload > 0.5) {
      recommendations.push({
        type: 'physical',
        action: 'Ensure 7-8 hours of sleep per night',
        priority: 'high',
        rationale: 'High workload requires adequate rest for recovery',
        timeframe: 'immediate',
      });
    }

    if (burnout.risk === 'high' || burnout.risk === 'critical') {
      recommendations.push({
        type: 'physical',
        action: 'Take a 10-minute walk outside during work breaks',
        priority: 'high',
        rationale: 'Physical movement helps reduce stress and improve mood',
        timeframe: 'immediate',
      });
    }

    recommendations.push({
      type: 'physical',
      action: 'Schedule regular exercise (even 20 minutes helps)',
      priority: burnout.factors.stress > 0.5 ? 'high' : 'medium',
      rationale: 'Regular exercise supports both physical and mental health',
      timeframe: 'this_week',
    });

    return recommendations;
  }

  /**
   * Get mental wellness recommendations
   */
  private getMentalRecommendations(trends: any, burnout: any): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    if (burnout.factors.stress > 0.6) {
      recommendations.push({
        type: 'mental',
        action: 'Practice 5-minute breathing exercises twice daily',
        priority: 'high',
        rationale: 'Immediate stress relief technique',
        timeframe: 'immediate',
      });
    }

    if (trends?.avgSentiment && trends.avgSentiment < -0.3) {
      recommendations.push({
        type: 'mental',
        action: 'Use the meditation feature in GoodCounsel',
        priority: 'high',
        rationale: 'Meditation can help improve mood and reduce stress',
        timeframe: 'immediate',
      });
    }

    if (burnout.risk === 'moderate' || burnout.risk === 'high') {
      recommendations.push({
        type: 'mental',
        action: 'Consider speaking with a therapist or counselor',
        priority: burnout.risk === 'high' ? 'high' : 'medium',
        rationale: 'Professional support can help manage stress and prevent burnout',
        timeframe: 'this_week',
      });
    }

    recommendations.push({
      type: 'mental',
      action: 'Practice gratitude journaling',
      priority: 'low',
      rationale: 'Focusing on positive aspects can improve overall well-being',
      timeframe: 'this_month',
    });

    return recommendations;
  }

  /**
   * Get social wellness recommendations
   */
  private getSocialRecommendations(trends: any, burnout: any): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    if (burnout.factors.isolation > 0.5) {
      recommendations.push({
        type: 'social',
        action: 'Reach out to a colleague or friend this week',
        priority: 'high',
        rationale: 'Social connection is important for mental health',
        timeframe: 'immediate',
      });
    }

    if (burnout.factors.isolation > 0.3) {
      recommendations.push({
        type: 'social',
        action: 'Join a professional networking group or bar association event',
        priority: 'medium',
        rationale: 'Connecting with peers can reduce professional isolation',
        timeframe: 'this_month',
      });
    }

    recommendations.push({
      type: 'social',
      action: 'Schedule regular social activities outside of work',
      priority: burnout.factors.isolation > 0.3 ? 'high' : 'low',
      rationale: 'Maintaining social connections supports overall wellness',
      timeframe: 'this_month',
    });

    return recommendations;
  }

  /**
   * Get professional wellness recommendations
   */
  private getProfessionalRecommendations(trends: any, burnout: any): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    if (burnout.factors.workload > 0.6) {
      recommendations.push({
        type: 'professional',
        action: 'Review your caseload and identify tasks that can be delegated',
        priority: 'high',
        rationale: 'Delegation can help manage workload and prevent burnout',
        timeframe: 'immediate',
      });
    }

    if (burnout.factors.workload > 0.5) {
      recommendations.push({
        type: 'professional',
        action: 'Set clear boundaries around work hours and communicate them',
        priority: 'high',
        rationale: 'Boundaries protect your time and prevent overwork',
        timeframe: 'this_week',
      });
    }

    recommendations.push({
      type: 'professional',
      action: 'Use time-blocking to manage your schedule more effectively',
      priority: burnout.factors.workload > 0.4 ? 'medium' : 'low',
      rationale: 'Better time management reduces stress and improves productivity',
      timeframe: 'this_week',
    });

    if (burnout.risk === 'high' || burnout.risk === 'critical') {
      recommendations.push({
        type: 'professional',
        action: 'Consider taking time off to recharge',
        priority: 'high',
        rationale: 'Rest is essential for preventing burnout and maintaining performance',
        timeframe: 'this_month',
      });
    }

    return recommendations;
  }
}

// Export singleton instance
let wellnessRecommendationsService: WellnessRecommendationsService | null = null;

export function getWellnessRecommendationsService(): WellnessRecommendationsService {
  if (!wellnessRecommendationsService) {
    wellnessRecommendationsService = new WellnessRecommendationsService();
  }
  return wellnessRecommendationsService;
}

// Export for direct use
export const wellnessRecommendations = {
  getRecommendations: async (userId: number, period?: 'week' | 'month') => {
    const service = getWellnessRecommendationsService();
    return service.getRecommendations(userId, period);
  },
};


