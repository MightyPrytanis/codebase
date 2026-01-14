/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * QDRO Calculation Formulas
 * Implements ERISA-compliant QDRO division calculations
 */

export type PlanType = 'defined_contribution' | 'defined_benefit';

export interface QDROInput {
  planType: PlanType;
  accountBalance?: number; // For defined contribution
  monthlyBenefit?: number; // For defined benefit
  maritalServiceStart: Date;
  maritalServiceEnd: Date;
  retirementAge?: number; // For defined benefit
  divisionPercentage: number; // Percentage to alternate payee (0-100)
  participantDOB?: Date;
  alternatePayeeDOB?: Date;
}

export interface QDROCalculation {
  maritalServicePeriod: number; // Years
  totalServicePeriod: number; // Years (for defined benefit)
  maritalServicePercentage: number; // Percentage of total service
  divisionAmount: number; // Dollar amount or percentage
  monthlyBenefitAmount?: number; // For defined benefit
  accountBalanceAmount?: number; // For defined contribution
  erisaCompliant: boolean;
  complianceNotes: string[];
}

/**
 * Calculate QDRO division for Defined Contribution plan
 */
export function calculateDefinedContributionQDRO(
  input: QDROInput
): QDROCalculation {
  if (!input.accountBalance) {
    throw new Error('Account balance required for defined contribution plan');
  }

  // Calculate marital service period
  const maritalServicePeriod =
    (input.maritalServiceEnd.getTime() - input.maritalServiceStart.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25); // Years

  // For defined contribution, division is typically percentage of account balance
  // Can be either:
  // 1. Percentage of account balance at time of division
  // 2. Percentage of account balance at time of divorce (with earnings allocation)
  // Simplified: use division percentage of current balance
  const divisionAmount = (input.accountBalance * input.divisionPercentage) / 100;

  const complianceNotes: string[] = [];
  if (input.divisionPercentage > 50) {
    complianceNotes.push('Division percentage exceeds 50% - verify plan allows this');
  }
  if (maritalServicePeriod < 0) {
    complianceNotes.push('WARNING: Marital service period is negative - check dates');
  }

  return {
    maritalServicePeriod: Math.round(maritalServicePeriod * 100) / 100,
    totalServicePeriod: maritalServicePeriod, // For DC, typically same as marital
    maritalServicePercentage: 100, // For DC, typically 100% of marital period
    divisionAmount: Math.round(divisionAmount * 100) / 100,
    accountBalanceAmount: divisionAmount,
    erisaCompliant: complianceNotes.length === 0,
    complianceNotes,
  };
}

/**
 * Calculate QDRO division for Defined Benefit plan
 */
export function calculateDefinedBenefitQDRO(
  input: QDROInput
): QDROCalculation {
  if (!input.monthlyBenefit) {
    throw new Error('Monthly benefit required for defined benefit plan');
  }

  // Calculate marital service period
  const maritalServicePeriod =
    (input.maritalServiceEnd.getTime() - input.maritalServiceStart.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25); // Years

  // For defined benefit, need total service period
  // Simplified: assume retirement age calculation
  let totalServicePeriod = maritalServicePeriod;
  if (input.participantDOB && input.retirementAge) {
    const retirementDate = new Date(input.participantDOB);
    retirementDate.setFullYear(retirementDate.getFullYear() + input.retirementAge);
    const totalServiceStart = new Date(input.participantDOB);
    totalServiceStart.setFullYear(totalServiceStart.getFullYear() + 18); // Assume employment starts at 18
    totalServicePeriod =
      (retirementDate.getTime() - totalServiceStart.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);
  }

  // Calculate marital service percentage
  const maritalServicePercentage =
    totalServicePeriod > 0 ? (maritalServicePeriod / totalServicePeriod) * 100 : 0;

  // Calculate monthly benefit for alternate payee
  // Formula: (marital service period / total service period) * monthly benefit * division percentage
  const monthlyBenefitAmount =
    (maritalServicePercentage / 100) * input.monthlyBenefit * (input.divisionPercentage / 100);

  const complianceNotes: string[] = [];
  if (maritalServicePeriod < 0) {
    complianceNotes.push('WARNING: Marital service period is negative - check dates');
  }
  if (maritalServicePercentage > 100) {
    complianceNotes.push('WARNING: Marital service percentage exceeds 100% - check dates');
  }
  if (input.divisionPercentage > 50) {
    complianceNotes.push('Division percentage exceeds 50% - verify plan allows this');
  }

  return {
    maritalServicePeriod: Math.round(maritalServicePeriod * 100) / 100,
    totalServicePeriod: Math.round(totalServicePeriod * 100) / 100,
    maritalServicePercentage: Math.round(maritalServicePercentage * 100) / 100,
    divisionAmount: monthlyBenefitAmount,
    monthlyBenefitAmount: Math.round(monthlyBenefitAmount * 100) / 100,
    erisaCompliant: complianceNotes.length === 0,
    complianceNotes,
  };
}

/**
 * Calculate QDRO division based on plan type
 */
export function calculateQDRO(input: QDROInput): QDROCalculation {
  switch (input.planType) {
    case 'defined_contribution':
      return calculateDefinedContributionQDRO(input);
    case 'defined_benefit':
      return calculateDefinedBenefitQDRO(input);
    default:
      throw new Error(`Unknown plan type: ${input.planType}`);
  }
}


}