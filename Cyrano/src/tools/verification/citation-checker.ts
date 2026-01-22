/**
 * Citation Checker - Shared Verification Tool
 * 
 * Verifies and validates citations in documents
 * Used by: Potemkin (verify_document), Arkiver (citation validation)
 * 
 * Created: 2025-11-22
 */
/* eslint-disable no-case-declarations */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { michiganCitationValidator } from './citations/michigan-citations.js';

/**
 * Citation format types
 */
export enum CitationFormat {
  LEGAL = 'legal',           // Legal citation (e.g., "123 U.S. 456")
  ACADEMIC = 'academic',     // Academic citation (e.g., "Smith (2020)")
  URL = 'url',              // Web URL
  BLUEBOOK = 'bluebook',    // Bluebook legal citation format
  APA = 'apa',              // APA academic citation
  MLA = 'mla',              // MLA academic citation
}

/**
 * Citation validation status
 */
export enum CitationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  PARTIAL = 'partial',       // Partially valid (e.g., format correct but source not verified)
  UNKNOWN = 'unknown',       // Cannot determine validity
}

/**
 * Parsed citation components
 */
export interface ParsedCitation {
  format: CitationFormat;
  volume?: string;
  reporter?: string;
  page?: string;
  court?: string;
  year?: string;
  author?: string;
  title?: string;
  url?: string;
  raw: string;
}

/**
 * Citation validation result
 */
export interface CitationValidation {
  citation: string;
  status: CitationStatus;
  format?: CitationFormat;
  parsed?: ParsedCitation;
  confidence: number; // 0.0-1.0
  issues: string[];
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Citation checking parameters
 */
export const CitationCheckParamsSchema = z.object({
  citations: z.array(z.string()).min(1),
  documentContext: z.string().optional(),
  verifyFormat: z.boolean().default(true),
  verifySource: z.boolean().default(false), // Requires external API calls
  strictMode: z.boolean().default(false),
});

export type CitationCheckParams = z.infer<typeof CitationCheckParamsSchema>;

/**
 * Citation check result
 */
export interface CitationCheckResult {
  validations: CitationValidation[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    partial: number;
    unknown: number;
  };
  metadata: {
    processingTime: number;
    formatVerified: boolean;
    sourceVerified: boolean;
  };
}

/**
 * Citation Checker Tool
 * Extends BaseTool for MCP integration
 */
export class CitationChecker extends BaseTool {
  /**
   * Check citations
   */
  async checkCitations(params: CitationCheckParams): Promise<CitationCheckResult> {
    const startTime = Date.now();
    
    // Validate parameters
    const validated = CitationCheckParamsSchema.parse(params);

    // Validate each citation
    const validations: CitationValidation[] = [];
    
    for (const citation of validated.citations) {
      const validation = await this.validateCitation(
        citation,
        validated.documentContext,
        validated.verifyFormat,
        validated.verifySource,
        validated.strictMode
      );
      validations.push(validation);
    }

    // Calculate summary
    const summary = {
      total: validations.length,
      valid: validations.filter((v) => v.status === CitationStatus.VALID).length,
      invalid: validations.filter((v) => v.status === CitationStatus.INVALID).length,
      partial: validations.filter((v) => v.status === CitationStatus.PARTIAL).length,
      unknown: validations.filter((v) => v.status === CitationStatus.UNKNOWN).length,
    };

    const processingTime = Date.now() - startTime;

    return {
      validations,
      summary,
      metadata: {
        processingTime,
        formatVerified: validated.verifyFormat,
        sourceVerified: validated.verifySource,
      },
    };
  }

