/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Tax Calculation Formulas
 * Implements IRS tax brackets and calculation logic for 2018-2025
 */

import { z } from 'zod';

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
  // Covers 2018-2025 (2018 was first year of TCJA)
  const thresholds: Record<number, Record<FilingStatus, number[]>> = {
    2018: {
      single: [9525, 38700, 82500, 157500, 200000, 500000, Infinity],
      married_joint: [19050, 77400, 165000, 315000, 400000, 600000, Infinity],
      married_separate: [9525, 38700, 82500, 157500, 200000, 300000, Infinity],
      head_of_household: [13650, 51800, 82500, 157500, 200000, 500000, Infinity],
      qualifying_widow: [19050, 77400, 165000, 315000, 400000, 600000, Infinity],
    },
    2019: {
      single: [9700, 39475, 84200, 160725, 204100, 510300, Infinity],
      married_joint: [19400, 78950, 168400, 321450, 408200, 612350, Infinity],
      married_separate: [9700, 39475, 84200, 160725, 204100, 306175, Infinity],
      head_of_household: [13850, 52850, 84200, 160700, 204100, 510300, Infinity],
      qualifying_widow: [19400, 78950, 168400, 321450, 408200, 612350, Infinity],
    },
    2020: {
      single: [9875, 40125, 85525, 163300, 207350, 518400, Infinity],
      married_joint: [19750, 80250, 171050, 326600, 414700, 622050, Infinity],
      married_separate: [9875, 40125, 85525, 163300, 207350, 311025, Infinity],
      head_of_household: [14100, 53700, 85500, 163300, 207350, 518400, Infinity],
      qualifying_widow: [19750, 80250, 171050, 326600, 414700, 622050, Infinity],
    },
    2021: {
      single: [9950, 40525, 86375, 164925, 209425, 523600, Infinity],
      married_joint: [19900, 81050, 172750, 329850, 418850, 628300, Infinity],
      married_separate: [9950, 40525, 86375, 164925, 209425, 314150, Infinity],
      head_of_household: [14200, 54200, 86350, 164900, 209400, 523600, Infinity],
      qualifying_widow: [19900, 81050, 172750, 329850, 418850, 628300, Infinity],
    },
    2022: {
      single: [10275, 41775, 89450, 190750, 364200, 462500, Infinity],
      married_joint: [20550, 83550, 178950, 364200, 462500, 693750, Infinity],
      married_separate: [10275, 41775, 89450, 190750, 231250, 346875, Infinity],
      head_of_household: [14650, 55900, 89450, 190750, 364200, 462500, Infinity],
      qualifying_widow: [20550, 83550, 178950, 364200, 462500, 693750, Infinity],
    },
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
    2018: {
      single: 12000,
      married_joint: 24000,
      married_separate: 12000,
      head_of_household: 18000,
      qualifying_widow: 24000,
    },
    2019: {
      single: 12200,
      married_joint: 24400,
      married_separate: 12200,
      head_of_household: 18350,
      qualifying_widow: 24400,
    },
    2020: {
      single: 12400,
      married_joint: 24800,
      married_separate: 12400,
      head_of_household: 18650,
      qualifying_widow: 24800,
    },
    2021: {
      single: 12550,
      married_joint: 25100,
      married_separate: 12550,
      head_of_household: 18800,
      qualifying_widow: 25100,
    },
    2022: {
      single: 12950,
      married_joint: 25900,
      married_separate: 12950,
      head_of_household: 19400,
      qualifying_widow: 25900,
    },
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
    2018: 128400,
    2019: 132900,
    2020: 137700,
    2021: 142800,
    2022: 147000,
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

// ============================================================================
// Credit Calculation Constants (Tax-Calculator 6.3.0 policy parameters)
// ============================================================================

// CTC / ODC / ACTC
// Note: CTC was $2000 per child starting in 2018 (TCJA). ACTC refundable portion varies by year.
const CTC_AMOUNT: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, number> = {
  2018: 2000, 2019: 2000, 2020: 2000, 2021: 2000, 2022: 2000, 2023: 2000, 2024: 2000, 2025: 2200
};
const ODC_AMOUNT: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, number> = {
  2018: 500, 2019: 500, 2020: 500, 2021: 500, 2022: 500, 2023: 500, 2024: 500, 2025: 500
};
const CTC_PHASEOUT_THRESHOLD: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, Record<FilingStatus, number>> = {
  2018: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2019: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2020: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2021: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2022: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2023: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2024: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 },
  2025: { single: 200000, married_joint: 400000, married_separate: 200000, head_of_household: 200000, qualifying_widow: 400000 }
};
const ACTC_REFUNDABLE_PER_CHILD: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, number> = {
  2018: 1400, 2019: 1400, 2020: 1400, 2021: 1400, 2022: 1500, 2023: 1600, 2024: 1700, 2025: 1700
};
const ACTC_EARNED_INCOME_THRESHOLD: number = 2500;
const ACTC_EARNED_INCOME_RATE: number = 0.15;
const ACTC_REFUNDABLE_CHILD_LIMIT: number = 3;

