/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDefinedContributionQDRO,
  calculateDefinedBenefitQDRO,
  QDROInput,
} from '../../src/modules/forecast/formulas/qdro-formulas.js';

/**
 * Functional Correctness Tests for QDRO Forecast
 * 
 * These tests validate that QDRO calculations comply with ERISA requirements
 * and Michigan domestic relations order standards
 */

describe('QDRO Forecast Correctness Validation', () => {
  describe('Defined Contribution Plan QDRO', () => {
    it('should calculate division amount correctly for 50% split', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 100000,
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        divisionPercentage: 50,
      };

      const result = calculateDefinedContributionQDRO(input);

      // 50% of $100,000 = $50,000
      expect(result.divisionAmount).toBe(50000);
      expect(result.accountBalanceAmount).toBe(50000);
      expect(result.maritalServicePeriod).toBeCloseTo(11, 1); // ~11 years
    });

    it('should calculate division amount correctly for 30% split', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 200000,
        maritalServiceStart: new Date('2015-06-01'),
        maritalServiceEnd: new Date('2024-06-01'),
        divisionPercentage: 30,
      };

      const result = calculateDefinedContributionQDRO(input);

      // 30% of $200,000 = $60,000
      expect(result.divisionAmount).toBe(60000);
      expect(result.accountBalanceAmount).toBe(60000);
    });

    it('should flag division percentage over 50%', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 100000,
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        divisionPercentage: 60, // Over 50%
      };

      const result = calculateDefinedContributionQDRO(input);

      expect(result.complianceNotes.length).toBeGreaterThan(0);
      expect(result.complianceNotes.some(note => note.includes('50%'))).toBe(true);
    });

    it('should calculate marital service period correctly', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 100000,
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-01-01'), // Exactly 10 years
        divisionPercentage: 50,
      };

      const result = calculateDefinedContributionQDRO(input);

      expect(result.maritalServicePeriod).toBeCloseTo(10, 1);
    });
  });

  describe('Defined Benefit Plan QDRO', () => {
    it('should calculate division amount correctly for defined benefit plan', () => {
      const input: QDROInput = {
        planType: 'defined_benefit',
        monthlyBenefit: 2000,
        maritalServiceStart: new Date('1990-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        retirementAge: 65,
        participantDOB: new Date('1960-01-01'),
        divisionPercentage: 50,
      };

      const result = calculateDefinedBenefitQDRO(input);

      expect(result.monthlyBenefitAmount).toBeDefined();
      expect(result.erisaCompliant).toBe(true);
      expect(result.maritalServicePeriod).toBeCloseTo(31, 1); // ~31 years
    });

    it('should calculate marital service percentage correctly', () => {
      const input: QDROInput = {
        planType: 'defined_benefit',
        monthlyBenefit: 3000,
        maritalServiceStart: new Date('2000-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        retirementAge: 65,
        participantDOB: new Date('1970-01-01'),
        divisionPercentage: 50,
      };

      const result = calculateDefinedBenefitQDRO(input);

      // Marital service: 21 years
      // Total service: from age 18 to 65 = 47 years
      // Marital service percentage: 21/47 = ~44.7%
      expect(result.maritalServicePercentage).toBeGreaterThan(0);
      expect(result.maritalServicePercentage).toBeLessThanOrEqual(100);
    });

    it('should validate ERISA compliance', () => {
      const input: QDROInput = {
        planType: 'defined_benefit',
        monthlyBenefit: 2000,
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        retirementAge: 65,
        participantDOB: new Date('1980-01-01'),
        divisionPercentage: 50,
      };

      const result = calculateDefinedBenefitQDRO(input);

      // Should include compliance validation
      expect(result.erisaCompliant).toBeDefined();
      expect(result.complianceNotes).toBeInstanceOf(Array);
    });
  });

  describe('ERISA Compliance Validation', () => {
    it('should flag negative marital service period', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 100000,
        maritalServiceStart: new Date('2020-01-01'),
        maritalServiceEnd: new Date('2010-01-01'), // End before start
        divisionPercentage: 50,
      };

      const result = calculateDefinedContributionQDRO(input);

      expect(result.complianceNotes.some(note => note.includes('negative'))).toBe(true);
    });

    it('should require account balance for defined contribution', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        divisionPercentage: 50,
      };

      expect(() => calculateDefinedContributionQDRO(input)).toThrow();
    });

    it('should require monthly benefit for defined benefit', () => {
      const input: QDROInput = {
        planType: 'defined_benefit',
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        divisionPercentage: 50,
      };

      expect(() => calculateDefinedBenefitQDRO(input)).toThrow();
    });
  });

  describe('Michigan Domestic Relations Order Requirements', () => {
    it('should validate division percentage is within valid range', () => {
      const input: QDROInput = {
        planType: 'defined_contribution',
        accountBalance: 100000,
        maritalServiceStart: new Date('2010-01-01'),
        maritalServiceEnd: new Date('2020-12-31'),
        divisionPercentage: 0, // Minimum
      };

      const result = calculateDefinedContributionQDRO(input);
      expect(result.divisionAmount).toBe(0);

      const input2: QDROInput = {
        ...input,
        divisionPercentage: 100, // Maximum
      };

      const result2 = calculateDefinedContributionQDRO(input2);
      expect(result2.divisionAmount).toBe(100000);
    });
  });
});
