/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Child Support Calculation Formulas
 * Implements Michigan FOC (Friend of the Court) formula and other state formulas
 */

export type Jurisdiction = 'michigan' | 'other';

export interface ChildSupportInput {
  jurisdiction: Jurisdiction;
  payerIncome: number;
  payeeIncome: number;
  numberOfChildren: number;
  overnightsPayer: number; // Nights per year with payer
  overnightsPayee: number; // Nights per year with payee
  healthInsurance: number; // Monthly health insurance cost
  childcare: number; // Monthly childcare cost
  otherChildren: number; // Number of other children payer supports
}

export interface ChildSupportCalculation {
  combinedIncome: number;
  payerPercentage: number;
  payeePercentage: number;
  baseSupportObligation: number;
  payerShare: number;
  payeeShare: number;
  parentingTimeAdjustment: number;
  healthInsuranceAdjustment: number;
  childcareAdjustment: number;
  otherChildrenAdjustment: number;
  finalSupportAmount: number;
}

/**
 * Michigan FOC Child Support Formula
 * Based on income shares model with parenting time adjustments
 */
export function calculateMichiganChildSupport(input: ChildSupportInput): ChildSupportCalculation {
  // Combined income
  const combinedIncome = input.payerIncome + input.payeeIncome;

  // Income percentages
  const payerPercentage = input.payerIncome / combinedIncome;
  const payeePercentage = input.payeeIncome / combinedIncome;

  // Base support obligation (simplified - actual Michigan formula uses detailed tables)
  // This is a placeholder that approximates Michigan's formula
  const baseSupportObligation = calculateBaseSupportObligation(
    combinedIncome,
    input.numberOfChildren
  );

  // Payer and payee shares
  const payerShare = baseSupportObligation * payerPercentage;
  const payeeShare = baseSupportObligation * payeePercentage;

  // Parenting time adjustment (Michigan uses overnight percentage)
  const totalOvernights = input.overnightsPayer + input.overnightsPayee;
  const payerOvernightPercentage = totalOvernights > 0 ? input.overnightsPayer / totalOvernights : 0;

  // If payer has significant parenting time (>34%), reduce support
  let parentingTimeAdjustment = 0;
  if (payerOvernightPercentage > 0.34) {
    // Proportional reduction for parenting time over 34%
    const excessTime = payerOvernightPercentage - 0.34;
    parentingTimeAdjustment = payerShare * excessTime * 0.5; // 50% of excess time
  }

  // Health insurance adjustment (split proportionally)
  const healthInsuranceAdjustment = input.healthInsurance * payerPercentage;

  // Childcare adjustment (split proportionally)
  const childcareAdjustment = input.childcare * payerPercentage;

  // Other children adjustment (reduces payer's available income)
  const otherChildrenAdjustment = input.otherChildren > 0 ? payerShare * 0.1 * input.otherChildren : 0;

  // Calculate final support amount
  const adjustedPayerShare = payerShare - parentingTimeAdjustment;
  const finalSupportAmount =
    adjustedPayerShare + healthInsuranceAdjustment + childcareAdjustment - otherChildrenAdjustment;

  return {
    combinedIncome,
    payerPercentage,
    payeePercentage,
    baseSupportObligation,
    payerShare,
    payeeShare,
    parentingTimeAdjustment,
    healthInsuranceAdjustment,
    childcareAdjustment,
    otherChildrenAdjustment,
    finalSupportAmount: Math.max(0, Math.round(finalSupportAmount * 100) / 100),
  };
}

/**
 * Calculate base support obligation using income shares model
 * Simplified version - actual Michigan formula uses detailed tables
 */
function calculateBaseSupportObligation(combinedIncome: number, numberOfChildren: number): number {
  // Simplified income shares calculation
  // Actual Michigan formula uses detailed tables based on combined income ranges
  const baseAmounts: Record<number, number> = {
    1: 500, // Monthly base for 1 child
    2: 750, // Monthly base for 2 children
    3: 1000, // Monthly base for 3 children
    4: 1200, // Monthly base for 4 children
  };

  const baseAmount = baseAmounts[numberOfChildren] || 300 * numberOfChildren;

  // Adjust for income (simplified - actual formula uses brackets)
  const incomeMultiplier = Math.min(combinedIncome / 50000, 2.0); // Cap at 2x

  return baseAmount * incomeMultiplier;
}

/**
 * Calculate child support based on jurisdiction
 */
export function calculateChildSupport(input: ChildSupportInput): ChildSupportCalculation {
  switch (input.jurisdiction) {
    case 'michigan':
      return calculateMichiganChildSupport(input);
    default:
      // Default to Michigan formula for now
      return calculateMichiganChildSupport(input);
  }
}

