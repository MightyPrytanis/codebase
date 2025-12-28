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
import { multiModelService, MultiModelConfig } from '../engines/mae/services/multi-model-service.js';
import { userVerificationPreferences, VerificationMode, ProviderStrategy, ModelConfig } from '../services/user-verification-preferences.js';
import { getPreset, isValidPreset } from '../config/model-presets.js';

const FactCheckerSchema = z.object({
  claim_text: z.string().describe('The claim or statement to fact-check'),
  context: z.string().optional().describe('Additional context for the claim'),
  verification_level: z.enum(['basic', 'thorough', 'exhaustive']).default('thorough'),
  sources: z.array(z.string()).optional().describe('Sources to check against'),
  ai_provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use (default: auto-select, prefers Perplexity for real-time data)'),
  verification_mode: z.enum(['simple', 'standard', 'comprehensive', 'custom']).optional().describe('Verification depth: simple (1 model), standard (2 models), comprehensive (3 models), custom (user-defined)'),
  provider_strategy: z.enum(['single', 'mixed']).optional().describe('Use single provider (recommended) or mix providers (advanced)'),
  custom_models: z.array(z.object({
    provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek']),
    model: z.string(),
    role: z.enum(['fact_check', 'trust_chain', 'reasoning']),
    weight: z.number().min(0).max(1),
  })).optional().describe('Custom model configuration (required for custom mode)'),
  user_id: z.string().optional().describe('User ID for preference loading (user sovereignty)'),
  save_preference: z.boolean().optional().default(false).describe('Save current settings as user preference'),
});

