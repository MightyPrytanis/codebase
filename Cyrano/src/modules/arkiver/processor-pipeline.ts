/**
 * Arkiver Processor Pipeline
 * 
 * Orchestrates the use of all processors in the extraction pipeline
 * Integrates text, email, insight, entity, and timeline processors
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { textProcessor } from './processors/text-processor.js';
import { emailProcessor } from './processors/email-processor.js';
import { insightProcessor } from './processors/insight-processor.js';
import { entityProcessor } from './processors/entity-processor.js';
import { timelineProcessor } from './processors/timeline-processor.js';
import { citationFormatter, Jurisdiction } from '../../tools/verification/citation-formatter.js';
import { consistencyChecker } from '../../tools/verification/consistency-checker.js';
import { claimExtractor, ClaimType, ClaimConfidence } from '../../tools/verification/claim-extractor.js';
import type { ConsistencyCheckResult } from '../../tools/verification/consistency-checker.js';
import type { ExtractedClaim } from '../../tools/verification/claim-extractor.js';
import { AIProvider } from '../../services/ai-service.js';

export interface ProcessorPipelineInput {
  text: string;
  source?: string;
  extractionSettings: {
    extractionMode?: 'standard' | 'deep' | 'fast';
    enableOCR?: boolean;
    extractEntities?: boolean;
    extractCitations?: boolean;
    extractTimeline?: boolean;
    categories?: string[];
    jurisdiction?: Jurisdiction; // For citation formatting
    useLLM?: boolean; // Enable LLM extraction
    llmProvider?: AIProvider; // AI provider for LLM extraction
    insightType?: 'general' | 'legal' | 'medical' | 'business'; // Type of insights to extract
    customPrompt?: string; // Custom prompt for LLM extraction
    checkConsistency?: boolean; // Check consistency across insights (default: true for deep mode)
    consistencyCheckTypes?: Array<'contradiction' | 'inconsistency' | 'ambiguity' | 'temporal' | 'missing_info'>; // Types of consistency checks
  };
}

export interface ProcessorPipelineOutput {
  text: {
    processed: string;
    metadata: any;
    statistics: any;
    structure: any;
  };
  entities?: {
    entities: any[];
    summary: any;
    relationships: any[];
  };
  insights?: {
    insights: any[];
    patterns: any[];
    anomalies: any[];
    trends: any[];
  };
  timeline?: {
    events: any[];
    timeline: any;
    gaps: any[];
  };
  citations?: {
    corrected: string;
    corrections: any[];
  };
  consistencyCheck?: ConsistencyCheckResult;
  metadata: {
    processingTime: number;
    processorsUsed: string[];
  };
}

/**
 * Processor Pipeline
 * Orchestrates all processors for comprehensive document analysis
 */
