/* eslint-disable */
/**
 * Michigan Citation Tests
 * Tests validator against Michigan Appellate Opinion Manual rules
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { michiganCitationValidator, MichiganCitationFormat } from '../michigan-citations';

describe('Michigan Citation Validator', () => {
  describe('Traditional Case Citations', () => {
    it('validates Michigan Supreme Court citation', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich 123 (2020)');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe(MichiganCitationFormat.TRADITIONAL);
      expect(result.reporter).toBe('Mich');
      expect(result.volume).toBe('500');
      expect(result.page).toBe('123');
    });

    it('validates Michigan Court of Appeals citation', () => {
      const result = michiganCitationValidator.validate('Doe v Roe, 300 Mich App 456 (2019)');
      expect(result.isValid).toBe(true);
      expect(result.reporter).toBe('Mich App');
    });

    it('validates citation with pinpoint', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich 123, 125 (2020)');
      expect(result.isValid).toBe(true);
      expect(result.pinpoint).toBe('125');
    });

    it('accepts citation with periods but warns with W001', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich. 123 (2020)');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('W001');
      expect(result.warnings[0].message).toContain('periods');
    });
  });

  describe('Public Domain Citations', () => {
    it('validates Michigan Supreme Court public domain', () => {
      const result = michiganCitationValidator.validate('People v Smith, 2020 MI 45');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe(MichiganCitationFormat.PUBLIC_DOMAIN);
      expect(result.year).toBe('2020');
      expect(result.court).toBe('MI');
    });

    it('validates with paragraph reference', () => {
      const result = michiganCitationValidator.validate('People v Smith, 2020 MI 45, ¶ 12');
      expect(result.isValid).toBe(true);
      expect(result.paragraph).toBe('12');
    });

    it('validates Court of Appeals public domain', () => {
      const result = michiganCitationValidator.validate('Doe v Roe, 2019 MI App 123');
      expect(result.isValid).toBe(true);
      expect(result.court).toBe('MI App');
    });
  });

  describe('Statutory Citations', () => {
    it('validates MCL citation', () => {
      const result = michiganCitationValidator.validate('MCL 600.2922');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe(MichiganCitationFormat.STATUTORY);
      expect(result.statute).toBe('MCL');
      expect(result.section).toBe('600.2922');
    });

    it('validates MSA citation', () => {
      const result = michiganCitationValidator.validate('MSA 12.345');
      expect(result.isValid).toBe(true);
    });

    it('rejects M.C.L. with periods', () => {
      const errors = michiganCitationValidator.checkCommonErrors('M.C.L. 600.2922');
      expect(errors.some(e => e.includes('periods'))).toBe(true);
    });
  });

  describe('Court Rule Citations', () => {
    it('validates basic MCR citation', () => {
      const result = michiganCitationValidator.validate('MCR 2.116');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe(MichiganCitationFormat.COURT_RULE);
    });

    it('validates MCR with subsections', () => {
      const result = michiganCitationValidator.validate('MCR 2.116(C)(10)');
      expect(result.isValid).toBe(true);
      expect(result.section).toBe('2.116(C)(10)');
    });
  });

  describe('Warning Code Structure', () => {
    it('generates W001 for periods in reporter abbreviations', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 N.W.2d 100 (2020)');
      expect(result.isValid).toBe(true);
      const periodWarning = result.warnings.find(w => w.code === 'W001');
      expect(periodWarning).toBeDefined();
      expect(periodWarning?.message).toContain('NW 2d');
    });

    it('generates W002 for parallel citations', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich 100; 600 NW 2d 200 (2020)');
      expect(result.isValid).toBe(true);
      const parallelWarning = result.warnings.find(w => w.code === 'W002');
      expect(parallelWarning).toBeDefined();
    });

    it('warnings have stable code format', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich. 100 (2020)');
      if (result.warnings.length > 0) {
        expect(result.warnings[0]).toHaveProperty('code');
        expect(result.warnings[0]).toHaveProperty('message');
        expect(['W001', 'W002', 'W003', 'W004']).toContain(result.warnings[0].code);
      }
    });
  });

  describe('Common Error Detection', () => {
    it('detects periods in NW reporter via checkCommonErrors', () => {
      const errors = michiganCitationValidator.checkCommonErrors('500 N.W.2d 100');
      expect(errors[0]).toContain('NW 2d');
    });

    it('detects periods in Mich via checkCommonErrors', () => {
      const errors = michiganCitationValidator.checkCommonErrors('500 Mich. 100');
      expect(errors[0]).toContain('periods');
    });

    it('detects parallel citations with W002 warning', () => {
      const result = michiganCitationValidator.validate('People v Smith, 500 Mich 100; 600 NW 2d 200 (2020)');
      expect(result.isValid).toBe(true);
      const parallelWarning = result.warnings.find(w => w.code === 'W002');
      expect(parallelWarning).toBeDefined();
      expect(parallelWarning?.message).toContain('Parallel citations');
    });
  });
});

export const testMichiganCitations = async () => {
  console.log('Testing Michigan Citation Validator...\n');
  
  const testCases = [
    'People v Smith, 500 Mich 123 (2020)',
    'Doe v Roe, 300 Mich App 456 (2019)',
    '2020 MI 45',
    'MCL 600.2922',
    'MCR 2.116(C)(10)',
    'People v Smith, 500 N.W.2d 100 (2020)', // Should warn about periods
  ];
  
  for (const citation of testCases) {
    const result = michiganCitationValidator.validate(citation);
    console.log(`Citation: ${citation}`);
    console.log(`Valid: ${result.isValid}`);
    console.log(`Format: ${result.format}`);
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('---\n');
  }
};
