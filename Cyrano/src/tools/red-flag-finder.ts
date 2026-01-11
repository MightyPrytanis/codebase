/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { PerplexityService } from '../services/perplexity.js';
import { apiValidator } from '../utils/api-validator.js';
import { AIService, AIProvider } from '../services/ai-service.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { alertGenerator } from '../engines/potemkin/tools/alert-generator.js';

const RedFlagFinderSchema = z.object({
  action: z.enum(['scan_documents', 'scan_emails', 'scan_court_notices', 'scan_case_law', 'get_red_flags', 'analyze_urgency']).describe('Action to perform'),
  content: z.string().optional().describe('Content to analyze for red flags'),
  case_id: z.string().optional().describe('Case ID to scan for red flags'),
  document_type: z.enum(['motion', 'notice', 'email', 'pleading', 'order', 'other']).optional().describe('Type of document being analyzed'),
  urgency_threshold: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Minimum urgency level to flag'),
  ai_provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use (default: auto-select, prefers Perplexity for real-time data)'),
});

export const redFlagFinder = new (class extends BaseTool {
  public redFlags: Map<string, any[]> = new Map();

  getToolDefinition() {
    return {
      name: 'red_flag_finder',
      description: 'Scan documents, emails, court notices, and case law for urgent legal matters requiring immediate attention',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['scan_documents', 'scan_emails', 'scan_court_notices', 'scan_case_law', 'get_red_flags', 'analyze_urgency'],
            description: 'Action to perform',
          },
          content: {
            type: 'string',
            description: 'Content to analyze for red flags',
          },
          case_id: {
            type: 'string',
            description: 'Case ID to scan for red flags',
          },
          document_type: {
            type: 'string',
            enum: ['motion', 'notice', 'email', 'pleading', 'order', 'other'],
            description: 'Type of document being analyzed',
          },
          urgency_threshold: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            description: 'Minimum urgency level to flag',
          },
          ai_provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto'],
            default: 'auto',
            description: 'AI provider to use (default: auto-select, prefers Perplexity for real-time data)',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, content, case_id, document_type, urgency_threshold, ai_provider } = RedFlagFinderSchema.parse(args);

      switch (action) {
        case 'scan_documents':
          return await this.scanDocuments(content || '', document_type, urgency_threshold, ai_provider);
        case 'scan_emails':
          return await this.scanEmails(content || '', urgency_threshold, ai_provider);
        case 'scan_court_notices':
          return await this.scanCourtNotices(content || '', urgency_threshold, ai_provider);
        case 'scan_case_law':
          return await this.scanCaseLaw(content || '', urgency_threshold, ai_provider);
        case 'get_red_flags':
          return await this.getRedFlags(case_id);
        case 'analyze_urgency':
          return await this.analyzeUrgency(content || '', document_type, ai_provider);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(`Red flag detection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async scanDocuments(content: string, documentType?: string, urgencyThreshold: string = 'medium', aiProvider?: string) {
    if (!content.trim()) {
      return this.createErrorResult('No content provided for analysis');
    }

    if (!apiValidator.hasAnyValidProviders()) {
      return this.createErrorResult('No AI API keys configured for red flag analysis');
    }

    // Resolve provider (handle 'auto' mode with user sovereignty)
    let provider: AIProvider;
    if (aiProvider === 'auto' || !aiProvider) {
      // Use auto-select - red flag analysis benefits from real-time data
      provider = aiProviderSelector.getProviderForTask({
        taskType: 'red_flag_analysis',
        requiresRealTimeData: true,
        preferredProvider: 'auto',
        balanceQualitySpeed: 'balanced',
      });
    } else {
      // User explicitly selected a provider (user sovereignty)
      const validation = apiValidator.validateProvider(aiProvider as AIProvider);
      if (!validation.valid) {
        return this.createErrorResult(
          `Selected AI provider ${aiProvider} is not configured: ${validation.error}`
        );
      }
      provider = aiProvider as AIProvider;
    }

    try {
      const analysis = await this.performRedFlagAnalysis(content, documentType, urgencyThreshold, provider);

      // Store red flags for retrieval
      const caseId = this.extractCaseId(content) || 'unknown';
      if (!this.redFlags.has(caseId)) {
        this.redFlags.set(caseId, []);
      }
      
      if (analysis.red_flags && analysis.red_flags.length > 0) {
        this.redFlags.get(caseId)!.push(...analysis.red_flags);
        
        // Generate alerts for critical/high urgency red flags using Potemkin's alert_generator
        const criticalFlags = analysis.red_flags.filter((flag: any) => 
          flag.urgency === 'critical' || flag.urgency === 'high' || flag.severity === 'critical' || flag.severity === 'high'
        );
        
        if (criticalFlags.length > 0) {
          try {
            for (const flag of criticalFlags) {
              await alertGenerator.execute({
                alert: {
                  id: `red_flag_${Date.now()}_${flag.id || Math.random()}`,
                  type: 'red_flag',
                  severity: flag.severity || flag.urgency || 'high',
                  title: flag.title || flag.description?.substring(0, 100) || 'Red Flag Detected',
                  description: flag.description || flag.details || 'Red flag requiring immediate attention',
                  test: {
                    id: `red_flag_test_${flag.id || Date.now()}`,
                    testName: 'Red Flag Detection',
                    testType: 'red_flag',
                    targetLLM: 'red_flag_finder',
                  },
                },
                userConfig: {
                  notification_method: flag.urgency === 'critical' ? 'both' : 'email',
                  email: undefined, // Will use default from user config
                },
                existingAlerts: [],
              });
            }
          } catch (error) {
            // Log but don't fail - alert generation is supplementary
            console.warn('Failed to generate alerts for red flags:', error instanceof Error ? error.message : String(error));
          }
        }
      }

      return this.createSuccessResult(JSON.stringify(analysis, null, 2), {
        document_type: documentType,
        urgency_threshold: urgencyThreshold,
        ai_provider: provider,
        red_flags_found: analysis.red_flags?.length || 0,
      });
    } catch (aiError) {
      return this.createErrorResult(`AI analysis failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
    }
  }

  public async scanEmails(content: string, urgencyThreshold: string = 'medium', aiProvider?: string) {
    return await this.scanDocuments(content, 'email', urgencyThreshold, aiProvider);
  }

  public async scanCourtNotices(content: string, urgencyThreshold: string = 'medium', aiProvider?: string) {
    return await this.scanDocuments(content, 'notice', urgencyThreshold, aiProvider);
  }

  public async scanCaseLaw(content: string, urgencyThreshold: string = 'medium', aiProvider?: string) {
    return await this.scanDocuments(content, 'other', urgencyThreshold, aiProvider);
  }

  public async getRedFlags(caseId?: string) {
    if (caseId) {
      const flags = this.redFlags.get(caseId) || [];
      return this.createSuccessResult(JSON.stringify({
        case_id: caseId,
        red_flags: flags,
        total_count: flags.length,
        critical_count: flags.filter(f => f.urgency === 'critical').length,
        high_count: flags.filter(f => f.urgency === 'high').length,
      }, null, 2));
    } else {
      // Return all red flags across all cases
      const allFlags = Array.from(this.redFlags.entries()).map(([caseId, flags]) => ({
        case_id: caseId,
        flags: flags,
        count: flags.length,
      }));
      
      return this.createSuccessResult(JSON.stringify({
        all_cases: allFlags,
        total_flags: allFlags.reduce((sum, caseData) => sum + caseData.count, 0),
      }, null, 2));
    }
  }

  public async analyzeUrgency(content: string, documentType?: string, aiProvider?: string) {
    const urgencyKeywords = {
      critical: [
        'emergency', 'urgent', 'immediate', 'asap', 'stat', 'expedited',
        'temporary restraining order', 'tro', 'injunction', 'sanctions',
        'contempt', 'deadline today', 'due today', 'filing deadline',
        'hearing today', 'trial today', 'response due today'
      ],
      high: [
        'deadline', 'due', 'hearing', 'trial', 'motion', 'response required',
        'objection', 'appeal', 'filing', 'discovery', 'deposition',
        'mediation', 'settlement conference', 'status conference'
      ],
      medium: [
        'review', 'consider', 'evaluate', 'assess', 'analyze',
        'preparation', 'draft', 'prepare', 'develop'
      ],
      low: [
        'information', 'update', 'status', 'progress', 'routine',
        'administrative', 'clerical', 'filing', 'record keeping'
      ]
    };

    const contentLower = content.toLowerCase();
    let maxUrgency = 'low';
    let urgencyScore = 0;

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      const matches = keywords.filter(keyword => contentLower.includes(keyword));
      if (matches.length > 0) {
        const levelScore = this.getUrgencyScore(level);
        if (levelScore > urgencyScore) {
          urgencyScore = levelScore;
          maxUrgency = level;
        }
      }
    }

    // Additional context-based urgency detection
    if (documentType === 'motion' && contentLower.includes('emergency')) {
      maxUrgency = 'critical';
    } else if (documentType === 'notice' && contentLower.includes('hearing')) {
      maxUrgency = 'high';
    } else if (documentType === 'email' && contentLower.includes('urgent')) {
      maxUrgency = 'high';
    }

    return this.createSuccessResult(JSON.stringify({
      urgency_level: maxUrgency,
      urgency_score: urgencyScore,
      document_type: documentType,
      analysis_timestamp: new Date().toISOString(),
      detected_keywords: this.extractDetectedKeywords(content, urgencyKeywords),
    }, null, 2));
  }

  public buildRedFlagPrompt(content: string, documentType?: string, urgencyThreshold: string = 'medium') {
    let prompt = `Analyze this legal document for red flags and urgent matters requiring immediate attention:\n\n${content}\n\n`;

    if (documentType) {
      prompt += `Document Type: ${documentType}\n`;
    }

    prompt += `Minimum Urgency Threshold: ${urgencyThreshold}\n\n`;

    prompt += `Look for:
1. EMERGENCY MOTIONS (TRO, injunctions, expedited hearings)
2. DEADLINES (especially same-day or next-day deadlines)
3. SANCTIONS or CONTEMPT proceedings
4. FRAUD allegations or serious misconduct
5. COURT ORDERS requiring immediate compliance
6. HEARINGS scheduled with short notice
7. DISCOVERY violations or disputes
8. SETTLEMENT demands with tight deadlines
9. APPEAL deadlines
10. Any other matters requiring immediate legal attention

For each red flag found, provide:
- Description of the issue
- Urgency level (critical, high, medium, low)
- Recommended action
- Deadline (if applicable)
- Potential consequences if not addressed

Format the response as JSON with a "red_flags" array containing objects with: description, urgency, recommended_action, deadline, consequences, and source_text.`;

    return prompt;
  }

  public parseRedFlagResponse(aiResponse: string, content: string, documentType?: string, urgencyThreshold: string = 'medium') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      return {
        document_type: documentType,
        urgency_threshold: urgencyThreshold,
        red_flags: parsed.red_flags || [],
        analysis_summary: parsed.analysis_summary || 'Red flag analysis completed',
        timestamp: new Date().toISOString(),
        ai_response: aiResponse,
      };
    } catch {
      // Fallback to text parsing
      const redFlags = this.extractRedFlagsFromText(aiResponse);
      return {
        document_type: documentType,
        urgency_threshold: urgencyThreshold,
        red_flags: redFlags,
        analysis_summary: 'Red flag analysis completed via text parsing',
        timestamp: new Date().toISOString(),
        ai_response: aiResponse,
      };
    }
  }

  public extractRedFlagsFromText(text: string): Array<{
    description: string;
    urgency: string;
    recommended_action: string;
    deadline: string | null;
    consequences: string;
    source_text: string;
  }> {
    const flags: Array<{
      description: string;
      urgency: string;
      recommended_action: string;
      deadline: string | null;
      consequences: string;
      source_text: string;
    }> = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.toLowerCase().includes('red flag') || 
          line.toLowerCase().includes('urgent') ||
          line.toLowerCase().includes('deadline') ||
          line.toLowerCase().includes('emergency')) {
        flags.push({
          description: line.trim(),
          urgency: this.determineUrgencyFromText(line),
          recommended_action: 'Review immediately',
          deadline: this.extractDeadlineFromText(line),
          consequences: 'Potential legal consequences if not addressed',
          source_text: line.trim(),
        });
      }
    }
    
    return flags;
  }

  public determineUrgencyFromText(text: string): string {
    const textLower = text.toLowerCase();
    if (textLower.includes('critical') || textLower.includes('emergency') || textLower.includes('immediate')) {
      return 'critical';
    } else if (textLower.includes('urgent') || textLower.includes('deadline') || textLower.includes('hearing')) {
      return 'high';
    } else if (textLower.includes('important') || textLower.includes('review')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  public extractDeadlineFromText(text: string): string | null {
    const deadlinePatterns = [
      /due\s+(?:on\s+)?([a-zA-Z0-9\s,]+)/i,
      /deadline[:\s]+([a-zA-Z0-9\s,]+)/i,
      /by\s+([a-zA-Z0-9\s,]+)/i,
      /before\s+([a-zA-Z0-9\s,]+)/i,
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  public async performRedFlagAnalysis(content: string, documentType: string | undefined, urgencyThreshold: string, provider: AIProvider = 'perplexity') {
    const prompt = this.buildRedFlagPrompt(content, documentType, urgencyThreshold);
    const aiService = new AIService();
    
    try {
      // Prefer Perplexity for web search capabilities, fallback to others
      let aiProvider: 'perplexity' | 'openai' | 'anthropic' = 'perplexity';
      if (provider === 'anthropic' || provider === 'openai') {
        aiProvider = provider;
      }
      
      // Try to get first available provider
      const validation = apiValidator.validateProvider(aiProvider);
      if (!validation.valid) {
        // Try fallbacks
        if (apiValidator.validateProvider('openai').valid) {
          aiProvider = 'openai';
        } else if (apiValidator.validateProvider('anthropic').valid) {
          aiProvider = 'anthropic';
        } else {
          throw new Error('No AI provider available');
        }
      }
      
      const aiResponse = await aiService.call(aiProvider, prompt, {
        maxTokens: 2000,
        temperature: 0.3,
      });
      
      const parsed = this.parseRedFlagResponse(aiResponse, content, documentType, urgencyThreshold);
      return {
        ...parsed,
        ai_provider: aiProvider,
      };
    } catch (error) {
      // Fallback to basic analysis if AI call fails
      console.warn('AI red flag analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
      return {
        document_type: documentType,
        urgency_threshold: urgencyThreshold,
        red_flags: this.extractRedFlagsFromText(content),
        analysis_summary: 'Red flag analysis completed (fallback mode)',
        timestamp: new Date().toISOString(),
        ai_provider: 'fallback',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public extractCaseId(content: string): string | null {
    const caseIdPatterns = [
      /case\s+(?:no\.?|number)[:\s]+([a-zA-Z0-9-]+)/i,
      /docket\s+(?:no\.?|number)[:\s]+([a-zA-Z0-9-]+)/i,
      /file\s+(?:no\.?|number)[:\s]+([a-zA-Z0-9-]+)/i,
    ];

    for (const pattern of caseIdPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  public getUrgencyScore(level: string): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[level as keyof typeof scores] || 0;
  }

  public extractDetectedKeywords(content: string, urgencyKeywords: Record<string, string[]>): Record<string, string[]> {
    const contentLower = content.toLowerCase();
    const detected: Record<string, string[]> = {};
    
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      detected[level] = keywords.filter(keyword => contentLower.includes(keyword));
    }
    
    return detected;
  }
})();





)
}
}
}
}
}
}
}
}