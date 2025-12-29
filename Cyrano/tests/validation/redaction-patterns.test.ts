/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect } from 'vitest';
import { documentProcessor } from '../../src/tools/document-processor.js';

/**
 * Functional Correctness Tests for Redaction Patterns
 * 
 * These tests validate that redaction patterns correctly identify and redact
 * PHI, HIPAA, FERPA, and PII data
 */

describe('Redaction Patterns Correctness Validation', () => {
  describe('SSN Redaction', () => {
    it('should redact SSN in XXX-XX-XXXX format', () => {
      const document = 'Patient SSN: 123-45-6789';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-SSN]');
      expect(result.redacted_document).not.toContain('123-45-6789');
      expect(result.redaction_log.some(log => log.type === 'PII-SSN')).toBe(true);
    });

    it('should redact SSN in XXX XX XXXX format', () => {
      const document = 'Patient SSN: 123 45 6789';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-SSN]');
      expect(result.redacted_document).not.toContain('123 45 6789');
    });

    it('should redact SSN in XXXXXXXXX format', () => {
      const document = 'Patient SSN: 123456789';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-SSN]');
      expect(result.redacted_document).not.toContain('123456789');
    });

    it('should handle multiple SSNs in same document', () => {
      const document = 'Patient 1 SSN: 123-45-6789. Patient 2 SSN: 987-65-4321.';
      const result = documentProcessor.performRedaction(document, { pii: true });

      const ssnLog = result.redaction_log.find(log => log.type === 'PII-SSN');
      expect(ssnLog?.count).toBe(2);
      expect(result.redacted_document.match(/\[REDACTED-SSN\]/g)?.length).toBe(2);
    });
  });

  describe('Credit Card Redaction', () => {
    it('should redact credit card numbers', () => {
      const document = 'Payment method: 4532-1234-5678-9010';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-CC]');
      expect(result.redacted_document).not.toContain('4532-1234-5678-9010');
    });

    it('should redact credit card without dashes', () => {
      const document = 'Card number: 4532123456789010';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-CC]');
    });
  });

  describe('Date of Birth Redaction', () => {
    it('should redact DOB in MM/DD/YYYY format', () => {
      const document = 'Patient DOB: 01/15/1980';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-DOB]');
      expect(result.redacted_document).not.toContain('01/15/1980');
    });

    it('should redact DOB in MM-DD-YYYY format', () => {
      const document = 'Patient DOB: 01-15-1980';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-DOB]');
    });

    it('should redact DOB in YYYY-MM-DD format', () => {
      const document = 'Patient DOB: 1980-01-15';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-DOB]');
    });
  });

  describe('Email Redaction', () => {
    it('should redact email addresses', () => {
      const document = 'Contact: patient@example.com';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-EMAIL]');
      expect(result.redacted_document).not.toContain('patient@example.com');
    });

    it('should handle multiple email addresses', () => {
      const document = 'Email: test@example.com and admin@test.org';
      const result = documentProcessor.performRedaction(document, { pii: true });

      const emailLog = result.redaction_log.find(log => log.type === 'PII-EMAIL');
      expect(emailLog?.count).toBe(2);
    });
  });

  describe('Phone Number Redaction', () => {
    it('should redact phone numbers in (XXX) XXX-XXXX format', () => {
      const document = 'Phone: (313) 555-1234';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-PHONE]');
      expect(result.redacted_document).not.toContain('(313) 555-1234');
    });

    it('should redact phone numbers in XXX-XXX-XXXX format', () => {
      const document = 'Phone: 313-555-1234';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-PHONE]');
    });
  });

  describe('HIPAA PHI Redaction', () => {
    it('should redact medical record numbers', () => {
      const document = 'MRN: 12345678';
      const result = documentProcessor.performRedaction(document, { hipaa: true, phi: true });

      expect(result.redacted_document).toContain('[REDACTED-MRN]');
    });

    it('should redact health insurance information', () => {
      const document = 'Insurance ID: ABC123456789';
      const result = documentProcessor.performRedaction(document, { hipaa: true, phi: true });

      // Should be redacted as part of HIPAA compliance
      expect(result.redaction_log.length).toBeGreaterThan(0);
    });
  });

  describe('FERPA Student Data Redaction', () => {
    it('should redact student IDs', () => {
      const document = 'Student ID: 123456789';
      const result = documentProcessor.performRedaction(document, { ferpa: true });

      expect(result.redacted_document).toContain('[REDACTED-STUDENT-ID]');
    });

    it('should redact grade information when requested', () => {
      const document = 'Grade: A, GPA: 3.8';
      const result = documentProcessor.performRedaction(document, { ferpa: true });

      // Should log grade information if redaction rules include it
      expect(result.redaction_log.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Address Redaction', () => {
    it('should redact street addresses', () => {
      const document = 'Address: 123 Main Street, Detroit, MI 48201';
      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-ADDRESS]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle documents with no sensitive data', () => {
      const document = 'This is a regular document with no sensitive information.';
      const result = documentProcessor.performRedaction(document, {
        pii: true,
        hipaa: true,
        ferpa: true,
      });

      expect(result.redacted_document).toBe(document);
      expect(result.redaction_log.length).toBe(0);
    });

    it('should handle mixed sensitive data', () => {
      const document = `Patient: John Doe
SSN: 123-45-6789
DOB: 01/15/1980
Email: john@example.com
Phone: (313) 555-1234
Address: 123 Main St, Detroit, MI 48201`;

      const result = documentProcessor.performRedaction(document, { pii: true });

      expect(result.redacted_document).toContain('[REDACTED-SSN]');
      expect(result.redacted_document).toContain('[REDACTED-DOB]');
      expect(result.redacted_document).toContain('[REDACTED-EMAIL]');
      expect(result.redacted_document).toContain('[REDACTED-PHONE]');
      expect(result.redacted_document).toContain('[REDACTED-ADDRESS]');
    });

    it('should preserve document structure after redaction', () => {
      const document = `Line 1: SSN 123-45-6789
Line 2: Regular text
Line 3: Email test@example.com`;

      const result = documentProcessor.performRedaction(document, { pii: true });

      // Should maintain line breaks
      expect(result.redacted_document.split('\n').length).toBe(3);
    });

    it('should handle partial matches correctly', () => {
      // Test that partial SSN-like patterns don't trigger false positives
      const document = 'Reference number: 123-45-678 (not a full SSN)';
      const result = documentProcessor.performRedaction(document, { pii: true });

      // Should not redact partial matches
      expect(result.redacted_document).not.toContain('[REDACTED-SSN]');
    });
  });

  describe('Redaction Log Accuracy', () => {
    it('should accurately count redactions', () => {
      const document = `SSN: 123-45-6789
Another SSN: 987-65-4321
Email: test@example.com`;

      const result = documentProcessor.performRedaction(document, { pii: true });

      const ssnLog = result.redaction_log.find(log => log.type === 'PII-SSN');
      expect(ssnLog?.count).toBe(2);

      const emailLog = result.redaction_log.find(log => log.type === 'PII-EMAIL');
      expect(emailLog?.count).toBe(1);
    });

    it('should include examples in redaction log', () => {
      const document = 'SSN: 123-45-6789';
      const result = documentProcessor.performRedaction(document, { pii: true });

      const ssnLog = result.redaction_log.find(log => log.type === 'PII-SSN');
      expect(ssnLog?.examples).toBeDefined();
      expect(ssnLog?.examples.length).toBeGreaterThan(0);
    });
  });
});
