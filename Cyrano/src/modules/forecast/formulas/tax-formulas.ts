/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Tax Calculation Formulas
 * Implements IRS tax brackets and calculation logic for 2018-2025
 */

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface TaxInput {
  year: number;
  filingStatus: FilingStatus;
  wages: number;
  selfEmploymentIncome: number;
  interestIncome: number;
  dividendIncome: number;
  capitalGains: number;
  rentalIncome: number;
  otherIncome: number;
  standardDeduction: number;
  itemizedDeductions: number;
  personalExemptions?: number; // Pre-2018
  dependents: number;
  estimatedWithholding?: number; // Estimated tax withholding
  credits: {
    earnedIncomeCredit?: number;
    childTaxCredit?: number;
    educationCredit?: number;
    otherCredits?: number;
  };
}

export interface TaxCalculation {
  grossIncome: number;
  adjustedGrossIncome: number;
  adjustments: number;
  deductionUsed: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  credits: number;
  taxLiability: number;
  selfEmploymentTax: number;
  totalTax: number;
  estimatedWithholding: number;
  refundOrBalance: number;
}

/**
 * Get tax brackets for a given year and filing status
 */
export function getTaxBrackets(year: number, filingStatus: FilingStatus): TaxBracket[] {
  // Data source: Tax-Calculator (taxcalc) 6.3.0 policy parameters
  // Extracted in this workspace via `python3 -m pip install taxcalc==6.3.0` and Policy.select_eq().
  // Note: This is intended to cover 2023–2025 for the Forecaster prototype.
  const thresholds: Record<number, Record<FilingStatus, number[]>> = {
    2023: {
      single: [11000, 44725, 95375, 182100, 231250, 578125, Infinity],
      married_joint: [22000, 89450, 190750, 364200, 462500, 693750, Infinity],
      married_separate: [11000, 44725, 95375, 182100, 231250, 578125, Infinity],
      head_of_household: [15700, 59850, 95350, 182100, 231250, 578100, Infinity],
      qualifying_widow: [22000, 89450, 190750, 364200, 462500, 693750, Infinity],
    },
    2024: {
      single: [11600, 47150, 100525, 191950, 243725, 609350, Infinity],
      married_joint: [23200, 94300, 201050, 383900, 487450, 731200, Infinity],
      married_separate: [11600, 47150, 100525, 191950, 243725, 365600, Infinity],
      head_of_household: [16550, 63100, 100500, 191950, 243700, 609350, Infinity],
      qualifying_widow: [23200, 94300, 201050, 383900, 487450, 731200, Infinity],
    },
    2025: {
      single: [11925, 48475, 103350, 197300, 250525, 626350, Infinity],
      married_joint: [23850, 96950, 206700, 394600, 501050, 751600, Infinity],
      married_separate: [11925, 48475, 103350, 197300, 250525, 375800, Infinity],
      head_of_household: [17000, 64850, 103350, 197300, 250500, 626350, Infinity],
      qualifying_widow: [23850, 96950, 206700, 394600, 501050, 751600, Infinity],
    },
  };

  const rates = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
  const t = thresholds[year]?.[filingStatus] || thresholds[2024][filingStatus];
  const brackets: TaxBracket[] = [];
  let prevMin = 0;
  for (let i = 0; i < rates.length; i++) {
    const max = t[i] ?? Infinity;
    brackets.push({ min: prevMin, max, rate: rates[i] });
    prevMin = max;
  }
  return brackets;
}

/**
 * Get standard deduction for a given year and filing status
 */
export function getStandardDeduction(year: number, filingStatus: FilingStatus): number {
  // Data source: Tax-Calculator (taxcalc) 6.3.0 policy parameters (STD)
  const std: Record<number, Record<FilingStatus, number>> = {
    2023: {
      single: 13850,
      married_joint: 27700,
      married_separate: 13850,
      head_of_household: 20800,
      qualifying_widow: 27700,
    },
    2024: {
      single: 14600,
      married_joint: 29200,
      married_separate: 14600,
      head_of_household: 21900,
      qualifying_widow: 29200,
    },
    2025: {
      single: 15750,
      married_joint: 31500,
      married_separate: 15750,
      head_of_household: 23625,
      qualifying_widow: 31500,
    },
  };
  return std[year]?.[filingStatus] ?? std[2024][filingStatus];
}

