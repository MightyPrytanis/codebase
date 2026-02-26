/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect } from 'vitest';
import { mcrComplianceService, DocumentMetadata } from '../../src/services/mcr-compliance-service.js';

describe('MCR Compliance Service', () => {
  describe('validateDocumentFormat', () => {
    it('should validate document with proper caption', () => {
      const document = `Case No. 2025-12345
IN RE: John Doe v. Jane Doe

This is a legal document with proper formatting.`;
      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
        filingType: 'motion',
      };

      const result = mcrComplianceService.validateDocumentFormat(document, metadata);
      expect(result.compliant).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should flag missing case number in caption', () => {
      const document = `This is a legal document without a proper caption.`;
      const metadata: DocumentMetadata = {
        filingType: 'motion',
      };

      const result = mcrComplianceService.validateDocumentFormat(document, metadata);
      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].rule).toBe('MCR 2.113');
    });

    it('should warn about missing page numbers in multi-page documents', () => {
      const document = `Case No. 2025-12345
IN RE: John Doe v. Jane Doe

${'Page content.\n'.repeat(50)}`;
      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
        pageCount: 3,
      };

      const result = mcrComplianceService.validateDocumentFormat(document, metadata);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateEFilingSpecs', () => {
    it('should validate PDF format for e-filing', () => {
      const metadata: DocumentMetadata = {
        format: 'pdf',
        caseNumber: '2025-12345',
        filingType: 'motion',
        court: 'Michigan Circuit Court',
      };

      const result = mcrComplianceService.validateEFilingSpecs(metadata);
      expect(result.compliant).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should flag non-PDF format for e-filing', () => {
      const metadata: DocumentMetadata = {
        format: 'docx',
        caseNumber: '2025-12345',
      };

      const result = mcrComplianceService.validateEFilingSpecs(metadata);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.description.includes('PDF'))).toBe(true);
    });

    it('should flag missing case number for e-filing', () => {
      const metadata: DocumentMetadata = {
        format: 'pdf',
      };

      const result = mcrComplianceService.validateEFilingSpecs(metadata);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.description.includes('case number'))).toBe(true);
    });
  });

  describe('validateServiceOfProcess', () => {
    it('should validate service document with proof of service', () => {
      const document = `AFFIDAVIT OF SERVICE

I hereby certify that I served the attached document on the defendant
by personal service on January 15, 2025.`;
      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
      };

      const result = mcrComplianceService.validateServiceOfProcess(document, metadata);
      expect(result.compliant).toBe(true);
    });

    it('should flag missing proof of service', () => {
      const document = `This is a service document but it doesn't include proof of service.`;
      const result = mcrComplianceService.validateServiceOfProcess(document);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.description.includes('proof of service'))).toBe(true);
    });

    it('should warn about missing service method', () => {
      const document = `AFFIDAVIT OF SERVICE

I served the document.`;
      const result = mcrComplianceService.validateServiceOfProcess(document);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateCitationFormat', () => {
    it('should validate Michigan citations without periods', () => {
      const citations = [
        '123 Mich App 456',
        '456 Mich 789',
      ];

      const result = mcrComplianceService.validateCitationFormat(citations);
      expect(result.compliant).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should flag citations with periods in abbreviations', () => {
      const citations = [
        '123 Mich. App. 456', // Violates Michigan rule
        '456 Mich. 789',
      ];

      const result = mcrComplianceService.validateCitationFormat(citations);
      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].description).toContain('periods in abbreviations');
    });
  });

  describe('validateDocument (comprehensive)', () => {
    it('should perform comprehensive validation', () => {
      const document = `Case No. 2025-12345
IN RE: John Doe v. Jane Doe

This is a properly formatted legal document.
Citation: 123 Mich App 456`;
      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
        format: 'pdf',
        filingType: 'motion',
        court: 'Michigan Circuit Court',
      };

      const result = mcrComplianceService.validateDocument(document, metadata, {
        checkFormat: true,
        checkEFiling: true,
        checkCitations: true,
      });

      expect(result.overall).toBeDefined();
      expect(result.format).toBeDefined();
      expect(result.eFiling).toBeDefined();
      expect(result.citations).toBeDefined();
    });
  });
});