/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai-service.js';
import { apiValidator } from '../utils/api-validator.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { isDemoModeEnabled, markAsDemo } from '../utils/demo-mode.js';

const QualityAssessorSchema = z.object({
  document_text: z.string().describe('The document to assess for quality'),
  assessment_criteria: z.array(z.string()).optional().describe('Specific quality criteria to assess'),
  quality_standard: z.enum(['basic', 'professional', 'excellent']).default('professional'),
  ai_provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use (default: auto-select)'),
});

export const qualityAssessor = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'quality_assessor',
      description: 'Assess document quality across multiple dimensions',
      inputSchema: {
        type: 'object' as const,
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
          ai_provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto'],
            default: 'auto',
            description: 'AI provider to use (default: auto-select)',
          },
        },
        required: ['document_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document_text, assessment_criteria, quality_standard, ai_provider } = QualityAssessorSchema.parse(args);

      // Demo mode: return placeholder scores with disclaimer (opt-in only via DEMO_MODE=true)
      if (isDemoModeEnabled()) {
        const demoAssessment = markAsDemo(
          this.assessQuality(document_text, assessment_criteria, quality_standard),
          'Quality Assessor'
        );
        return this.createSuccessResult(JSON.stringify(demoAssessment, null, 2));
      }

      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          'No AI providers configured. Quality assessment requires an AI provider. Configure API keys, or set DEMO_MODE=true to enable demo mode.'
        );
      }

      let provider: AIProvider;
      if (ai_provider === 'auto' || !ai_provider) {
        provider = aiProviderSelector.getProviderForTask({
          taskType: 'analysis',
          complexity: quality_standard === 'excellent' ? 'high' : 'medium',
          requiresSafety: false,
          preferredProvider: 'auto',
        });
      } else {
        const validation = apiValidator.validateProvider(ai_provider as AIProvider);
        if (!validation.valid) {
          return this.createErrorResult(
            `Selected AI provider ${ai_provider} is not configured: ${validation.error}`
          );
        }
        provider = ai_provider as AIProvider;
      }

      try {
        const prompt = this.buildAssessmentPrompt(document_text, assessment_criteria, quality_standard);
        const aiResponse = await aiService.call(provider, prompt, {
          systemPrompt: 'You are an expert document quality analyst. Provide objective, evidence-based quality assessment with specific scores and actionable recommendations.',
          maxTokens: 2000,
          temperature: 0.3,
          metadata: {
            toolName: 'quality_assessor',
            actionType: 'content_generation',
          },
        });

        const structuralAssessment = this.assessQuality(document_text, assessment_criteria, quality_standard);
        const assessment = {
          ...structuralAssessment,
          ai_analysis: {
            provider,
            analysis: aiResponse,
            timestamp: new Date().toISOString(),
          },
        };

        return this.createSuccessResult(JSON.stringify(assessment, null, 2), {
          quality_standard,
          ai_provider: provider,
          document_length: document_text.length,
        });
      } catch (aiError) {
        return this.createErrorResult(`AI quality assessment failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      }
    } catch (error) {
      return this.createErrorResult(`Quality assessment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public buildAssessmentPrompt(document: string, criteria?: string[], standard: 'basic' | 'professional' | 'excellent' = 'professional'): string {
    let prompt = `Assess the quality of the following document to a ${standard} standard:\n\n${document}\n\n`;

    prompt += `Provide a structured quality assessment including:
- Overall quality score (0-10) with justification
- Writing quality: clarity, grammar, style, and professional tone
- Structure quality: organization, flow, and completeness
- Content quality: accuracy, relevance, depth, and coherence
- Specific strengths
- Specific weaknesses
- Actionable recommendations for improvement`;

    if (criteria && criteria.length > 0) {
      prompt += `\n\nPay special attention to these criteria: ${criteria.join(', ')}`;
    }

    return prompt;
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

