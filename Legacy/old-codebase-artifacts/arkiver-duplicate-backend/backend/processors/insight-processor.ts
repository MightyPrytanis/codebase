/**
 * Insight Processor
 * Extracts insights, patterns, and key findings from processed data
 */

import { z } from 'zod';

export const InsightProcessorSchema = z.object({
  data: z.any(),
  type: z.enum(['claims', 'patterns', 'anomalies', 'trends', 'relationships']),
  context: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.5), // Confidence threshold
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
}

export interface InsightProcessorOutput {
  insights: Insight[];
  summary: {
    total: number;
    byType: Record<string, number>;
    highConfidence: number;
  };
  metadata: {
    processingTime: number;
    dataSize: number;
    threshold: number;
  };
}

export class InsightProcessor {
  private insightCounter = 0;

  /**
   * Process data and extract insights
   */
  async process(input: InsightProcessorInput): Promise<InsightProcessorOutput> {
    const startTime = Date.now();
    const validated = InsightProcessorSchema.parse(input);
    
    let insights: Insight[] = [];
    
    switch (validated.type) {
      case 'claims':
        insights = this.extractClaims(validated.data, validated.threshold);
        break;
      case 'patterns':
        insights = this.detectPatterns(validated.data, validated.threshold);
        break;
      case 'anomalies':
        insights = this.detectAnomalies(validated.data, validated.threshold);
        break;
      case 'trends':
        insights = this.identifyTrends(validated.data, validated.threshold);
        break;
      case 'relationships':
        insights = this.findRelationships(validated.data, validated.threshold);
        break;
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
      metadata: {
        processingTime,
        dataSize: JSON.stringify(validated.data).length,
        threshold: validated.threshold,
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
   * Extract claims from text using pattern matching
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
}

export const insightProcessor = new InsightProcessor();

}
}
}
}
}
}
}
}
}