/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Profitability Analyzer Service
 * 
 * Tracks matter profitability and calculates metrics:
 * - Actual vs budget comparison
 * - Profitability ratios
 * - Flags at-risk matters
 * - Integrates with ethics_reviewer for recommendations
 */

import { ethicsReviewer } from '../../goodcounsel/tools/ethics-reviewer.js';

export interface MatterBudget {
  matterId: string;
  userId: string;
  budgetedHours: number;
  budgetedAmount: number;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MatterActuals {
  matterId: string;
  userId: string;
  actualHours: number;
  actualAmount: number;
  lastUpdated: string;
}

export interface ProfitabilityMetrics {
  matterId: string;
  userId: string;
  budgetedHours: number;
  actualHours: number;
  hoursVariance: number; // actual - budgeted (negative = over budget)
  hoursVariancePercent: number;
  budgetedAmount: number;
  actualAmount: number;
  amountVariance: number; // actual - budgeted (negative = over budget)
  amountVariancePercent: number;
  profitabilityRatio: number; // actualAmount / budgetedAmount (1.0 = on target, >1.0 = profitable, <1.0 = unprofitable)
  isAtRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ethicsRecommendations?: string[];
  calculatedAt: string;
}

// In-memory storage (TODO: Replace with database persistence)
const matterBudgets = new Map<string, MatterBudget>(); // matterId -> budget
const matterActuals = new Map<string, MatterActuals>(); // matterId -> actuals

/**
 * Set or update matter budget
 */
export async function setMatterBudget(budget: Omit<MatterBudget, 'createdAt' | 'updatedAt'>): Promise<MatterBudget> {
  const existing = matterBudgets.get(budget.matterId);
  const now = new Date().toISOString();
  
  const matterBudget: MatterBudget = {
    ...budget,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  
  // Calculate hourly rate if not provided
  if (!matterBudget.hourlyRate && matterBudget.budgetedHours > 0) {
    matterBudget.hourlyRate = matterBudget.budgetedAmount / matterBudget.budgetedHours;
  }
  
  matterBudgets.set(budget.matterId, matterBudget);
  return matterBudget;
}

/**
 * Get matter budget
 */
export async function getMatterBudget(matterId: string): Promise<MatterBudget | null> {
  return matterBudgets.get(matterId) || null;
}

/**
 * Update matter actuals (hours and amount billed)
 */
export async function updateMatterActuals(actuals: Omit<MatterActuals, 'lastUpdated'>): Promise<MatterActuals> {
  const matterActual: MatterActuals = {
    ...actuals,
    lastUpdated: new Date().toISOString(),
  };
  
  matterActuals.set(actuals.matterId, matterActual);
  return matterActual;
}

/**
 * Get matter actuals
 */
export async function getMatterActuals(matterId: string): Promise<MatterActuals | null> {
  return matterActuals.get(matterId) || null;
}

/**
 * Calculate profitability metrics for a matter
 */
export async function calculateProfitabilityMetrics(matterId: string, userId: string): Promise<ProfitabilityMetrics | null> {
  const budget = await getMatterBudget(matterId);
  const actuals = await getMatterActuals(matterId);
  
  if (!budget) {
    return null; // No budget set
  }
  
  const actualHours = actuals?.actualHours || 0;
  const actualAmount = actuals?.actualAmount || 0;
  
  // Calculate variances
  const hoursVariance = actualHours - budget.budgetedHours;
  const hoursVariancePercent = budget.budgetedHours > 0 
    ? (hoursVariance / budget.budgetedHours) * 100 
    : 0;
  
  const amountVariance = actualAmount - budget.budgetedAmount;
  const amountVariancePercent = budget.budgetedAmount > 0 
    ? (amountVariance / budget.budgetedAmount) * 100 
    : 0;
  
  // Calculate profitability ratio
  const profitabilityRatio = budget.budgetedAmount > 0 
    ? actualAmount / budget.budgetedAmount 
    : 1.0;
  
  // Determine risk level
  let isAtRisk = false;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (hoursVariancePercent > 20 || amountVariancePercent > 20) {
    isAtRisk = true;
    riskLevel = 'high';
  } else if (hoursVariancePercent > 10 || amountVariancePercent > 10) {
    isAtRisk = true;
    riskLevel = 'medium';
  }
  
  if (profitabilityRatio < 0.8) {
    isAtRisk = true;
    if (riskLevel === 'low') riskLevel = 'medium';
    if (profitabilityRatio < 0.6) riskLevel = 'critical';
  }
  
  // Get ethics recommendations if at risk
  let ethicsRecommendations: string[] | undefined;
  if (isAtRisk) {
    try {
      const ethicsResult = await ethicsReviewer.execute({
        facts: {
          matterId,
          hoursOverBudget: hoursVariance > 0 ? hoursVariance : 0,
          amountOverBudget: amountVariance > 0 ? amountVariance : 0,
          profitabilityRatio,
          riskLevel,
        },
        userId,
      });
      
      if (!ethicsResult.isError && ethicsResult.content[0]?.type === 'text') {
        const result = JSON.parse(ethicsResult.content[0].text);
        if (result.violations && result.violations.length > 0) {
          ethicsRecommendations = result.violations.map((v: any) => v.message);
        } else if (result.warnings && result.warnings.length > 0) {
          ethicsRecommendations = result.warnings.map((w: any) => w.message);
        }
      }
    } catch (error) {
      // Ethics review failed, continue without recommendations
      console.error('Ethics review failed for profitability analysis:', error);
    }
  }
  
  return {
    matterId,
    userId,
    budgetedHours: budget.budgetedHours,
    actualHours,
    hoursVariance,
    hoursVariancePercent,
    budgetedAmount: budget.budgetedAmount,
    actualAmount,
    amountVariance,
    amountVariancePercent,
    profitabilityRatio,
    isAtRisk,
    riskLevel,
    ethicsRecommendations,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Get all at-risk matters for a user
 */
export async function getAtRiskMatters(userId: string): Promise<ProfitabilityMetrics[]> {
  const atRisk: ProfitabilityMetrics[] = [];
  
  // Find all matters for this user
  for (const [matterId, budget] of matterBudgets.entries()) {
    if (budget.userId === userId) {
      const metrics = await calculateProfitabilityMetrics(matterId, userId);
      if (metrics && metrics.isAtRisk) {
        atRisk.push(metrics);
      }
    }
  }
  
  // Sort by risk level (critical first)
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  atRisk.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  
  return atRisk;
}

/**
 * Get profitability summary for a user (all matters)
 */
export async function getProfitabilitySummary(userId: string): Promise<{
  totalMatters: number;
  atRiskMatters: number;
  averageProfitabilityRatio: number;
  totalBudgeted: number;
  totalActual: number;
  overallVariance: number;
}> {
  let totalMatters = 0;
  let atRiskMatters = 0;
  let totalProfitabilityRatio = 0;
  let totalBudgeted = 0;
  let totalActual = 0;
  
  for (const [matterId, budget] of matterBudgets.entries()) {
    if (budget.userId === userId) {
      totalMatters++;
      const metrics = await calculateProfitabilityMetrics(matterId, userId);
      if (metrics) {
        if (metrics.isAtRisk) atRiskMatters++;
        totalProfitabilityRatio += metrics.profitabilityRatio;
        totalBudgeted += metrics.budgetedAmount;
        totalActual += metrics.actualAmount;
      }
    }
  }
  
  return {
    totalMatters,
    atRiskMatters,
    averageProfitabilityRatio: totalMatters > 0 ? totalProfitabilityRatio / totalMatters : 0,
    totalBudgeted,
    totalActual,
    overallVariance: totalActual - totalBudgeted,
  };
}

}
}
}
}