/**
 * Michigan Citation Validator
 * Based on: Michigan Appellate Opinions Manual
 * https://www.courts.michigan.gov/siteassets/publications/manuals/msc/miappopmanual.pdf
 * 
 * MANDATORY for all Michigan state court pleadings and opinions
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';

// Michigan citation format types
export enum MichiganCitationFormat {
  TRADITIONAL = 'traditional',           // People v Smith, 500 Mich 123 (2020)
  PUBLIC_DOMAIN = 'public_domain',       // People v Smith, 2020 MI 45
  STATUTORY = 'statutory',               // MCL 123.456
  COURT_RULE = 'court_rule',            // MCR 2.116
  FEDERAL = 'federal',                   // US v Smith, 500 US 123 (2020)
}

// Michigan reporter abbreviations (NO PERIODS per manual)
// Note: Reporters can appear with or without spaces (e.g., "Mich App" or "MichApp")
// This map uses normalized keys (no spaces) but accepts variations
const MICHIGAN_REPORTERS: Record<string, { name: string; court?: string; series?: string }> = {
  // Michigan state reporters
  'mich': { name: 'Michigan Reports', court: 'Supreme Court' },
  'michapp': { name: 'Michigan Appeals Reports', court: 'Court of Appeals' },
  
  // Regional reporters (Michigan format - no periods)
  'nw': { name: 'North Western Reporter', series: '1st' },
  'nw2d': { name: 'North Western Reporter', series: '2nd' },
  'nw3d': { name: 'North Western Reporter', series: '3rd' },
  
  // Federal reporters (Michigan format - no periods)
  'us': { name: 'United States Reports', court: 'US Supreme Court' },
  'sct': { name: 'Supreme Court Reporter', court: 'US Supreme Court' },
  'f': { name: 'Federal Reporter', series: '1st' },
  'f2d': { name: 'Federal Reporter', series: '2nd' },
  'f3d': { name: 'Federal Reporter', series: '3rd' },
  'f4th': { name: 'Federal Reporter', series: '4th' },
  'fsupp': { name: 'Federal Supplement', series: '1st' },
  'fsupp2d': { name: 'Federal Supplement', series: '2nd' },
  'fsupp3d': { name: 'Federal Supplement', series: '3rd' },
};

/**
 * Normalize reporter name for lookup (remove spaces, periods, convert to lowercase)
 */
function normalizeReporter(reporter: string): string {
  return reporter.replace(/[\s.]/g, '').toLowerCase();
}

/**
 * Get reporter info if valid, handling variations
 */
function getReporterInfo(reporter: string): { name: string; court?: string; series?: string } | null {
  const normalized = normalizeReporter(reporter);
  return MICHIGAN_REPORTERS[normalized] || null;
}

// Michigan court abbreviations (NO PERIODS)
export const MICHIGAN_COURTS = {
  'MI': 'Michigan Supreme Court',
  'MI App': 'Michigan Court of Appeals',
  'Mich Ct App': 'Michigan Court of Appeals',
  'ED Mich': 'Eastern District of Michigan',
  'WD Mich': 'Western District of Michigan',
  'CA 6': 'US Court of Appeals, Sixth Circuit',
};

// Michigan statutory abbreviations (NO PERIODS)
export const MICHIGAN_STATUTORY = {
  'MCL': 'Michigan Compiled Laws',
  'MCR': 'Michigan Court Rules',
  'MSA': 'Michigan Statutes Annotated',
  'MCLA': 'Michigan Compiled Laws Annotated',
};

// Warning codes per Michigan Appellate Opinions Manual
export type WarningCode = 'W001' | 'W002' | 'W003' | 'W004';

export interface CitationWarning {
  code: WarningCode;
  message: string;
  position?: { start: number; end: number };
}

export interface MichiganCitation {
  raw: string;
  format: MichiganCitationFormat;
  caseName?: string;
  volume?: string;
  reporter?: string;
  page?: string;
  pinpoint?: string;
  court?: string;
  year?: string;
  paragraph?: string;
  statute?: string;
  section?: string;
  isValid: boolean;
  errors: string[];
  warnings: CitationWarning[];
}

export class MichiganCitationValidator {
  
  /**
   * Create a structured warning
   */
  private createWarning(code: WarningCode, message: string, position?: { start: number; end: number }): CitationWarning {
    return { code, message, position };
  }
  
