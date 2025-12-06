/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { wellness } from './wellness-service.js';

/**
 * Burnout Detection Service
 * 
 * Analyzes patterns in journal entries, workflow data, and wellness metrics
 * to detect signs of burnout, overwork, stress, and isolation.
 */

export interface BurnoutAnalysis {
  risk: 'low' | 'moderate' | 'high' | 'critical';
  signals: string[];
  factors: {
    workload: number; // 0-1 scale
    stress: number; // 0-1 scale
    isolation: number; // 0-1 scale
    moodDecline: number; // 0-1 scale
  };
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

class BurnoutDetectorService {
  /**
   * Analyze burnout risk for a user
   */
  async analyzeBurnoutRisk(
    userId: number,
    timeframe: 'week' | 'month' = 'month',
    workflowData?: {
      hoursLogged?: number;
      deadlinesCount?: number;
      urgentItems?: number;
    }
  ): Promise<BurnoutAnalysis> {
    // Get wellness data
    const burnoutSignals = await wellness.detectBurnoutSignals(userId, timeframe);
    const trends = await wellness.getWellnessTrends(userId, timeframe);

    // Analyze factors
    const factors = {
      workload: this.analyzeWorkload(workflowData),
      stress: this.analyzeStress(burnoutSignals),
      isolation: this.analyzeIsolation(burnoutSignals),
      moodDecline: this.analyzeMoodDecline(trends),
    };

    // Calculate overall risk
    const risk = this.calculateRisk(factors, burnoutSignals);

    // Generate recommendations
    const recommendations = this.generateRecommendations(risk, factors, burnoutSignals);

    // Determine urgency
    const urgency = this.determineUrgency(risk, factors);

    return {
      risk,
      signals: burnoutSignals.signals,
      factors,
      recommendations,
      urgency,
    };
  }

  /**
   * Analyze workload indicators
   */
  private analyzeWorkload(workflowData?: any): number {
    if (!workflowData) return 0;

    let score = 0;

    // Hours logged (assuming 40hr/week is normal, >60hr/week is high risk)
    if (workflowData.hoursLogged) {
      const weeklyHours = workflowData.hoursLogged / 4; // Approximate weekly
      if (weeklyHours > 60) score += 0.4;
      else if (weeklyHours > 50) score += 0.2;
    }

    // Deadlines count
    if (workflowData.deadlinesCount) {
      if (workflowData.deadlinesCount > 10) score += 0.3;
      else if (workflowData.deadlinesCount > 5) score += 0.15;
    }

    // Urgent items
    if (workflowData.urgentItems) {
      if (workflowData.urgentItems > 5) score += 0.3;
      else if (workflowData.urgentItems > 2) score += 0.15;
    }

    return Math.min(1.0, score);
  }

  /**
   * Analyze stress indicators
   */
  private analyzeStress(burnoutSignals: any): number {
    const stressKeywords = ['overwork', 'burnout', 'anxiety', 'stress'];
    const stressCount = burnoutSignals.signals.filter((s: string) =>
      stressKeywords.some(keyword => s.toLowerCase().includes(keyword))
    ).length;

    return Math.min(1.0, stressCount / 3); // Normalize to 0-1
  }

  /**
   * Analyze isolation indicators
   */
  private analyzeIsolation(burnoutSignals: any): number {
    const isolationKeywords = ['isolation', 'alone', 'no support', 'isolated'];
    const isolationCount = burnoutSignals.signals.filter((s: string) =>
      isolationKeywords.some(keyword => s.toLowerCase().includes(keyword))
    ).length;

    return Math.min(1.0, isolationCount / 2); // Normalize to 0-1
  }

  /**
   * Analyze mood decline
   */
  private analyzeMoodDecline(trends: any): number {
    if (!trends || !trends.avgSentiment) return 0;

    // Negative sentiment indicates mood decline
    // -1.0 (very negative) = 1.0, 0 (neutral) = 0
    return Math.max(0, -trends.avgSentiment);
  }

  /**
   * Calculate overall risk level
   */
  private calculateRisk(factors: any, burnoutSignals: any): 'low' | 'moderate' | 'high' | 'critical' {
    const totalScore = factors.workload + factors.stress + factors.isolation + factors.moodDecline;
    const avgScore = totalScore / 4;

    // Critical: Multiple high-risk factors or severe signals
    if (avgScore > 0.7 || burnoutSignals.risk === 'high') {
      return 'critical';
    }

    // High: Elevated risk across multiple factors
    if (avgScore > 0.5 || burnoutSignals.risk === 'moderate') {
      return 'high';
    }

    // Moderate: Some risk indicators present
    if (avgScore > 0.3) {
      return 'moderate';
    }

    return 'low';
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    risk: string,
    factors: any,
    burnoutSignals: any
  ): string[] {
    const recommendations: string[] = [];

    if (risk === 'critical' || risk === 'high') {
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Take time off if possible - your health comes first');
      recommendations.push('Review your workload and identify tasks that can be delegated');
    }

    if (factors.workload > 0.5) {
      recommendations.push('Set boundaries around work hours and stick to them');
      recommendations.push('Break large tasks into smaller, manageable chunks');
      recommendations.push('Use time-blocking to manage your schedule');
    }

    if (factors.stress > 0.5) {
      recommendations.push('Practice stress-reduction techniques (deep breathing, meditation)');
      recommendations.push('Take regular breaks throughout the day');
      recommendations.push('Consider mindfulness or relaxation exercises');
    }

    if (factors.isolation > 0.5) {
      recommendations.push('Reach out to colleagues, friends, or family for support');
      recommendations.push('Consider joining a professional support group');
      recommendations.push('Schedule regular social activities outside of work');
    }

    if (factors.moodDecline > 0.5) {
      recommendations.push('Prioritize activities that bring you joy and fulfillment');
      recommendations.push('Consider journaling about what\'s contributing to your mood');
      recommendations.push('Ensure you\'re getting adequate sleep and nutrition');
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring your wellness');
      recommendations.push('Maintain healthy work-life boundaries');
    }

    return recommendations;
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(risk: string, factors: any): 'low' | 'medium' | 'high' | 'critical' {
    if (risk === 'critical') return 'critical';
    if (risk === 'high') return 'high';
    if (factors.workload > 0.6 || factors.stress > 0.6) return 'high';
    if (risk === 'moderate') return 'medium';
    return 'low';
  }
}

// Export singleton instance
let burnoutDetectorService: BurnoutDetectorService | null = null;

export function getBurnoutDetectorService(): BurnoutDetectorService {
  if (!burnoutDetectorService) {
    burnoutDetectorService = new BurnoutDetectorService();
  }
  return burnoutDetectorService;
}

// Export for direct use
export const burnoutDetector = {
  analyzeBurnoutRisk: async (
    userId: number,
    timeframe?: 'week' | 'month',
    workflowData?: any
  ) => {
    const service = getBurnoutDetectorService();
    return service.analyzeBurnoutRisk(userId, timeframe, workflowData);
  },
};


