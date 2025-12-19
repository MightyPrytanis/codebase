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
  // 2024 tax brackets (most recent)
  const brackets2024: Record<FilingStatus, TaxBracket[]> = {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
    married_joint: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ],
    married_separate: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 365600, rate: 0.35 },
      { min: 365600, max: Infinity, rate: 0.37 },
    ],
    head_of_household: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16550, max: 63100, rate: 0.12 },
      { min: 63100, max: 100500, rate: 0.22 },
      { min: 100500, max: 191950, rate: 0.24 },
      { min: 191950, max: 243700, rate: 0.32 },
      { min: 243700, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
    qualifying_widow: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ],
  };

  // For now, use 2024 brackets for all years (in production, would have year-specific data)
  // TODO: Add historical brackets for 2018-2023
  return brackets2024[filingStatus] || brackets2024.single;
}

/**
 * Get standard deduction for a given year and filing status
 */
export function getStandardDeduction(year: number, filingStatus: FilingStatus): number {
  // 2024 standard deductions
  const deductions2024: Record<FilingStatus, number> = {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_of_household: 21900,
    qualifying_widow: 29200,
  };

  // TODO: Add historical standard deductions for 2018-2023
  return deductions2024[filingStatus] || deductions2024.single;
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
export function calculateSelfEmploymentTax(selfEmploymentIncome: number, year: number): number {
  // 2024 rates
  const socialSecurityRate = 0.124; // 12.4% (employee + employer)
  const medicareRate = 0.029; // 2.9% (employee + employer)
  const socialSecurityWageBase = 168600; // 2024

  const taxableSS = Math.min(selfEmploymentIncome, socialSecurityWageBase);
  const socialSecurityTax = taxableSS * socialSecurityRate;
  const medicareTax = selfEmploymentIncome * medicareRate;

  // Self-employment tax is reduced by employer-equivalent portion (50%)
  const selfEmploymentTax = (socialSecurityTax + medicareTax) * 0.9235; // SE tax adjustment

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

  // Calculate AGI (simplified - would include adjustments in full implementation)
  const adjustedGrossIncome = grossIncome;

  // Determine deduction (standard vs itemized)
  const deduction = Math.max(input.standardDeduction, input.itemizedDeductions || 0);

  // Calculate taxable income
  const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);

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

  // Calculate self-employment tax
  const selfEmploymentTax = calculateSelfEmploymentTax(input.selfEmploymentIncome, input.year);

  // Total tax
  const totalTax = taxLiability + selfEmploymentTax;

  // Refund or balance due (assuming estimated withholding provided)
  const refundOrBalance = (input.estimatedWithholding || 0) - totalTax;

  return {
    grossIncome,
    adjustedGrossIncome,
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

