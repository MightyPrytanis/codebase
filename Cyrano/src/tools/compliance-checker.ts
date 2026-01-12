/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai-service.js';
import { apiValidator } from '../utils/api-validator.js';

const ComplianceCheckerSchema = z.object({
  document_text: z.string().describe('The document to check for compliance'),
  regulations: z.array(z.string()).optional().describe('Specific regulations to check against'),
  jurisdiction: z.string().optional().describe('Jurisdiction for compliance'),
  industry: z.string().optional().describe('Industry-specific compliance requirements'),
});

export const complianceChecker = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'compliance_checker',
      description: 'Check documents for regulatory compliance and identify violations',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_text: {
            type: 'string',
            description: 'The document to check for compliance',
          },
          regulations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific regulations to check against',
          },
          jurisdiction: {
            type: 'string',
            description: 'Jurisdiction for compliance',
          },
          industry: {
            type: 'string',
            description: 'Industry-specific compliance requirements',
          },
        },
        required: ['document_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document_text, regulations, jurisdiction, industry } = ComplianceCheckerSchema.parse(args);
      
      // Check for available AI providers
      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          'No AI providers configured. Compliance checking requires an AI provider. Please configure API keys.'
        );
      }

      // Use first available provider (no preference - user sovereignty)
      const availableProviders = apiValidator.getAvailableProviders();
      if (availableProviders.length === 0) {
        return this.createErrorResult(
          'No AI providers configured. Compliance checking requires an AI provider. Please configure API keys.'
        );
      }
      
      // Use first available provider (neutral selection)
      // Validate that the provider is supported by AIService
      const provider = availableProviders[0];
      const supportedProviders: AIProvider[] = ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'];
      if (!supportedProviders.includes(provider as AIProvider)) {
        return this.createErrorResult(
          `Unsupported AI provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}`
        );
      }

      const compliance = await this.performRealComplianceCheck(
        document_text, 
        regulations, 
        jurisdiction, 
        industry,
        provider as AIProvider
      );
      
      return this.createSuccessResult(JSON.stringify(compliance, null, 2), {
        ai_provider: provider,
      });
    } catch (error) {
      return this.createErrorResult(`Compliance check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform real compliance check using AI
   */
  public async performRealComplianceCheck(
    document: string,
    regulations?: string[],
    jurisdiction?: string,
    industry?: string,
    provider: AIProvider = 'openai'
  ): Promise<any> {
    const prompt = this.buildCompliancePrompt(document, regulations, jurisdiction, industry);
    
    let aiResponse: string;
    try {
      aiResponse = await aiService.call(provider, prompt, {
        systemPrompt: this.getSystemPrompt(jurisdiction, industry),
        temperature: 0.3,
        maxTokens: 4000,
      });
    } catch (error) {
      // Fallback to basic analysis
      return this.checkCompliance(document, regulations, jurisdiction, industry);
    }

    const structuralCheck = this.checkCompliance(document, regulations, jurisdiction, industry);
    
    return {
      ...structuralCheck,
      ai_analysis: {
        provider: provider,
        response: aiResponse,
        violations_identified: this.extractViolations(aiResponse),
        recommendations: this.extractRecommendations(aiResponse),
        risk_assessment: this.extractRiskAssessment(aiResponse),
      },
      timestamp: new Date().toISOString(),
    };
  }

  public buildCompliancePrompt(document: string, regulations?: string[], jurisdiction?: string, industry?: string): string {
    let prompt = `Check the following document for regulatory compliance:\n\n${document}\n\n`;
    
    if (jurisdiction) {
      prompt += `Jurisdiction: ${jurisdiction}\n`;
    }
    
    if (industry) {
      prompt += `Industry: ${industry}\n`;
    }
    
    if (regulations && regulations.length > 0) {
      prompt += `\nSpecific regulations to check:\n${regulations.map(r => `- ${r}`).join('\n')}\n`;
    }
    
    prompt += `\nPlease identify:\n- Compliance violations\n- Risk level\n- Specific recommendations for compliance`;
    
    return prompt;
  }

  public getSystemPrompt(jurisdiction?: string, industry?: string): string {
    let prompt = 'You are an expert compliance analyst specializing in ';
    if (industry) prompt += `${industry} and `;
    if (jurisdiction) prompt += `${jurisdiction} regulations. `;
    else prompt += 'regulatory compliance. ';
    prompt += 'Identify compliance violations and provide specific recommendations.';
    return prompt;
  }

  public extractViolations(response: string): string[] {
    const violations: string[] = [];
    const patterns = [
      /violation[:\s]+([^\n]+)/gi,
      /non-compliance[:\s]+([^\n]+)/gi,
      /issue[:\s]+([^\n]+)/gi,
    ];
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        violations.push(...matches.map(m => m.replace(/^(?:violation|non-compliance|issue)[:\s]+/i, '').trim()));
      }
    });
    
    return violations.length > 0 ? violations : [];
  }

  public extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const patterns = [
      /recommendation[:\s]+([^\n]+)/gi,
      /should[:\s]+([^\n]+)/gi,
      /suggest[:\s]+([^\n]+)/gi,
    ];
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        recommendations.push(...matches.map(m => m.replace(/^(?:recommendation|should|suggest)[:\s]+/i, '').trim()));
      }
    });
    
    return recommendations;
  }

  public extractRiskAssessment(response: string): string {
    const riskPatterns = [
      /risk level[:\s]+([^\n]+)/i,
      /risk[:\s]+([^\n]+)/i,
    ];
    
    for (const pattern of riskPatterns) {
      const match = response.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'moderate';
  }

  public checkCompliance(document: string, regulations?: string[], jurisdiction?: string, industry?: string) {
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        jurisdiction: jurisdiction || 'not specified',
        industry: industry || 'not specified',
        regulations_checked: regulations?.length || 0,
      },
      compliance_score: this.calculateComplianceScore(document),
      violations: this.identifyViolations(document, regulations),
      recommendations: this.generateComplianceRecommendations(document),
      risk_level: this.assessRiskLevel(document),
    };
  }

  public calculateComplianceScore(document: string): number {
    const violations = this.identifyViolations(document);
    return Math.max(0, 1 - (violations.length * 0.1));
  }

  public identifyViolations(document: string, regulations?: string[]): string[] {
    const violations: string[] = [];
    
    if (this.hasDiscriminatoryLanguage(document)) {
      violations.push('Potential discriminatory language detected');
    }
    
    if (this.hasPrivacyViolations(document)) {
      violations.push('Privacy policy violations detected');
    }
    
    if (this.hasAccessibilityIssues(document)) {
      violations.push('Accessibility compliance issues detected');
    }
    
    return violations;
  }

  public generateComplianceRecommendations(document: string): string[] {
    const recommendations: string[] = [];
    
    if (this.hasDiscriminatoryLanguage(document)) {
      recommendations.push('Review and remove discriminatory language');
    }
    
    if (this.hasPrivacyViolations(document)) {
      recommendations.push('Add comprehensive privacy policy');
    }
    
    return recommendations;
  }

  public assessRiskLevel(document: string): string {
    const violations = this.identifyViolations(document);
    if (violations.length === 0) return 'LOW';
    if (violations.length <= 2) return 'MEDIUM';
    return 'HIGH';
  }

  public hasDiscriminatoryLanguage(document: string): boolean {
    const discriminatoryTerms = ['discriminate', 'exclude', 'prefer', 'bias'];
    return discriminatoryTerms.some(term => document.toLowerCase().includes(term));
  }

  public hasPrivacyViolations(document: string): boolean {
    const privacyTerms = ['personal data', 'privacy', 'confidential'];
    return privacyTerms.some(term => document.toLowerCase().includes(term));
  }

  public hasAccessibilityIssues(document: string): boolean {
    return !document.toLowerCase().includes('accessibility') && 
           !document.toLowerCase().includes('ada');
  }
}();

)
}
}
}
}
}
}
}