  /**
   * Validate a citation against Michigan rules
   */
  validate(citation: string): MichiganCitation {
    const trimmed = citation.trim();
    
    // Try traditional case citation
    const traditional = this.parseTraditional(trimmed);
    if (traditional.isValid) return traditional;
    
    // Try public domain citation
    const publicDomain = this.parsePublicDomain(trimmed);
    if (publicDomain.isValid) return publicDomain;
    
    // Try statutory citation
    const statutory = this.parseStatutory(trimmed);
    if (statutory.isValid) return statutory;
    
    // Try court rule citation
    const courtRule = this.parseCourtRule(trimmed);
    if (courtRule.isValid) return courtRule;
    
    // Invalid citation
    return {
      raw: trimmed,
      format: MichiganCitationFormat.TRADITIONAL,
      isValid: false,
      errors: ['Citation does not match any Michigan format'],
      warnings: [],
    };
  }
  
  /**
   * Parse traditional case citation
   * Format: Case Name, Volume Reporter Page, Pinpoint (Court Year)
   * Also handles: Case Name, Volume Reporter Page; Parallel Citation (Year)
   * Example: People v Smith, 500 Mich 123, 125 (2020)
   * Example: Hays v Lutheran Social Servs of Mich, 300 Mich App 54; 832 NW2d 433 (2013)
   */
  private parseTraditional(citation: string): MichiganCitation {
    const errors: string[] = [];
    const warnings: CitationWarning[] = [];
    
    // First, check for parallel citations (semicolon-separated)
    // Example: "300 Mich App 54; 832 NW2d 433 (2013)"
    const hasParallel = citation.includes(';');
    
    // Pattern: Case Name, Volume Reporter Page, Pinpoint (Court Year)
    // More flexible: allows variations in spacing, handles semicolons for parallel citations
    // Also accepts periods in reporters (but will warn about them)
    // Group 1: Case name (everything up to first comma)
    // Group 2: Volume
    // Group 3: Reporter (can have spaces, periods, like "Mich App" or "Mich." or "N.W.2d")
    // Group 4: Page
    // Group 5: Optional pinpoint
    // Group 6: Optional parallel citation (after semicolon)
    // Group 7: Optional court/year in parentheses
    const pattern = /^(.+?),\s*(\d+)\s+([A-Za-z][A-Za-z0-9\s.]*?)\s+(\d+)(?:,\s*(\d+))?(?:\s*;\s*(\d+\s+[A-Za-z][A-Za-z0-9\s.]*?\s+\d+))?\s*(?:\(([^)]*?)(?:\s+(\d{4}))?\))?/;
    const match = citation.match(pattern);
    
    if (!match) {
      // Try short-form citation: "Hays, 300 Mich App at 59"
      // Also handles periods in reporters
      const shortFormPattern = /^(.+?),\s*(\d+)\s+([A-Za-z][A-Za-z0-9\s.]*?)\s+(?:at\s+)?(\d+)(?:\s*\(([^)]*?)\))?/;
      const shortMatch = citation.match(shortFormPattern);
      
      if (shortMatch) {
        const caseName = shortMatch[1].trim();
        const volume = shortMatch[2];
        const reporter = shortMatch[3].trim();
        const page = shortMatch[4];
        const court = shortMatch[5]?.trim();
        
        // Normalize reporter
        const reporterInfo = getReporterInfo(reporter);
        const normalizedReporter = reporterInfo ? 
          (reporter.includes(' ') ? reporter : reporter.replace(/([a-z])([A-Z])/g, '$1 $2')) : 
          reporter;
        
        if (reporter.includes('.')) {
          warnings.push(this.createWarning('W001', `Reporter "${reporter}" contains periods - Michigan prefers format without periods`));
        }
        
        if (!reporterInfo) {
          errors.push(`Unknown reporter "${reporter}"`);
        }
        
        return {
          raw: citation,
          format: MichiganCitationFormat.TRADITIONAL,
          caseName,
          volume,
          reporter: normalizedReporter,
          page,
          court,
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      }
      
      return {
        raw: citation,
        format: MichiganCitationFormat.TRADITIONAL,
        isValid: false,
        errors: ['Does not match traditional Michigan citation format'],
        warnings: [],
      };
    }
    
    const caseName = match[1].trim();
    const volume = match[2];
    let reporter = match[3].trim();
    const page = match[4];
    const pinpoint = match[5];
    const parallelCitation = match[6];
    let court: string | undefined = match[7]?.trim();
    let year = match[8];
    
