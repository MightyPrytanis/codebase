/**
 * Consistency Checker - Shared Verification Tool
 * 
 * Checks consistency across claims and statements in documents
 * Used by: Potemkin (assess_honesty), Arkiver (cross-reference checking)
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
import type { ExtractedClaim } from './claim-extractor';

/**
 * Consistency issue types
 */
export enum ConsistencyIssueType {
  CONTRADICTION = 'contradiction',     // Direct contradictions
  INCONSISTENCY = 'inconsistency',    // Logical inconsistencies
  AMBIGUITY = 'ambiguity',           // Ambiguous or unclear statements
  MISSING_INFO = 'missing_info',     // Missing supporting information
  TEMPORAL = 'temporal',             // Timeline inconsistencies
}

/**
 * Consistency issue severity
 */
export enum IssueSeverity {
  CRITICAL = 'critical',   // Major logical contradiction
  HIGH = 'high',          // Significant inconsistency
  MEDIUM = 'medium',      // Minor inconsistency
  LOW = 'low',           // Potential issue, needs review
}

/**
 * Consistency issue
 */
export interface ConsistencyIssue {
  id: string;
  type: ConsistencyIssueType;
  severity: IssueSeverity;
  description: string;
  claimIds: string[]; // IDs of conflicting claims
  evidence: string[];
  confidence: number; // 0.0-1.0
  location?: {
    start: number;
    end: number;
  };
}

/**
 * Claim relationship
 */
export interface ClaimRelationship {
  claim1Id: string;
  claim2Id: string;
  relationship: 'supports' | 'contradicts' | 'related' | 'unrelated';
  confidence: number;
  explanation: string;
}

/**
 * Consistency check parameters
 */
export const ConsistencyCheckParamsSchema = z.object({
  claims: z.array(z.any()).min(1), // Array of ExtractedClaim
  documentContext: z.string().optional(),
  checkTypes: z.array(z.enum([
    'contradiction',
    'inconsistency',
    'ambiguity',
    'missing_info',
    'temporal',
  ])).default(['contradiction', 'inconsistency']),
  minConfidence: z.number().min(0).max(1).default(0.6),
  detectRelationships: z.boolean().default(true),
});

export type ConsistencyCheckParams = z.infer<typeof ConsistencyCheckParamsSchema>;

/**
 * Consistency check result
 */
export interface ConsistencyCheckResult {
  issues: ConsistencyIssue[];
  relationships: ClaimRelationship[];
  consistencyScore: number; // 0.0-1.0 (higher = more consistent)
  summary: {
    totalClaims: number;
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  metadata: {
    processingTime: number;
    checksPerformed: string[];
  };
}

/**
 * Consistency Checker Tool
 * Extends BaseTool for MCP integration
 */
export class ConsistencyChecker extends BaseTool {
  private issueCounter: number = 0;

  /**
   * Check consistency across claims
   */
  async checkConsistency(params: ConsistencyCheckParams): Promise<ConsistencyCheckResult> {
    const startTime = Date.now();
    
    // Validate parameters
    const validated = ConsistencyCheckParamsSchema.parse(params);

    const issues: ConsistencyIssue[] = [];
    const relationships: ClaimRelationship[] = [];

    // Run requested checks
    if (validated.checkTypes.includes('contradiction')) {
      issues.push(...this.findContradictions(validated.claims));
    }

    if (validated.checkTypes.includes('inconsistency')) {
      // Check for date inconsistencies directly (doesn't require entity grouping)
      issues.push(...this.findDateInconsistencies(validated.claims));
      // Then check entity-based inconsistencies
      issues.push(...this.findInconsistencies(validated.claims));
    }

    if (validated.checkTypes.includes('ambiguity')) {
      issues.push(...this.findAmbiguities(validated.claims));
    }

    if (validated.checkTypes.includes('temporal')) {
      issues.push(...this.findTemporalIssues(validated.claims));
    }

    if (validated.checkTypes.includes('missing_info')) {
      issues.push(...this.findMissingInfo(validated.claims, validated.documentContext));
    }

    // Filter by confidence threshold
    const filteredIssues = issues.filter((issue) => issue.confidence >= validated.minConfidence);

    // Detect relationships if requested
    if (validated.detectRelationships) {
      relationships.push(...this.detectRelationships(validated.claims));
    }

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(
      validated.claims.length,
      filteredIssues
    );

    // Calculate summary
    const summary = {
      totalClaims: validated.claims.length,
      totalIssues: filteredIssues.length,
      critical: filteredIssues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
      high: filteredIssues.filter((i) => i.severity === IssueSeverity.HIGH).length,
      medium: filteredIssues.filter((i) => i.severity === IssueSeverity.MEDIUM).length,
      low: filteredIssues.filter((i) => i.severity === IssueSeverity.LOW).length,
    };

    const processingTime = Date.now() - startTime;

    return {
      issues: filteredIssues,
      relationships,
      consistencyScore,
      summary,
      metadata: {
        processingTime,
        checksPerformed: validated.checkTypes,
      },
    };
  }

