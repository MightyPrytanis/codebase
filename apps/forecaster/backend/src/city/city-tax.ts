import { CITY_TAX_CONFIG, type SupportedCity } from './cities.js';

export interface CityTaxInput {
  city: SupportedCity;
  year: 2023 | 2024 | 2025;
  isResident: boolean;
  // Simplified taxable base for scaffold:
  // wages + otherIncome (this is NOT a legally complete city tax base).
  wages: number;
  otherIncome?: number;
  withholding?: number;
}

export interface CityTaxResult {
  city: SupportedCity;
  year: 2023 | 2024 | 2025;
  isResident: boolean;
  taxBase: number;
  rate: number;
  tax: number;
  withholding: number;
  refundOrBalance: number;
  warnings: string[];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function calculateCityTax(input: CityTaxInput): CityTaxResult {
  const cfg = CITY_TAX_CONFIG[input.city];
  const warnings: string[] = [];

  if (cfg.source === 'UNVERIFIED_PLACEHOLDER') {
    warnings.push(
      `City tax rates for ${cfg.displayName} are scaffold placeholders (unverified). Confirm rates from an authoritative city source before relying on results.`
    );
  }

  const wages = Number(input.wages || 0);
  const other = Number(input.otherIncome || 0);
  const taxBase = Math.max(0, wages + other);
  const rate = input.isResident ? cfg.residentRate : cfg.nonresidentRate;

  const tax = round2(taxBase * rate);
  const withholding = round2(Number(input.withholding || 0));
  const refundOrBalance = round2(withholding - tax);

  return {
    city: input.city,
    year: input.year,
    isResident: input.isResident,
    taxBase: round2(taxBase),
    rate,
    tax,
    withholding,
    refundOrBalance,
    warnings
  };
}