    // If no separate year group, try to extract from court/parentheses
    if (!year && court) {
      const yearMatch = court.match(/\b(\d{4})\b/);
      if (yearMatch) {
        year = yearMatch[1];
        // Remove year from court string
        const cleanedCourt = court.replace(/\s*\d{4}\s*/, '').trim();
        court = cleanedCourt.length > 0 ? cleanedCourt : undefined;
      }
    }
    
    // Check for periods before normalization (to show original in warning)
    const hasPeriods = reporter.includes('.');
    const originalReporter = reporter;
    
    // Normalize reporter (handle "Mich App" vs "MichApp", and periods)
    const reporterInfo = getReporterInfo(reporter);
    if (reporterInfo) {
      const normalized = normalizeReporter(reporter);
      // Use preferred format: "Mich App" (with space) for Michigan Appeals
      if (normalized === 'michapp') {
        reporter = 'Mich App';
      } else if (normalized === 'mich') {
        reporter = 'Mich';
      } else if (normalized.startsWith('nw')) {
        // Normalize NW reporters: "NW2d" or "N.W.2d" -> "NW 2d" (preferred format)
        if (normalized === 'nw2d') {
          reporter = 'NW 2d';
        } else if (normalized === 'nw3d') {
          reporter = 'NW 3d';
        } else if (normalized === 'nw') {
          reporter = 'NW';
        }
      } else if (normalized.startsWith('f')) {
        // Normalize F reporters
        if (normalized === 'f2d') reporter = 'F 2d';
        else if (normalized === 'f3d') reporter = 'F 3d';
        else if (normalized === 'f4th') reporter = 'F 4th';
        else if (normalized === 'fsupp') reporter = 'F Supp';
        else if (normalized === 'fsupp2d') reporter = 'F Supp 2d';
        else if (normalized === 'fsupp3d') reporter = 'F Supp 3d';
        else if (normalized === 'f') reporter = 'F';
      }
    }
    
    // Validate reporter (no periods allowed in Michigan format)
    if (hasPeriods) {
      warnings.push(this.createWarning('W001', `Reporter "${originalReporter}" contains periods - Michigan prefers "${reporter}" (no periods)`));
    }
    
    if (!reporterInfo) {
      errors.push(`Unknown reporter "${reporter}" - should be one of: Mich, Mich App, NW, NW 2d, NW 3d, US, F, F 2d, F 3d, F 4th, F Supp, F Supp 2d, F Supp 3d`);
    }
    
    // Validate court abbreviation (if present)
    if (court && court.includes('.')) {
      warnings.push(this.createWarning('W001', `Court abbreviation "${court}" contains periods - Michigan prefers format without periods`));
    }
    
    // Note parallel citation if present
    if (parallelCitation) {
      warnings.push(this.createWarning('W002', 'Parallel citations are no longer required in Michigan (but are acceptable)'));
    }
    
