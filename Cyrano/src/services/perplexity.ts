/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';

export interface PerplexityConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface PerplexityRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityService {
  private config: PerplexityConfig;
  private baseUrl: string;

  constructor(config: PerplexityConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.perplexity.ai';
  }

  /**
   * Make a request to Perplexity API
   */
  async makeRequest(request: PerplexityRequest): Promise<PerplexityResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json() as PerplexityResponse;
  }

  /**
   * Analyze a legal document using Perplexity
   */
  async analyzeDocument(documentText: string, analysisType: string = 'comprehensive'): Promise<string> {
    const systemPrompt = `You are a highly experienced legal AI assistant specializing in document analysis for family law and civil litigation. Your role is to identify key legal issues, assess risks, and provide actionable recommendations to attorneys.

Key responsibilities:
1. Identify unusual, significant, or unexpected elements in legal documents
2. Flag new allegations, material changes in circumstances, or risks to client interests
3. Assess procedural deadlines and compliance requirements
4. Provide specific, actionable recommendations
5. Maintain professional legal standards and ethics

Always provide analysis in a clear, structured format with specific legal insights.`;

    const userPrompt = `Analyze this legal document and provide a ${analysisType} analysis:

${documentText}

Please provide:
1. Key legal issues and implications
2. Contractual obligations and rights
3. Potential risks and liabilities
4. Compliance considerations
5. Specific recommendations for the attorney

Format your response in a clear, professional manner suitable for legal practice.`;

    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    };

    const response = await this.makeRequest(request);
    return response.choices[0].message.content;
  }

  /**
   * Compare legal documents using Perplexity
   */
  async compareDocuments(documents: Array<{ text: string; title: string }>): Promise<string> {
    const systemPrompt = `You are a legal document comparison specialist. Your role is to analyze multiple legal documents and identify similarities, differences, and potential conflicts or inconsistencies.

Key responsibilities:
1. Identify overlapping provisions and terms
2. Highlight conflicting clauses or requirements
3. Assess consistency in legal language and intent
4. Identify potential risks from inconsistencies
5. Provide recommendations for resolution

Always provide analysis in a clear, structured format with specific legal insights.`;

    const documentList = documents.map((doc, index) => 
      `Document ${index + 1}: ${doc.title}\n${doc.text}\n`
    ).join('\n---\n');

    const userPrompt = `Compare these legal documents and provide a comprehensive analysis:

${documentList}

Please provide:
1. Summary of each document's key provisions
2. Identified similarities and differences
3. Potential conflicts or inconsistencies
4. Risk assessment for each conflict
5. Recommendations for resolution

Format your response in a clear, professional manner suitable for legal practice.`;

    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    };

    const response = await this.makeRequest(request);
    return response.choices[0].message.content;
  }

  /**
   * Generate GoodCounsel insights using Perplexity
   */
  async generateGoodCounselInsights(attorneyData: any): Promise<string> {
    const systemPrompt = `You are GoodCounsel, a supportive AI assistant designed to help attorneys with wellness, professional development, and work-life balance. Your role is to provide insights, encouragement, and practical recommendations.

Key principles:
1. Always be supportive and non-judgmental
2. Focus on growth opportunities, not failures
3. Provide practical, actionable advice
4. Maintain professional boundaries
5. Encourage healthy work practices

Use warm, encouraging language that affirms the attorney's value and work.`;

    const userPrompt = `Based on this attorney's profile and work patterns, provide supportive insights and recommendations:

Attorney Profile:
${JSON.stringify(attorneyData, null, 2)}

Please provide:
1. Positive observations about their work patterns
2. Gentle suggestions for improvement
3. Wellness and work-life balance recommendations
4. Professional development opportunities
5. Encouragement and affirmation

Remember: GoodCounsel is about support, not criticism. Frame everything positively and constructively.`;

    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    };

    const response = await this.makeRequest(request);
    return response.choices[0].message.content;
  }

  /**
   * Fact check content using Perplexity
   */
  async factCheck(content: string, sources?: string[]): Promise<string> {
    const systemPrompt = `You are a legal fact-checking specialist. Your role is to verify legal claims, check citations, and identify potential inaccuracies in legal content.

Key responsibilities:
1. Verify legal citations and references
2. Check factual claims against known legal principles
3. Identify potential misstatements of law
4. Assess the accuracy of procedural information
5. Provide confidence levels for your assessments

Always provide analysis in a clear, professional manner with specific legal insights.`;

    const userPrompt = `Fact-check this legal content and verify its accuracy:

${content}

${sources && sources.length > 0 ? `Additional sources to consider: ${sources.join(', ')}` : ''}

Please provide:
1. Verification of legal citations and references
2. Assessment of factual claims
3. Identification of any inaccuracies
4. Confidence levels for your assessments
5. Recommendations for corrections if needed

Format your response in a clear, professional manner suitable for legal practice.`;

    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.2
    };

    const response = await this.makeRequest(request);
    return response.choices[0].message.content;
  }

  /**
   * Legal review using Perplexity
   */
  async legalReview(documentText: string, documentType: string): Promise<string> {
    const systemPrompt = `You are a senior legal reviewer specializing in ${documentType} documents. Your role is to provide comprehensive legal review and analysis.

Key responsibilities:
1. Identify legal issues and potential problems
2. Assess compliance with relevant laws and regulations
3. Evaluate the strength of legal arguments
4. Identify missing elements or provisions
5. Provide recommendations for improvement

Always provide analysis in a clear, professional manner with specific legal insights.`;

    const userPrompt = `Review this ${documentType} document and provide a comprehensive legal analysis:

${documentText}

Please provide:
1. Summary of key legal issues
2. Assessment of legal strength and weaknesses
3. Compliance considerations
4. Missing elements or provisions
5. Specific recommendations for improvement

Format your response in a clear, professional manner suitable for legal practice.`;

    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    };

    const response = await this.makeRequest(request);
    return response.choices[0].message.content;
  }

  /**
   * Check health of Perplexity service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const request: PerplexityRequest = {
        model: 'sonar',
        messages: [
          { role: 'user', content: 'Hello, this is a health check.' }
        ],
        max_tokens: 10
      };

      await this.makeRequest(request);
      return true;
    } catch (error) {
      console.error('Perplexity health check failed:', error);
      return false;
    }
  }
}




