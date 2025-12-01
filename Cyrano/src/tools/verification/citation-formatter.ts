/**
 * Jurisdiction-Specific Citation Formatter
 * 
 * Checks and corrects citations according to jurisdiction-specific rules:
 * - Michigan: Michigan Appellate Opinions Manual (MANDATORY - no periods is a RULE)
 * - Federal: Federal Court Rules, local court rules
 * - Bluebook: Supplemental/fallback format
 * 
 * Can process single citations or entire documents.
 * 
 * CRITICAL: In Michigan state courts, the Michigan Appellate Opinions Manual
 * controls over all other citation formats. No periods in abbreviations is a
 * RULE, not a preference.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { michiganCitationValidator, MichiganCitationFormat } from './citations/michigan-citations.js';

/**
 * Jurisdiction types
 */
export enum Jurisdiction {
  MICHIGAN = 'michigan',           // Michigan state courts (Michigan Appellate Opinions Manual)
  FEDERAL = 'federal',             // Federal courts (Federal Rules, local rules)
  BLUEBOOK = 'bluebook',           // Bluebook format (supplemental)
  CHICAGO = 'chicago',             // Chicago Manual of Style
  MLA = 'mla',                     // MLA format
  AUTO = 'auto',                    // Auto-detect jurisdiction
}

/**
 * Citation correction result
 */
export interface CitationCorrection {
  original: string;
  corrected: string;
  jurisdiction: Jurisdiction;
  changes: Array<{
    type: 'removed_period' | 'added_space' | 'removed_space' | 'format_change' | 'reporter_change';
    description: string;
    position?: { start: number; end: number };
  }>;
  confidence: number; // 0.0-1.0
  ruleSource: string; // e.g., "Michigan Appellate Opinions Manual § 1:8"
  error?: string; // Error message if processing failed
}

/**
 * Document citation check result
 */
export interface DocumentCitationResult {
  totalCitations: number;
  correctedCitations: number;
  uncorrectableCitations: number;
  corrections: CitationCorrection[];
  summary: {
    byJurisdiction: Record<Jurisdiction, number>;
    byType: Record<string, number>;
  };
  correctedText: string; // Document with corrected citations
}

/**
 * Citation formatter parameters
 */
export const CitationFormatterParamsSchema = z.object({
  text: z.string().describe('Text containing citations (can be single citation or full document)'),
  jurisdiction: z.nativeEnum(Jurisdiction).default(Jurisdiction.AUTO).describe('Target jurisdiction (or auto-detect)'),
  correct: z.boolean().default(true).describe('Whether to correct citations (true) or just check (false)'),
  strictMode: z.boolean().default(true).describe('Strict enforcement of jurisdiction rules (Michigan: no periods is mandatory)'),
  documentMode: z.boolean().default(false).describe('Process entire document (true) or single citation (false)'),
});

export type CitationFormatterParams = z.infer<typeof CitationFormatterParamsSchema>;

/**
 * Citation Formatter Tool
 * Checks and corrects citations according to jurisdiction rules
 */
export class CitationFormatter extends BaseTool {
  
  /**
   * Format citations according to jurisdiction rules
   */
  async formatCitations(params: CitationFormatterParams): Promise<DocumentCitationResult | CitationCorrection> {
    const validated = CitationFormatterParamsSchema.parse(params);
    
    if (validated.documentMode) {
      return await this.processDocument(validated);
    } else {
      return await this.processSingleCitation(validated);
    }
  }
  