    return {
      raw: citation,
      format: MichiganCitationFormat.TRADITIONAL,
      caseName,
      volume,
      reporter,
      page,
      pinpoint,
      court,
      year,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  
  /**
   * Parse public domain citation
   * Format: Case Name, Year State Court Sequence ¶ Paragraph
   * Example: People v Smith, 2020 MI 45, ¶ 12
   */
  private parsePublicDomain(citation: string): MichiganCitation {
    const errors: string[] = [];
    
    // Pattern: Case Name, Year MI/MI App Sequence, ¶ Paragraph
    const pattern = /^(.+?),\s*(\d{4})\s+(MI(?:\s+App)?)\s+(\d+)(?:,?\s*¶\s*(\d+))?/;
    const match = citation.match(pattern);
    
    if (!match) {
      return {
        raw: citation,
        format: MichiganCitationFormat.PUBLIC_DOMAIN,
        isValid: false,
        errors: ['Does not match Michigan public domain citation format'],
        warnings: [],
      };
    }
    
    const caseName = match[1].trim();
    const year = match[2];
    const court = match[3].trim();
    const sequence = match[4];
    const paragraph = match[5];
    
    return {
      raw: citation,
      format: MichiganCitationFormat.PUBLIC_DOMAIN,
      caseName,
      year,
      court,
      volume: sequence,
      paragraph,
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
  
  /**
   * Parse statutory citation
   * Format: MCL Section.Subsection
   * Example: MCL 600.2922
   */
  private parseStatutory(citation: string): MichiganCitation {
    const errors: string[] = [];
    
    // Pattern: MCL/MSA/MCLA digits.digits
    const pattern = /^(MCL|MSA|MCLA)\s+(\d+\.\d+(?:\([a-z0-9]+\))?)$/;
    const match = citation.match(pattern);
    
    if (!match) {
      return {
        raw: citation,
        format: MichiganCitationFormat.STATUTORY,
        isValid: false,
        errors: ['Does not match Michigan statutory citation format'],
        warnings: [],
      };
    }
    
    const statute = match[1];
    const section = match[2];
    
    // Check for periods in statute abbreviation
    if (statute.includes('.')) {
      errors.push(`Statute abbreviation "${statute}" contains periods - Michigan disfavors periods`);
    }
    
    return {
      raw: citation,
      format: MichiganCitationFormat.STATUTORY,
      statute,
      section,
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
  
  /**
   * Parse court rule citation
   * Format: MCR Section.Subsection
   * Example: MCR 2.116(C)(10)
   */
  private parseCourtRule(citation: string): MichiganCitation {
    const errors: string[] = [];
    
    // Pattern: MCR digits.digits(optional subsections)
    const pattern = /^(MCR)\s+(\d+\.\d+(?:\([A-Z0-9]+\)(?:\(\d+\))?)?)$/;
    const match = citation.match(pattern);
    
    if (!match) {
      return {
        raw: citation,
        format: MichiganCitationFormat.COURT_RULE,
        isValid: false,
        errors: ['Does not match Michigan court rule citation format'],
        warnings: [],
      };
    }
    
    const statute = match[1];
    const section = match[2];
    
    // Check for periods in MCR abbreviation
    if (statute.includes('.')) {
      errors.push(`Court rule abbreviation "${statute}" contains periods - should be MCR`);
    }
    
    return {
      raw: citation,
      format: MichiganCitationFormat.COURT_RULE,
      statute,
      section,
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
  
  /**
   * Check if citation has common Michigan errors
   */
  checkCommonErrors(citation: string): string[] {
    const errors: string[] = [];
    
    // Check for periods in common abbreviations
    const periodsInAbbreviations = [
      { wrong: 'N.W.', correct: 'NW', regex: /\bN\.W\./g },
      { wrong: 'N.W.2d', correct: 'NW 2d', regex: /\bN\.W\.2d\b/g },
      { wrong: 'N.W.3d', correct: 'NW 3d', regex: /\bN\.W\.3d\b/g },
      { wrong: 'Mich.', correct: 'Mich', regex: /\bMich\./g },
      { wrong: 'Mich.App.', correct: 'Mich App', regex: /\bMich\.App\./g },
      { wrong: 'M.C.L.', correct: 'MCL', regex: /\bM\.C\.L\./g },
      { wrong: 'M.C.R.', correct: 'MCR', regex: /\bM\.C\.R\./g },
      { wrong: 'U.S.', correct: 'US', regex: /\bU\.S\./g },
      { wrong: 'F.Supp.', correct: 'F Supp', regex: /\bF\.Supp\./g },
      { wrong: 'F.2d', correct: 'F 2d', regex: /\bF\.2d\b/g },
      { wrong: 'F.3d', correct: 'F 3d', regex: /\bF\.3d\b/g },
      { wrong: 'F.4th', correct: 'F 4th', regex: /\bF\.4th\b/g },
    ];
    
    for (const { wrong, correct, regex } of periodsInAbbreviations) {
      if (regex.test(citation)) {
        errors.push(`Michigan disfavors periods: use "${correct}" instead of "${wrong}"`);
      }
    }
    
    // Check for parallel citations (no longer required, but acceptable)
    // Don't treat as error, just note it
    
    return errors;
  }
  
  /**
   * Format a citation to Michigan standards
   */
  format(components: Partial<MichiganCitation>): string {
    if (components.format === MichiganCitationFormat.PUBLIC_DOMAIN) {
      let result = `${components.caseName}, ${components.year} ${components.court} ${components.volume}`;
      if (components.paragraph) {
        result += `, ¶ ${components.paragraph}`;
      }
      return result;
    }
    
    if (components.format === MichiganCitationFormat.STATUTORY) {
      return `${components.statute} ${components.section}`;
    }
    
    if (components.format === MichiganCitationFormat.COURT_RULE) {
      return `${components.statute} ${components.section}`;
    }
    
    // Traditional format
    let result = `${components.caseName}, ${components.volume} ${components.reporter} ${components.page}`;
    if (components.pinpoint) {
      result += `, ${components.pinpoint}`;
    }
    if (components.court && components.year) {
      result += ` (${components.court} ${components.year})`;
    } else if (components.year) {
      result += ` (${components.year})`;
    }
    return result;
  }
export const michiganCitationValidator = new MichiganCitationValidator();