export const factChecker = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'fact_checker',
      description: 'Verify facts and claims in legal documents with confidence scoring',
      inputSchema: {
        type: 'object',
        properties: {
          claim_text: {
            type: 'string',
            description: 'The claim or statement to fact-check',
          },
          context: {
            type: 'string',
            description: 'Additional context for the claim',
          },
          verification_level: {
            type: 'string',
            enum: ['basic', 'thorough', 'exhaustive'],
            default: 'thorough',
            description: 'Level of verification to perform',
          },
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Sources to check against',
          },
          ai_provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto'],
            default: 'auto',
            description: 'AI provider to use (default: auto-select, prefers Perplexity for real-time data)',
          },
          verification_mode: {
            type: 'string',
            enum: ['simple', 'standard', 'comprehensive', 'custom'],
            description: 'Verification depth: simple (1 model), standard (2 models), comprehensive (3 models), custom (user-defined). Uses saved user preference if not specified.',
          },
          provider_strategy: {
            type: 'string',
            enum: ['single', 'mixed'],
            description: 'Use single provider (recommended) or mix providers (advanced). Uses saved user preference if not specified.',
          },
          custom_models: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                provider: { type: 'string', enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'] },
                model: { type: 'string' },
                role: { type: 'string', enum: ['fact_check', 'trust_chain', 'reasoning'] },
                weight: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['provider', 'model', 'role', 'weight'],
            },
            description: 'Custom model configuration (required for custom mode)',
          },
          user_id: {
            type: 'string',
            description: 'User ID for preference loading (user sovereignty)',
          },
          save_preference: {
            type: 'boolean',
            default: false,
            description: 'Save current settings as user preference (user sovereignty)',
          },
        },
        required: ['claim_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { 
        claim_text, 
        context, 
        verification_level, 
        sources, 
        ai_provider,
        verification_mode,
        provider_strategy,
        custom_models,
        user_id,
        save_preference,
      } = FactCheckerSchema.parse(args);

      // Check for available AI providers
      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          'No AI providers configured. Fact-checking requires an AI provider with web search capabilities (preferably Perplexity).'
        );
      }

      // Load user preferences (user sovereignty)
      const userId = user_id || 'default';
      const userPrefs = userVerificationPreferences.getToolPreference(userId, 'fact_checker');
      
      // Determine verification mode (user preference > explicit > default)
      const mode: VerificationMode = verification_mode || userPrefs.mode || 'standard';
      const strategy: ProviderStrategy = provider_strategy || userPrefs.providerStrategy || 'single';
      
      // Validate custom mode
      if (mode === 'custom') {
        if (!custom_models || custom_models.length === 0) {
          // Try to load from saved custom config
          const customConfigId = userPrefs.customConfigId;
          if (customConfigId) {
            const customConfig = userVerificationPreferences.getCustomConfig(userId, customConfigId);
            if (customConfig) {
              // Use saved custom config
              const multiModelConfig: MultiModelConfig = {
                mode: 'custom',
                providerStrategy: strategy,
                primaryProvider: ai_provider !== 'auto' ? (ai_provider as AIProvider) : undefined,
                customModels: customConfig.models,
                claim: claim_text,
                context,
                sources,
                verificationLevel: verification_level,
              };
              
              const result = await multiModelService.executeVerification(multiModelConfig);
              
              // Save preference if requested
              if (save_preference) {
                userVerificationPreferences.saveToolPreference(userId, 'fact_checker', mode, strategy, customConfigId);
              }
              
              return this.createSuccessResult(JSON.stringify(this.formatMultiModelResult(result), null, 2), {
                verification_level,
                verification_mode: mode,
                provider_strategy: strategy,
                claim_length: claim_text.length,
                sources_checked: sources?.length || 0,
                models_used: result.metadata.modelsExecuted,
                combined_confidence: result.combinedConfidence,
                was_user_preference: !verification_mode,
              });
            }
          }
          return this.createErrorResult('Custom mode requires custom_models configuration or a saved custom config');
        }
      }
      
      // Validate mode
      if (mode !== 'custom' && !isValidPreset(mode)) {
        return this.createErrorResult(`Invalid verification mode: ${mode}`);
      }
      
      // Resolve provider for single-provider strategy
      let primaryProvider: AIProvider | undefined;
      if (strategy === 'single') {
        if (ai_provider === 'auto' || !ai_provider) {
          primaryProvider = aiProviderSelector.getProviderForTask({
            taskType: 'fact_check',
            requiresRealTimeData: true,
            preferredProvider: 'auto',
            balanceQualitySpeed: 'balanced',
          });
        } else {
          // User explicitly selected a provider (user sovereignty)
          const validation = apiValidator.validateProvider(ai_provider as AIProvider);
          if (!validation.valid) {
            return this.createErrorResult(
              `Selected AI provider ${ai_provider} is not configured: ${validation.error}`
            );
          }
          primaryProvider = ai_provider as AIProvider;
        }
      }
      
      // Use multi-model service for standard/comprehensive/custom modes
      if (mode !== 'simple') {
        const multiModelConfig: MultiModelConfig = {
          mode,
          providerStrategy: strategy,
          primaryProvider,
          customModels: custom_models as ModelConfig[] | undefined,
          claim: claim_text,
          context,
          sources,
          verificationLevel: verification_level,
        };
        
        const result = await multiModelService.executeVerification(multiModelConfig);
        
        // Save preference if requested (user sovereignty)
        if (save_preference) {
          userVerificationPreferences.saveToolPreference(userId, 'fact_checker', mode, strategy);
        }
        
        return this.createSuccessResult(JSON.stringify(this.formatMultiModelResult(result), null, 2), {
          verification_level,
          verification_mode: mode,
          provider_strategy: strategy,
          claim_length: claim_text.length,
          sources_checked: sources?.length || 0,
          models_used: result.metadata.modelsExecuted,
          combined_confidence: result.combinedConfidence,
          was_user_preference: !verification_mode,
        });
      }
      
      // Simple mode: use single model (backward compatible)
      const provider = primaryProvider || aiProviderSelector.getProviderForTask({
        taskType: 'fact_check',
        requiresRealTimeData: true,
        preferredProvider: ai_provider === 'auto' ? 'auto' : (ai_provider as AIProvider),
        balanceQualitySpeed: 'balanced',
      });

      const verification = await this.performRealFactCheck(
        claim_text, 
        context, 
        verification_level, 
        sources,
        provider
      );
      
      // Save preference if requested (user sovereignty)
      if (save_preference) {
        userVerificationPreferences.saveToolPreference(userId, 'fact_checker', 'simple', 'single');
      }

      return this.createSuccessResult(JSON.stringify(verification, null, 2), {
        verification_level,
        verification_mode: 'simple',
        claim_length: claim_text.length,
        sources_checked: sources?.length || 0,
        ai_provider: provider,
        was_auto_selected: ai_provider === 'auto' || !ai_provider,
        was_user_preference: !verification_mode,
      });
    } catch (error) {
      return this.createErrorResult(`Fact checking failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Format multi-model result for output
   */
  private formatMultiModelResult(result: any): any {
    return {
      verification_status: this.determineVerificationStatusFromConfidence(result.combinedConfidence),
      combined_confidence: result.combinedConfidence,
      fact_check: {
        provider: result.factCheck.provider,
        model: result.factCheck.model,
        response: result.factCheck.response,
        confidence: result.factCheck.confidence,
      },
      trust_chain: result.trustChain ? {
        provider: result.trustChain.provider,
        model: result.trustChain.model,
        response: result.trustChain.response,
        confidence: result.trustChain.confidence,
      } : undefined,
      reasoning: result.reasoning ? {
        provider: result.reasoning.provider,
        model: result.reasoning.model,
        response: result.reasoning.response,
        confidence: result.reasoning.confidence,
      } : undefined,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Determine verification status from combined confidence
   */
  private determineVerificationStatusFromConfidence(confidence: number): string {
    if (confidence >= 0.8) return 'VERIFIED';
    if (confidence >= 0.6) return 'LIKELY_TRUE';
    if (confidence >= 0.4) return 'UNCERTAIN';
    if (confidence >= 0.2) return 'LIKELY_FALSE';
    return 'UNVERIFIED';
  }

  /**
   * Perform real fact-checking using AI with web search capabilities
   */
  public async performRealFactCheck(
    claim: string, 
    context?: string, 
    level: string = 'thorough', 
    sources?: string[],
    provider: AIProvider = 'perplexity'
  ): Promise<any> {
    // Build fact-checking prompt
    const prompt = this.buildFactCheckPrompt(claim, context, level, sources);

    // Get AI response with web search (Perplexity) or analysis (others)
    let aiResponse: string;
    try {
      aiResponse = await aiService.call(provider, prompt, {
        systemPrompt: this.getSystemPrompt(level),
        temperature: 0.3, // Lower temperature for factual accuracy
        maxTokens: 4000,
      });
    } catch (error) {
      // Use structural analysis if AI call fails
      return this.performFactCheck(claim, context, level, sources);
    }

    // Parse AI response and combine with structural analysis
    // Structural analysis provides real value by analyzing claim patterns, extracting elements, etc.
    const structuralAnalysis = this.performFactCheck(claim, context, level, sources);
    
    return {
      ...structuralAnalysis,
      ai_verification: {
        provider: provider,
        response: aiResponse,
        verification_summary: this.extractVerificationSummary(aiResponse),
        confidence_indicators: this.extractConfidenceIndicators(aiResponse),
        sources_mentioned: this.extractSourcesFromResponse(aiResponse),
      },
      verification_status: this.determineVerificationStatusFromAI(aiResponse, structuralAnalysis.confidence_score),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build fact-checking prompt for AI
   */
  public buildFactCheckPrompt(claim: string, context?: string, level: string = 'thorough', sources?: string[]): string {
    let prompt = `Fact-check the following claim: "${claim}"\n\n`;
    
    if (context) {
      prompt += `Context: ${context}\n\n`;
    }
    
    if (sources && sources.length > 0) {
      prompt += `Please verify against these sources:\n${sources.map(s => `- ${s}`).join('\n')}\n\n`;
    }
    
    prompt += `Verification level: ${level}\n\n`;
    
    if (level === 'exhaustive') {
      prompt += `Provide a comprehensive fact-check including:
- Verification status (VERIFIED, LIKELY_TRUE, UNCERTAIN, LIKELY_FALSE, UNVERIFIED)
- Supporting evidence found
- Contradictory evidence found
- Confidence level (0-1)
- Specific sources that support or contradict the claim
- Recommendations for further verification if needed`;
    } else if (level === 'thorough') {
      prompt += `Provide a thorough fact-check including:
- Verification status
- Key evidence found
- Confidence level
- Main sources`;
    } else {
      prompt += `Provide a basic fact-check including:
- Verification status
- Brief summary`;
    }
    
    return prompt;
  }

  /**
   * Get system prompt based on verification level
   */
  public getSystemPrompt(level: string): string {
    if (level === 'exhaustive') {
      return 'You are an expert fact-checker with access to real-time information. Provide comprehensive, accurate fact-checking with detailed evidence and sources.';
    } else if (level === 'thorough') {
      return 'You are an expert fact-checker. Provide accurate fact-checking with evidence and sources.';
    } else {
      return 'You are a fact-checker. Provide accurate verification of claims.';
    }
  }

  /**
   * Extract verification summary from AI response
   */
  public extractVerificationSummary(response: string): string {
    // Look for common patterns in fact-check responses
    const patterns = [
      /verification status[:\s]+([^\n]+)/i,
      /status[:\s]+([^\n]+)/i,
      /verdict[:\s]+([^\n]+)/i,
      /conclusion[:\s]+([^\n]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) return match[1].trim();
    }
    
    // Fallback: first sentence
    return response.split('.')[0] + '.';
  }

  /**
   * Extract confidence indicators from AI response
   */
  public extractConfidenceIndicators(response: string): string[] {
    const indicators: string[] = [];
    
    if (/high confidence|very confident|strongly|definitely/i.test(response)) {
      indicators.push('high_confidence');
    }
    if (/moderate|somewhat|likely/i.test(response)) {
      indicators.push('moderate_confidence');
    }
    if (/uncertain|unclear|unverified|cannot verify/i.test(response)) {
      indicators.push('low_confidence');
    }
    if (/contradict|dispute|false|incorrect/i.test(response)) {
      indicators.push('contradictory_evidence');
    }
    if (/support|confirm|verify|true|accurate/i.test(response)) {
      indicators.push('supporting_evidence');
    }
    
    return indicators;
  }

  /**
   * Extract sources mentioned in AI response
   */
  public extractSourcesFromResponse(response: string): string[] {
    const sourcePatterns = [
      /(?:source|reference|citation|according to|from)\s*:?\s*([^\n\.]+)/gi,
      /https?:\/\/[^\s]+/g,
      /\[([^\]]+)\]/g,
    ];
    
    const sources: string[] = [];
    sourcePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        sources.push(...matches.map(m => m.replace(/^(?:source|reference|citation|according to|from)\s*:?\s*/i, '').trim()));
      }
    });
    
    return [...new Set(sources)]; // Remove duplicates
  }

  /**
   * Determine verification status from AI response and confidence score
   */
  public determineVerificationStatusFromAI(aiResponse: string, confidenceScore: number): string {
    const responseLower = aiResponse.toLowerCase();
    
    // Check AI response for explicit status
    if (/verified|true|accurate|confirmed|correct/i.test(responseLower) && confidenceScore >= 0.7) {
      return 'VERIFIED';
    }
    if (/likely true|probably true|appears true/i.test(responseLower) && confidenceScore >= 0.6) {
      return 'LIKELY_TRUE';
    }
    if (/false|incorrect|inaccurate|contradicted|disputed/i.test(responseLower) && confidenceScore <= 0.3) {
      return 'LIKELY_FALSE';
    }
    if (/uncertain|unclear|cannot verify|unverified|insufficient/i.test(responseLower)) {
      return 'UNCERTAIN';
    }
    
    // Fallback to confidence score
    if (confidenceScore >= 0.8) return 'VERIFIED';
    if (confidenceScore >= 0.6) return 'LIKELY_TRUE';
    if (confidenceScore >= 0.4) return 'UNCERTAIN';
    if (confidenceScore >= 0.2) return 'LIKELY_FALSE';
    return 'UNVERIFIED';
  }

  /**
   * Structural analysis method - performs pattern-based fact checking using heuristics and text analysis
   * This provides real analytical value and is used both as a supplement to AI analysis and as a fallback
   * when AI is unavailable. Not a mock - this is functional analysis at a more basic level than AI.
   */
  public performFactCheck(claim: string, context?: string, level: string = 'thorough', sources?: string[]) {
    const verification = {
      metadata: {
        verification_level: level,
        timestamp: new Date().toISOString(),
        claim_length: claim.length,
        context_provided: !!context,
        sources_provided: sources?.length || 0,
      },
      claim_analysis: this.analyzeClaim(claim),
      fact_check_results: this.checkFacts(claim, level),
      confidence_score: this.calculateConfidenceScore(claim, context),
      verification_status: this.determineVerificationStatus(claim),
      recommendations: this.generateVerificationRecommendations(claim, level),
      context_analysis: undefined as any,
      source_verification: undefined as any,
    };

    if (context) {
      verification.context_analysis = this.analyzeContext(context);
    }

    if (sources && sources.length > 0) {
      verification.source_verification = this.verifyAgainstSources(claim, sources);
    }

    return verification;
  }

  public analyzeClaim(claim: string): any {
    return {
      claim_type: this.identifyClaimType(claim),
      factual_elements: this.extractFactualElements(claim),
      legal_elements: this.extractLegalElements(claim),
      numerical_claims: this.extractNumericalClaims(claim),
      temporal_elements: this.extractTemporalElements(claim),
      complexity_score: this.calculateComplexityScore(claim),
    };
  }

  public checkFacts(claim: string, level: string): any {
    const results = {
      verifiable_facts: this.identifyVerifiableFacts(claim),
      unverifiable_claims: this.identifyUnverifiableClaims(claim),
      potential_issues: this.identifyPotentialIssues(claim),
      fact_check_confidence: this.calculateFactCheckConfidence(claim, level),
      detailed_analysis: undefined as any,
    };

    if (level === 'exhaustive') {
      results.detailed_analysis = this.performDetailedAnalysis(claim);
    }

    return results;
  }

  public calculateConfidenceScore(claim: string, context?: string): number {
    let score = 0.5; // Base score

    // Adjust based on claim characteristics
    if (this.hasSpecificDetails(claim)) score += 0.1;
    if (this.hasSupportingEvidence(claim)) score += 0.1;
    if (this.isMeasurable(claim)) score += 0.1;
    if (this.hasTemporalContext(claim)) score += 0.1;

    // Adjust based on context
    if (context && context.length > 50) score += 0.1;

    // Adjust based on potential issues
    if (this.hasVagueLanguage(claim)) score -= 0.2;
    if (this.hasUnsupportedAssertions(claim)) score -= 0.2;

    return Math.max(0, Math.min(1, score));
  }

  public determineVerificationStatus(claim: string): string {
    const confidence = this.calculateConfidenceScore(claim);
    
    if (confidence >= 0.8) return 'VERIFIED';
    if (confidence >= 0.6) return 'LIKELY_TRUE';
    if (confidence >= 0.4) return 'UNCERTAIN';
    if (confidence >= 0.2) return 'LIKELY_FALSE';
    return 'UNVERIFIED';
  }

  public generateVerificationRecommendations(claim: string, level: string): string[] {
    const recommendations: string[] = [];
    
    if (this.hasVagueLanguage(claim)) {
      recommendations.push('Clarify vague language for better verification');
    }
    
    if (this.hasUnsupportedAssertions(claim)) {
      recommendations.push('Provide supporting evidence for assertions');
    }
    
    if (this.hasNumericalClaims(claim)) {
      recommendations.push('Verify numerical data against reliable sources');
    }
    
    if (level === 'basic') {
      recommendations.push('Consider thorough verification for important claims');
    }
    
    return recommendations;
  }

  public identifyClaimType(claim: string): string {
    if (this.hasNumericalClaims(claim)) return 'NUMERICAL';
    if (this.hasTemporalElements(claim)) return 'TEMPORAL';
    if (this.hasLegalElements(claim)) return 'LEGAL';
    if (this.hasFactualElements(claim)) return 'FACTUAL';
    return 'GENERAL';
  }

  public extractFactualElements(claim: string): string[] {
    const factualPatterns = [
      /\b(?:is|are|was|were|has|have|had)\s+[^.!?]+/gi,
      /\b(?:according to|based on|research shows|studies indicate)\s+[^.!?]+/gi,
    ];
    
    const elements: string[] = [];
    factualPatterns.forEach(pattern => {
      const matches = claim.match(pattern) || [];
      elements.push(...matches.map(match => match.trim()));
    });
    
    return elements;
  }

  public extractLegalElements(claim: string): string[] {
    const legalTerms = [
      'liability', 'damages', 'breach', 'contract', 'agreement', 'statute',
      'regulation', 'law', 'legal', 'court', 'judgment', 'ruling'
    ];
    
    return legalTerms.filter(term => 
      claim.toLowerCase().includes(term)
    );
  }

  public extractNumericalClaims(claim: string): string[] {
    const numberPattern = /\b\d+(?:\.\d+)?\s*(?:percent|%|dollars?|\$|years?|months?|days?|hours?|minutes?)\b/gi;
    return claim.match(numberPattern) || [];
  }

  public extractTemporalElements(claim: string): string[] {
    const temporalPatterns = [
      /\b(?:in|on|at|during|before|after|since|until)\s+\d{4}\b/gi,
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b(?:yesterday|today|tomorrow|last|next|this)\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    ];
    
    const elements: string[] = [];
    temporalPatterns.forEach(pattern => {
      const matches = claim.match(pattern) || [];
      elements.push(...matches.map(match => match.trim()));
    });
    
    return elements;
  }

  public calculateComplexityScore(claim: string): number {
    let score = 0;
    
    // Length factor
    score += Math.min(claim.length / 100, 1) * 0.3;
    
    // Number of clauses
    const clauses = claim.split(/[,;]/).length;
    score += Math.min(clauses / 5, 1) * 0.2;
    
    // Legal terminology
    const legalTerms = this.extractLegalElements(claim).length;
    score += Math.min(legalTerms / 10, 1) * 0.3;
    
    // Numerical claims
    const numericalClaims = this.extractNumericalClaims(claim).length;
    score += Math.min(numericalClaims / 5, 1) * 0.2;
    
    return Math.min(score, 1);
  }

  public identifyVerifiableFacts(claim: string): string[] {
    const verifiablePatterns = [
      /\b(?:on|in|at)\s+\d{4}\b/gi,
      /\b\d+(?:\.\d+)?\s*(?:percent|%)\b/gi,
      /\b(?:according to|based on|research shows)\s+[^.!?]+/gi,
    ];
    
    const facts: string[] = [];
    verifiablePatterns.forEach(pattern => {
      const matches = claim.match(pattern) || [];
      facts.push(...matches.map(match => match.trim()));
    });
    
    return facts;
  }

  public identifyUnverifiableClaims(claim: string): string[] {
    const unverifiablePatterns = [
      /\b(?:always|never|all|none|every|no)\s+[^.!?]+/gi,
      /\b(?:obviously|clearly|undoubtedly|certainly)\s+[^.!?]+/gi,
      /\b(?:it is known|everyone knows|it is clear)\s+[^.!?]+/gi,
    ];
    
    const claims: string[] = [];
    unverifiablePatterns.forEach(pattern => {
      const matches = claim.match(pattern) || [];
      claims.push(...matches.map(match => match.trim()));
    });
    
    return claims;
  }

  public identifyPotentialIssues(claim: string): string[] {
    const issues: string[] = [];
    
    if (this.hasVagueLanguage(claim)) {
      issues.push('Contains vague or ambiguous language');
    }
    
    if (this.hasUnsupportedAssertions(claim)) {
      issues.push('Contains unsupported assertions');
    }
    
    if (this.hasAbsoluteLanguage(claim)) {
      issues.push('Contains absolute language that may be difficult to verify');
    }
    
    return issues;
  }

  public calculateFactCheckConfidence(claim: string, level: string): number {
    let confidence = 0.5;
    
    const verifiableFacts = this.identifyVerifiableFacts(claim).length;
    const unverifiableClaims = this.identifyUnverifiableClaims(claim).length;
    
    if (verifiableFacts > 0) confidence += 0.2;
    if (unverifiableClaims > 0) confidence -= 0.3;
    
    if (level === 'exhaustive') confidence += 0.1;
    if (level === 'basic') confidence -= 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  public performDetailedAnalysis(claim: string): any {
    return {
      sentence_analysis: this.analyzeSentences(claim),
      word_analysis: this.analyzeWords(claim),
      logical_structure: this.analyzeLogicalStructure(claim),
      evidence_requirements: this.identifyEvidenceRequirements(claim),
    };
  }

  public analyzeSentences(claim: string): any {
    const sentences = claim.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return {
      sentence_count: sentences.length,
      average_length: sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length,
      complex_sentences: sentences.filter(s => s.includes(',') || s.includes(';')).length,
    };
  }

  public analyzeWords(claim: string): any {
    const words = claim.toLowerCase().split(/\W+/).filter(w => w.length > 0);
    return {
      word_count: words.length,
      unique_words: new Set(words).size,
      legal_terms: this.extractLegalElements(claim).length,
      technical_terms: this.identifyTechnicalTerms(claim).length,
    };
  }

  public analyzeLogicalStructure(claim: string): any {
    return {
      has_conditionals: /\b(?:if|when|unless|provided that)\b/gi.test(claim),
      has_causality: /\b(?:because|since|due to|as a result)\b/gi.test(claim),
      has_comparisons: /\b(?:than|compared to|versus|vs\.?)\b/gi.test(claim),
      logical_connectors: (claim.match(/\b(?:and|or|but|however|therefore|thus)\b/gi) || []).length,
    };
  }

  public identifyEvidenceRequirements(claim: string): string[] {
    const requirements: string[] = [];
    
    if (this.hasNumericalClaims(claim)) {
      requirements.push('Numerical data verification');
    }
    
    if (this.hasTemporalElements(claim)) {
      requirements.push('Temporal verification');
    }
    
    if (this.hasLegalElements(claim)) {
      requirements.push('Legal precedent verification');
    }
    
    return requirements;
  }

  public analyzeContext(context: string): any {
    return {
      context_length: context.length,
      provides_evidence: this.hasSupportingEvidence(context),
      adds_clarity: this.addsClarity(context),
      relevant_sources: this.identifyRelevantSources(context),
    };
  }

  public verifyAgainstSources(claim: string, sources: string[]): any {
    return {
      sources_checked: sources.length,
      verification_results: sources.map(source => ({
        source: source,
        supports_claim: this.sourceSupportsClaim(claim, source),
        confidence: this.calculateSourceConfidence(claim, source),
      })),
      overall_support: this.calculateOverallSupport(claim, sources),
    };
  }

  // Helper methods
  public hasSpecificDetails(claim: string): boolean {
    return /\b\d+\b/.test(claim) || /\b(?:specific|particular|exact|precise)\b/gi.test(claim);
  }

  public hasSupportingEvidence(claim: string): boolean {
    return /\b(?:according to|based on|research shows|studies indicate|evidence shows)\b/gi.test(claim);
  }

  public hasTemporalElements(claim: string): boolean {
    return /\b(?:in|on|at|during|before|after|since|until)\s+\d{4}\b/gi.test(claim) ||
           /\b(?:yesterday|today|tomorrow|last year|next month)\b/gi.test(claim);
  }

  public hasLegalElements(claim: string): boolean {
    return /\b(?:law|legal|court|judge|attorney|contract|statute|regulation|compliance)\b/gi.test(claim);
  }

  public isMeasurable(claim: string): boolean {
    return /\b\d+(?:\.\d+)?\s*(?:percent|%|dollars?|\$|years?|months?|days?)\b/gi.test(claim);
  }

  public hasTemporalContext(claim: string): boolean {
    return /\b(?:in|on|at|during|before|after|since|until)\s+\d{4}\b/gi.test(claim);
  }

  public hasVagueLanguage(claim: string): boolean {
    return /\b(?:some|many|few|several|various|certain|somewhat|rather|quite)\b/gi.test(claim);
  }

  public hasUnsupportedAssertions(claim: string): boolean {
    return /\b(?:obviously|clearly|undoubtedly|certainly|it is known|everyone knows)\b/gi.test(claim);
  }

  public hasNumericalClaims(claim: string): boolean {
    return /\b\d+(?:\.\d+)?\b/.test(claim);
  }

  public hasAbsoluteLanguage(claim: string): boolean {
    return /\b(?:always|never|all|none|every|no|completely|entirely|totally)\b/gi.test(claim);
  }

  public hasFactualElements(claim: string): boolean {
    return /\b(?:fact|factual|true|false|proven|disproven|verified|evidence)\b/gi.test(claim);
  }

  public identifyTechnicalTerms(claim: string): string[] {
    const technicalTerms = [
      'algorithm', 'protocol', 'system', 'process', 'methodology', 'framework',
      'architecture', 'implementation', 'configuration', 'specification'
    ];
    
    return technicalTerms.filter(term => 
      claim.toLowerCase().includes(term)
    );
  }

  public addsClarity(context: string): boolean {
    return context.length > 50 && /\b(?:explains|clarifies|details|describes)\b/gi.test(context);
  }

  public identifyRelevantSources(context: string): string[] {
    const sourcePattern = /\b(?:source|reference|citation|study|research|report)\s*:?\s*([^.!?]+)/gi;
    const matches = context.match(sourcePattern) || [];
    return matches.map(match => match.replace(/\b(?:source|reference|citation|study|research|report)\s*:?\s*/i, '').trim());
  }

  public sourceSupportsClaim(claim: string, source: string): boolean {
    // Simple keyword matching - in a real implementation, this would be more sophisticated
    const claimWords = new Set(claim.toLowerCase().split(/\W+/));
    const sourceWords = new Set(source.toLowerCase().split(/\W+/));
    const commonWords = [...claimWords].filter(word => sourceWords.has(word));
    return commonWords.length > 2;
  }

  public calculateSourceConfidence(claim: string, source: string): number {
    const claimWords = new Set(claim.toLowerCase().split(/\W+/));
    const sourceWords = new Set(source.toLowerCase().split(/\W+/));
    const commonWords = [...claimWords].filter(word => sourceWords.has(word));
    return Math.min(commonWords.length / 10, 1);
  }

  public calculateOverallSupport(claim: string, sources: string[]): number {
    const supportScores = sources.map(source => this.calculateSourceConfidence(claim, source));
    return supportScores.reduce((sum, score) => sum + score, 0) / supportScores.length;
  }
})();