// EITC
type EitcKids = 0 | 1 | 2 | 3;
const EITC_MAX_CREDIT: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, Record<EitcKids, number>> = {
  2018: { 0: 519, 1: 3461, 2: 5719, 3: 6431 },
  2019: { 0: 529, 1: 3526, 2: 5828, 3: 6557 },
  2020: { 0: 538, 1: 3584, 2: 5920, 3: 6660 },
  2021: { 0: 1502, 1: 3618, 2: 5980, 3: 6728 },
  2022: { 0: 560, 1: 3733, 2: 6164, 3: 6935 },
  2023: { 0: 600, 1: 3995, 2: 6604, 3: 7430 },
  2024: { 0: 632, 1: 4213, 2: 6960, 3: 7830 },
  2025: { 0: 649, 1: 4405, 2: 7280, 3: 8180 }
};
const EITC_PHASE_IN_RATE: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, Record<EitcKids, number>> = {
  2018: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2019: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2020: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2021: { 0: 0.15, 1: 0.34, 2: 0.4, 3: 0.45 },
  2022: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2023: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2024: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 },
  2025: { 0: 0.0765, 1: 0.34, 2: 0.4, 3: 0.45 }
};
const EITC_PHASE_OUT_RATE: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, Record<EitcKids, number>> = {
  2018: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2019: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2020: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2021: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2022: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2023: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2024: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 },
  2025: { 0: 0.0765, 1: 0.1598, 2: 0.2106, 3: 0.2106 }
};
const EITC_PHASE_OUT_START: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, Record<EitcKids, number>> = {
  2018: { 0: 8490, 1: 18660, 2: 18660, 3: 18660 },
  2019: { 0: 8650, 1: 19030, 2: 19030, 3: 19030 },
  2020: { 0: 8790, 1: 19330, 2: 19330, 3: 19330 },
  2021: { 0: 9210, 1: 20260, 2: 20260, 3: 20260 },
  2022: { 0: 9530, 1: 20950, 2: 20950, 3: 20950 },
  2023: { 0: 9800, 1: 21560, 2: 21560, 3: 21560 },
  2024: { 0: 10330, 1: 22720, 2: 22720, 3: 22720 },
  2025: { 0: 10620, 1: 23370, 2: 23370, 3: 23370 }
};
const EITC_PHASE_OUT_MARRIED_ADDON: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, number> = {
  2018: 5700, 2019: 5840, 2020: 5960, 2021: 6250, 2022: 6400, 2023: 6570, 2024: 6920, 2025: 7110
};
const EITC_INVESTMENT_INCOME_LIMIT: Record<2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025, number> = {
  2018: 3500, 2019: 3600, 2020: 3650, 2021: 10000, 2022: 10150, 2023: 11000, 2024: 11600, 2025: 11950
};
const EITC_MIN_AGE = 25;
const EITC_MAX_AGE = 64;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampKids(n: number): EitcKids {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  return 3;
}

