/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Michigan Court Rules (MCR) Compliance Service
 * 
 * Validates legal documents and processes for compliance with:
 * - MCR 2.113: Document formatting requirements
 * - MCR 1.109: E-filing specifications
 * - MCR 2.105: Service of process standards
 * - Michigan Appellate Opinions Manual: Citation formatting
 */

export interface MCRValidationResult {
  compliant: boolean;
  rule: string; // e.g., "MCR 2.113", "MCR 1.109"
  violations: MCRViolation[];
  warnings: MCRWarning[];
  recommendations: string[];
}

export interface MCRViolation {
  rule: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location?: {
    line?: number;
    section?: string;
    field?: string;
  };
  fix?: string;
}

export interface MCRWarning {
  rule: string;
  description: string;
  recommendation: string;
}

export interface DocumentMetadata {
  title?: string;
  caseNumber?: string;
  court?: string;
  filingType?: 'motion' | 'brief' | 'pleading' | 'order' | 'other';
  format?: 'docx' | 'pdf' | 'txt';
  pageCount?: number;
  wordCount?: number;
}

/**
 * MCR Compliance Service
 */
export class MCRComplianceService {
  /**
   * Validate document formatting per MCR 2.113
   * 
   * MCR 2.113 requirements:
   * - Paper size: 8.5 x 11 inches
   * - Margins: At least 1 inch on all sides
   * - Font: 12-point, legible font
   * - Line spacing: Double-spaced (except for footnotes, quotations, etc.)
   * - Page numbering: Required
   * - Caption: Required with case name and number
   */
  validateDocumentFormat(document: string, metadata?: DocumentMetadata): MCRValidationResult {
    const violations: MCRViolation[] = [];
    const warnings: MCRWarning[] = [];
    const recommendations: string[] = [];

    // Check for required caption (case name and number)
    const hasCaseNumber = metadata?.caseNumber || /Case No\.?\s*[:-]?\s*[\d-]+/i.test(document);
    const hasCaseName = /IN RE|v\.|vs\.|versus/i.test(document) || metadata?.caseNumber;

    if (!hasCaseNumber && !hasCaseName) {
      violations.push({
        rule: 'MCR 2.113',
        description: 'Document missing required caption with case name and number',
        severity: 'critical',
        fix: 'Add caption with case name and case number at the top of the document',
      });
    }

    // Check for page numbering indicators
    const hasPageNumbers = /Page \d+|^\s*\d+\s*$/m.test(document);
    if (!hasPageNumbers && metadata?.pageCount && metadata.pageCount > 1) {
      warnings.push({
        rule: 'MCR 2.113',
        description: 'Multi-page document should include page numbers',
        recommendation: 'Add page numbers to all pages',
      });
    }

    // Check for proper line spacing (basic check - would need more sophisticated parsing)
    const lines = document.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    // Very long lines might indicate single-spacing
    if (avgLineLength > 100) {
      warnings.push({
        rule: 'MCR 2.113',
        description: 'Document may not be double-spaced as required',
        recommendation: 'Verify document is double-spaced (except for footnotes and block quotations)',
      });
    }

    // Check for proper font size indicators (basic check)
    if (metadata?.format === 'pdf') {
      recommendations.push('Verify PDF uses 12-point font as required by MCR 2.113');
    }

    return {
      compliant: violations.length === 0,
      rule: 'MCR 2.113',
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Validate e-filing specifications per MCR 1.109
   * 
   * MCR 1.109 requirements:
   * - File format: PDF (required for e-filing)
   * - File size: Within court system limits
   * - Metadata: Required fields (case number, document type, etc.)
   * - Signatures: Electronic signature requirements
   * - Service: E-service requirements
   */
  validateEFilingSpecs(metadata: DocumentMetadata): MCRValidationResult {
    const violations: MCRViolation[] = [];
    const warnings: MCRWarning[] = [];
    const recommendations: string[] = [];

    // E-filing requires PDF format
    if (metadata.format && metadata.format !== 'pdf') {
      violations.push({
        rule: 'MCR 1.109',
        description: 'E-filing requires PDF format',
        severity: 'critical',
        location: { field: 'format' },
        fix: 'Convert document to PDF format before e-filing',
      });
    }

    // Case number required for e-filing
    if (!metadata.caseNumber) {
      violations.push({
        rule: 'MCR 1.109',
        description: 'case number required for e-filing',
        severity: 'critical',
        location: { field: 'caseNumber' },
        fix: 'Provide case number in document metadata',
      });
    }

    // Document type should be specified
    if (!metadata.filingType) {
      warnings.push({
        rule: 'MCR 1.109',
        description: 'Document type should be specified for e-filing',
        recommendation: 'Specify filing type (motion, brief, pleading, etc.)',
      });
    }

    // Court should be specified
    if (!metadata.court) {
      warnings.push({
        rule: 'MCR 1.109',
        description: 'Court should be specified for e-filing',
        recommendation: 'Specify target court in document metadata',
      });
    }

    // File size recommendations (typical limits are 10-25MB)
    recommendations.push('Verify file size is within court e-filing system limits (typically 10-25MB)');
    recommendations.push('Ensure document includes required electronic signature if applicable');

    return {
      compliant: violations.length === 0,
      rule: 'MCR 1.109',
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Validate service of process per MCR 2.105
   * 
   * MCR 2.105 requirements:
   * - Service methods: Personal service, service by mail, service by publication
   * - Proof of service: Required affidavit or certificate
   * - Time limits: Service must be completed within specified timeframes
   * - Service on parties: Proper identification of parties to be served
   */
  validateServiceOfProcess(processDoc: string, metadata?: DocumentMetadata): MCRValidationResult {
    const violations: MCRViolation[] = [];
    const warnings: MCRWarning[] = [];
    const recommendations: string[] = [];

    // Check for proof of service indicators
    const hasProofOfService = /^[\s]*(?:PROOF OF SERVICE|AFFIDAVIT OF SERVICE|CERTIFICATE OF SERVICE)/im.test(processDoc);
    if (!hasProofOfService) {
      violations.push({
        rule: 'MCR 2.105',
        description: 'Service of process document must include proof of service',
        severity: 'critical',
        fix: 'Include affidavit or certificate of service with the document',
      });
    }

    // Check for service method identification
    const hasServiceMethod = /personal service|service by mail|service by publication|substituted service/i.test(processDoc);
    if (!hasServiceMethod) {
      warnings.push({
        rule: 'MCR 2.105',
        description: 'Service method should be clearly identified',
        recommendation: 'Specify method of service (personal, mail, publication, etc.)',
      });
    }

    // Check for party identification
    const hasPartyNames = /plaintiff|defendant|petitioner|respondent/i.test(processDoc);
    if (!hasPartyNames) {
      warnings.push({
        rule: 'MCR 2.105',
        description: 'Parties to be served should be clearly identified',
        recommendation: 'Include names and addresses of all parties to be served',
      });
    }

    // Check for service date
    const hasServiceDate = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(processDoc);
    if (!hasServiceDate) {
      warnings.push({
        rule: 'MCR 2.105',
        description: 'Service date should be documented',
        recommendation: 'Include date of service in proof of service',
      });
    }

    recommendations.push('Verify service was completed within required timeframes per MCR 2.105');
    recommendations.push('Ensure all required parties were properly served');

    return {
      compliant: violations.length === 0,
      rule: 'MCR 2.105',
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Validate citation formatting per Michigan Appellate Opinions Manual
   * 
   * Michigan citation requirements:
   * - No periods in abbreviations (MANDATORY RULE)
   * - Proper reporter abbreviations
   * - Proper case name formatting
   * - Proper page number format
   */
  validateCitationFormat(citations: string[]): MCRValidationResult {
    const violations: MCRViolation[] = [];
    const warnings: MCRWarning[] = [];
    const recommendations: string[] = [];

    // Check each citation for Michigan formatting rules
    citations.forEach((citation, index) => {
      // Check for periods in abbreviations (violation of Michigan rule)
      const periodInAbbrev = /(?:Mich|App|Ct|Cir|Dist|Sup)\./.test(citation);
      if (periodInAbbrev) {
        violations.push({
          rule: 'Michigan Appellate Opinions Manual',
          description: `Citation ${index + 1} contains periods in abbreviations (violates Michigan rule)`,
          severity: 'high',
          location: { section: `citation_${index + 1}` },
          fix: 'Remove periods from abbreviations (e.g., "Mich App" not "Mich. App.")',
        });
      }

      // Check for proper Michigan reporter format
      const hasMichiganReporter = /Mich App|Mich Ct App|Mich|Mich Comp Laws/i.test(citation);
      if (!hasMichiganReporter && /Michigan|Mich/i.test(citation)) {
        warnings.push({
          rule: 'Michigan Appellate Opinions Manual',
          description: `Citation ${index + 1} may not follow Michigan reporter format`,
          recommendation: 'Verify citation uses proper Michigan reporter abbreviations',
        });
      }
    });

    if (violations.length === 0 && warnings.length === 0) {
      recommendations.push('All citations appear to comply with Michigan Appellate Opinions Manual');
    }

    return {
      compliant: violations.length === 0,
      rule: 'Michigan Appellate Opinions Manual',
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Comprehensive validation of a document for all MCR requirements
   */
  validateDocument(
    document: string,
    metadata?: DocumentMetadata,
    options?: {
      checkFormat?: boolean;
      checkEFiling?: boolean;
      checkService?: boolean;
      checkCitations?: boolean;
    }
  ): {
    overall: MCRValidationResult;
    format?: MCRValidationResult;
    eFiling?: MCRValidationResult;
    service?: MCRValidationResult;
    citations?: MCRValidationResult;
  } {
    const results: any = {};
    const allViolations: MCRViolation[] = [];
    const allWarnings: MCRWarning[] = [];
    const allRecommendations: string[] = [];

    // Format validation
    if (options?.checkFormat !== false) {
      results.format = this.validateDocumentFormat(document, metadata);
      allViolations.push(...results.format.violations);
      allWarnings.push(...results.format.warnings);
      allRecommendations.push(...results.format.recommendations);
    }

    // E-filing validation
    if (options?.checkEFiling && metadata) {
      results.eFiling = this.validateEFilingSpecs(metadata);
      allViolations.push(...results.eFiling.violations);
      allWarnings.push(...results.eFiling.warnings);
      allRecommendations.push(...results.eFiling.recommendations);
    }

    // Service of process validation
    if (options?.checkService) {
      results.service = this.validateServiceOfProcess(document, metadata);
      allViolations.push(...results.service.violations);
      allWarnings.push(...results.service.warnings);
      allRecommendations.push(...results.service.recommendations);
    }

    // Citation validation
    if (options?.checkCitations) {
      const citationMatches = document.match(/\d+\s+(?:Mich|Mich App|Mich Ct App|F\.?\s*(?:2d|3d)?|S\.?\s*Ct|U\.?\s*S)[\s\S]{0,200}/gi) || [];
      if (citationMatches.length > 0) {
        results.citations = this.validateCitationFormat(citationMatches);
        allViolations.push(...results.citations.violations);
        allWarnings.push(...results.citations.warnings);
        allRecommendations.push(...results.citations.recommendations);
      }
    }

    // Overall result
    results.overall = {
      compliant: allViolations.length === 0,
      rule: 'MCR Comprehensive',
      violations: allViolations,
      warnings: allWarnings,
      recommendations: allRecommendations,
    };

    return results;
  }
}

// Export singleton instance
export const mcrComplianceService = new MCRComplianceService();
}