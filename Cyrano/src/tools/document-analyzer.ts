/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PerplexityService } from '../services/perplexity.js';
import { apiValidator } from '../utils/api-validator.js';

const DocumentAnalyzerSchema = z.object({
  document_text: z.string().describe('The legal document text to analyze'),
  analysis_type: z.enum(['comprehensive', 'summary', 'key_points', 'metadata']).default('comprehensive'),
  focus_areas: z.array(z.string()).optional().describe('Specific areas to focus analysis on'),
});

export const documentAnalyzer = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'document_analyzer',
      description: 'Analyze legal documents to extract key information, metadata, and insights',
      inputSchema: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The legal document text to analyze',
          },
          analysis_type: {
            type: 'string',
            enum: ['comprehensive', 'summary', 'key_points', 'metadata'],
            default: 'comprehensive',
            description: 'Type of analysis to perform',
          },
          focus_areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific areas to focus analysis on',
          },
        },
        required: ['document_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document_text, analysis_type, focus_areas } = DocumentAnalyzerSchema.parse(args);

      // Check for Perplexity API key first (preferred)
      const perplexityKey = process.env.PERPLEXITY_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!perplexityKey && !anthropicKey && !openaiKey) {
        return this.createErrorResult('No AI API keys configured. Please set PERPLEXITY_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY environment variables.');
      }

      // Use Perplexity as primary (as requested), fallback to others
      let analysis;
      let provider = 'unknown';
      
      try {
        if (perplexityKey) {
          const perplexityService = new PerplexityService({ apiKey: perplexityKey });
          const aiResponse = await perplexityService.analyzeDocument(document_text, analysis_type);
          analysis = this.parsePerplexityResponse(aiResponse, document_text, analysis_type, focus_areas);
          provider = 'perplexity';
        } else if (anthropicKey) {
          analysis = await this.performRealAnalysis(document_text, analysis_type, focus_areas, 'anthropic');
          provider = 'anthropic';
        } else if (openaiKey) {
          analysis = await this.performRealAnalysis(document_text, analysis_type, focus_areas, 'openai');
          provider = 'openai';
        }
      } catch (aiError) {
        return this.createErrorResult(`AI analysis failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      }

      return this.createSuccessResult(JSON.stringify(analysis, null, 2), {
        analysis_type,
        word_count: document_text.split(' ').length,
        focus_areas: focus_areas || [],
        ai_provider: provider,
      });
    } catch (error) {
      return this.createErrorResult(`Document analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async performRealAnalysis(documentText: string, analysisType: string, focusAreas: string[] | undefined, provider: 'openai' | 'anthropic') {
    const wordCount = documentText.split(' ').length;
    const paragraphCount = documentText.split('\n\n').length;

    // Create analysis prompt based on type
    const prompt = this.buildAnalysisPrompt(documentText, analysisType, focusAreas);

    // Get AI response
    const aiResponse = await this.callAIProvider(prompt, provider);

    // Parse and structure the response
    const analysis = {
      metadata: {
        word_count: wordCount,
        paragraph_count: paragraphCount,
        analysis_type: analysisType,
        timestamp: new Date().toISOString(),
        ai_provider: provider,
      },
      ai_analysis: aiResponse,
      key_points: this.extractKeyPoints(aiResponse),
      summary: this.generateSummary(aiResponse),
      legal_elements: this.identifyLegalElements(documentText), // Keep basic extraction for document
      recommendations: this.generateRecommendations(aiResponse),
      focused_analysis: focusAreas ? await this.performFocusedAnalysis(documentText, focusAreas, provider) : undefined,
    };

    return analysis;
  }

  public buildAnalysisPrompt(documentText: string, analysisType: string, focusAreas?: string[]): string {
    let prompt = `Analyze this legal document and provide a ${analysisType} analysis:\n\n${documentText}\n\n`;

    switch (analysisType) {
      case 'comprehensive':
        prompt += `Provide a comprehensive legal analysis including:
- Key legal issues and implications
- Contractual obligations and rights
- Potential risks and liabilities
- Compliance considerations
- Recommendations for the client`;
        break;
      case 'summary':
        prompt += 'Provide a concise summary of the main legal points and implications.';
        break;
      case 'key_points':
        prompt += 'Extract and list the most important legal points, obligations, and provisions.';
        break;
      case 'metadata':
        prompt += 'Extract metadata including parties, dates, jurisdiction, and key legal concepts.';
        break;
    }

    if (focusAreas && focusAreas.length > 0) {
      prompt += `\n\nFocus areas: ${focusAreas.join(', ')}`;
    }

    return prompt;
  }

  public async callAIProvider(prompt: string, provider: 'openai' | 'anthropic'): Promise<string> {
    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : 'Analysis failed';
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: prompt,
        }],
        max_tokens: 4000,
      });

      return response.choices[0].message.content || 'Analysis failed';
    }
  }

  public extractKeyPoints(text: string): string[] {
    // Simple key point extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  public generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  public identifyLegalElements(text: string): string[] {
    const legalTerms = [
      'contract', 'agreement', 'liability', 'damages', 'breach', 'warranty',
      'indemnification', 'jurisdiction', 'governing law', 'force majeure',
      'termination', 'remedy', 'arbitration', 'mediation'
    ];
    
    return legalTerms.filter(term => 
      text.toLowerCase().includes(term)
    );
  }

  public generateRecommendations(text: string): string[] {
    return [
      'Review for completeness of legal terms',
      'Verify jurisdiction and governing law clauses',
      'Check for potential liability issues',
      'Ensure proper termination and remedy provisions'
    ];
  }

  public async performFocusedAnalysis(text: string, focusAreas: string[], provider: 'openai' | 'anthropic'): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const area of focusAreas) {
      switch (area.toLowerCase()) {
        case 'contracts':
          result.contracts = await this.analyzeWithAI(text, 'contracts', provider);
          break;
        case 'liability':
          result.liability = await this.analyzeWithAI(text, 'liability', provider);
          break;
        case 'compliance':
          result.compliance = await this.analyzeWithAI(text, 'compliance', provider);
          break;
        default:
          result[area] = `Analysis for ${area} not implemented`;
      }
    }
    
    return result;
  }

  public async analyzeWithAI(text: string, focusArea: string, provider: 'openai' | 'anthropic'): Promise<any> {
    const prompt = `Analyze this legal document focusing specifically on ${focusArea}:

${text}

Provide a detailed analysis of ${focusArea} aspects, including key findings, potential issues, and recommendations.`;

    return await this.callAIProvider(prompt, provider);
  }

  public analyzeContracts(text: string): any {
    return {
      contract_indicators: (text.match(/contract|agreement|terms|conditions/gi) || []).length,
      parties_mentioned: this.extractParties(text),
      key_provisions: this.extractKeyProvisions(text),
    };
  }

  public analyzeLiability(text: string): any {
    return {
      liability_mentions: (text.match(/liability|damages|breach|negligence/gi) || []).length,
      risk_factors: this.identifyRiskFactors(text),
      protection_clauses: this.identifyProtectionClauses(text),
    };
  }

  public analyzeCompliance(text: string): any {
    return {
      regulatory_mentions: (text.match(/compliance|regulation|statute|law/gi) || []).length,
      required_elements: this.identifyRequiredElements(text),
      compliance_risks: this.identifyComplianceRisks(text),
    };
  }

  public extractParties(text: string): string[] {
    const partyPattern = /(?:party|parties|between|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const matches = text.match(partyPattern) || [];
    return matches.map(match => match.replace(/(?:party|parties|between|and)\s+/i, '').trim());
  }

  public extractKeyProvisions(text: string): string[] {
    const provisionPattern = /(?:section|clause|provision|term)\s+\d+[:\-\.]?\s*([^.!?]+)/gi;
    const matches = text.match(provisionPattern) || [];
    return matches.map(match => match.replace(/(?:section|clause|provision|term)\s+\d+[:\-\.]?\s*/i, '').trim());
  }

  public identifyRiskFactors(text: string): string[] {
    const riskTerms = ['risk', 'hazard', 'danger', 'exposure', 'vulnerability'];
    return riskTerms.filter(term => text.toLowerCase().includes(term));
  }

  public identifyProtectionClauses(text: string): string[] {
    const protectionTerms = ['indemnification', 'hold harmless', 'limitation of liability', 'disclaimer'];
    return protectionTerms.filter(term => text.toLowerCase().includes(term));
  }

  public identifyRequiredElements(text: string): string[] {
    const requiredTerms = ['required', 'must', 'shall', 'obligation', 'duty'];
    return requiredTerms.filter(term => text.toLowerCase().includes(term));
  }

  public identifyComplianceRisks(text: string): string[] {
    const riskTerms = ['non-compliance', 'violation', 'penalty', 'fine', 'sanction'];
    return riskTerms.filter(term => text.toLowerCase().includes(term));
  }

  public parsePerplexityResponse(aiResponse: string, documentText: string, analysisType: string, focusAreas?: string[]): any {
    const wordCount = documentText.split(' ').length;
    const paragraphCount = documentText.split('\n\n').length;

    return {
      metadata: {
        word_count: wordCount,
        paragraph_count: paragraphCount,
        analysis_type: analysisType,
        timestamp: new Date().toISOString(),
        ai_provider: 'perplexity',
      },
      ai_analysis: aiResponse,
      key_points: this.extractKeyPoints(aiResponse),
      summary: this.generateSummary(aiResponse),
      legal_elements: this.identifyLegalElements(documentText),
      recommendations: this.generateRecommendations(aiResponse),
      focused_analysis: focusAreas ? this.performFocusedAnalysisFromResponse(aiResponse, focusAreas) : undefined,
    };
  }

  public performFocusedAnalysisFromResponse(aiResponse: string, focusAreas: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const area of focusAreas) {
      switch (area.toLowerCase()) {
        case 'contracts':
          result.contracts = this.extractContractAnalysis(aiResponse);
          break;
        case 'liability':
          result.liability = this.extractLiabilityAnalysis(aiResponse);
          break;
        case 'compliance':
          result.compliance = this.extractComplianceAnalysis(aiResponse);
          break;
        default:
          result[area] = `Analysis for ${area} extracted from Perplexity response`;
      }
    }
    
    return result;
  }

  public extractContractAnalysis(response: string): any {
    const contractKeywords = ['contract', 'agreement', 'terms', 'conditions', 'provisions'];
    const contractMentions = contractKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    return {
      contract_indicators: contractMentions.length,
      key_provisions: this.extractKeyProvisions(response),
      parties_mentioned: this.extractParties(response),
    };
  }

  public extractLiabilityAnalysis(response: string): any {
    const liabilityKeywords = ['liability', 'damages', 'breach', 'negligence', 'risk'];
    const liabilityMentions = liabilityKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    return {
      liability_mentions: liabilityMentions.length,
      risk_factors: this.identifyRiskFactors(response),
      protection_clauses: this.identifyProtectionClauses(response),
    };
  }

  public extractComplianceAnalysis(response: string): any {
    const complianceKeywords = ['compliance', 'regulation', 'statute', 'law', 'requirement'];
    const complianceMentions = complianceKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    return {
      compliance_mentions: complianceMentions.length,
      required_elements: this.identifyRequiredElements(response),
      compliance_risks: this.identifyComplianceRisks(response),
    };
  }
})();
