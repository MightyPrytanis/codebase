export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';

export interface FederalTaxInput {
  year: 2023 | 2024 | 2025;
  filingStatus: FilingStatus;
  wages: number;
  selfEmploymentIncome?: number;
  interestIncome?: number;
  dividendIncome?: number;
  capitalGains?: number;
  otherIncome?: number;
  itemizedDeductions?: number;
  standardDeduction?: number;
  estimatedWithholding?: number;
}

export interface FederalTaxResult {
  year: 2023 | 2024 | 2025;
  filingStatus: FilingStatus;
  grossIncome: number;
  adjustments: number;
  adjustedGrossIncome: number;
  deductionUsed: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  credits: number;
  selfEmploymentTax: number;
  totalTax: number;
  withholding: number;
  refundOrBalance: number;
}

type BracketsByStatus = Record<FilingStatus, number[]>;

// Data source: Tax-Calculator (taxcalc) 6.3.0 policy parameters extracted locally.
const THRESHOLDS: Record<2023 | 2024 | 2025, BracketsByStatus> = {
  2023: {
    single: [11000, 44725, 95375, 182100, 231250, 578125, Infinity],
    married_joint: [22000, 89450, 190750, 364200, 462500, 693750, Infinity],
    married_separate: [11000, 44725, 95375, 182100, 231250, 578125, Infinity],
    head_of_household: [15700, 59850, 95350, 182100, 231250, 578100, Infinity],
    qualifying_widow: [22000, 89450, 190750, 364200, 462500, 693750, Infinity]
  },
  2024: {
    single: [11600, 47150, 100525, 191950, 243725, 609350, Infinity],
    married_joint: [23200, 94300, 201050, 383900, 487450, 731200, Infinity],
    married_separate: [11600, 47150, 100525, 191950, 243725, 365600, Infinity],
    head_of_household: [16550, 63100, 100500, 191950, 243700, 609350, Infinity],
    qualifying_widow: [23200, 94300, 201050, 383900, 487450, 731200, Infinity]
  },
  2025: {
    single: [11925, 48475, 103350, 197300, 250525, 626350, Infinity],
    married_joint: [23850, 96950, 206700, 394600, 501050, 751600, Infinity],
    married_separate: [11925, 48475, 103350, 197300, 250525, 375800, Infinity],
    head_of_household: [17000, 64850, 103350, 197300, 250500, 626350, Infinity],
    qualifying_widow: [23850, 96950, 206700, 394600, 501050, 751600, Infinity]
  }
};

const STD_DEDUCTION: Record<2023 | 2024 | 2025, Record<FilingStatus, number>> = {
  2023: {
    single: 13850,
    married_joint: 27700,
    married_separate: 13850,
    head_of_household: 20800,
    qualifying_widow: 27700
  },
  2024: {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_of_household: 21900,
    qualifying_widow: 29200
  },
  2025: {
    single: 15750,
    married_joint: 31500,
    married_separate: 15750,
    head_of_household: 23625,
    qualifying_widow: 31500
  }
};

const SS_WAGE_BASE: Record<2023 | 2024 | 2025, number> = {
  2023: 160200,
  2024: 168600,
  2025: 176100
};

const RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37] as const;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calcTaxFromBrackets(taxableIncome: number, thresholds: number[]): number {
  let tax = 0;
  let prev = 0;
  for (let i = 0; i < RATES.length; i++) {
    const max = thresholds[i] ?? Infinity;
    const amount = Math.max(0, Math.min(taxableIncome, max) - prev);
    tax += amount * RATES[i];
    prev = max;
    if (taxableIncome <= max) break;
  }
  return round2(tax);
}

function calcSelfEmploymentTax(seIncome: number, wages: number, year: 2023 | 2024 | 2025): number {
  const net = seIncome * 0.9235;
  const remainingSS = Math.max(0, SS_WAGE_BASE[year] - Math.max(0, wages));
  const ssTax = Math.min(net, remainingSS) * 0.124;
  const medicareTax = net * 0.029;
  return round2(ssTax + medicareTax);
}

export function calculateFederal(input: FederalTaxInput): FederalTaxResult {
  const seIncome = Number(input.selfEmploymentIncome || 0);
  const interest = Number(input.interestIncome || 0);
  const dividends = Number(input.dividendIncome || 0);
  const capGains = Number(input.capitalGains || 0);
  const otherIncome = Number(input.otherIncome || 0);
  const wages = Number(input.wages || 0);
  const withholding = Number(input.estimatedWithholding || 0);

  const grossIncome = wages + seIncome + interest + dividends + capGains + otherIncome;

  const seTax = calcSelfEmploymentTax(seIncome, wages, input.year);
  const adjustments = seTax * 0.5; // 1/2 SE tax deduction (simplified)
  const agi = grossIncome - adjustments;

  const standard = input.standardDeduction && input.standardDeduction > 0
    ? input.standardDeduction
    : STD_DEDUCTION[input.year][input.filingStatus];
  const itemized = Number(input.itemizedDeductions || 0);
  const deductionUsed = Math.max(standard, itemized);

  const taxableIncome = Math.max(0, agi - deductionUsed);
  const taxBeforeCredits = calcTaxFromBrackets(taxableIncome, THRESHOLDS[input.year][input.filingStatus]);

  // Credits intentionally not implemented in this prototype path; keep explicit.
  const credits = 0;
  const totalTax = round2(taxBeforeCredits + seTax - credits);
  const refundOrBalance = round2(withholding - totalTax);

  return {
    year: input.year,
    filingStatus: input.filingStatus,
    grossIncome: round2(grossIncome),
    adjustments: round2(adjustments),
    adjustedGrossIncome: round2(agi),
    deductionUsed: round2(deductionUsed),
    taxableIncome: round2(taxableIncome),
    taxBeforeCredits,
    credits,
    selfEmploymentTax: seTax,
    totalTax,
    withholding: round2(withholding),
    refundOrBalance
  };
}