  /**
   * Validate a single citation
   */
  private async validateCitation(
    citation: string,
    context?: string,
    verifyFormat: boolean = true,
    verifySource: boolean = false,
    strictMode: boolean = false
  ): Promise<CitationValidation> {
    const issues: string[] = [];
    let confidence = 1.0;
    let status = CitationStatus.UNKNOWN;
    let format: CitationFormat | undefined;
    let parsed: ParsedCitation | undefined;
    let sourceUrl: string | undefined;

    // Try to parse citation
    const parseResult = this.parseCitation(citation);
    
    if (parseResult) {
      format = parseResult.format;
      parsed = parseResult;

      if (verifyFormat) {
        const formatValidation = this.validateFormat(parseResult, strictMode);
        issues.push(...formatValidation.issues);
        confidence *= formatValidation.confidence;

        if (formatValidation.isValid) {
          status = CitationStatus.PARTIAL; // Format valid, but source not checked
        } else {
          status = CitationStatus.INVALID;
        }
      }

      if (verifySource) {
        // Use CourtListener API for source verification
        try {
          const { courtListenerService } = await import('../../services/courtlistener.js');
          const validationResult = await courtListenerService.validateCitation(citation);
          
          if (validationResult.valid && validationResult.caseData) {
            status = CitationStatus.VALID;
            sourceUrl = validationResult.caseData.url || this.constructSourceUrl(parseResult);
            confidence = Math.min(confidence * validationResult.confidence, 1.0);
          } else {
            // Fallback to URL construction if CourtListener doesn't find it
            sourceUrl = this.constructSourceUrl(parseResult);
            if (sourceUrl) {
              status = CitationStatus.PARTIAL; // Format valid but not verified in database
            }
          }
        } catch (error) {
          // If CourtListener fails, fall back to URL construction
          console.warn('CourtListener verification failed, using fallback:', error instanceof Error ? error.message : String(error));
          sourceUrl = this.constructSourceUrl(parseResult);
          if (sourceUrl) {
            status = CitationStatus.PARTIAL;
          }
        }
      } else if (status === CitationStatus.PARTIAL) {
        // Format valid and source verification not requested
        status = CitationStatus.VALID;
      }
    } else {
      issues.push('Unable to parse citation format');
      confidence = 0.0;
      status = CitationStatus.INVALID;
    }

    // Check context if provided
    if (context && parsed) {
      const contextCheck = this.checkContext(citation, context);
      if (!contextCheck.found) {
        issues.push('Citation not found in document context');
        confidence *= 0.8;
      }
    }

    return {
      citation,
      status,
      format,
      parsed,
      confidence,
      issues,
      sourceUrl,
    };
  }

  /**
   * Parse citation to identify format and extract components
   * Supports both standard Bluebook format and Michigan format (no periods)
   */
  private parseCitation(citation: string): ParsedCitation | null {
    citation = citation.trim();

    // First, try Michigan validator for full citations with case names
    // Michigan citations: case names, statutory (MCL), court rules (MCR), public domain
    // Also check for NW2d, NW, MichApp, Mich patterns (with or without periods)
    if (citation.match(/\b(Mich|MichApp|NW|NW2d|NW\s*2d|N\.W\.|N\.W\.2d|MCL|MCR|MI(?:\s+App)?)\b/i)) {
      const miResult = michiganCitationValidator.validate(citation);
      if (miResult.isValid) {
        return {
          format: CitationFormat.LEGAL,
          volume: miResult.volume,
          reporter: miResult.reporter,
          page: miResult.page,
          court: miResult.court,
          year: miResult.year,
          raw: citation,
        };
      }
    }

    // Try Michigan-style citation WITHOUT case name (e.g., "500 NW2d 100 (Mich 2010)")
    // Handles: NW2d (no space), NW 2d (with space), N.W.2d (with periods), MichApp, etc.
    // Pattern: volume, reporter (can be multi-word or combined like NW2d), page, optional court/year in parens
    // This pattern handles citations that don't have case names
    const michiganShortMatch = citation.match(/^(\d+)\s+([A-Z][A-Za-z0-9.]*(?:\s+[A-Z][A-Za-z0-9.]*)?)\s+(\d+)(?:,\s+(\d+))?\s*(?:\(([^)]+)\))?/);
    if (michiganShortMatch) {
      const reporter = michiganShortMatch[2].trim();
      // Check if this looks like a Michigan reporter
      if (reporter.match(/^(NW|NW2d|NW\s*2d|N\.W\.|N\.W\.2d|Mich|MichApp|Mich\s*App|Mich\.|Mich\.\s*App\.)/i)) {
        // Extract year from parentheses if present
        const parenContent = michiganShortMatch[5] || '';
        const yearMatch = parenContent.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : undefined;
        const court = parenContent.replace(/\d{4}/g, '').trim() || undefined;
        
        return {
          format: CitationFormat.LEGAL,
          volume: michiganShortMatch[1],
          reporter: reporter,
          page: michiganShortMatch[3],
          court: court,
          year: year,
          raw: citation,
        };
      }
    }