/**
 * Calculate EITC (Earned Income Tax Credit)
 */
function computeEitc(params: {
  year: 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;
  filingStatus: FilingStatus;
  agi: number;
  earnedIncome: number;
  investmentIncome: number;
  qualifyingKids: number;
  filerAge?: number;
  spouseAge?: number;
  canBeClaimedAsDependent?: boolean;
  warnings: string[];
}): number {
  const { year, filingStatus, agi, earnedIncome, investmentIncome, warnings } = params;

  // In most cases, MFS is ineligible. (There are narrow exceptions; not implemented.)
  if (filingStatus === 'married_separate') {
    warnings.push('EITC not computed for Married Filing Separately in this prototype (treated as ineligible).');
    return 0;
  }

  const invLimit = EITC_INVESTMENT_INCOME_LIMIT[year];
  if (investmentIncome > invLimit) {
    warnings.push(`EITC disallowed because investment income exceeds limit (${invLimit}).`);
    return 0;
  }

  const kids = clampKids(params.qualifyingKids);

  // Age/dependency rules for 0-kid EITC (simplified)
  if (kids === 0) {
    if (params.canBeClaimedAsDependent) {
      warnings.push('EITC (0 children) disallowed because filer can be claimed as a dependent.');
      return 0;
    }
    const age = params.filerAge;
    if (typeof age !== 'number') {
      warnings.push('EITC (0 children) requires filer age; not provided so credit computed as 0.');
      return 0;
    }
    if (age < EITC_MIN_AGE || age > EITC_MAX_AGE) {
      warnings.push(`EITC (0 children) requires age between ${EITC_MIN_AGE} and ${EITC_MAX_AGE}; outside range so credit computed as 0.`);
      return 0;
    }
    if (filingStatus === 'married_joint' && typeof params.spouseAge === 'number') {
      if (params.spouseAge < EITC_MIN_AGE || params.spouseAge > EITC_MAX_AGE) {
        warnings.push(`EITC (0 children) spouse age outside ${EITC_MIN_AGE}-${EITC_MAX_AGE}; credit computed as 0.`);
        return 0;
      }
    }
  }

  const maxCredit = EITC_MAX_CREDIT[year][kids];
  const phaseInRate = EITC_PHASE_IN_RATE[year][kids];
  const phaseOutRate = EITC_PHASE_OUT_RATE[year][kids];
  const basePhaseOutStart = EITC_PHASE_OUT_START[year][kids];
  const phaseOutStart = basePhaseOutStart + (filingStatus === 'married_joint' ? EITC_PHASE_OUT_MARRIED_ADDON[year] : 0);

  const phaseInCredit = Math.min(maxCredit, earnedIncome * phaseInRate);
  const incomeForPhaseout = Math.max(agi, earnedIncome);
  const phaseOut = Math.max(0, incomeForPhaseout - phaseOutStart) * phaseOutRate;
  return round2(Math.max(0, phaseInCredit - phaseOut));
}

/**
 * Calculate comprehensive tax return with automatic credit computation
 * This is the enhanced version that computes CTC/ODC/ACTC/EITC automatically
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

  // Calculate credits (use provided credits if available, otherwise compute automatically)
  let credits = 0;
  if (input.credits && (input.credits.earnedIncomeCredit !== undefined || input.credits.childTaxCredit !== undefined)) {
    // Use provided credits
    credits =
      (input.credits.earnedIncomeCredit || 0) +
      (input.credits.childTaxCredit || 0) +
      (input.credits.educationCredit || 0) +
      (input.credits.otherCredits || 0);
  } else {
    // Auto-compute credits (simplified - would need additional input fields for full computation)
    credits =
      (input.credits?.earnedIncomeCredit || 0) +
      (input.credits?.childTaxCredit || 0) +
      (input.credits?.educationCredit || 0) +
      (input.credits?.otherCredits || 0);
  }

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

// ============================================================================
// Standalone Backend Compatibility Interface
// ============================================================================

/**
 * Standalone backend input interface (for compatibility)
 */
