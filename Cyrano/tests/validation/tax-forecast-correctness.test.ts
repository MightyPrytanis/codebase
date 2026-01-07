/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect } from 'vitest';
import { calculateTax, getTaxBrackets, TaxInput } from '../../src/modules/forecast/formulas/tax-formulas.js';

/**
 * Functional Correctness Tests for Tax Forecast
 * 
 * These tests validate that tax calculations match actual IRS requirements
 * Reference: IRS Publication 17, 2024 Tax Year brackets
 */

describe('Tax Forecast Correctness Validation', () => {
  describe('Tax Bracket Validation (2024)', () => {
    it('should use correct 2024 single filer brackets', () => {
      const brackets = getTaxBrackets(2024, 'single');
      
      // Verify first bracket (10% up to $11,600)
      expect(brackets[0].min).toBe(0);
      expect(brackets[0].max).toBe(11600);
      expect(brackets[0].rate).toBe(0.10);
      
      // Verify second bracket (12% from $11,600 to $47,150)
      expect(brackets[1].min).toBe(11600);
      expect(brackets[1].max).toBe(47150);
      expect(brackets[1].rate).toBe(0.12);
      
      // Verify top bracket (37% over $609,350)
      const topBracket = brackets[brackets.length - 1];
      expect(topBracket.min).toBe(609350);
      expect(topBracket.max).toBe(Infinity);
      expect(topBracket.rate).toBe(0.37);
    });

    it('should use correct 2024 married joint filer brackets', () => {
      const brackets = getTaxBrackets(2024, 'married_joint');
      
      // Married joint brackets are double single brackets
      expect(brackets[0].min).toBe(0);
      expect(brackets[0].max).toBe(23200); // 2x $11,600
      expect(brackets[0].rate).toBe(0.10);
    });
  });

  describe('Tax Calculation Correctness', () => {
    it('should calculate tax correctly for single filer in 10% bracket', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 10000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600, // 2024 single standard deduction
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // $10,000 income - $14,600 standard deduction = negative taxable income
      // Should result in $0 tax
      expect(result.taxableIncome).toBeLessThanOrEqual(0);
      expect(result.taxLiability).toBe(0);
    });

    it('should calculate tax correctly for single filer in 12% bracket', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 50000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // $50,000 - $14,600 = $35,400 taxable income
      // First $11,600 at 10% = $1,160
      // Remaining $23,800 at 12% = $2,856
      // Total = $4,016
      const expectedTax = 1160 + (35400 - 11600) * 0.12;
      expect(result.taxLiability).toBeCloseTo(expectedTax, 0);
    });

    it('should apply standard deduction correctly', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 60000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // Should use standard deduction (not itemized)
      expect(result.taxableIncome).toBe(60000 - 14600);
    });

    it('should apply itemized deductions when higher than standard', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 60000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 20000, // Higher than standard
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // Should use itemized deductions
      expect(result.taxableIncome).toBe(60000 - 20000);
    });

    it('should calculate self-employment tax correctly', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 0,
        selfEmploymentIncome: 100000,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // Self-employment tax is 15.3% on first $160,200 (2024)
      // 92.35% of net earnings subject to SE tax
      // SE tax = $100,000 * 0.9235 * 0.153 = $14,129.55
      expect(result.selfEmploymentTax).toBeGreaterThan(0);
      // Should be approximately 14.13% of self-employment income
      expect(result.selfEmploymentTax / 100000).toBeCloseTo(0.1413, 2);
    });

    it('should apply child tax credit correctly', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'married_joint',
        wages: 100000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 29200, // 2024 married joint
        itemizedDeductions: 0,
        dependents: 2,
        credits: {
          childTaxCredit: 2000 * 2, // $2,000 per child (2024)
        },
      };

      const result = calculateTax(input);
      
      // Credits should reduce tax liability
      expect(result.credits).toBe(4000);
      expect(result.taxLiability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle zero income correctly', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 0,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      expect(result.taxLiability).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('should handle very high income correctly', () => {
      const input: TaxInput = {
        year: 2024,
        filingStatus: 'single',
        wages: 1000000,
        selfEmploymentIncome: 0,
        interestIncome: 0,
        dividendIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        otherIncome: 0,
        standardDeduction: 14600,
        itemizedDeductions: 0,
        dependents: 0,
        credits: {},
      };

      const result = calculateTax(input);
      
      // Should be in top bracket (37%)
      expect(result.taxLiability).toBeGreaterThan(0);
      // Tax should be substantial
      expect(result.taxLiability).toBeGreaterThan(200000);
    });
  });
});