  /**
   * Process a single citation
   */
  private async processSingleCitation(params: CitationFormatterParams): Promise<CitationCorrection> {
    try {
      let jurisdiction = params.jurisdiction;
      
      if (jurisdiction === Jurisdiction.AUTO) {
        jurisdiction = this.detectJurisdiction(params.text);
      }
      
      switch (jurisdiction) {
        case Jurisdiction.MICHIGAN:
          return this.correctMichiganCitation(params.text, params.strictMode);
        case Jurisdiction.FEDERAL:
          return this.correctFederalCitation(params.text, params.strictMode);
        case Jurisdiction.BLUEBOOK:
          return this.correctBluebookCitation(params.text);
        default:
          return this.correctBluebookCitation(params.text); // Fallback
      }
    } catch (error) {
      // Return error result
      return {
        original: params.text,
        corrected: params.text,
        jurisdiction: params.jurisdiction === Jurisdiction.AUTO ? Jurisdiction.BLUEBOOK : params.jurisdiction,
        changes: [],
        confidence: 0.0,
        ruleSource: 'Error processing citation',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Process entire document
   */
  private async processDocument(params: CitationFormatterParams): Promise<DocumentCitationResult> {
    // Extract all citations from document
    const citations = this.extractCitations(params.text);
    const corrections: CitationCorrection[] = [];
    let correctedText = params.text;
    
    // Track replacements in reverse order to maintain positions
    const replacements: Array<{ start: number; end: number; replacement: string }> = [];
    
    for (const citation of citations) {
      let correction: CitationCorrection;
      
      // Detect jurisdiction for this specific citation if auto-detect
      let citationJurisdiction = params.jurisdiction;
      if (params.jurisdiction === Jurisdiction.AUTO) {
        citationJurisdiction = this.detectJurisdiction(citation.text);
      }
      
      switch (citationJurisdiction) {
        case Jurisdiction.MICHIGAN:
          correction = this.correctMichiganCitation(citation.text, params.strictMode);
          break;
        case Jurisdiction.FEDERAL:
          correction = this.correctFederalCitation(citation.text, params.strictMode);
          break;
        default:
          correction = this.correctBluebookCitation(citation.text);
      }
      
      if (correction.corrected !== correction.original && params.correct) {
        // Store replacement for later (process in reverse to maintain positions)
        replacements.push({
          start: citation.start,
          end: citation.end,
          replacement: correction.corrected,
        });
      }
      
      corrections.push(correction);
    }
    
    // Apply replacements in reverse order
    if (params.correct && replacements.length > 0) {
      replacements.sort((a, b) => b.start - a.start); // Reverse order
      for (const replacement of replacements) {
        correctedText = 
          correctedText.substring(0, replacement.start) +
          replacement.replacement +
          correctedText.substring(replacement.end);
      }
    }
    
    // Calculate summary
    const byJurisdiction: Record<Jurisdiction, number> = {
      [Jurisdiction.MICHIGAN]: 0,
      [Jurisdiction.FEDERAL]: 0,
      [Jurisdiction.BLUEBOOK]: 0,
      [Jurisdiction.CHICAGO]: 0,
      [Jurisdiction.MLA]: 0,
      [Jurisdiction.AUTO]: 0,
    };
    
    const byType: Record<string, number> = {};
    
    corrections.forEach(corr => {
      byJurisdiction[corr.jurisdiction]++;
      const type = this.getCitationType(corr.original);
      byType[type] = (byType[type] || 0) + 1;
    });
    
    return {
      totalCitations: citations.length,
      correctedCitations: corrections.filter(c => c.corrected !== c.original).length,
      uncorrectableCitations: corrections.filter(c => c.corrected === c.original && c.confidence < 0.5).length,
      corrections,
      summary: {
        byJurisdiction,
        byType,
      },
      correctedText: params.correct ? correctedText : params.text,
    };
  }
  
  /**
   * Correct Michigan citation (MANDATORY: no periods in abbreviations)
   */
  private correctMichiganCitation(citation: string, strictMode: boolean): CitationCorrection {
    const changes: CitationCorrection['changes'] = [];
    let corrected = citation;
    let confidence = 1.0;
    
    // Validate using Michigan validator
    const validation = michiganCitationValidator.validate(citation);
    
    // MICHIGAN RULE: No periods in abbreviations (MANDATORY per Michigan Appellate Opinions Manual)
    // This is a RULE, not a preference - must be enforced
    
    // Remove periods from reporters
    // ORDER MATTERS: Match longer patterns first (e.g., N.W.2d before N.W.)
    const periodRemovals = [
      { pattern: /\bN\.W\.3d\b/g, replacement: 'NW 3d', description: 'Remove periods from N.W.3d' },
      { pattern: /\bN\.W\.2d\b/g, replacement: 'NW 2d', description: 'Remove periods from N.W.2d' },
      { pattern: /\bN\.W\./g, replacement: 'NW', description: 'Remove periods from N.W.' },
      { pattern: /\bMich\.App\./g, replacement: 'Mich App', description: 'Remove periods from Mich.App.' },
      { pattern: /\bMich\./g, replacement: 'Mich', description: 'Remove period from Mich.' },
      { pattern: /\bApp\./g, replacement: 'App', description: 'Remove period from App.' },
      { pattern: /\bF\.Supp\.3d\b/g, replacement: 'F Supp 3d', description: 'Remove periods from F.Supp.3d' },
      { pattern: /\bF\.Supp\.2d\b/g, replacement: 'F Supp 2d', description: 'Remove periods from F.Supp.2d' },
      { pattern: /\bF\.Supp\./g, replacement: 'F Supp', description: 'Remove periods from F.Supp.' },
      { pattern: /\bF\.4th\b/g, replacement: 'F 4th', description: 'Remove periods from F.4th' },
      { pattern: /\bF\.3d\b/g, replacement: 'F 3d', description: 'Remove periods from F.3d' },
      { pattern: /\bF\.2d\b/g, replacement: 'F 2d', description: 'Remove periods from F.2d' },
      { pattern: /\bF\./g, replacement: 'F', description: 'Remove period from F.' },
      { pattern: /\bU\.S\./g, replacement: 'US', description: 'Remove periods from U.S.' },
      { pattern: /\bS\.Ct\./g, replacement: 'S Ct', description: 'Remove periods from S.Ct.' },
      { pattern: /\bM\.C\.L\./g, replacement: 'MCL', description: 'Remove periods from M.C.L.' },
      { pattern: /\bM\.C\.R\./g, replacement: 'MCR', description: 'Remove periods from M.C.R.' },
    ];
    
    for (const { pattern, replacement, description } of periodRemovals) {
      if (pattern.test(corrected)) {
        const match = corrected.match(pattern);
        if (match) {
          const start = corrected.indexOf(match[0]);
          const end = start + match[0].length;
          changes.push({
            type: 'removed_period',
            description,
            position: { start, end },
          });
          corrected = corrected.replace(pattern, replacement);
        }
      }
    }
    
    // Normalize spacing in reporters (Mich App vs MichApp)
    if (corrected.includes('MichApp') && !corrected.includes('Mich App')) {
      corrected = corrected.replace(/\bMichApp\b/g, 'Mich App');
      changes.push({
        type: 'added_space',
        description: 'Add space in MichApp → Mich App',
      });
    }
    
    // Normalize NW reporters (NW2d → NW 2d)
    if (corrected.match(/\bNW2d\b/) && !corrected.match(/\bNW 2d\b/)) {
      corrected = corrected.replace(/\bNW2d\b/g, 'NW 2d');
      changes.push({
        type: 'added_space',
        description: 'Add space in NW2d → NW 2d',
      });
    }
    
    if (corrected.match(/\bNW3d\b/) && !corrected.match(/\bNW 3d\b/)) {
      corrected = corrected.replace(/\bNW3d\b/g, 'NW 3d');
      changes.push({
        type: 'added_space',
        description: 'Add space in NW3d → NW 3d',
      });
    }
    
    // If validation found errors, lower confidence
    if (validation.errors.length > 0) {
      confidence = 0.5;
    } else if (validation.warnings.length > 0) {
      confidence = 0.8;
    }
    
    return {
      original: citation,
      corrected,
      jurisdiction: Jurisdiction.MICHIGAN,
      changes,
      confidence,
      ruleSource: 'Michigan Appellate Opinions Manual § 1:8 (Punctuation in Case Citations)',
    };
  }
  
  /**
   * Correct Federal citation
   * Federal courts follow Bluebook with some variations per local rules
   */
  private correctFederalCitation(citation: string, strictMode: boolean): CitationCorrection {
    const changes: CitationCorrection['changes'] = [];
    let corrected = citation;
    let confidence = 1.0;
    
    // Federal citations generally use periods in abbreviations (Bluebook style)
    // But some local rules may vary
    
    // Ensure proper spacing in Federal Reporter citations
    if (corrected.match(/\bF\.\s*2d\b/) && !corrected.match(/\bF\.2d\b/)) {
      corrected = corrected.replace(/\bF\.\s*2d\b/g, 'F.2d');
      changes.push({
        type: 'format_change',
        description: 'Normalize F. 2d → F.2d',
      });
    }
    
    if (corrected.match(/\bF\.\s*3d\b/) && !corrected.match(/\bF\.3d\b/)) {
      corrected = corrected.replace(/\bF\.\s*3d\b/g, 'F.3d');
      changes.push({
        type: 'format_change',
        description: 'Normalize F. 3d → F.3d',
      });
    }
    
    // Federal Rules citations
    if (corrected.match(/\bFR\s+Civ\s+P\b/i)) {
      const normalized = corrected.replace(/\bFR\s+Civ\s+P\b/gi, 'Fed. R. Civ. P.');
      if (normalized !== corrected) {
        corrected = normalized;
        changes.push({
          type: 'format_change',
          description: 'Normalize FR Civ P → Fed. R. Civ. P.',
        });
      }
    }
    
    if (corrected.match(/\bFR\s+Crim\s+P\b/i)) {
      const normalized = corrected.replace(/\bFR\s+Crim\s+P\b/gi, 'Fed. R. Crim. P.');
      if (normalized !== corrected) {
        corrected = normalized;
        changes.push({
          type: 'format_change',
          description: 'Normalize FR Crim P → Fed. R. Crim. P.',
        });
      }
    }
    
    if (corrected.match(/\bFRE\b/i) && !corrected.match(/\bFed\.\s*R\.\s*Evid\./i)) {
      corrected = corrected.replace(/\bFRE\b/gi, 'Fed. R. Evid.');
      changes.push({
        type: 'format_change',
        description: 'Normalize FRE → Fed. R. Evid.',
      });
    }
    
    // USC citations (United States Code)
    if (corrected.match(/\b(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+)/i)) {
      const normalized = corrected.replace(/\b(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+)/gi, '$1 U.S.C. § $2');
      if (normalized !== corrected) {
        corrected = normalized;
        changes.push({
          type: 'format_change',
          description: 'Normalize USC citation format',
        });
      }
    }
    
    // Federal district court citations (e.g., "E.D. Mich.", "W.D. Mich.", "S.D.N.Y.")
    if (corrected.match(/\b([A-Z]\.?\s*D\.?\s*[A-Z]{2}|[A-Z]{1,2}\.?\s*D\.?\s*[A-Z]{2})\b/)) {
      // Normalize spacing: "D. Mich" → "D. Mich."
      corrected = corrected.replace(/\b([A-Z]\.?)\s*D\.?\s*([A-Z]{2})\b/g, '$1. D. $2.');
      changes.push({
        type: 'format_change',
        description: 'Normalize Federal district court citation',
      });
    }
    
    // Federal circuit citations (e.g., "6th Cir.", "D.C. Cir.")
    if (corrected.match(/\b(\d+(?:st|nd|rd|th)?|D\.C\.)\s*Cir\.?\b/i)) {
      corrected = corrected.replace(/\b(\d+(?:st|nd|rd|th)?|D\.C\.)\s*Cir\.?\b/gi, '$1 Cir.');
      changes.push({
        type: 'format_change',
        description: 'Normalize Federal circuit citation',
      });
    }
    
    // Federal Supplement spacing
    if (corrected.match(/\bF\.\s*Supp\.\s*2d\b/) && !corrected.match(/\bF\.\s*Supp\.2d\b/)) {
      corrected = corrected.replace(/\bF\.\s*Supp\.\s*2d\b/g, 'F. Supp. 2d');
      changes.push({
        type: 'format_change',
        description: 'Normalize F. Supp. 2d spacing',
      });
    }
    
    if (corrected.match(/\bF\.\s*Supp\.\s*3d\b/) && !corrected.match(/\bF\.\s*Supp\.3d\b/)) {
      corrected = corrected.replace(/\bF\.\s*Supp\.\s*3d\b/g, 'F. Supp. 3d');
      changes.push({
        type: 'format_change',
        description: 'Normalize F. Supp. 3d spacing',
      });
    }
    
    return {
      original: citation,
      corrected,
      jurisdiction: Jurisdiction.FEDERAL,
      changes,
      confidence,
      ruleSource: 'Federal Rules of Civil/Criminal Procedure, Federal Court Rules, Bluebook (supplemental)',
    };
  }
  
  /**
   * Correct Bluebook citation
   */
  private correctBluebookCitation(citation: string): CitationCorrection {
    // Bluebook allows periods in abbreviations
    // This is the standard format
    return {
      original: citation,
      corrected: citation, // No changes for Bluebook (it's the reference format)
      jurisdiction: Jurisdiction.BLUEBOOK,
      changes: [],
      confidence: 1.0,
      ruleSource: 'The Bluebook: A Uniform System of Citation',
    };
  }
  
  /**
   * Detect jurisdiction from text
   */
  private detectJurisdiction(text: string): Jurisdiction {
    // Check for Michigan indicators (case citations, MCL, MCR, public domain)
    // Handle both with and without periods (e.g., N.W.2d or NW 2d, M.C.L. or MCL)
    if (text.match(/\b(M\.?C\.?L\.?|M\.?C\.?R\.?|Mich|MI\s+App|Mich\s+App|N\.?W\.?|N\.?W\.?\s*2d|N\.?W\.?\s*3d)\b/i) ||
        text.match(/\d{4}\s+MI(\s+App)?\s+\d+/) || // Public domain citation
        text.match(/,\s+\d+\s+(Mich|N\.?W\.?|N\.?W\.?\s*2d|N\.?W\.?\s*3d)\s+\d+/)) { // Case citation
      return Jurisdiction.MICHIGAN;
    }
    
    // Check for Federal indicators
    if (text.match(/\b(FR\s+Civ\s+P|FR\s+Crim\s+P|FRE|Fed\.\s*R\.|F\.\s*Supp|F\.\s*\d+d|USC|U\.S\.C\.)\b/i)) {
      return Jurisdiction.FEDERAL;
    }
    
    // Default to Bluebook
    return Jurisdiction.BLUEBOOK;
  }
  
  /**
   * Extract citations from document text
   */
  private extractCitations(text: string): Array<{ text: string; start: number; end: number }> {
    const citations: Array<{ text: string; start: number; end: number }> = [];
    const seen = new Set<string>(); // Avoid duplicates
    
    // Pattern for case citations: Case Name, Volume Reporter Page (Year)
    const casePattern = /[A-Z][^,]+,\s+\d+\s+[A-Z][A-Za-z0-9\s.]+\s+\d+(?:\s*,\s*\d+)?\s*(?:\([^)]+\))?/g;
    
    // Pattern for statutory citations: MCL, USC, MCR, etc. (including with periods)
    const statutoryPattern = /\b(M\.?C\.?L\.?|M\.?C\.?R\.?|USC|U\.?S\.?C\.?|FR\s+Civ\s+P|FR\s+Crim\s+P|FRE|Fed\.\s*R\.)\s+[\d.()]+/gi;
    
    // Pattern for public domain citations: Year State Court Sequence
    const publicDomainPattern = /\d{4}\s+(MI|MI\s+App)\s+\d+/g;
    
    // Pattern for short-form citations: "Smith, 500 Mich at 59" or "Smith, 500 Mich 59"
    const shortFormPattern = /[A-Z][^,]+,\s+\d+\s+[A-Z][A-Za-z0-9\s.]+\s+(?:at\s+)?\d+/g;
    
    // Pattern for Id. citations: "Id. at 59" or "Id."
    const idPattern = /\bId\.\s*(?:at\s+\d+)?/gi;
    
    // Pattern for supra citations: "Smith, supra at 59"
    const supraPattern = /[A-Z][^,]+,\s+supra\s+(?:at\s+)?\d+/gi;
    
    let match;
    
    // Find case citations
    while ((match = casePattern.exec(text)) !== null) {
      const citationText = match[0];
      if (!seen.has(citationText)) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Find statutory citations
    while ((match = statutoryPattern.exec(text)) !== null) {
      const citationText = match[0];
      if (!seen.has(citationText)) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Find public domain citations
    while ((match = publicDomainPattern.exec(text)) !== null) {
      const citationText = match[0];
      if (!seen.has(citationText)) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Find short-form citations (but avoid duplicates with full citations)
    while ((match = shortFormPattern.exec(text)) !== null) {
      const citationText = match[0];
      // Only add if it's not already captured as a full citation
      if (!seen.has(citationText) && !citations.some(c => c.text.includes(citationText) || citationText.includes(c.text))) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Find Id. citations
    while ((match = idPattern.exec(text)) !== null) {
      const citationText = match[0];
      if (!seen.has(citationText)) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Find supra citations
    while ((match = supraPattern.exec(text)) !== null) {
      const citationText = match[0];
      if (!seen.has(citationText)) {
        seen.add(citationText);
        citations.push({
          text: citationText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    
    // Sort by position
    citations.sort((a, b) => a.start - b.start);
    
    return citations;
  }
  
  /**
   * Get citation type
   */
  private getCitationType(citation: string): string {
    if (citation.match(/\b(MCL|USC|MCR)\b/i)) return 'statutory';
    if (citation.match(/\d{4}\s+(MI|MI\s+App)\s+\d+/)) return 'public_domain';
    if (citation.match(/,\s+\d+\s+[A-Z]/)) return 'case';
    return 'unknown';
  }
  
  /**
   * Get MCP tool definition
   */
  getToolDefinition() {
    return {
      name: 'citation_formatter',
      description: 'Check and correct citations according to jurisdiction-specific rules. Michigan: no periods in abbreviations is MANDATORY (Michigan Appellate Opinions Manual controls).',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text containing citations (single citation or full document)',
          },
          jurisdiction: {
            type: 'string',
            enum: Object.values(Jurisdiction),
            default: 'auto',
            description: 'Target jurisdiction (michigan, federal, bluebook, or auto-detect)',
          },
          correct: {
            type: 'boolean',
            default: true,
            description: 'Whether to correct citations (true) or just check (false)',
          },
          strictMode: {
            type: 'boolean',
            default: true,
            description: 'Strict enforcement (Michigan: no periods is mandatory)',
          },
          documentMode: {
            type: 'boolean',
            default: false,
            description: 'Process entire document (true) or single citation (false)',
          },
        },
        required: ['text'],
      },
    };
  }
  
  /**
   * Execute tool via MCP
   */
  async execute(args: any): Promise<CallToolResult> {
    try {
      const result = await this.formatCitations(args);
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
export const citationFormatter = new CitationFormatter();

/**
 * MCP tool handler
 */
export async function handleCitationFormatter(params: any): Promise<DocumentCitationResult | CitationCorrection> {
  return await citationFormatter.formatCitations(params);
}