  /**
   * Find direct contradictions between claims
   */
  private findContradictions(claims: ExtractedClaim[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Compare each claim with every other claim
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claim1 = claims[i];
        const claim2 = claims[j];

        const contradiction = this.detectContradiction(claim1, claim2);
        
        if (contradiction) {
          issues.push({
            id: this.generateIssueId(),
            type: ConsistencyIssueType.CONTRADICTION,
            severity: IssueSeverity.CRITICAL,
            description: contradiction.description,
            claimIds: [claim1.id, claim2.id],
            evidence: [claim1.text, claim2.text],
            confidence: contradiction.confidence,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect contradiction between two claims
   */
  private detectContradiction(
    claim1: ExtractedClaim,
    claim2: ExtractedClaim
  ): { description: string; confidence: number } | null {
    const doc1 = nlp(claim1.text);
    const doc2 = nlp(claim2.text);

    // Extract subjects and verbs
    const subject1 = doc1.match('#Noun+').text();
    const subject2 = doc2.match('#Noun+').text();

    // If subjects don't overlap, unlikely to be contradictory
    if (!this.hasSubjectOverlap(subject1, subject2)) {
      return null;
    }

    // Check for negation patterns
    const hasNegation1 = this.hasNegation(claim1.text);
    const hasNegation2 = this.hasNegation(claim2.text);

    // If one has negation and the other doesn't, potential contradiction
    if (hasNegation1 !== hasNegation2) {
      return {
        description: `Potential contradiction: one claim negates what the other asserts about ${subject1}`,
        confidence: 0.7,
      };
    }

    // Check for opposite values (numbers, dates, etc.)
    const numbers1 = claim1.text.match(/\d+/g) || [];
    const numbers2 = claim2.text.match(/\d+/g) || [];

    if (numbers1.length > 0 && numbers2.length > 0 && numbers1[0] !== numbers2[0]) {
      return {
        description: `Numerical contradiction: claims state different values (${numbers1[0]} vs ${numbers2[0]})`,
        confidence: 0.85,
      };
    }

    return null;
  }

  /**
   * Find logical inconsistencies
   */
  private findInconsistencies(claims: ExtractedClaim[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Group claims by entities
    const entityGroups = this.groupClaimsByEntity(claims);

    // Check each entity group for inconsistencies
    for (const [entity, entityClaims] of entityGroups.entries()) {
      if (entityClaims.length < 2) continue;

      // Check for inconsistent attributes
      const inconsistency = this.detectEntityInconsistency(entity, entityClaims);
      
      if (inconsistency) {
        issues.push({
          id: this.generateIssueId(),
          type: ConsistencyIssueType.INCONSISTENCY,
          severity: IssueSeverity.HIGH,
          description: inconsistency.description,
          claimIds: entityClaims.map((c) => c.id),
          evidence: entityClaims.map((c) => c.text),
          confidence: inconsistency.confidence,
        });
      }
    }

    return issues;
  }

  /**
   * Find date inconsistencies (same event, different dates)
   */
  private findDateInconsistencies(claims: ExtractedClaim[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Look for claims with similar structure but different dates
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claim1 = claims[i];
        const claim2 = claims[j];

        // Extract dates from both claims
        const dates1 = this.extractDates(claim1.text);
        const dates2 = this.extractDates(claim2.text);

        // If both have dates and they're different, check if claims are about the same thing
        if (dates1.length > 0 && dates2.length > 0 && dates1[0] !== dates2[0]) {
          // Check if claims are similar (same subject/verb structure)
          const similarity = this.calculateTextSimilarity(claim1.text, claim2.text);
          
          // If claims are similar (>70% similarity) but have different dates, that's an inconsistency
          if (similarity > 0.7) {
            issues.push({
              id: this.generateIssueId(),
              type: ConsistencyIssueType.INCONSISTENCY,
              severity: IssueSeverity.HIGH,
              description: `Date inconsistency: same event described with different dates (${dates1[0]} vs ${dates2[0]})`,
              claimIds: [claim1.id, claim2.id],
              evidence: [claim1.text, claim2.text],
              confidence: 0.85,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): string[] {
    const dates: string[] = [];
    
    // Match various date formats
    const patterns = [
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches.map(m => m.toLowerCase().trim()));
      }
    }

    return dates;
  }

  /**
   * Calculate text similarity (simple word overlap)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Find ambiguous or unclear statements
   */
  private findAmbiguities(claims: ExtractedClaim[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const claim of claims) {
      const ambiguity = this.detectAmbiguity(claim);
      
      if (ambiguity) {
        issues.push({
          id: this.generateIssueId(),
          type: ConsistencyIssueType.AMBIGUITY,
          severity: IssueSeverity.MEDIUM,
          description: ambiguity.description,
          claimIds: [claim.id],
          evidence: [claim.text],
          confidence: ambiguity.confidence,
        });
      }
    }

    return issues;
  }

  /**
   * Find timeline inconsistencies
   */
  private findTemporalIssues(claims: ExtractedClaim[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Extract temporal information from claims
    const temporalClaims = claims.filter((claim) => {
      return /\b(before|after|during|when|then|date|year|\d{4})\b/i.test(claim.text);
    });

    // Check for temporal contradictions
    for (let i = 0; i < temporalClaims.length; i++) {
      for (let j = i + 1; j < temporalClaims.length; j++) {
        const issue = this.detectTemporalContradiction(temporalClaims[i], temporalClaims[j]);
        
        if (issue) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }

  /**
   * Find missing supporting information
   */
  private findMissingInfo(claims: ExtractedClaim[], context?: string): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const claim of claims) {
      // Check if claim makes assertions without evidence
      if (this.needsSupport(claim.text) && !this.hasSupport(claim, claims, context)) {
        issues.push({
          id: this.generateIssueId(),
          type: ConsistencyIssueType.MISSING_INFO,
          severity: IssueSeverity.MEDIUM,
          description: `Claim lacks supporting evidence or citations`,
          claimIds: [claim.id],
          evidence: [claim.text],
          confidence: 0.65,
        });
      }
    }

    return issues;
  }

  /**
   * Detect relationships between claims
   */
  private detectRelationships(claims: ExtractedClaim[]): ClaimRelationship[] {
    const relationships: ClaimRelationship[] = [];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const relationship = this.analyzeRelationship(claims[i], claims[j]);
        
        if (relationship.relationship !== 'unrelated') {
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Helper: Check if subjects overlap
   */
  private hasSubjectOverlap(subject1: string, subject2: string): boolean {
    if (!subject1 || !subject2) return false;
    
    const words1 = subject1.toLowerCase().split(/\s+/);
    const words2 = subject2.toLowerCase().split(/\s+/);
    
    return words1.some((w) => words2.includes(w));
  }

  /**
   * Helper: Check for negation
   */
  private hasNegation(text: string): boolean {
    const negationWords = ['not', 'no', 'never', 'none', 'neither', 'nor', "don't", "doesn't", "didn't", "won't", "can't"];
    return negationWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  /**
   * Helper: Group claims by entities
   */
  private groupClaimsByEntity(claims: ExtractedClaim[]): Map<string, ExtractedClaim[]> {
    const groups = new Map<string, ExtractedClaim[]>();

    for (const claim of claims) {
      if (!claim.entities || claim.entities.length === 0) continue;

      for (const entity of claim.entities) {
        const existing = groups.get(entity) || [];
        existing.push(claim);
        groups.set(entity, existing);
      }
    }

    return groups;
  }

  /**
   * Helper: Detect entity inconsistency
   */
  private detectEntityInconsistency(
    entity: string,
    claims: ExtractedClaim[]
  ): { description: string; confidence: number } | null {
    // Look for conflicting descriptions of the same entity
    const descriptions = claims.map((c) => c.text);
    
    // Check for date inconsistencies (same event, different dates)
    const dates: string[] = [];
    for (const claim of claims) {
      // Extract dates (various formats: "January 1, 2023", "2023-01-01", "1/1/2023", etc.)
      const dateMatches = claim.text.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi) ||
                         claim.text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ||
                         claim.text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) ||
                         claim.text.match(/\b\d{4}\b/g);
      if (dateMatches) {
        dates.push(...dateMatches);
      }
    }

    // If we have multiple different dates for the same entity, that's an inconsistency
    const uniqueDates = new Set(dates.map(d => d.toLowerCase().trim()));
    if (uniqueDates.size > 1 && dates.length >= 2) {
      return {
        description: `Date inconsistency: conflicting dates found (${Array.from(uniqueDates).join(', ')})`,
        confidence: 0.85,
      };
    }

    // Check if descriptions use different terminology
    const uniqueVerbs = new Set<string>();
    for (const claim of claims) {
      const doc = nlp(claim.text);
      const verbs = doc.verbs().out('array');
      verbs.forEach((v) => uniqueVerbs.add(v.toLowerCase()));
    }

    if (uniqueVerbs.size > claims.length / 2) {
      return {
        description: `Inconsistent descriptions of "${entity}" across multiple claims`,
        confidence: 0.6,
      };
    }

    return null;
  }

  /**
   * Helper: Detect ambiguity
   */
  private detectAmbiguity(claim: ExtractedClaim): { description: string; confidence: number } | null {
    const ambiguousWords = ['some', 'many', 'few', 'several', 'various', 'certain', 'unclear', 'ambiguous'];
    const hasAmbiguous = ambiguousWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(claim.text));

    if (hasAmbiguous) {
      return {
        description: 'Claim uses vague or ambiguous language',
        confidence: 0.7,
      };
    }

    return null;
  }

  /**
   * Helper: Detect temporal contradiction
   */
  private detectTemporalContradiction(
    claim1: ExtractedClaim,
    claim2: ExtractedClaim
  ): ConsistencyIssue | null {
    // Simple temporal contradiction detection
    // Extract year patterns
    const years1: string[] = claim1.text.match(/\b(\d{4})\b/g) || [];
    const years2: string[] = claim2.text.match(/\b(\d{4})\b/g) || [];

    if (years1.length === 0 || years2.length === 0) return null;

    // Check for temporal ordering conflicts (before/after)
    const hasBefore1 = /\bbefore\b/i.test(claim1.text);
    const hasAfter1 = /\bafter\b/i.test(claim1.text);
    const hasBefore2 = /\bbefore\b/i.test(claim2.text);
    const hasAfter2 = /\bafter\b/i.test(claim2.text);

    // If one says "before" and the other says "after" with same year, potential conflict
    if ((hasBefore1 && hasAfter2) || (hasAfter1 && hasBefore2)) {
      const sharedYear = years1.find((y: string) => years2.includes(y));
      if (sharedYear) {
        return {
          id: this.generateIssueId(),
          type: ConsistencyIssueType.TEMPORAL,
          severity: IssueSeverity.HIGH,
          description: `Temporal contradiction: conflicting timeline around ${sharedYear}`,
          claimIds: [claim1.id, claim2.id],
          evidence: [claim1.text, claim2.text],
          confidence: 0.75,
        };
      }
    }
    
    return null;
  }

  /**
   * Helper: Check if claim needs support
   */
  private needsSupport(text: string): boolean {
    const assertionWords = ['proves', 'shows', 'demonstrates', 'indicates', 'establishes'];
    return assertionWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));
  }

  /**
   * Helper: Check if claim has support
   */
  private hasSupport(claim: ExtractedClaim, allClaims: ExtractedClaim[], context?: string): boolean {
    // Check if other claims support this one
    // Simplified: look for citations or references
    return claim.type === 'citation' || Boolean(claim.entities && claim.entities.length > 0);
  }

  /**
   * Helper: Analyze relationship between claims
   */
  private analyzeRelationship(claim1: ExtractedClaim, claim2: ExtractedClaim): ClaimRelationship {
    // Check for contradiction
    const contradiction = this.detectContradiction(claim1, claim2);
    if (contradiction && contradiction.confidence > 0.7) {
      return {
        claim1Id: claim1.id,
        claim2Id: claim2.id,
        relationship: 'contradicts',
        confidence: contradiction.confidence,
        explanation: contradiction.description,
      };
    }

    // Check for support (shared entities, related content)
    const hasSharedEntities = claim1.entities?.some((e) => claim2.entities?.includes(e));
    if (hasSharedEntities) {
      return {
        claim1Id: claim1.id,
        claim2Id: claim2.id,
        relationship: 'related',
        confidence: 0.7,
        explanation: 'Claims share common entities',
      };
    }

    return {
      claim1Id: claim1.id,
      claim2Id: claim2.id,
      relationship: 'unrelated',
      confidence: 0.5,
      explanation: 'No clear relationship detected',
    };
  }

  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(totalClaims: number, issues: ConsistencyIssue[]): number {
    if (totalClaims === 0) return 1.0;

    // Weight issues by severity
    const weights = {
      [IssueSeverity.CRITICAL]: 1.0,
      [IssueSeverity.HIGH]: 0.7,
      [IssueSeverity.MEDIUM]: 0.4,
      [IssueSeverity.LOW]: 0.2,
    };

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + (weights[issue.severity] * issue.confidence);
    }, 0);

    // Normalize by number of claims
    const penaltyPerClaim = totalPenalty / totalClaims;
    const score = Math.max(0, 1.0 - (penaltyPerClaim * 0.5));

    return score;
  }

  /**
   * Generate unique issue ID
   */
  private generateIssueId(): string {
    return `issue_${++this.issueCounter}_${Date.now()}`;
  }

  /**
   * Get MCP tool definition
   */
  getToolDefinition() {
    return {
      name: 'consistency_checker',
      description: 'Check consistency across claims and statements in documents',
      inputSchema: {
        type: 'object' as const,
        properties: {
          claims: {
            type: 'array',
            items: { type: 'object' },
            description: 'Array of extracted claims to check',
          },
          documentContext: {
            type: 'string',
            description: 'Full document content for context',
          },
          checkTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['contradiction', 'inconsistency', 'ambiguity', 'missing_info', 'temporal'],
            },
            description: 'Types of consistency checks to perform',
            default: ['contradiction', 'inconsistency'],
          },
          minConfidence: {
            type: 'number',
            description: 'Minimum confidence threshold for issues',
            default: 0.6,
          },
          detectRelationships: {
            type: 'boolean',
            description: 'Detect relationships between claims',
            default: true,
          },
        },
        required: ['claims'],
      },
    };
  }

  /**
   * Execute tool via MCP
   */
  async execute(args: any): Promise<CallToolResult> {
    try {
      const result = await this.checkConsistency(args);
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
export const consistencyChecker = new ConsistencyChecker();

/**
 * MCP tool handler
 */
export async function handleConsistencyChecker(params: any): Promise<ConsistencyCheckResult> {
  return await consistencyChecker.checkConsistency(params);
}