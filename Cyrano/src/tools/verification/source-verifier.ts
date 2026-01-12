/**
 * Source Verifier - Shared Verification Tool
 * 
 * Verifies sources and references for accessibility and reliability
 * Used by: Potemkin (assess_honesty), Arkiver (source verification)
 * 
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Source types
 */
export enum SourceType {
  URL = 'url',
  LEGAL_CASE = 'legal_case',
  STATUTE = 'statute',
  ACADEMIC = 'academic',
  NEWS = 'news',
  GOVERNMENT = 'government',
  UNKNOWN = 'unknown',
}

/**
 * Source accessibility status
 */
export enum AccessibilityStatus {
  ACCESSIBLE = 'accessible',       // Source is accessible
  RESTRICTED = 'restricted',       // Requires authentication/payment
  NOT_FOUND = 'not_found',        // 404 or similar
  ERROR = 'error',                // Network or server error
  UNKNOWN = 'unknown',            // Not yet verified
}

/**
 * Source reliability level
 */
export enum ReliabilityLevel {
  HIGH = 'high',           // 0.8-1.0 (government, legal, peer-reviewed)
  MEDIUM = 'medium',       // 0.5-0.79 (established news, verified sources)
  LOW = 'low',            // 0.0-0.49 (blogs, social media, unverified)
  UNKNOWN = 'unknown',    // Cannot determine
}

/**
 * Source verification result
 */
export interface SourceVerification {
  source: string;
  type: SourceType;
  accessibility: AccessibilityStatus;
  reliability: ReliabilityLevel;
  reliabilityScore: number; // 0.0-1.0
  metadata: {
    domain?: string;
    title?: string;
    author?: string;
    publishDate?: string;
    lastChecked?: string;
    contentMatch?: number; // How well content matches expectation (0.0-1.0)
  };
  issues: string[];
  warnings: string[];
}

/**
 * Verification parameters
 */
export const SourceVerificationParamsSchema = z.object({
  sources: z.array(z.string()).min(1),
  verificationLevel: z.enum(['basic', 'comprehensive']).default('basic'),
  checkAccessibility: z.boolean().default(true),
  checkReliability: z.boolean().default(true),
  expectedContent: z.string().optional(), // For content matching
  timeout: z.number().default(5000), // Timeout for HTTP requests (ms)
});

export type SourceVerificationParams = z.infer<typeof SourceVerificationParamsSchema>;

/**
 * Verification result
 */
export interface SourceVerificationResult {
  verifications: SourceVerification[];
  summary: {
    total: number;
    accessible: number;
    restricted: number;
    notFound: number;
    highReliability: number;
    mediumReliability: number;
    lowReliability: number;
  };
  metadata: {
    processingTime: number;
    verificationLevel: string;
    accessibilityChecked: boolean;
    reliabilityChecked: boolean;
  };
}

/**
 * Source Verifier Tool
 * Extends BaseTool for MCP integration
 */
export class SourceVerifier extends BaseTool {
  private trustedDomains = new Set([
    // Legal
    'law.cornell.edu', 'supremecourt.gov', 'uscourts.gov', 'justia.com',
    'courtlistener.com', 'casetext.com', 'law.com',
    
    // Government
    'gov', 'mil', 'edu', 'congress.gov', 'gpo.gov', 'archives.gov',
    
    // Academic
    'jstor.org', 'scholar.google.com', 'arxiv.org', 'pubmed.gov',
    'sciencedirect.com', 'springer.com', 'nature.com', 'science.org',
    
    // Established News
    'nytimes.com', 'washingtonpost.com', 'wsj.com', 'reuters.com',
    'apnews.com', 'bbc.com', 'theguardian.com', 'npr.org',
  ]);

  /**
   * Verify sources
   */
  async verifySources(params: SourceVerificationParams): Promise<SourceVerificationResult> {
    const startTime = Date.now();
    
    // Validate parameters
    const validated = SourceVerificationParamsSchema.parse(params);

    // Verify each source
    const verifications: SourceVerification[] = [];
    
    for (const source of validated.sources) {
      const verification = await this.verifySource(
        source,
        validated.verificationLevel,
        validated.checkAccessibility,
        validated.checkReliability,
        validated.expectedContent,
        validated.timeout
      );
      verifications.push(verification);
    }

    // Calculate summary
    const summary = {
      total: verifications.length,
      accessible: verifications.filter((v) => v.accessibility === AccessibilityStatus.ACCESSIBLE).length,
      restricted: verifications.filter((v) => v.accessibility === AccessibilityStatus.RESTRICTED).length,
      notFound: verifications.filter((v) => v.accessibility === AccessibilityStatus.NOT_FOUND).length,
      highReliability: verifications.filter((v) => v.reliability === ReliabilityLevel.HIGH).length,
      mediumReliability: verifications.filter((v) => v.reliability === ReliabilityLevel.MEDIUM).length,
      lowReliability: verifications.filter((v) => v.reliability === ReliabilityLevel.LOW).length,
    };

    const processingTime = Date.now() - startTime;

    return {
      verifications,
      summary,
      metadata: {
        processingTime,
        verificationLevel: validated.verificationLevel,
        accessibilityChecked: validated.checkAccessibility,
        reliabilityChecked: validated.checkReliability,
      },
    };
  }

