/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect } from 'vitest';
import { mcrComplianceService, DocumentMetadata } from '../../src/services/mcr-compliance-service.js';

describe('MCR Document Validation Integration Tests', () => {
  describe('End-to-End Document Validation', () => {
    it('should validate a complete motion document', () => {
      const document = `Case No. 2025-12345
IN THE CIRCUIT COURT FOR THE COUNTY OF WAYNE
STATE OF MICHIGAN

IN RE: John Doe v. Jane Doe

MOTION FOR SUMMARY DISPOSITION

Page 1

NOW COMES the Plaintiff, John Doe, by and through counsel, and moves this Court
for summary disposition pursuant to MCR 2.116.

Citation: 123 Mich App 456, 789 NW2d 123 (2020).

RESPECTFULLY SUBMITTED,
Attorney Name
Attorney for Plaintiff`;

      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
        format: 'pdf',
        filingType: 'motion',
        court: 'Wayne County Circuit Court',
        pageCount: 1,
      };

      const result = mcrComplianceService.validateDocument(document, metadata, {
        checkFormat: true,
        checkEFiling: true,
        checkCitations: true,
      });

      expect(result.overall.compliant).toBe(true);
      expect(result.format?.compliant).toBe(true);
      expect(result.eFiling?.compliant).toBe(true);
    });

    it('should identify multiple compliance issues', () => {
      const document = `This is a document without proper formatting.
Citation: 123 Mich. App. 456 (has periods - violates Michigan rule).`;

      const metadata: DocumentMetadata = {
        format: 'docx', // Wrong format for e-filing
      };

      const result = mcrComplianceService.validateDocument(document, metadata, {
        checkFormat: true,
        checkEFiling: true,
        checkCitations: true,
      });

      expect(result.overall.compliant).toBe(false);
      expect(result.overall.violations.length).toBeGreaterThan(0);
    });

    it('should validate service of process document', () => {
      const document = `Case No. 2025-12345
IN RE: John Doe v. Jane Doe

AFFIDAVIT OF SERVICE

I, John Server, hereby certify that on January 15, 2025, I served the attached
Motion for Summary Disposition on Jane Doe by personal service at her residence
located at 123 Main Street, Detroit, Michigan 48201.

Service was completed at 2:00 PM on January 15, 2025.

/s/ John Server
John Server, Process Server`;

      const metadata: DocumentMetadata = {
        caseNumber: '2025-12345',
      };

      const result = mcrComplianceService.validateDocument(document, metadata, {
        checkService: true,
      });

      expect(result.service?.compliant).toBe(true);
    });
  });
});
