/**
 * Claim Extractor - Shared Verification Tool
 * 
 * Extracts claims, assertions, and factual statements from documents
 * Used by: Potemkin (verify_document), Arkiver (insight extraction)
 * 
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import nlp from 'compromise';
import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Claim types
 */
export enum ClaimType {
  FACTUAL = 'factual',           // Objective statements of fact
  LEGAL = 'legal',               // Legal assertions or interpretations
  CITATION = 'citation',         // Citations to other sources
  OPINION = 'opinion',           // Subjective opinions
  PROCEDURAL = 'procedural',     // Process or procedural claims
  TEMPORAL = 'temporal',         // Time-based claims
  CAUSAL = 'causal',            // Cause-and-effect claims
}

/**
 * Claim confidence levels
 */
export enum ClaimConfidence {
  HIGH = 'high',       // 0.8-1.0
  MEDIUM = 'medium',   // 0.5-0.79
  LOW = 'low',         // 0.0-0.49
}

/**
 * Extracted claim
 */
export interface ExtractedClaim {
  id: string;
  text: string;
  type: ClaimType;
  confidence: number; // 0.0-1.0
  confidenceLevel: ClaimConfidence;
  source: {
    page?: number;
    line?: number;
    offset?: number;
    length?: number;
  };
  entities?: string[]; // Named entities in the claim
  keywords?: string[]; // Key terms
  metadata?: Record<string, any>;
}

/**
 * Extraction parameters (Zod schema for validation)
 */
export const ClaimExtractionParamsSchema = z.object({
  documentId: z.string().optional(),
  content: z.string().optional(),
  extractionType: z.enum(['all', 'factual', 'legal', 'citations', 'opinions']).default('all'),
  minConfidence: z.number().min(0).max(1).default(0.5),
  includeEntities: z.boolean().default(true),
  includeKeywords: z.boolean().default(true),
});

export type ClaimExtractionParams = z.infer<typeof ClaimExtractionParamsSchema>;

/**
 * Extraction result
 */
export interface ClaimExtractionResult {
  claims: ExtractedClaim[];
  totalClaims: number;
  metadata: {
    processingTime: number;
    documentLength: number;
    extractionType: string;
  };
}

/**
 * Claim Extractor Tool
 * Extends BaseTool for MCP integration
 */
export class ClaimExtractor extends BaseTool {
  private claimCounter: number = 0;

  /**
   * Extract claims from content
   */
  async extractClaims(params: ClaimExtractionParams): Promise<ClaimExtractionResult> {
    const startTime = Date.now();
    
    // Validate parameters
    const validated = ClaimExtractionParamsSchema.parse(params);

    // Get content
    const content = validated.content || await this.loadDocument(validated.documentId);
    if (!content) {
      throw new Error('No content provided and document not found');
    }

    // Parse content with NLP
    const doc = nlp(content);

    // Extract claims based on type
    let claims: ExtractedClaim[] = [];

    if (validated.extractionType === 'all' || validated.extractionType === 'factual') {
      claims.push(...this.extractFactualClaims(doc, content));
    }

    if (validated.extractionType === 'all' || validated.extractionType === 'legal') {
      claims.push(...this.extractLegalClaims(doc, content));
    }

    if (validated.extractionType === 'all' || validated.extractionType === 'citations') {
      claims.push(...this.extractCitationClaims(doc, content));
    }

    if (validated.extractionType === 'all' || validated.extractionType === 'opinions') {
      claims.push(...this.extractOpinionClaims(doc, content));
    }

    // Filter by confidence threshold
    claims = claims.filter((claim) => claim.confidence >= validated.minConfidence);

    // Add entities and keywords if requested
    if (validated.includeEntities || validated.includeKeywords) {
      claims = claims.map((claim) => this.enrichClaim(claim, validated));
    }

    const processingTime = Date.now() - startTime;

    return {
      claims,
      totalClaims: claims.length,
      metadata: {
        processingTime,
        documentLength: content.length,
        extractionType: validated.extractionType,
      },
    };
  }

  /**
   * Extract factual claims
   * Looks for declarative sentences with objective statements
   */
  private extractFactualClaims(doc: any, content: string): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const sentences = doc.sentences().json();