/**
 * Calculate tax using progressive brackets
 */
export function calculateTaxFromBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const incomeInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += incomeInBracket * bracket.rate;
    remainingIncome -= incomeInBracket;
  }

  return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate self-employment tax (Social Security + Medicare)
 */
export function calculateSelfEmploymentTax(selfEmploymentIncome: number, wages: number, year: number): number {
  const socialSecurityRate = 0.124; // 12.4% (employee + employer)
  const medicareRate = 0.029; // 2.9% (employee + employer)
  // Data source: Tax-Calculator (taxcalc) 6.3.0 policy parameter SS_Earnings_c
  const socialSecurityWageBaseByYear: Record<number, number> = {
    2023: 160200,
    2024: 168600,
    2025: 176100,
  };
  const socialSecurityWageBase = socialSecurityWageBaseByYear[year] ?? socialSecurityWageBaseByYear[2024];

  // IRS: SE tax is calculated on 92.35% of net SE earnings (simplified here).
  const netEarnings = selfEmploymentIncome * 0.9235;
  // Approximate coordination with W-2 wages subject to SS wage base
  const remainingSSBase = Math.max(0, socialSecurityWageBase - Math.max(0, wages || 0));
  const taxableSS = Math.min(netEarnings, remainingSSBase);
  const socialSecurityTax = taxableSS * socialSecurityRate;
  const medicareTax = netEarnings * medicareRate;
  const selfEmploymentTax = socialSecurityTax + medicareTax;
  return Math.round(selfEmploymentTax * 100) / 100;
}

/**
 * Calculate comprehensive tax return
 */
export function calculateTax(input: TaxInput): TaxCalculation {
  // Calculate gross income
  const grossIncome =
    input.wages +
    input.selfEmploymentIncome +
    input.interestIncome +
    input.dividendIncome +
    input.capitalGains +
    input.rentalIncome +
    input.otherIncome;

  // Self-employment tax (simplified) and related adjustment (½ SE tax)
  const selfEmploymentTax = calculateSelfEmploymentTax(input.selfEmploymentIncome, input.wages, input.year);
  const adjustments = selfEmploymentTax * 0.5;

  // Calculate AGI (still simplified; only includes the SE-tax adjustment for now)
  const adjustedGrossIncome = grossIncome - adjustments;

  // Determine deduction (standard vs itemized)
  const defaultStandardDeduction = getStandardDeduction(input.year, input.filingStatus);
  const standard = input.standardDeduction && input.standardDeduction > 0 ? input.standardDeduction : defaultStandardDeduction;
  const deductionUsed = Math.max(standard, input.itemizedDeductions || 0);

  // Calculate taxable income
  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionUsed);

  // Get tax brackets
  const brackets = getTaxBrackets(input.year, input.filingStatus);

  // Calculate tax before credits
  const taxBeforeCredits = calculateTaxFromBrackets(taxableIncome, brackets);

  // Calculate credits
  const credits =
    (input.credits.earnedIncomeCredit || 0) +
    (input.credits.childTaxCredit || 0) +
    (input.credits.educationCredit || 0) +
    (input.credits.otherCredits || 0);

  // Calculate tax liability
  const taxLiability = Math.max(0, taxBeforeCredits - credits);

  // Total tax
  const totalTax = taxLiability + selfEmploymentTax;

  // Refund or balance due (assuming estimated withholding provided)
  const refundOrBalance = (input.estimatedWithholding || 0) - totalTax;

  return {
    grossIncome,
    adjustedGrossIncome,
    adjustments,
    deductionUsed,
    taxableIncome,
    taxBeforeCredits,
    credits,
    taxLiability,
    selfEmploymentTax,
    totalTax,
    estimatedWithholding: input.estimatedWithholding || 0,
    refundOrBalance,
  };
}


}