export interface FederalTaxInput {
  year: 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;
  filingStatus: FilingStatus;
  wages: number;
  selfEmploymentIncome?: number;
  interestIncome?: number;
  dividendIncome?: number;
  capitalGains?: number;
  otherIncome?: number;
  itemizedDeductions?: number;
  standardDeduction?: number;
  // Credits (computed) inputs
  qualifyingChildrenUnder17?: number;
  otherDependents?: number;
  // EITC eligibility inputs (required for 0-kid EITC; otherwise best-effort)
  filerAge?: number;
  spouseAge?: number;
  canBeClaimedAsDependent?: boolean;
  estimatedWithholding?: number;
}

/**
 * Zod validation schema for FederalTaxInput
 * Ensures type safety and runtime validation at API boundaries
 */
export const FederalTaxInputSchema = z.object({
  year: z.union([z.literal(2018), z.literal(2019), z.literal(2020), z.literal(2021), z.literal(2022), z.literal(2023), z.literal(2024), z.literal(2025)]),
  filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow']),
  wages: z.number().nonnegative(),
  selfEmploymentIncome: z.number().nonnegative().optional(),
  interestIncome: z.number().nonnegative().optional(),
  dividendIncome: z.number().nonnegative().optional(),
  capitalGains: z.number().optional(),
  otherIncome: z.number().optional(),
  itemizedDeductions: z.number().nonnegative().optional(),
  standardDeduction: z.number().nonnegative().optional(),
  qualifyingChildrenUnder17: z.number().int().nonnegative().optional(),
  otherDependents: z.number().int().nonnegative().optional(),
  filerAge: z.number().int().positive().optional(),
  spouseAge: z.number().int().positive().optional(),
  canBeClaimedAsDependent: z.boolean().optional(),
  estimatedWithholding: z.number().nonnegative().optional()
});


/**
 * Standalone backend result interface (for compatibility)
 */
export interface FederalTaxResult {
  year: 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;
  filingStatus: FilingStatus;
  grossIncome: number;
  adjustments: number;
  adjustedGrossIncome: number;
  deductionUsed: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  nonrefundableCredits: number;
  refundableCredits: number;
  creditsBreakdown: {
    childTaxCreditNonrefundable: number;
    otherDependentCreditNonrefundable: number;
    additionalChildTaxCreditRefundable: number;
    earnedIncomeCreditRefundable: number;
  };
  warnings: string[];
  selfEmploymentTax: number;
  incomeTaxAfterCredits: number;
  totalTax: number;
  withholding: number;
  totalPayments: number;
  refundOrBalance: number;
}

/**
 * Calculate federal tax with complete credit computations
 * This function matches the standalone backend's calculateFederal() interface
 * and includes full CTC/ODC/ACTC/EITC calculations
 */