    for (const sentence of sentences) {
      const text = sentence.text;

      // Skip questions and commands
      if (text.endsWith('?') || this.isCommand(text)) {
        continue;
      }

      // Check for factual indicators
      const hasFactualVerb = /\b(is|are|was|were|has|have|had|states|shows|demonstrates|indicates)\b/i.test(text);
      const hasNumbers = /\d+/.test(text);
      const hasDefiniteArticle = /\b(the|this|that|these|those)\b/i.test(text);

      if (hasFactualVerb || hasNumbers || hasDefiniteArticle) {
        const confidence = this.calculateFactualConfidence(text, hasFactualVerb, hasNumbers, hasDefiniteArticle);

        claims.push({
          id: this.generateClaimId(),
          text: text.trim(),
          type: ClaimType.FACTUAL,
          confidence,
          confidenceLevel: this.getConfidenceLevel(confidence),
          source: this.findSourceLocation(content, text),
        });
      }
    }

    return claims;
  }

  /**
   * Extract legal claims
   * Looks for legal terminology and case references
   */
  private extractLegalClaims(doc: any, content: string): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const sentences = doc.sentences().json();

    const legalTerms = [
      'court', 'judge', 'ruling', 'statute', 'law', 'regulation', 'holding',
      'precedent', 'plaintiff', 'defendant', 'appellant', 'appellee',
      'jurisdiction', 'testimony', 'evidence', 'verdict', 'judgment',
    ];

    for (const sentence of sentences) {
      const text = sentence.text;
      const lowerText = text.toLowerCase();

      // Check for legal terminology
      const legalTermCount = legalTerms.filter((term) => lowerText.includes(term)).length;

      // Check for case citation pattern
      const hasCaseCitation = /\d+\s+[A-Z][a-z.]+\s+\d+/.test(text);

      if (legalTermCount > 0 || hasCaseCitation) {
        const confidence = Math.min(0.95, 0.6 + (legalTermCount * 0.1) + (hasCaseCitation ? 0.2 : 0));

        claims.push({
          id: this.generateClaimId(),
          text: text.trim(),
          type: ClaimType.LEGAL,
          confidence,
          confidenceLevel: this.getConfidenceLevel(confidence),
          source: this.findSourceLocation(content, text),
        });
      }
    }

    return claims;
  }

  /**
   * Extract citation claims
   * Looks for references to other sources
   */
  private extractCitationClaims(doc: any, content: string): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];

    // Pattern for legal citations (e.g., "123 U.S. 456")
    // Allow uppercase letters in middle for abbreviations like "U.S."
    const legalCitationRegex = /\d+\s+[A-Z][A-Za-z.]+\s+\d+(?:,\s+\d+)?/g;
    
    // Pattern for academic citations (e.g., "Smith (2020)")
    const academicCitationRegex = /[A-Z][a-z]+\s+\(\d{4}\)/g;

    // Pattern for URLs
    const urlRegex = /https?:\/\/[^\s]+/g;

    const citationPatterns = [
      { regex: legalCitationRegex, type: 'legal' },
      { regex: academicCitationRegex, type: 'academic' },
      { regex: urlRegex, type: 'url' },
    ];

    for (const { regex, type } of citationPatterns) {
      const matches = content.matchAll(regex);

      for (const match of matches) {
        const text = match[0];
        const offset = match.index || 0;

        claims.push({
          id: this.generateClaimId(),
          text: text.trim(),
          type: ClaimType.CITATION,
          confidence: 0.9, // High confidence for pattern matches
          confidenceLevel: ClaimConfidence.HIGH,
          source: {
            offset,
            length: text.length,
          },
          metadata: {
            citationType: type,
          },
        });
      }
    }

    return claims;
  }

  /**
   * Extract opinion claims
   * Looks for subjective language and hedging
   */
  private extractOpinionClaims(doc: any, content: string): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const sentences = doc.sentences().json();

    const opinionIndicators = [
      'believe', 'think', 'feel', 'suggest', 'argue', 'claim', 'assert',
      'likely', 'probably', 'possibly', 'may', 'might', 'could',
      'should', 'would', 'seems', 'appears', 'arguably',
    ];

    for (const sentence of sentences) {
      const text = sentence.text;
      const lowerText = text.toLowerCase();

      // Check for opinion indicators
      const indicatorCount = opinionIndicators.filter((ind) => lowerText.includes(ind)).length;

      if (indicatorCount > 0) {
        const confidence = Math.min(0.9, 0.5 + (indicatorCount * 0.15));

        claims.push({
          id: this.generateClaimId(),
          text: text.trim(),
          type: ClaimType.OPINION,
          confidence,
          confidenceLevel: this.getConfidenceLevel(confidence),
          source: this.findSourceLocation(content, text),
        });
      }
    }

    return claims;
  }

  /**
   * Calculate factual confidence score
   */
  private calculateFactualConfidence(
    text: string,
    hasFactualVerb: boolean,
    hasNumbers: boolean,
    hasDefiniteArticle: boolean
  ): number {
    let confidence = 0.5; // Base confidence

    if (hasFactualVerb) confidence += 0.2;
    if (hasNumbers) confidence += 0.15;
    if (hasDefiniteArticle) confidence += 0.1;

    // Penalize hedging language
    const hedgingWords = ['may', 'might', 'could', 'possibly', 'likely', 'probably'];
    const hasHedging = hedgingWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));
    if (hasHedging) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if sentence is a command
   */
  private isCommand(text: string): boolean {
    const commandVerbs = ['do', 'go', 'get', 'make', 'take', 'give', 'show', 'tell', 'put'];
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    return commandVerbs.includes(firstWord);
  }

  /**
   * Enrich claim with entities and keywords
   */
  private enrichClaim(claim: ExtractedClaim, params: ClaimExtractionParams): ExtractedClaim {
    const doc = nlp(claim.text);

    if (params.includeEntities) {
      const people = doc.people().out('array');
      const places = doc.places().out('array');
      const organizations = doc.organizations().out('array');
      claim.entities = [...people, ...places, ...organizations];
    }

    if (params.includeKeywords) {
      const nouns = doc.nouns().out('array');
      const verbs = doc.verbs().out('array');
      claim.keywords = [...nouns, ...verbs].slice(0, 5); // Top 5
    }

    return claim;
  }

  /**
   * Get confidence level from score
   */
  private getConfidenceLevel(confidence: number): ClaimConfidence {
    if (confidence >= 0.8) return ClaimConfidence.HIGH;
    if (confidence >= 0.5) return ClaimConfidence.MEDIUM;
    return ClaimConfidence.LOW;
  }

  /**
   * Find source location of text in document
   */
  private findSourceLocation(content: string, text: string): {
    page?: number;
    line?: number;
    offset?: number;
    length?: number;
  } {
    const offset = content.indexOf(text);
    if (offset === -1) return {};

    // Calculate line number
    const beforeText = content.substring(0, offset);
    const line = beforeText.split('\n').length;

    return {
      line,
      offset,
      length: text.length,
    };
  }

  /**
   * Generate unique claim ID
   */
  private generateClaimId(): string {
    return `claim_${++this.claimCounter}_${Date.now()}`;
  }

  /**
   * Load document from database
   */
  private async loadDocument(documentId?: string): Promise<string> {
    if (!documentId) {
      throw new Error('Document ID required');
    }
    
    try {
      // Import documents schema from LexFiat (server runtime schema)
      const { documents } = await import('../../lexfiat-schema.js');
      const { db } = await import('../../db.js');
      const { eq } = await import('drizzle-orm');
      
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      if (!document.content) {
        throw new Error(`Document ${documentId} has no content`);
      }

      return document.content;
    } catch (error) {
      throw new Error(
        `Failed to load document: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure document exists and database connection is properly configured.'
      );
    }
  }

  /**
   * Get MCP tool definition
   */
  getToolDefinition() {
    return {
      name: 'claim_extractor',
      description: 'Extract claims, assertions, and factual statements from documents',
      inputSchema: {
        type: 'object' as const,
        properties: {
          documentId: {
            type: 'string',
            description: 'ID of document to analyze (alternative to content)',
          },
          content: {
            type: 'string',
            description: 'Text content to analyze (alternative to documentId)',
          },
          extractionType: {
            type: 'string',
            enum: ['all', 'factual', 'legal', 'citations', 'opinions'],
            description: 'Type of claims to extract',
            default: 'all',
          },
          minConfidence: {
            type: 'number',
            description: 'Minimum confidence threshold (0.0-1.0)',
            default: 0.5,
          },
          includeEntities: {
            type: 'boolean',
            description: 'Extract named entities from claims',
            default: true,
          },
          includeKeywords: {
            type: 'boolean',
            description: 'Extract keywords from claims',
            default: true,
          },
        },
        required: [],
      },
    };
  }

  /**
   * Execute tool via MCP
   */
  async execute(args: any): Promise<CallToolResult> {
    try {
      const result = await this.extractClaims(args);
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
export const claimExtractor = new ClaimExtractor();

/**
 * MCP tool handler
 */
export async function handleClaimExtractor(params: any): Promise<ClaimExtractionResult> {
  return await claimExtractor.extractClaims(params);
}