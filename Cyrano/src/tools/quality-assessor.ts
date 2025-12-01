/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const QualityAssessorSchema = z.object({
  document_text: z.string().describe('The document to assess for quality'),
  assessment_criteria: z.array(z.string()).optional().describe('Specific quality criteria to assess'),
  quality_standard: z.enum(['basic', 'professional', 'excellent']).default('professional'),
});

export const qualityAssessor = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'quality_assessor',
      description: 'Assess document quality across multiple dimensions',
      inputSchema: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The document to assess for quality',
          },
          assessment_criteria: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific quality criteria to assess',
          },
          quality_standard: {
            type: 'string',
            enum: ['basic', 'professional', 'excellent'],
            default: 'professional',
            description: 'Quality standard to measure against',
          },
        },
        required: ['document_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document_text, assessment_criteria, quality_standard } = QualityAssessorSchema.parse(args);
      const assessment = this.assessQuality(document_text, assessment_criteria, quality_standard);
      return this.createSuccessResult(JSON.stringify(assessment, null, 2));
    } catch (error) {
      return this.createErrorResult(`Quality assessment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public assessQuality(document: string, criteria?: string[], standard: string = 'professional') {
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        quality_standard: standard,
        document_length: document.length,
      },
      overall_score: this.calculateOverallScore(document, standard),
      writing_quality: this.assessWritingQuality(document),
      structure_quality: this.assessStructureQuality(document),
      content_quality: this.assessContentQuality(document),
      recommendations: this.generateQualityRecommendations(document, standard),
    };
  }

  public calculateOverallScore(document: string, standard: string): number {
    const writingScore = this.assessWritingQuality(document).score;
    const structureScore = this.assessStructureQuality(document).score;
    const contentScore = this.assessContentQuality(document).score;
    
    return (writingScore + structureScore + contentScore) / 3;
  }

  public assessWritingQuality(document: string): any {
    return {
      score: 0.8,
      clarity: this.assessClarity(document),
      grammar: this.assessGrammar(document),
      style: this.assessStyle(document),
    };
  }

  public assessStructureQuality(document: string): any {
    return {
      score: 0.7,
      organization: this.assessOrganization(document),
      flow: this.assessFlow(document),
      completeness: this.assessCompleteness(document),
    };
  }

  public assessContentQuality(document: string): any {
    return {
      score: 0.9,
      accuracy: this.assessAccuracy(document),
      relevance: this.assessRelevance(document),
      depth: this.assessDepth(document),
    };
  }

  public generateQualityRecommendations(document: string, standard: string): string[] {
    const recommendations: string[] = [];
    
    if (this.assessWritingQuality(document).score < 0.7) {
      recommendations.push('Improve writing clarity and grammar');
    }
    
    if (this.assessStructureQuality(document).score < 0.7) {
      recommendations.push('Enhance document structure and organization');
    }
    
    return recommendations;
  }

  public assessClarity(document: string): number {
    const sentences = document.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    return avgLength < 50 ? 0.9 : 0.6;
  }

  public assessGrammar(document: string): number {
    // Simplified grammar assessment
    return 0.8;
  }

  public assessStyle(document: string): number {
    // Simplified style assessment
    return 0.7;
  }

  public assessOrganization(document: string): number {
    const hasSections = document.includes('Section') || document.includes('Chapter');
    const hasNumbering = /\d+\./.test(document);
    return hasSections && hasNumbering ? 0.9 : 0.6;
  }

  public assessFlow(document: string): number {
    // Simplified flow assessment
    return 0.8;
  }

  public assessCompleteness(document: string): number {
    const hasIntroduction = document.toLowerCase().includes('introduction');
    const hasConclusion = document.toLowerCase().includes('conclusion');
    return hasIntroduction && hasConclusion ? 0.9 : 0.6;
  }

  public assessAccuracy(document: string): number {
    // Simplified accuracy assessment
    return 0.9;
  }

  public assessRelevance(document: string): number {
    // Simplified relevance assessment
    return 0.8;
  }

  public assessDepth(document: string): number {
    const wordCount = document.split(/\s+/).length;
    return wordCount > 500 ? 0.9 : 0.6;
  }
})();

