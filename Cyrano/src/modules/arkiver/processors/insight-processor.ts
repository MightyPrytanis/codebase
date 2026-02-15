/**
 * Insight Processor
 * Extracts insights, patterns, and key findings from processed data
 * Uses LLM for intelligent extraction when enabled
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import { AIService, AIProvider } from '../../../services/ai-service.js';
import { sourceVerifier } from '../../../tools/verification/source-verifier.js';
import type { SourceVerificationResult } from '../../../tools/verification/source-verifier.js';

export const InsightProcessorSchema = z.object({
  data: z.any(),
  type: z.enum(['claims', 'patterns', 'anomalies', 'trends', 'relationships']),
  context: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.5), // Confidence threshold
  useLLM: z.boolean().default(false).describe('Use LLM for intelligent extraction'),
  llmProvider: z.enum(['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek']).optional().describe('AI provider for LLM extraction'),
  insightType: z.enum(['general', 'legal', 'medical', 'business']).optional().default('general').describe('Type of insights to extract'),
  customPrompt: z.string().optional().describe('Custom prompt for LLM extraction'),
  verifySources: z.boolean().default(true).describe('Verify sources and citations found in insights'),
  sourceVerificationLevel: z.enum(['basic', 'comprehensive']).default('basic').describe('Level of source verification'),
});

export type InsightProcessorInput = z.infer<typeof InsightProcessorSchema>;

export interface Insight {
  id: string;
  type: 'claim' | 'pattern' | 'anomaly' | 'trend' | 'relationship';
  description: string;
  confidence: number;
  evidence: string[];
  metadata: Record<string, any>;
  timestamp: string;
  sourceVerification?: {
    verified: boolean;
    sources: Array<{
      source: string;
      accessible: boolean;
      reliable: boolean;
      reliabilityScore: number;
    }>;
  };
}

export interface InsightProcessorOutput {
  insights: Insight[];
  summary: {
    total: number;
    byType: Record<string, number>;
    highConfidence: number;
  };
  sourceVerification?: SourceVerificationResult;
  metadata: {
    processingTime: number;
    dataSize: number;
    threshold: number;
    sourcesVerified: boolean;
  };
}

export class InsightProcessor {
  private insightCounter = 0;
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Process data and extract insights
   */
  async process(input: InsightProcessorInput): Promise<InsightProcessorOutput> {
    const startTime = Date.now();
    const validated = InsightProcessorSchema.parse(input);
    
    let insights: Insight[] = [];
    
    // Use LLM extraction if enabled
    if (validated.useLLM && typeof validated.data === 'string' && validated.data.length > 100) {
      try {
        insights = await this.extractWithLLM(validated.data, validated);
      } catch (error) {
        console.warn('LLM extraction failed, falling back to pattern matching:', error);
        // Fall back to pattern matching
        insights = await this.extractWithPatterns(validated);
      }
    } else {
      // Use pattern-based extraction
      insights = await this.extractWithPatterns(validated);
    }

    // Extract sources/citations from insights for verification
    let sourceVerificationResult: SourceVerificationResult | undefined;
    if (validated.verifySources && insights.length > 0) {
      try {
        const sources = this.extractSourcesFromInsights(insights);
        if (sources.length > 0) {
          sourceVerificationResult = await sourceVerifier.verifySources({
            sources,
            verificationLevel: validated.sourceVerificationLevel,
            checkAccessibility: validated.sourceVerificationLevel === 'comprehensive',
            checkReliability: true,
            timeout: 5000,
          });

          // Attach verification results to insights
          insights = this.attachSourceVerificationToInsights(insights, sourceVerificationResult);
        }
      } catch (error) {
        console.warn('Source verification failed:', error);
        // Continue without source verification
      }
    }

    // Calculate summary
    const byType = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highConfidence = insights.filter(i => i.confidence >= 0.8).length;

    const processingTime = Date.now() - startTime;

    return {
      insights,
      summary: {
        total: insights.length,
        byType,
        highConfidence,
      },
      sourceVerification: sourceVerificationResult,
      metadata: {
        processingTime,
        dataSize: JSON.stringify(validated.data).length,
        threshold: validated.threshold,
        sourcesVerified: validated.verifySources && sourceVerificationResult !== undefined,
      },
    };
  }

  /**
   * Extract claims from text or structured data
   */
  private extractClaims(data: any, threshold: number): Insight[] {
    const insights: Insight[] = [];
    
    // Handle text input
    if (typeof data === 'string') {
      const claims = this.extractClaimsFromText(data);
      for (const claim of claims) {
        if (claim.confidence >= threshold) {
          insights.push({
            id: this.generateId(),
            type: 'claim',
            description: claim.text,
            confidence: claim.confidence,
            evidence: [claim.source],
            metadata: { position: claim.position },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
    
    // Handle structured data
    else if (Array.isArray(data)) {
      for (const item of data) {
        if (item.type === 'claim' && item.confidence >= threshold) {
          insights.push({
            id: this.generateId(),
            type: 'claim',
            description: item.text || item.description,
            confidence: item.confidence,
            evidence: item.evidence || [],
            metadata: item.metadata || {},
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract insights using LLM
   */
  private async extractWithLLM(
    text: string,
    settings: z.infer<typeof InsightProcessorSchema>
  ): Promise<Insight[]> {
    const provider = (settings.llmProvider || 'perplexity') as AIProvider;
    
    // Construct prompt based on insight type
    const systemPrompt = this.buildSystemPrompt(settings.insightType || 'general', settings.type);
    const userPrompt = this.buildExtractionPrompt(text, settings);
    
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    try {
      const response = await this.aiService.call(provider, fullPrompt, {
        maxTokens: 2000,
        systemPrompt,
      });
      
      // Parse LLM response
      return this.parseLLMResponse(response, settings.threshold);
    } catch (error) {
      console.error('LLM extraction error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for LLM extraction
   */
  private buildSystemPrompt(insightType: string, extractionType: string): string {
    const basePrompt = `You are an expert at extracting concise insights, named entities (persons, organizations, locations, dates), legal citations, and key findings from text.`;
    
    const typeSpecific = {
      legal: 'Focus on legal concepts, case law citations, statutes, regulations, and legal terminology.',
      medical: 'Focus on medical terminology, diagnoses, treatments, medications, and health-related information.',
      business: 'Focus on business concepts, financial data, market trends, and business relationships.',
      general: 'Extract general insights, key facts, important relationships, and notable patterns.',
    };
    
    const extractionSpecific = {
      claims: 'Identify specific claims, assertions, or statements made in the text.',
      patterns: 'Identify recurring patterns, sequences, or structures.',
      anomalies: 'Identify unusual or unexpected findings.',
      trends: 'Identify trends, changes over time, or directional patterns.',
      relationships: 'Identify relationships, connections, or correlations between entities.',
    };
    
    return `${basePrompt}\n${typeSpecific[insightType as keyof typeof typeSpecific] || typeSpecific.general}\n${extractionSpecific[extractionType as keyof typeof extractionSpecific] || ''}\n\nOutput your findings as a JSON array of insight objects. Each insight should have: title (string), content (string), confidence (0-1), entities (object with persons, organizations, locations, dates arrays), citations (array of strings), and metadata (object).`;
  }

  /**
   * Build extraction prompt for LLM
   */
  private buildExtractionPrompt(text: string, settings: z.infer<typeof InsightProcessorSchema>): string {
    let prompt = `Extract insights from the following text:\n\n${text.substring(0, 8000)}\n\n`;
    
    if (settings.customPrompt) {
      prompt += `Additional instructions: ${settings.customPrompt}\n\n`;
    }
    
    prompt += `Return a JSON array of insight objects. Each insight should include:
- title: A brief, descriptive title
- content: The full insight text or description
- confidence: A confidence score between 0 and 1
- entities: Object with arrays for persons, organizations, locations, dates
- citations: Array of legal citations or references found
- metadata: Any additional relevant metadata

Focus on extracting ${settings.type} insights with a minimum confidence threshold of ${settings.threshold}.`;
    
    return prompt;
  }

  /**
   * Parse LLM response into insights
   */
  private parseLLMResponse(response: string, threshold: number): Insight[] {
    const insights: Insight[] = [];
    
    try {
      // Try to extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const match = jsonStr.match(/```(?:json)?\n?(.*?)\n?```/s);
        if (match) {
          jsonStr = match[1].trim();
        }
      }
      
      const parsed = JSON.parse(jsonStr);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      
      for (const item of items) {
        if (item.title && item.content && (item.confidence ?? 0.7) >= threshold) {
          insights.push({
            id: this.generateId(),
            type: this.inferInsightType(item),
            description: item.content,
            confidence: item.confidence ?? 0.7,
            evidence: [item.title],
            metadata: {
              ...item.metadata,
              entities: item.entities || {},
              citations: item.citations || [],
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse LLM response as JSON, attempting fallback:', error);
      // Fallback: treat entire response as single insight
      if (response.length > 50) {
        insights.push({
          id: this.generateId(),
          type: 'claim',
          description: response.substring(0, 500),
          confidence: 0.6,
          evidence: [],
          metadata: { rawResponse: response.substring(0, 200) },
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    return insights;
  }

  /**
   * Infer insight type from content
   */
  private inferInsightType(item: any): 'claim' | 'pattern' | 'anomaly' | 'trend' | 'relationship' {
    if (item.type) {
      return item.type;
    }
    
    const content = (item.content || item.description || '').toLowerCase();
    if (content.includes('pattern') || content.includes('recurring')) return 'pattern';
    if (content.includes('anomaly') || content.includes('unusual')) return 'anomaly';
    if (content.includes('trend') || content.includes('increasing') || content.includes('decreasing')) return 'trend';
    if (content.includes('relationship') || content.includes('correlation')) return 'relationship';
    return 'claim';
  }

  /**
   * Extract insights using pattern matching (fallback)
   */
  private async extractWithPatterns(
    validated: z.infer<typeof InsightProcessorSchema>
  ): Promise<Insight[]> {
    switch (validated.type) {
      case 'claims':
        return this.extractClaims(validated.data, validated.threshold);
      case 'patterns':
        return this.detectPatterns(validated.data, validated.threshold);
      case 'anomalies':
        return this.detectAnomalies(validated.data, validated.threshold);
      case 'trends':
        return this.identifyTrends(validated.data, validated.threshold);
      case 'relationships':
        return this.findRelationships(validated.data, validated.threshold);
      default:
        return [];
    }
  }

  /**
   * Extract claims from text or structured data
   */
  private extractClaimsFromText(text: string): Array<{
    text: string;
    confidence: number;
    source: string;
    position: number;
  }> {
    const claims: Array<{
      text: string;
      confidence: number;
      source: string;
      position: number;
    }> = [];

    // Patterns that indicate claims
    const claimPatterns = [
      /(?:states?|claim|allege|assert|contend)s?\s+that\s+([^.]+)/gi,
      /(?:according to|based on)\s+([^,]+),\s+([^.]+)/gi,
      /it\s+is\s+(?:alleged|claimed|stated)\s+that\s+([^.]+)/gi,
      /the\s+(?:plaintiff|defendant|party)\s+(?:claims?|alleges?|contends?)\s+that\s+([^.]+)/gi,
    ];

    for (const pattern of claimPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const claimText = match[1] || match[2];
        if (claimText && claimText.length > 20) {
          claims.push({
            text: claimText.trim(),
            confidence: 0.7, // Base confidence for pattern-matched claims
            source: match[0],
            position: match.index || 0,
          });
        }
      }
    }

    return claims;
  }

  /**
   * Detect patterns in data
   */
  private detectPatterns(data: any, threshold: number): Insight[] {
    const insights: Insight[] = [];

    // Handle array of items
    if (Array.isArray(data)) {
      // Frequency analysis
      const frequencies = this.analyzeFrequencies(data);
      for (const [pattern, freq] of Object.entries(frequencies)) {
        if (freq.confidence >= threshold) {
          insights.push({
            id: this.generateId(),
            type: 'pattern',
            description: `Pattern detected: ${pattern} occurs ${freq.count} times`,
            confidence: freq.confidence,
            evidence: freq.examples,
            metadata: { count: freq.count, percentage: freq.percentage },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Sequential patterns
      const sequences = this.detectSequences(data);
      for (const seq of sequences) {
        if (seq.confidence >= threshold) {
          insights.push({
            id: this.generateId(),
            type: 'pattern',
            description: `Sequential pattern: ${seq.description}`,
            confidence: seq.confidence,
            evidence: seq.examples,
            metadata: { sequence: seq.pattern },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze frequency patterns
   */
  private analyzeFrequencies(data: any[]): Record<string, {
    count: number;
    percentage: number;
    confidence: number;
    examples: string[];
  }> {
    const frequencies: Record<string, { count: number; examples: string[] }> = {};
    
    // Extract key fields for frequency analysis
    for (const item of data) {
      const keys = this.extractKeyFields(item);
      for (const key of keys) {
        if (!frequencies[key]) {
          frequencies[key] = { count: 0, examples: [] };
        }
        frequencies[key].count++;
        if (frequencies[key].examples.length < 3) {
          frequencies[key].examples.push(JSON.stringify(item).slice(0, 100));
        }
      }
    }

    // Calculate confidence based on frequency
    const result: Record<string, any> = {};
    const total = data.length;
    
    for (const [key, freq] of Object.entries(frequencies)) {
      const percentage = (freq.count / total) * 100;
      const confidence = Math.min(percentage / 20, 1); // Higher frequency = higher confidence
      
      if (freq.count >= 3) { // At least 3 occurrences
        result[key] = {
          count: freq.count,
          percentage: Math.round(percentage * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          examples: freq.examples,
        };
      }
    }

    return result;
  }

  /**
   * Extract key fields from object
   */
  private extractKeyFields(obj: any): string[] {
    const keys: string[] = [];
    
    if (typeof obj === 'string') {
      keys.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' || typeof value === 'number') {
          keys.push(`${key}:${value}`);
        }
      }
    }

    return keys;
  }

  /**
   * Detect sequential patterns
   */
  private detectSequences(data: any[]): Array<{
    pattern: string[];
    description: string;
    confidence: number;
    examples: string[];
  }> {
    const sequences: Array<{
      pattern: string[];
      description: string;
      confidence: number;
      examples: string[];
    }> = [];

    // Simple sequence detection - look for repeating 2-3 item patterns
    if (data.length < 4) return sequences;

    for (let len = 2; len <= 3; len++) {
      for (let i = 0; i <= data.length - len * 2; i++) {
        const pattern = data.slice(i, i + len);
        const nextOccurrence = this.findPattern(data, pattern, i + len);
        
        if (nextOccurrence !== -1) {
          const occurrences = this.countPatternOccurrences(data, pattern);
          const confidence = Math.min(occurrences / (data.length / len), 1);
          
          if (confidence >= 0.3) {
            sequences.push({
              pattern: pattern.map(item => JSON.stringify(item).slice(0, 50)),
              description: `Sequence of ${len} items repeats ${occurrences} times`,
              confidence: Math.round(confidence * 100) / 100,
              examples: pattern.map(item => JSON.stringify(item).slice(0, 100)),
            });
          }
        }
      }
    }

    return sequences;
  }

  /**
   * Find pattern in array
   */
  private findPattern(data: any[], pattern: any[], startIndex: number): number {
    for (let i = startIndex; i <= data.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (JSON.stringify(data[i + j]) !== JSON.stringify(pattern[j])) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }

  /**
   * Count pattern occurrences
   */
  private countPatternOccurrences(data: any[], pattern: any[]): number {
    let count = 0;
    let index = 0;
    
    while (index <= data.length - pattern.length) {
      const found = this.findPattern(data, pattern, index);
      if (found !== -1) {
        count++;
        index = found + pattern.length;
      } else {
        break;
      }
    }
    
    return count;
  }

  /**
   * Detect anomalies in data
   */
  private detectAnomalies(data: any, threshold: number): Insight[] {
    const insights: Insight[] = [];

    if (Array.isArray(data) && data.length > 0) {
      // Numeric anomalies
      const numericFields = this.extractNumericFields(data);
      for (const [field, values] of Object.entries(numericFields)) {
        const anomalies = this.findNumericAnomalies(values);
        for (const anomaly of anomalies) {
          if (anomaly.confidence >= threshold) {
            insights.push({
              id: this.generateId(),
              type: 'anomaly',
              description: `Anomaly in ${field}: ${anomaly.description}`,
              confidence: anomaly.confidence,
              evidence: [anomaly.value.toString()],
              metadata: { field, statistics: anomaly.stats },
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return insights;
  }

  /**
   * Extract numeric fields from data
   */
  private extractNumericFields(data: any[]): Record<string, number[]> {
    const fields: Record<string, number[]> = {};
    
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'number') {
            if (!fields[key]) fields[key] = [];
            fields[key].push(value);
          }
        }
      }
    }

    return fields;
  }

  /**
   * Find numeric anomalies using statistical methods
   */
  private findNumericAnomalies(values: number[]): Array<{
    value: number;
    description: string;
    confidence: number;
    stats: any;
  }> {
    if (values.length < 3) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    const anomalies: Array<{
      value: number;
      description: string;
      confidence: number;
      stats: any;
    }> = [];

    for (const value of values) {
      const zScore = Math.abs((value - mean) / stdDev);
      
      // Values more than 2 standard deviations away are anomalies
      if (zScore > 2) {
        anomalies.push({
          value,
          description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(2)}`,
          confidence: Math.min(zScore / 3, 1),
          stats: { mean, stdDev, zScore: zScore.toFixed(2) },
        });
      }
    }

    return anomalies;
  }

  /**
   * Identify trends in time-series or sequential data
   */
  private identifyTrends(data: any, threshold: number): Insight[] {
    const insights: Insight[] = [];

    if (Array.isArray(data) && data.length >= 3) {
      // Numeric trends
      const numericFields = this.extractNumericFields(data);
      for (const [field, values] of Object.entries(numericFields)) {
        const trend = this.calculateTrend(values);
        if (trend && trend.confidence >= threshold) {
          insights.push({
            id: this.generateId(),
            type: 'trend',
            description: `${trend.direction} trend in ${field}: ${trend.description}`,
            confidence: trend.confidence,
            evidence: values.slice(-3).map(v => v.toString()),
            metadata: { field, slope: trend.slope, change: trend.change },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Calculate trend direction and strength
   */
  private calculateTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    description: string;
    confidence: number;
    slope: number;
    change: number;
  } | null {
    if (values.length < 3) return null;

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const change = ((values[n - 1] - values[0]) / values[0]) * 100;
    
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    const confidence = Math.min(Math.abs(slope) / 2, 1);
    
    return {
      direction,
      description: `${Math.abs(change).toFixed(1)}% ${direction === 'increasing' ? 'increase' : direction === 'decreasing' ? 'decrease' : 'change'}`,
      confidence: Math.round(confidence * 100) / 100,
      slope: Math.round(slope * 100) / 100,
      change: Math.round(change * 100) / 100,
    };
  }

  /**
   * Find relationships between data items
   */
  private findRelationships(data: any, threshold: number): Insight[] {
    const insights: Insight[] = [];

    if (Array.isArray(data) && data.length >= 2) {
      // Look for correlations between numeric fields
      const numericFields = this.extractNumericFields(data);
      const fieldNames = Object.keys(numericFields);
      
      for (let i = 0; i < fieldNames.length; i++) {
        for (let j = i + 1; j < fieldNames.length; j++) {
          const field1 = fieldNames[i];
          const field2 = fieldNames[j];
          const correlation = this.calculateCorrelation(
            numericFields[field1],
            numericFields[field2]
          );
          
          if (correlation && Math.abs(correlation.coefficient) >= threshold) {
            insights.push({
              id: this.generateId(),
              type: 'relationship',
              description: `${correlation.strength} ${correlation.direction} correlation between ${field1} and ${field2}`,
              confidence: Math.abs(correlation.coefficient),
              evidence: [`Correlation coefficient: ${correlation.coefficient.toFixed(3)}`],
              metadata: { field1, field2, correlation: correlation.coefficient },
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return insights;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(values1: number[], values2: number[]): {
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak';
    direction: 'positive' | 'negative';
  } | null {
    if (values1.length !== values2.length || values1.length < 3) return null;

    const n = values1.length;
    const sum1 = values1.reduce((a, b) => a + b, 0);
    const sum2 = values2.reduce((a, b) => a + b, 0);
    const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
    const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
    const sumProducts = values1.reduce((sum, val, i) => sum + val * values2[i], 0);

    const numerator = n * sumProducts - sum1 * sum2;
    const denominator = Math.sqrt(
      (n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2)
    );

    if (denominator === 0) return null;

    const coefficient = numerator / denominator;
    const absCoef = Math.abs(coefficient);
    
    const strength: 'strong' | 'moderate' | 'weak' = 
      absCoef >= 0.7 ? 'strong' : absCoef >= 0.4 ? 'moderate' : 'weak';
    
    const direction: 'positive' | 'negative' = coefficient >= 0 ? 'positive' : 'negative';

    return { coefficient, strength, direction };
  }

  /**
   * Generate unique insight ID
   */
  private generateId(): string {
    return `insight-${Date.now()}-${++this.insightCounter}`;
  }

  /**
   * Extract sources/citations from insights
   */
  private extractSourcesFromInsights(insights: Insight[]): string[] {
    const sources = new Set<string>();

    for (const insight of insights) {
      // Extract from metadata citations
      if (insight.metadata?.citations && Array.isArray(insight.metadata.citations)) {
        for (const citation of insight.metadata.citations) {
          if (typeof citation === 'string' && citation.trim().length > 0) {
            sources.add(citation.trim());
          }
        }
      }

      // Extract URLs from description and evidence
      const textToSearch = `${insight.description} ${insight.evidence.join(' ')}`;
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = textToSearch.match(urlPattern);
      if (urls) {
        urls.forEach(url => sources.add(url));
      }

      // Extract legal citations (e.g., "123 U.S. 456")
      const legalCitationPattern = /\d+\s+[A-Z][a-z.]+(?:\s+\d+)?/g;
      const citations = textToSearch.match(legalCitationPattern);
      if (citations) {
        citations.forEach(cite => {
          if (cite.length > 5) { // Filter out short matches
            sources.add(cite);
          }
        });
      }
    }

    return Array.from(sources);
  }

  /**
   * Attach source verification results to insights
   */
  private attachSourceVerificationToInsights(
    insights: Insight[],
    verificationResult: SourceVerificationResult
  ): Insight[] {
    // Create a map of sources to verification results
    const sourceMap = new Map<string, SourceVerificationResult['verifications'][0]>();
    for (const verification of verificationResult.verifications) {
      sourceMap.set(verification.source.toLowerCase(), verification);
    }

    // Attach verification to insights that reference verified sources
    return insights.map(insight => {
      const verifiedSources: Array<{
        source: string;
        accessible: boolean;
        reliable: boolean;
        reliabilityScore: number;
      }> = [];
      let hasVerifiedSource = false;

      // Check metadata citations
      if (insight.metadata?.citations && Array.isArray(insight.metadata.citations)) {
        for (const citation of insight.metadata.citations) {
          if (typeof citation === 'string') {
            const verification = sourceMap.get(citation.toLowerCase());
            if (verification) {
              verifiedSources.push({
                source: citation,
                accessible: verification.accessibility === 'accessible',
                reliable: verification.reliability === 'high' || verification.reliability === 'medium',
                reliabilityScore: verification.reliabilityScore,
              });
              hasVerifiedSource = true;
            }
          }
        }
      }

      // Check description and evidence for URLs
      const textToSearch = `${insight.description} ${insight.evidence.join(' ')}`;
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = textToSearch.match(urlPattern);
      if (urls) {
        for (const url of urls) {
          const verification = sourceMap.get(url.toLowerCase());
          if (verification && !verifiedSources.some(vs => vs.source === url)) {
            verifiedSources.push({
              source: url,
              accessible: verification.accessibility === 'accessible',
              reliable: verification.reliability === 'high' || verification.reliability === 'medium',
              reliabilityScore: verification.reliabilityScore,
            });
            hasVerifiedSource = true;
          }
        }
      }

      return {
        ...insight,
        sourceVerification: hasVerifiedSource ? {
          verified: true,
          sources: verifiedSources,
        } : undefined,
      };
    });
  }
}

export const insightProcessor = new InsightProcessor();