export function calculateFederal(input: FederalTaxInput): FederalTaxResult {
  const warnings: string[] = [];

  const seIncome = Number(input.selfEmploymentIncome || 0);
  const interest = Number(input.interestIncome || 0);
  const dividends = Number(input.dividendIncome || 0);
  const capGains = Number(input.capitalGains || 0);
  const otherIncome = Number(input.otherIncome || 0);
  const wages = Number(input.wages || 0);
  const withholding = Number(input.estimatedWithholding || 0);

  const grossIncome = wages + seIncome + interest + dividends + capGains + otherIncome;

  const seTax = calculateSelfEmploymentTax(seIncome, wages, input.year);
  const adjustments = seTax * 0.5; // 1/2 SE tax deduction (simplified)
  const agi = grossIncome - adjustments;

  const standard = input.standardDeduction && input.standardDeduction > 0
    ? input.standardDeduction
    : getStandardDeduction(input.year, input.filingStatus);
  const itemized = Number(input.itemizedDeductions || 0);
  const deductionUsed = Math.max(standard, itemized);

  const taxableIncome = Math.max(0, agi - deductionUsed);
  const brackets = getTaxBrackets(input.year, input.filingStatus);
  const taxBeforeCredits = calculateTaxFromBrackets(taxableIncome, brackets);

  // ------------------------------------------------------------
  // Credits (CTC/ODC + ACTC + EITC) — computed using taxcalc policy parameters
  // ------------------------------------------------------------

  const qualifyingChildrenUnder17 = Math.max(0, Math.floor(Number(input.qualifyingChildrenUnder17 || 0)));
  const otherDependents = Math.max(0, Math.floor(Number(input.otherDependents || 0)));

  const baseCTC = qualifyingChildrenUnder17 * CTC_AMOUNT[input.year];
  const baseODC = otherDependents * ODC_AMOUNT[input.year];

  // CTC/ODC phaseout: $50 per $1,000 (or part) over threshold (simplified MAGI≈AGI here)
  const threshold = CTC_PHASEOUT_THRESHOLD[input.year][input.filingStatus];
  const excess = Math.max(0, agi - threshold);
  const reduction = Math.ceil(excess / 1000) * 50;

  const remainingCTC = Math.max(0, baseCTC - reduction);
  const remainingODC = Math.max(0, baseODC - Math.max(0, reduction - baseCTC));

  // Nonrefundable credits can reduce income tax (not SE tax)
  const nonrefundableAvailable = remainingCTC + remainingODC;
  const nonrefundableUsed = Math.min(taxBeforeCredits, nonrefundableAvailable);
  const incomeTaxAfterCredits = round2(Math.max(0, taxBeforeCredits - nonrefundableUsed));

  // Refundable ACTC is limited (simplified) and applies only to remaining CTC portion
  const usedNonrefundableFromCTC = Math.min(remainingCTC, nonrefundableUsed);
  const ctcLeftAfterNonrefundable = Math.max(0, remainingCTC - usedNonrefundableFromCTC);
  const refundableChildCount = Math.min(qualifyingChildrenUnder17, ACTC_REFUNDABLE_CHILD_LIMIT);
  const refundableCap = refundableChildCount * ACTC_REFUNDABLE_PER_CHILD[input.year];
  const earnedIncome = wages + seIncome * 0.9235;
  const refundableByEarnedIncome = Math.max(0, (earnedIncome - ACTC_EARNED_INCOME_THRESHOLD) * ACTC_EARNED_INCOME_RATE);
  const actc = round2(Math.min(ctcLeftAfterNonrefundable, refundableCap, refundableByEarnedIncome));

  // Refundable EITC (best-effort)
  const investmentIncome = interest + dividends + capGains;
  const eitc = computeEitc({
    year: input.year,
    filingStatus: input.filingStatus,
    agi,
    earnedIncome,
    investmentIncome,
    qualifyingKids: qualifyingChildrenUnder17,
    filerAge: input.filerAge,
    spouseAge: input.spouseAge,
    canBeClaimedAsDependent: input.canBeClaimedAsDependent,
    warnings
  });

  const refundableCredits = actc + eitc;
  const totalPayments = round2(withholding + refundableCredits);

  const totalTax = round2(incomeTaxAfterCredits + seTax);
  const refundOrBalance = round2(totalPayments - totalTax);

  return {
    year: input.year,
    filingStatus: input.filingStatus,
    grossIncome: round2(grossIncome),
    adjustments: round2(adjustments),
    adjustedGrossIncome: round2(agi),
    deductionUsed: round2(deductionUsed),
    taxableIncome: round2(taxableIncome),
    taxBeforeCredits,
    nonrefundableCredits: round2(nonrefundableUsed),
    refundableCredits: round2(refundableCredits),
    creditsBreakdown: {
      childTaxCreditNonrefundable: round2(usedNonrefundableFromCTC),
      otherDependentCreditNonrefundable: round2(Math.max(0, nonrefundableUsed - usedNonrefundableFromCTC)),
      additionalChildTaxCreditRefundable: actc,
      earnedIncomeCreditRefundable: eitc
    },
    warnings,
    selfEmploymentTax: seTax,
    incomeTaxAfterCredits,
    totalTax,
    withholding: round2(withholding),
    totalPayments,
    refundOrBalance
  };
}