export class ProcessorPipeline {
  /**
   * Process text through all relevant processors
   */
  async process(input: ProcessorPipelineInput): Promise<ProcessorPipelineOutput> {
    const startTime = Date.now();
    const processorsUsed: string[] = [];
    
    // Step 1: Text processing (always done)
    const textResult = await textProcessor.process({
      content: input.text,
      encoding: 'utf-8',
      source: input.source,
      preserveFormatting: false,
    });
    processorsUsed.push('text');
    
    // Step 2: Entity extraction (if requested)
    let entitiesResult;
    if (input.extractionSettings.extractEntities) {
      entitiesResult = await entityProcessor.process({
        text: textResult.text,
        types: ['person', 'organization', 'location', 'date', 'money', 'statute', 'case'],
      });
      processorsUsed.push('entity');
    }
    
    // Step 3: Insight processing (if requested)
    let insightsResult;
    if (input.extractionSettings.extractionMode === 'deep' || input.extractionSettings.extractionMode === 'standard') {
      insightsResult = await insightProcessor.process({
        data: textResult.text,
        type: 'claims', // Default to claims extraction
        context: input.source,
        threshold: 0.5,
        useLLM: input.extractionSettings.useLLM ?? (input.extractionSettings.extractionMode === 'deep'),
        llmProvider: input.extractionSettings.llmProvider,
        insightType: input.extractionSettings.insightType || 'general',
        customPrompt: input.extractionSettings.customPrompt,
        verifySources: true, // Enable source verification
        sourceVerificationLevel: input.extractionSettings.extractionMode === 'deep' ? 'comprehensive' : 'basic',
      });
      processorsUsed.push('insight');
    }
    
    // Step 3.5: Consistency checking (if insights were extracted and consistency checking enabled)
    let consistencyCheckResult: ConsistencyCheckResult | undefined;
    const shouldCheckConsistency = 
      insightsResult && 
      (input.extractionSettings.checkConsistency ?? (input.extractionSettings.extractionMode === 'deep'));
    
    if (shouldCheckConsistency && insightsResult.insights.length > 1) {
      try {
        // Convert insights to claims format for consistency checking
        const claims = await this.convertInsightsToClaims(insightsResult.insights, textResult.text);
        
        if (claims.length > 1) {
          consistencyCheckResult = await consistencyChecker.checkConsistency({
            claims,
            documentContext: textResult.text,
            checkTypes: input.extractionSettings.consistencyCheckTypes || ['contradiction', 'inconsistency'],
            minConfidence: 0.6,
            detectRelationships: true,
          });
          processorsUsed.push('consistency');
        }
      } catch (error) {
        console.warn('Consistency checking failed:', error);
        // Continue without consistency checking
      }
    }
    
    // Step 4: Timeline extraction (if requested)
    let timelineResult;
    if (input.extractionSettings.extractTimeline) {
      timelineResult = await timelineProcessor.process({
        data: textResult.text,
        source: input.source,
        includeRelative: false,
        sortOrder: 'chronological',
      });
      processorsUsed.push('timeline');
    }
    
    // Step 5: Citation formatting (if requested and jurisdiction specified)
    let citationsResult;
    if (input.extractionSettings.extractCitations && input.extractionSettings.jurisdiction) {
      const citationResult = await citationFormatter.formatCitations({
        text: textResult.text,
        jurisdiction: input.extractionSettings.jurisdiction,
        documentMode: true,
        correct: true,
        strictMode: true,
      });
      
      if ('correctedText' in citationResult) {
        citationsResult = {
          corrected: citationResult.correctedText,
          corrections: citationResult.corrections,
        };
        processorsUsed.push('citation');
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      text: {
        processed: textResult.text,
        metadata: textResult.metadata,
        statistics: textResult.statistics,
        structure: textResult.structure,
      },
      entities: entitiesResult,
      insights: insightsResult,
      timeline: timelineResult,
      citations: citationsResult,
      consistencyCheck: consistencyCheckResult,
      metadata: {
        processingTime,
        processorsUsed,
      },
    };
  }

  /**
   * Convert insights to claims format for consistency checking
   */
  private async convertInsightsToClaims(
    insights: Array<{ id: string; description: string; confidence: number; type: string; metadata?: any }>,
    documentContext: string
  ): Promise<ExtractedClaim[]> {
    // Extract claims from document context for better consistency checking
    // We'll use the insight descriptions as claim text, but also extract actual claims
    const claimExtractionResult = await claimExtractor.extractClaims({
      content: documentContext,
      extractionType: 'all',
      minConfidence: 0.5,
      includeEntities: false,
      includeKeywords: false,
    });

    // Map insights to claims, matching with extracted claims where possible
    const claims: ExtractedClaim[] = [];
    
    for (const insight of insights) {
      // Try to find a matching extracted claim
      const matchingClaim = claimExtractionResult.claims.find(
        claim => claim.text.includes(insight.description.substring(0, 50)) ||
                 insight.description.includes(claim.text.substring(0, 50))
      );

      if (matchingClaim) {
        // Use the extracted claim (has better structure)
        claims.push(matchingClaim);
      } else {
        // Create a claim from the insight
        const confidenceLevel = this.getConfidenceLevel(insight.confidence);
        claims.push({
          id: insight.id,
          text: insight.description,
          type: this.mapInsightTypeToClaimType(insight.type),
          confidence: insight.confidence,
          confidenceLevel,
          source: {
            offset: 0,
            length: insight.description.length,
          },
          metadata: insight.metadata || {},
        });
      }
    }

    return claims;
  }

  /**
   * Map insight type to claim type
   */
  private mapInsightTypeToClaimType(insightType: string): ClaimType {
    switch (insightType) {
      case 'claim':
        return ClaimType.FACTUAL;
      case 'pattern':
      case 'trend':
        return ClaimType.FACTUAL;
      case 'anomaly':
        return ClaimType.FACTUAL;
      case 'relationship':
        return ClaimType.FACTUAL;
      default:
        return ClaimType.FACTUAL;
    }
  }

  /**
   * Get confidence level from confidence score
   */
  private getConfidenceLevel(confidence: number): ClaimConfidence {
    if (confidence >= 0.8) return ClaimConfidence.HIGH;
    if (confidence >= 0.5) return ClaimConfidence.MEDIUM;
    return ClaimConfidence.LOW;
  }
  
  /**
   * Process email through email processor and then text pipeline
   */
  async processEmail(
    emailContent: string,
    format: 'eml' | 'json' | 'raw' = 'raw',
    extractionSettings: ProcessorPipelineInput['extractionSettings']
  ): Promise<ProcessorPipelineOutput & { email: any }> {
    // First process email
    const emailResult = await emailProcessor.process({
      content: emailContent,
      format,
      extractAttachments: true,
    });
    
    // Then process email body through text pipeline
    const textInput: ProcessorPipelineInput = {
      text: emailResult.body.text,
      source: emailResult.headers.from?.[0]?.address || 'email',
      extractionSettings,
    };
    
    const pipelineResult = await this.process(textInput);
    
    return {
      ...pipelineResult,
      email: {
        headers: emailResult.headers,
        attachments: emailResult.attachments,
        threadInfo: emailResult.threadInfo,
      },
    };
  }
}

export const processorPipeline = new ProcessorPipeline();