    // Try legal citation with standard Bluebook format (e.g., "123 U.S. 456", "50 F.3d 789")
    // Pattern matches: volume, reporter (with periods and mixed case), page, optional pin cite, optional year in parens
    // Also handles reporters like "N.W.2d" with periods
    const bluebookMatch = citation.match(/^(\d+)\s+([A-Z][A-Za-z.]*(?:\s+\d+[a-z]*)?)\s+(\d+)(?:,\s+(\d+))?\s*(?:\(([^)]+)\))?/);
    if (bluebookMatch) {
      return {
        format: CitationFormat.LEGAL,
        volume: bluebookMatch[1],
        reporter: bluebookMatch[2].trim(),
        page: bluebookMatch[3],
        year: bluebookMatch[5],
        raw: citation,
      };
    }

    // Try academic citation (e.g., "Smith (2020)", "Jones et al. (2021)")
    const academicMatch = citation.match(/^([A-Z][a-z]+(?:\s+et\s+al\.)?)\s+\((\d{4})\)/);
    if (academicMatch) {
      return {
        format: CitationFormat.ACADEMIC,
        author: academicMatch[1],
        year: academicMatch[2],
        raw: citation,
      };
    }

    // Try URL
    const urlMatch = citation.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      return {
        format: CitationFormat.URL,
        url: urlMatch[1],
        raw: citation,
      };
    }

    return null;
  }

  /**
   * Validate citation format
   */
  private validateFormat(
    parsed: ParsedCitation,
    strictMode: boolean
  ): { isValid: boolean; confidence: number; issues: string[] } {
    const issues: string[] = [];
    let confidence = 1.0;

    switch (parsed.format) {
      case CitationFormat.LEGAL:
        // Validate legal citation components
        if (!parsed.volume || !parsed.reporter || !parsed.page) {
          issues.push('Missing required legal citation components');
          confidence = 0.0;
          return { isValid: false, confidence, issues };
        }

        // Check reporter abbreviation validity
        // Federal reporters
        const federalReporters = [
          'U.S.', 'S.Ct.', 'L.Ed.', 'L.Ed.2d',
          'F.', 'F.2d', 'F.3d', 'F.4th',
          'F.Supp.', 'F.Supp.2d', 'F.Supp.3d',
        ];

        // Regional reporters (cover multiple states)
        const regionalReporters = [
          // Pacific Reporter (Alaska, Arizona, California, Colorado, Hawaii, Idaho, Kansas, Montana, Nevada, New Mexico, Oklahoma, Oregon, Utah, Washington, Wyoming)
          'P.', 'P.2d', 'P.3d',
          // North Eastern Reporter (Illinois, Indiana, Massachusetts, New York, Ohio)
          'N.E.', 'N.E.2d', 'N.E.3d',
          // North Western Reporter (Iowa, Michigan, Minnesota, Nebraska, North Dakota, South Dakota, Wisconsin)
          'N.W.', 'N.W.2d',
          // South Western Reporter (Arkansas, Kentucky, Missouri, Tennessee, Texas)
          'S.W.', 'S.W.2d', 'S.W.3d',
          // Southern Reporter (Alabama, Florida, Louisiana, Mississippi)
          'So.', 'So.2d', 'So.3d',
          // Atlantic Reporter (Connecticut, Delaware, District of Columbia, Maine, Maryland, New Hampshire, New Jersey, Pennsylvania, Rhode Island, Vermont)
          'A.', 'A.2d', 'A.3d',
          // South Eastern Reporter (Georgia, North Carolina, South Carolina, Virginia, West Virginia)
          'S.E.', 'S.E.2d', 'S.E.3d',
        ];

        // Michigan-specific reporters
        // Michigan disfavors periods in abbreviations
        const michiganReporters = [
          // Michigan preferred format (no periods)
          'Mich', 'MichApp',      // Michigan official reporters (no periods)
          'NW', 'NW2d',           // Northwestern Reporter (Michigan format, no periods)
          // Alternative formats (with periods, also accepted)
          'Mich.', 'Mich.App.',   // Michigan official reporters (with periods)
          'N.W.', 'N.W.2d',       // Northwestern Reporter (standard format)
        ];

        // Other state reporters
        const stateReporters = [
          'Cal.', 'Cal.2d', 'Cal.3d', 'Cal.4th', 'Cal.5th',
          'Cal.App.', 'Cal.App.2d', 'Cal.App.3d', 'Cal.App.4th', 'Cal.App.5th',
          'Cal.Rptr.', 'Cal.Rptr.2d', 'Cal.Rptr.3d',
          'N.Y.', 'N.Y.2d', 'N.Y.3d',
          'N.Y.S.', 'N.Y.S.2d', 'N.Y.S.3d',
          'Tex.', 'Tex.Crim.App.',
          'Ill.', 'Ill.2d',
          'Ill.App.', 'Ill.App.2d', 'Ill.App.3d',
          // Add more as needed
        ];

        const knownReporters = [
          ...federalReporters,
          ...regionalReporters,
          ...michiganReporters,
          ...stateReporters,
        ];

        // Check if this is a known reporter (but allow Michigan reporters even if not in standard list)
        const isMichiganReporter = parsed.reporter.match(/^(Mich|MichApp|Mich\s*App|NW|NW2d|NW\s*2d|N\.W\.|N\.W\.2d|N\.W\.\s*2d)/i);
        if (!knownReporters.includes(parsed.reporter) && !isMichiganReporter) {
          // For clearly invalid reporters (like "XYZ"), mark as invalid
          // Common invalid patterns: single letters that aren't valid, random strings
          const clearlyInvalid = /^[A-Z]{1,3}$/.test(parsed.reporter) && !['F', 'U', 'S', 'L', 'E'].includes(parsed.reporter);
          if (clearlyInvalid || strictMode) {
            issues.push(`Unknown reporter abbreviation: ${parsed.reporter}`);
            confidence *= 0.3; // Very low confidence for unknown reporters
            // Don't mark as invalid here - let the overall validation decide
          } else {
            issues.push(`Uncommon reporter abbreviation: ${parsed.reporter}`);
            confidence *= 0.8;
          }
        }

        // Michigan-specific validation
        const michiganPreferredReporters = ['Mich', 'MichApp', 'Mich App', 'NW', 'NW2d', 'NW 2d'];
        const michiganAlternateReporters = ['Mich.', 'Mich.App.', 'Mich. App.', 'N.W.', 'N.W.2d', 'N.W. 2d'];
        
        // Normalize reporter for comparison (handle spaces and case)
        const normalizedReporter = parsed.reporter.replace(/\s+/g, '').toLowerCase();
        
        if (michiganPreferredReporters.some(r => r.replace(/\s+/g, '').toLowerCase() === normalizedReporter)) {
          // Michigan preferred format (no periods)
          if (normalizedReporter === 'mich' || normalizedReporter === 'nw' || normalizedReporter === 'nw2d') {
            issues.push('Michigan Supreme Court citation (Michigan preferred format - no periods)');
          } else if (normalizedReporter === 'michapp') {
            issues.push('Michigan Court of Appeals citation (Michigan preferred format - no periods)');
          }
          confidence *= 1.0; // Full confidence for Michigan citations
        } else if (michiganAlternateReporters.some(r => r.replace(/\s+/g, '').toLowerCase() === normalizedReporter)) {
          // Alternative format with periods (also accepted but not preferred in Michigan)
          if (normalizedReporter === 'mich.' || normalizedReporter === 'nw.' || normalizedReporter === 'nw.2d') {
            issues.push('Michigan Supreme Court citation (alternative format with periods - Michigan prefers format without periods: Mich, NW, NW2d)');
          } else if (normalizedReporter === 'mich.app.') {
            issues.push('Michigan Court of Appeals citation (alternative format - Michigan prefers MichApp without periods)');
          }
          confidence *= 0.95; // Slightly lower confidence for non-preferred format
        }

        // Validate volume and page are numeric
        if (!/^\d+$/.test(parsed.volume)) {
          issues.push('Volume must be numeric');
          confidence *= 0.5;
        }

        if (!/^\d+$/.test(parsed.page)) {
          issues.push('Page must be numeric');
          confidence *= 0.5;
        }

        break;

      case CitationFormat.ACADEMIC:
        if (!parsed.author || !parsed.year) {
          issues.push('Missing required academic citation components');
          confidence = 0.0;
          return { isValid: false, confidence, issues };
        }

        // Validate year is reasonable (1800-2030)
        const year = parseInt(parsed.year, 10);
        if (year < 1800 || year > 2030) {
          issues.push('Invalid publication year');
          confidence *= 0.5;
        }

        break;

      case CitationFormat.URL:
        if (!parsed.url) {
          issues.push('Missing URL');
          confidence = 0.0;
          return { isValid: false, confidence, issues };
        }

        // Validate URL format
        try {
          new URL(parsed.url);
        } catch {
          issues.push('Invalid URL format');
          confidence = 0.0;
          return { isValid: false, confidence, issues };
        }

        break;
    }

    const isValid = issues.length === 0 || (!strictMode && confidence > 0.5);
    return { isValid, confidence, issues };
  }

  /**
   * Construct source URL from parsed citation (best effort)
   */
  private constructSourceUrl(parsed: ParsedCitation): string | undefined {
    switch (parsed.format) {
      case CitationFormat.LEGAL:
        // Try to construct Google Scholar or Justia link
        if (parsed.volume && parsed.reporter && parsed.page) {
          // Example: https://scholar.google.com/scholar_case?case=...
          // For now, return a search URL
          return `https://scholar.google.com/scholar?q=${encodeURIComponent(parsed.raw)}`;
        }
        break;

      case CitationFormat.URL:
        return parsed.url;

      case CitationFormat.ACADEMIC:
        if (parsed.author && parsed.year) {
          return `https://scholar.google.com/scholar?q=${encodeURIComponent(parsed.raw)}`;
        }
        break;
    }

    return undefined;
  }

  /**
   * Check if citation appears in document context
   */
  private checkContext(citation: string, context: string): { found: boolean; count: number } {
    const escapedCitation = citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Citation text sanitized via regex escape to prevent injection
    const regex = new RegExp(escapedCitation, 'gi'); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const matches = context.match(regex);
    const count = matches ? matches.length : 0;

    return {
      found: count > 0,
      count,
    };
  }

  /**
   * Get MCP tool definition
   */
  getToolDefinition() {
    return {
      name: 'citation_checker',
      description: 'Verify and validate citations in documents. Used by Potemkin (verify_document) and Arkiver (citation validation).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          citations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of citation strings to validate',
          },
          documentContext: {
            type: 'string',
            description: 'Optional document content for context checking',
          },
          verifyFormat: {
            type: 'boolean',
            description: 'Verify citation format correctness',
            default: true,
          },
          verifySource: {
            type: 'boolean',
            description: 'Verify source accessibility (requires external API calls)',
            default: false,
          },
          strictMode: {
            type: 'boolean',
            description: 'Use strict validation rules',
            default: false,
          },
        },
        required: ['citations'],
      },
    };
  }

  /**
   * Execute tool via MCP
   */
  async execute(args: any): Promise<CallToolResult> {
    try {
      const result = await this.checkCitations(args);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

/**
 * Default instance
 */
export const citationChecker = new CitationChecker();

/**
 * MCP tool handler
 */
export async function handleCitationChecker(params: any): Promise<CitationCheckResult> {
  return await citationChecker.checkCitations(params);
}