  /**
   * Verify a single source
   */
  private async verifySource(
    source: string,
    level: 'basic' | 'comprehensive',
    checkAccessibility: boolean,
    checkReliability: boolean,
    expectedContent?: string,
    timeout: number = 5000
  ): Promise<SourceVerification> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Identify source type
    const type = this.identifySourceType(source);

    // Check reliability (doesn't require network call)
    let reliability = ReliabilityLevel.UNKNOWN;
    let reliabilityScore = 0.5;
    
    if (checkReliability) {
      const reliabilityResult = this.assessReliability(source, type);
      reliability = reliabilityResult.level;
      reliabilityScore = reliabilityResult.score;
      warnings.push(...reliabilityResult.warnings);
    }

    // Check accessibility (requires network call)
    let accessibility = AccessibilityStatus.UNKNOWN;
    const metadata: SourceVerification['metadata'] = {
      lastChecked: new Date().toISOString(),
    };

    if (checkAccessibility && type === SourceType.URL) {
      const accessResult = await this.checkAccessibility(source, timeout, expectedContent);
      accessibility = accessResult.status;
      metadata.domain = accessResult.domain;
      metadata.title = accessResult.title;
      metadata.contentMatch = accessResult.contentMatch;
      issues.push(...accessResult.issues);
    }

