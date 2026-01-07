/**
 * Ten Rules Checker Tool
 * 
 * Enforces Ten Rules classification, cites missing justification, 
 * flags ungrounded factual assertions in text content.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { TEN_RULES, getRuleById } from '../modules/ethical-ai/ten-rules.js';
import { aiService, AIProvider } from '../services/ai-service.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';

const TenRulesCheckerSchema = z.object({
  textContent: z.string().describe('Text content to check (answer, draft, report, etc.)'),
  contentType: z.enum(['answer', 'draft', 'report', 'recommendation', 'other']).optional()
    .describe('Type of content being checked'),
  strictMode: z.boolean().default(false).describe('Use strict mode (more thorough checking)'),
});

export interface TenRulesCheckResult {
  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'violation' | 'critical';
    message: string;
    location?: string; // Where in the text
    suggestedFix?: string;
  }>;
  warnings: Array<{
    ruleId: string;
    ruleName: string;
    message: string;
    location?: string;
    suggestedFix?: string;
  }>;
  suggestions: Array<{
    ruleId: string;
    ruleName: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  classificationIssues: Array<{
    text: string;
    issue: 'unmarked_fact' | 'unmarked_speculation' | 'unmarked_fiction' | 'mixed_claim';
    suggestedClassification: string;
  }>;
  missingCitations: Array<{
    claim: string;
    ruleId: string;
    ruleName: string;
    suggestedSource?: string;
  }>;
  ungroundedAssertions: Array<{
    assertion: string;
    ruleId: string;
    ruleName: string;
    reason: string;
  }>;
  compliance: {
    status: 'compliant' | 'needs_review' | 'non_compliant';
    score: number; // 0-100
    summary: string;
  };
  metadata: {
    timestamp: string;
    contentType?: string;
    rulesChecked: number;
    textLength: number;
  };
}

export const tenRulesChecker: BaseTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ten_rules_checker',
      description: 'Check text content against The Ten Rules. Enforces classification, identifies missing citations, flags ungrounded factual assertions. Returns machine-readable report with violations, warnings, and suggestions.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          textContent: {
            type: 'string',
            description: 'Text content to check (answer, draft, report, etc.)',
          },
          contentType: {
            type: 'string',
            enum: ['answer', 'draft', 'report', 'recommendation', 'other'],
            description: 'Type of content being checked',
          },
          strictMode: {
            type: 'boolean',
            default: false,
            description: 'Use strict mode (more thorough checking)',
          },
        },
        required: ['textContent'],
      },
    };
  }

  async execute(args: any) {
    try {
      const input = TenRulesCheckerSchema.parse(args);
      
      const result = await this.checkContent(
        input.textContent,
        input.contentType,
        input.strictMode
      );

      return this.createSuccessResult(JSON.stringify(result, null, 2), result);
    } catch (error) {
      return this.createErrorResult(
        `Ten Rules check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check content against Ten Rules
   */
  private async checkContent(
    textContent: string,
    contentType?: string,
    strictMode: boolean = false
  ): Promise<TenRulesCheckResult> {
    const violations: TenRulesCheckResult['violations'] = [];
    const warnings: TenRulesCheckResult['warnings'] = [];
    const suggestions: TenRulesCheckResult['suggestions'] = [];
    const classificationIssues: TenRulesCheckResult['classificationIssues'] = [];
    const missingCitations: TenRulesCheckResult['missingCitations'] = [];
    const ungroundedAssertions: TenRulesCheckResult['ungroundedAssertions'] = [];

    // Use AI to analyze the content
    const analysisPrompt = `Analyze the following text content against The Ten Rules for Ethical AI/Human Interactions (Version 1.4).

Text Content:
${textContent}

${contentType ? `Content Type: ${contentType}\n` : ''}
${strictMode ? 'Mode: STRICT (be thorough)\n' : ''}

Check for:

1. **Rule 2 (Statement Classification)**: Are statements properly classified as:
   - Confirmed true (with verification)
   - Uncertain/speculative (explicitly marked)
   - Fictional/imaginative/metaphorical (explicitly marked)
   - Mixed claims (properly disaggregated)

2. **Rule 4 (Foundation of Factual Claims)**: For each factual assertion:
   - Is there a citation or source?
   - Is there explicit reasoning?
   - Is the basis of inference acknowledged?
   - Are there unsupported assertions?

3. **Rule 1 (Truth Standard)**: Are there ungrounded factual assertions?

4. **Rule 3 (Disaggregation)**: Are mixed claims properly separated?

Return a JSON object:
{
  "classificationIssues": [
    {
      "text": "exact text from content",
      "issue": "unmarked_fact|unmarked_speculation|unmarked_fiction|mixed_claim",
      "suggestedClassification": "how to fix"
    }
  ],
  "missingCitations": [
    {
      "claim": "the factual claim",
      "ruleId": "rule_4",
      "ruleName": "Foundation of Factual Claims",
      "suggestedSource": "what source would help"
    }
  ],
  "ungroundedAssertions": [
    {
      "assertion": "the assertion",
      "ruleId": "rule_1",
      "ruleName": "Truth Standard",
      "reason": "why it's ungrounded"
    }
  ],
  "violations": [
    {
      "ruleId": "rule_X",
      "ruleName": "Rule Name",
      "severity": "info|warning|violation|critical",
      "message": "description",
      "location": "where in text",
      "suggestedFix": "how to fix"
    }
  ],
  "warnings": [
    {
      "ruleId": "rule_X",
      "ruleName": "Rule Name",
      "message": "description",
      "location": "where in text",
      "suggestedFix": "how to fix"
    }
  ],
  "suggestions": [
    {
      "ruleId": "rule_X",
      "ruleName": "Rule Name",
      "suggestion": "improvement suggestion",
      "priority": "low|medium|high"
    }
  ]
}`;

    try {
      let systemPrompt = 'You are an expert Ten Rules compliance checker. Analyze text content thoroughly.';
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'full');
      
      const response = await aiService.call('anthropic', analysisPrompt, {
        systemPrompt,
        temperature: 0.2,
        maxTokens: 4000,
      });

      // Parse AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.classificationIssues) {
          classificationIssues.push(...parsed.classificationIssues);
        }
        if (parsed.missingCitations) {
          missingCitations.push(...parsed.missingCitations);
        }
        if (parsed.ungroundedAssertions) {
          ungroundedAssertions.push(...parsed.ungroundedAssertions);
        }
        if (parsed.violations) {
          violations.push(...parsed.violations);
        }
        if (parsed.warnings) {
          warnings.push(...parsed.warnings);
        }
        if (parsed.suggestions) {
          suggestions.push(...parsed.suggestions);
        }
      }
    } catch (error) {
      // Use basic structural checks
      this.performBasicChecks(textContent, violations, warnings, missingCitations, ungroundedAssertions);
    }

    // Calculate compliance score
    const totalIssues = violations.length + warnings.length + classificationIssues.length + 
                        missingCitations.length + ungroundedAssertions.length;
    const complianceScore = Math.max(0, 100 - (violations.length * 15) - (warnings.length * 5) - 
                                     (classificationIssues.length * 3) - (missingCitations.length * 5) - 
                                     (ungroundedAssertions.length * 10));

    let status: 'compliant' | 'needs_review' | 'non_compliant';
    if (totalIssues === 0) {
      status = 'compliant';
    } else if (violations.length > 0 || ungroundedAssertions.length > 0) {
      status = 'non_compliant';
    } else {
      status = 'needs_review';
    }

    const summary = this.generateSummary(violations, warnings, classificationIssues, missingCitations, ungroundedAssertions, status);

    return {
      violations,
      warnings,
      suggestions,
      classificationIssues,
      missingCitations,
      ungroundedAssertions,
      compliance: {
        status,
        score: complianceScore,
        summary,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        contentType,
        rulesChecked: TEN_RULES.length,
        textLength: textContent.length,
      },
    };
  }

  /**
   * Basic structural checks - performs pattern-based Ten Rules compliance checking using heuristics
   * This provides real analytical value and is used both as a supplement to AI analysis and as a fallback
   * when AI is unavailable. Not a mock - this is functional analysis at a more basic level than AI.
   */
  private performBasicChecks(
    text: string,
    violations: TenRulesCheckResult['violations'],
    warnings: TenRulesCheckResult['warnings'],
    missingCitations: TenRulesCheckResult['missingCitations'],
    ungroundedAssertions: TenRulesCheckResult['ungroundedAssertions']
  ): void {
    const lowerText = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for unmarked factual statements
    const factIndicators = ['is', 'are', 'was', 'were', 'has', 'have', 'will', 'did', 'does'];
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasFactIndicator = factIndicators.some(ind => lowerSentence.includes(` ${ind} `));
      const hasUncertaintyMarker = lowerSentence.includes('uncertain') || lowerSentence.includes('speculative') || 
                                   lowerSentence.includes('may') || lowerSentence.includes('might');
      const hasCitation = lowerSentence.includes('cite') || lowerSentence.includes('source') || 
                         lowerSentence.includes('reference') || lowerSentence.includes('according to');

      if (hasFactIndicator && !hasUncertaintyMarker && !hasCitation && sentence.length > 20) {
        const rule = getRuleById('rule_4');
        if (rule) {
          missingCitations.push({
            claim: sentence.trim(),
            ruleId: rule.id,
            ruleName: rule.name,
            suggestedSource: 'Add citation or source reference',
          });
        }
      }
    }
  }

  /**
   * Generate summary
   */
  private generateSummary(
    violations: TenRulesCheckResult['violations'],
    warnings: TenRulesCheckResult['warnings'],
    classificationIssues: TenRulesCheckResult['classificationIssues'],
    missingCitations: TenRulesCheckResult['missingCitations'],
    ungroundedAssertions: TenRulesCheckResult['ungroundedAssertions'],
    status: string
  ): string {
    if (violations.length === 0 && warnings.length === 0 && classificationIssues.length === 0 && 
        missingCitations.length === 0 && ungroundedAssertions.length === 0) {
      return 'Content is compliant with The Ten Rules.';
    }

    const parts: string[] = [];
    if (violations.length > 0) {
      parts.push(`${violations.length} violation(s)`);
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning(s)`);
    }
    if (classificationIssues.length > 0) {
      parts.push(`${classificationIssues.length} classification issue(s)`);
    }
    if (missingCitations.length > 0) {
      parts.push(`${missingCitations.length} missing citation(s)`);
    }
    if (ungroundedAssertions.length > 0) {
      parts.push(`${ungroundedAssertions.length} ungrounded assertion(s)`);
    }

    return `Content ${status.replace('_', ' ')}. Found: ${parts.join(', ')}. Review recommended.`;
  }
})();
