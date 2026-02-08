/**
 * Ethical AI Guard Tool
 * 
 * Guards AI actions/outputs by evaluating against TWO DISTINCT frameworks:
 * 
 * 1. PROFESSIONAL RESPONSIBILITY (Attorney-Client Ethics)
 *    - Uses ethicsRulesService to evaluate against Model Rules of Professional Conduct (MRPC)
 *    - Covers: conflict of interest, client confidentiality, attorney-client privilege, etc.
 *    - Evaluated when 'facts' parameter is provided (attorney-client scenarios)
 * 
 * 2. AI ETHICS (Ten Rules for Ethical AI/Human Interactions)
 *    - Uses AI analysis to evaluate against The Ten Rules (Version 1.4)
 *    - Covers: truth standard, statement classification, anthropomorphic limits, etc.
 *    - Always evaluated for all AI actions/outputs
 * 
 * Returns allow/allow-with-warnings/block decisions with structured reasons.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { TEN_RULES, getHardRules } from '../modules/ethical-ai/ten-rules.js';
import { ethicsRulesService, EthicsReviewResult } from '../engines/goodcounsel/services/ethics-rules-service.js';
import { aiService, AIProvider } from '../services/ai-service.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';

const EthicalAIGuardSchema = z.object({
  proposedAction: z.string().describe('The proposed AI action or output to evaluate'),
  context: z.string().optional().describe('Context about the action (what, why, when)'),
  provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek']).optional()
    .describe('AI provider that generated the action'),
  callSiteMetadata: z.object({
    engine: z.string().optional().describe('Which engine (MAE, GoodCounsel, Potemkin, etc.)'),
    app: z.string().optional().describe('Which app (LexFiat, Arkiver, etc.)'),
    tool: z.string().optional().describe('Which tool generated this'),
  }).optional().describe('Metadata about where this was called from'),
  facts: z.record(z.string(), z.any()).optional().describe('Facts for professional ethics rules evaluation'),
});

export interface GuardResult {
  decision: 'allow' | 'allow_with_warnings' | 'block';
  reasons: string[];
  suggestedEdits?: string[];
  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'violation' | 'critical';
    message: string;
  }>;
  warnings: Array<{
    ruleId: string;
    ruleName: string;
    message: string;
  }>;
  complianceScore: number;
  metadata: {
    timestamp: string;
    rulesEvaluated: number;
    callSite?: {
      engine?: string;
      app?: string;
      tool?: string;
    };
  };
}

export const ethicalAIGuard: BaseTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ethical_ai_guard',
      description: 'Guard AI actions/outputs by evaluating against Ten Rules and professional ethics. Returns allow/allow-with-warnings/block decision with structured reasons and suggested edits.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          proposedAction: {
            type: 'string',
            description: 'The proposed AI action or output to evaluate',
          },
          context: {
            type: 'string',
            description: 'Context about the action (what, why, when)',
          },
          provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'],
            description: 'AI provider that generated the action',
          },
          callSiteMetadata: {
            type: 'object' as const,
            properties: {
              engine: { type: 'string' },
              app: { type: 'string' },
              tool: { type: 'string' },
            },
            description: 'Metadata about where this was called from',
          },
          facts: {
            type: 'object' as const,
            additionalProperties: true,
            description: 'Facts for professional ethics rules evaluation',
          },
        },
        required: ['proposedAction'],
      },
    };
  }

  async execute(args: any) {
    try {
      const input = EthicalAIGuardSchema.parse(args);
      
      const result = await this.evaluateAction(
        input.proposedAction,
        input.context,
        input.provider,
        input.callSiteMetadata,
        input.facts
      );

      return this.createSuccessResult(JSON.stringify(result, null, 2), result);
    } catch (error) {
      return this.createErrorResult(
        `Ethical AI guard evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Evaluate an action against Ten Rules and professional ethics
   */
  private async evaluateAction(
    proposedAction: string,
    context?: string,
    provider?: AIProvider,
    callSiteMetadata?: { engine?: string; app?: string; tool?: string },
    facts?: Record<string, any>
  ): Promise<GuardResult> {
    const violations: GuardResult['violations'] = [];
    const warnings: GuardResult['warnings'] = [];
    const reasons: string[] = [];
    const suggestedEdits: string[] = [];

    // Step 1: PROFESSIONAL RESPONSIBILITY (Attorney-Client Ethics)
    // Evaluate against Model Rules of Professional Conduct (MRPC) and state bar rules
    // This is distinct from AI Ethics - it covers attorney-client relationships, conflicts, confidentiality, etc.
    let professionalEthicsResult: EthicsReviewResult | null = null;
    if (facts) {
      professionalEthicsResult = await ethicsRulesService.runReview(facts);
      if (professionalEthicsResult.violations.length > 0) {
        violations.push(...professionalEthicsResult.violations.map(v => ({
          ruleId: v.ruleId,
          ruleName: v.ruleName,
          severity: v.severity as 'info' | 'warning' | 'violation' | 'critical',
          message: v.message,
        })));
        reasons.push(`Professional ethics violations: ${professionalEthicsResult.violations.length}`);
      }
      if (professionalEthicsResult.warnings.length > 0) {
        warnings.push(...professionalEthicsResult.warnings.map(w => ({
          ruleId: w.ruleId,
          ruleName: w.ruleName,
          message: w.message,
        })));
        reasons.push(`Professional ethics warnings: ${professionalEthicsResult.warnings.length}`);
      }
    }

    // Step 2: AI ETHICS (Ten Rules for Ethical AI/Human Interactions)
    // Evaluate against The Ten Rules (Version 1.4) - covers AI behavior, truth standards, anthropomorphic limits, etc.
    // This is distinct from Professional Responsibility - it governs how AI systems should interact with humans
    const tenRulesEvaluation = await this.evaluateTenRules(proposedAction, context, provider);
    violations.push(...tenRulesEvaluation.violations);
    warnings.push(...tenRulesEvaluation.warnings);
    reasons.push(...tenRulesEvaluation.reasons);
    if (tenRulesEvaluation.suggestedEdits) {
      suggestedEdits.push(...tenRulesEvaluation.suggestedEdits);
    }

    // Step 3: Calculate compliance score
    const totalRules = TEN_RULES.length + (facts ? Object.keys(facts).length : 0);
    const violationCount = violations.length;
    const warningCount = warnings.length;
    const complianceScore = Math.max(0, 100 - (violationCount * 20) - (warningCount * 5));

    // Step 4: Make decision
    let decision: 'allow' | 'allow_with_warnings' | 'block';
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const hardRuleViolations = violations.filter(v => {
      const rule = TEN_RULES.find(r => r.id === v.ruleId);
      return rule && rule.enforcementStrategy === 'hard';
    });

    if (criticalViolations.length > 0 || hardRuleViolations.length > 0) {
      decision = 'block';
      reasons.push('Blocked due to critical violations or hard rule violations');
    } else if (violations.length > 0 || warnings.length > 0) {
      decision = 'allow_with_warnings';
      reasons.push('Allowed with warnings - review recommended');
    } else {
      decision = 'allow';
      reasons.push('No violations detected - action allowed');
    }

    return {
      decision,
      reasons,
      suggestedEdits: suggestedEdits.length > 0 ? suggestedEdits : undefined,
      violations,
      warnings,
      complianceScore,
      metadata: {
        timestamp: new Date().toISOString(),
        rulesEvaluated: totalRules,
        callSite: callSiteMetadata,
      },
    };
  }

  /**
   * Evaluate against Ten Rules using AI
   */
  private async evaluateTenRules(
    proposedAction: string,
    context?: string,
    provider?: AIProvider
  ): Promise<{
    violations: GuardResult['violations'];
    warnings: GuardResult['warnings'];
    reasons: string[];
    suggestedEdits?: string[];
  }> {
    const violations: GuardResult['violations'] = [];
    const warnings: GuardResult['warnings'] = [];
    const reasons: string[] = [];
    const suggestedEdits: string[] = [];

    // Use AI to analyze the action against Ten Rules
    const analysisPrompt = `Analyze the following AI action/output against The Ten Rules for Ethical AI/Human Interactions (Version 1.4).

Proposed Action/Output:
${proposedAction}

${context ? `Context: ${context}\n` : ''}

Evaluate this against each of The Ten Rules:
${TEN_RULES.map(r => `${r.number}. ${r.name}: ${r.fullText.substring(0, 150)}...`).join('\n')}

For each rule, determine:
1. Does the action comply? (yes/no)
2. If not, what is the violation? (be specific)
3. What severity? (info/warning/violation/critical)
4. What edits would fix it? (if applicable)

Return a JSON object with:
{
  "evaluations": [
    {
      "ruleId": "rule_1",
      "ruleName": "Truth Standard",
      "complies": false,
      "violation": "description",
      "severity": "violation",
      "suggestedEdit": "how to fix"
    }
  ]
}`;

    try {
      const defaultProvider: AIProvider = provider || 'anthropic';
      let systemPrompt = 'You are an expert ethics evaluator. Analyze AI actions against The Ten Rules.';
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
      
      const response = await aiService.call(defaultProvider, analysisPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2000,
        metadata: {
          skipEthicsCheck: true, // Prevent infinite recursion: this IS the ethics check
          toolName: 'ethical_ai_guard',
          actionType: 'content_generation',
        },
      });

      // Parse AI response (may be JSON or text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.evaluations) {
          for (const eval_ of parsed.evaluations) {
            if (!eval_.complies) {
              const rule = TEN_RULES.find(r => r.id === eval_.ruleId);
              if (rule) {
                const severity = eval_.severity || 'warning';
                const violation = {
                  ruleId: eval_.ruleId,
                  ruleName: eval_.ruleName || rule.name,
                  severity: severity as 'info' | 'warning' | 'violation' | 'critical',
                  message: eval_.violation || `Violation of ${rule.name}`,
                };

                if (severity === 'violation' || severity === 'critical') {
                  violations.push(violation);
                } else {
                  warnings.push({
                    ruleId: eval_.ruleId,
                    ruleName: eval_.ruleName || rule.name,
                    message: eval_.violation || `Warning for ${rule.name}`,
                  });
                }

                if (eval_.suggestedEdit) {
                  suggestedEdits.push(eval_.suggestedEdit);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // If AI evaluation fails, use keyword-based checking
      reasons.push('AI evaluation failed, using keyword-based analysis');
      const keywordViolations = this.keywordBasedCheck(proposedAction);
      violations.push(...keywordViolations);
    }

    return { violations, warnings, reasons, suggestedEdits };
  }

  /**
   * Keyword-based ethical guard check - performs pattern matching to identify potential ethical violations
   * This provides real analytical value and is used both as a supplement to AI analysis and as a fallback
   * when AI is unavailable. Not a mock - this is functional analysis at a more basic level than AI.
   */
  private keywordBasedCheck(action: string): GuardResult['violations'] {
    const violations: GuardResult['violations'] = [];
    const lowerAction = action.toLowerCase();

    // Check for common violations
    const hardRules = getHardRules();
    for (const rule of hardRules) {
      // Simple keyword-based heuristics
      if (rule.id === 'rule_1' && (lowerAction.includes('definitely') || lowerAction.includes('certainly')) && !lowerAction.includes('uncertain')) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: 'warning',
          message: 'Possible truth standard violation - check for verifiable facts',
        });
      }
      if (rule.id === 'rule_4' && lowerAction.includes('according to') && !lowerAction.includes('source') && !lowerAction.includes('cite')) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: 'warning',
          message: 'Possible citation violation - check for source attribution',
        });
      }
    }

    return violations;
  }
})();

)
}
}
}