    return {
      source,
      type,
      accessibility,
      reliability,
      reliabilityScore,
      metadata,
      issues,
      warnings,
    };
  }

  /**
   * Identify source type
   */
  private identifySourceType(source: string): SourceType {
    const lower = source.toLowerCase();

    // Check for URL
    if (/^https?:\/\//.test(lower)) {
      // Check domain for specific types
      if (lower.includes('court') || lower.includes('justia') || lower.includes('casetext')) {
        return SourceType.LEGAL_CASE;
      }
      if (lower.includes('.gov') || lower.includes('congress') || lower.includes('gpo')) {
        return SourceType.GOVERNMENT;
      }
      if (lower.includes('scholar') || lower.includes('jstor') || lower.includes('arxiv')) {
        return SourceType.ACADEMIC;
      }
      if (lower.includes('news') || lower.includes('times') || lower.includes('post')) {
        return SourceType.NEWS;
      }
      return SourceType.URL;
    }

    // Check for legal citation pattern
    if (/\d+\s+[A-Z][a-z.]+\s+\d+/.test(source)) {
      return SourceType.LEGAL_CASE;
    }

    // Check for statute reference
    if (/\d+\s+U\.?S\.?C\.?\s+§?\s*\d+/.test(source)) {
      return SourceType.STATUTE;
    }

    return SourceType.UNKNOWN;
  }

  /**
   * Assess reliability based on source characteristics
   */
  private assessReliability(
    source: string,
    type: SourceType
  ): { level: ReliabilityLevel; score: number; warnings: string[] } {
    const warnings: string[] = [];
    let score = 0.5; // Default medium

    // Type-based scoring
    switch (type) {
      case SourceType.LEGAL_CASE:
      case SourceType.STATUTE:
      case SourceType.GOVERNMENT:
        score = 0.9; // High reliability
        break;

      case SourceType.ACADEMIC:
        score = 0.85; // High reliability
        break;

      case SourceType.NEWS:
        score = 0.6; // Medium reliability (depends on outlet)
        break;

      case SourceType.URL:
        // Check domain
        if (this.isTrustedDomain(source)) {
          score = 0.8;
        } else if (this.isSuspiciousDomain(source)) {
          score = 0.2;
          warnings.push('Domain has low trustworthiness indicators');
        } else {
          score = 0.5;
          warnings.push('Domain reliability unknown');
        }
        break;

      case SourceType.UNKNOWN:
        score = 0.3;
        warnings.push('Cannot determine source type');
        break;
    }

    // Additional checks for URLs
    if (type === SourceType.URL || type === SourceType.NEWS) {
      // Check for HTTPS
      if (source.startsWith('http://')) {
        score *= 0.9;
        warnings.push('Source uses HTTP instead of HTTPS');
      }

      // Check for suspicious patterns
      if (this.hasSuspiciousPatterns(source)) {
        score *= 0.7;
        warnings.push('Source URL contains suspicious patterns');
      }
    }

    // Determine level
    let level = ReliabilityLevel.MEDIUM;
    if (score >= 0.8) {
      level = ReliabilityLevel.HIGH;
    } else if (score < 0.5) {
      level = ReliabilityLevel.LOW;
    }

    return { level, score, warnings };
  }

  /**
   * Check if domain is trusted
   */
  private isTrustedDomain(source: string): boolean {
    try {
      const url = new URL(source);
      const hostname = url.hostname.toLowerCase();
      
      // Check exact match
      if (this.trustedDomains.has(hostname)) {
        return true;
      }

      // Check TLD
      if (hostname.endsWith('.gov') || hostname.endsWith('.edu') || hostname.endsWith('.mil')) {
        return true;
      }

      // Check if subdomain of trusted domain
      for (const trusted of this.trustedDomains) {
        if (hostname.endsWith('.' + trusted)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if domain is suspicious
   */
  private isSuspiciousDomain(source: string): boolean {
    const lower = source.toLowerCase();
    
    // Suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.info'];
    if (suspiciousTLDs.some((tld) => lower.endsWith(tld))) {
      return true;
    }

    // Suspicious keywords
    const suspiciousKeywords = ['free', 'download', 'click', 'win', 'prize', 'scam'];
    if (suspiciousKeywords.some((kw) => lower.includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Check for suspicious URL patterns
   */
  private hasSuspiciousPatterns(source: string): boolean {
    // Multiple subdomains
    try {
      const url = new URL(source);
      const parts = url.hostname.split('.');
      if (parts.length > 4) {
        return true;
      }
    } catch {
      return false;
    }

    // URL shorteners (could hide destination)
    const shorteners = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl'];
    if (shorteners.some((s) => source.includes(s))) {
      return true;
    }

    // Excessive query parameters
    const queryParams = (source.match(/[?&]/g) || []).length;
    if (queryParams > 5) {
      return true;
    }

    return false;
  }

  /**
   * Check source accessibility via HTTP request
   */
  private async checkAccessibility(
    source: string,
    timeout: number,
    expectedContent?: string
  ): Promise<{
    status: AccessibilityStatus;
    domain?: string;
    title?: string;
    contentMatch?: number;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const url = new URL(source);
      const domain = url.hostname;

      // Perform actual HTTP request to verify source accessibility
      try {
        const response = await fetch(source, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000), // 10 second timeout
          headers: {
            'User-Agent': 'Cyrano-Legal-Verification/1.0',
          },
        });

        if (!response.ok) {
          issues.push(`HTTP ${response.status}: ${response.statusText}`);
          return {
            status: AccessibilityStatus.NOT_FOUND,
            domain,
            issues,
          };
        }

        // Extract title from HTML if GET request succeeds
        let title: string | undefined;
        if (response.headers.get('content-type')?.includes('text/html')) {
          try {
            const htmlResponse = await fetch(source, {
              signal: AbortSignal.timeout(10000),
              headers: {
                'User-Agent': 'Cyrano-Legal-Verification/1.0',
              },
            });
            const html = await htmlResponse.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            title = titleMatch ? titleMatch[1].trim() : undefined;
          } catch {
            // Title extraction failed, continue without it
          }
        }

        // Check content match if expected content provided
        let contentMatch: number | undefined;
        if (expectedContent && response.headers.get('content-type')?.includes('text/html')) {
          try {
            const htmlResponse = await fetch(source, {
              signal: AbortSignal.timeout(10000),
              headers: {
                'User-Agent': 'Cyrano-Legal-Verification/1.0',
              },
            });
            const html = await htmlResponse.text();
            const expectedLower = expectedContent.toLowerCase();
            const htmlLower = html.toLowerCase();
            // Simple keyword matching for content relevance
            const expectedWords = expectedLower.split(/\W+/).filter(w => w.length > 3);
            const matchingWords = expectedWords.filter(w => htmlLower.includes(w));
            contentMatch = expectedWords.length > 0 ? matchingWords.length / expectedWords.length : undefined;
          } catch {
            // Content matching failed
          }
        }

        return {
          status: AccessibilityStatus.ACCESSIBLE,
          domain,
          title,
          contentMatch,
          issues,
        };
      } catch (fetchError) {
        issues.push(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        return {
          status: AccessibilityStatus.ERROR,
          domain,
          issues,
        };
      }
    } catch (error) {
      issues.push(`Invalid URL or network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        status: AccessibilityStatus.ERROR,
        issues,
      };
    }
  }


  /**
   * Get MCP tool definition
   */
  getToolDefinition() {
    return {
      name: 'source_verifier',
      description: 'Verify sources and references for accessibility and reliability',
      inputSchema: {
        type: 'object' as const,
        properties: {
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of source references to verify',
          },
          verificationLevel: {
            type: 'string',
            enum: ['basic', 'comprehensive'],
            description: 'Level of verification to perform',
            default: 'basic',
          },
          checkAccessibility: {
            type: 'boolean',
            description: 'Check if sources are accessible (requires network calls)',
            default: true,
          },
          checkReliability: {
            type: 'boolean',
            description: 'Assess source reliability',
            default: true,
          },
          expectedContent: {
            type: 'string',
            description: 'Expected content to match (for content verification)',
          },
          timeout: {
            type: 'number',
            description: 'Timeout for HTTP requests in milliseconds',
            default: 5000,
          },
        },
        required: ['sources'],
      },
    };
  }

  /**
   * Execute tool via MCP
   */
  async execute(args: any): Promise<CallToolResult> {
    try {
      const result = await this.verifySources(args);
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
export const sourceVerifier = new SourceVerifier();

/**
 * MCP tool handler
 */
export async function handleSourceVerifier(params: any): Promise<SourceVerificationResult> {
  return await sourceVerifier.verifySources(params);

}
}
}
}
}
}
}