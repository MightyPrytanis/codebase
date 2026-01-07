/**
 * Ethics Policy Explainer Tool
 * 
 * Explains which rule(s) apply and why, using values statement and Ten Rules as ground truth.
 * Provides explanations for debugging and user-facing transparency.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { TEN_RULES, getRuleById, getRulesByCategory, getRulesByValue } from '../modules/ethical-ai/ten-rules.js';
import { CORE_VALUES, getValueById } from '../modules/ethical-ai/values.js';
import { aiService } from '../services/ai-service.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';

const EthicsPolicyExplainerSchema = z.object({
  question: z.string().describe('Question about ethics policy or which rules apply'),
  context: z.string().optional().describe('Context about the situation or use case'),
  specificRule: z.string().optional().describe('Specific rule ID to explain (e.g., rule_1, rule_4)'),
  specificValue: z.string().optional().describe('Specific value ID to explain (e.g., truth, transparency)'),
});

export interface PolicyExplanation {
  question: string;
  applicableRules: Array<{
    ruleId: string;
    ruleNumber: number;
    ruleName: string;
    whyApplies: string;
    howApplies: string;
  }>;
  applicableValues: Array<{
    valueId: string;
    valueName: string;
    whyApplies: string;
    howApplies: string;
  }>;
  explanation: string;
  examples?: string[];
  relatedRules?: string[];
  metadata: {
    timestamp: string;
    version: string;
  };
}

export const ethicsPolicyExplainer: BaseTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ethics_policy_explainer',
      description: 'Explain which Ten Rules and core values apply to a situation and why. Uses values statement and Ten Rules as ground truth. Provides explanations for debugging and user-facing transparency.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          question: {
            type: 'string',
            description: 'Question about ethics policy or which rules apply',
          },
          context: {
            type: 'string',
            description: 'Context about the situation or use case',
          },
          specificRule: {
            type: 'string',
            description: 'Specific rule ID to explain (e.g., rule_1, rule_4)',
          },
          specificValue: {
            type: 'string',
            description: 'Specific value ID to explain (e.g., truth, transparency)',
          },
        },
        required: ['question'],
      },
    };
  }

  async execute(args: any) {
    try {
      const input = EthicsPolicyExplainerSchema.parse(args);
      
      const result = await this.explainPolicy(
        input.question,
        input.context,
        input.specificRule,
        input.specificValue
      );

      return this.createSuccessResult(JSON.stringify(result, null, 2), result);
    } catch (error) {
      return this.createErrorResult(
        `Ethics policy explanation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Explain ethics policy
   */
  private async explainPolicy(
    question: string,
    context?: string,
    specificRule?: string,
    specificValue?: string
  ): Promise<PolicyExplanation> {
    // If specific rule requested, explain that rule
    if (specificRule) {
      const rule = getRuleById(specificRule);
      if (rule) {
        return this.explainSpecificRule(rule, question, context);
      }
    }

    // If specific value requested, explain that value
    if (specificValue) {
      const value = getValueById(specificValue);
      if (value) {
        return this.explainSpecificValue(value as any, question, context);
      }
    }

    // General explanation using AI
    return await this.generateGeneralExplanation(question, context);
  }

  /**
   * Explain a specific rule
   */
  private explainSpecificRule(
    rule: typeof TEN_RULES[0],
    question: string,
    context?: string
  ): PolicyExplanation {
    const applicableValues = rule.relatedValues.map(vId => {
      const value = getValueById(vId);
      return {
        valueId: vId,
        valueName: value?.name || vId,
        whyApplies: `Rule ${rule.number} relates to ${value?.name || vId} value`,
        howApplies: value?.description || '',
      };
    });

    return {
      question,
      applicableRules: [{
        ruleId: rule.id,
        ruleNumber: rule.number,
        ruleName: rule.name,
        whyApplies: `Rule ${rule.number} (${rule.name}) is directly relevant to your question`,
        howApplies: rule.fullText,
      }],
      applicableValues,
      explanation: `Rule ${rule.number}: ${rule.name}\n\n${rule.fullText}\n\nThis rule is in the "${rule.category}" category and has "${rule.enforcementStrategy}" enforcement. It relates to the following core values: ${rule.relatedValues.join(', ')}.`,
      relatedRules: TEN_RULES.filter(r => 
        r.category === rule.category && r.id !== rule.id
      ).map(r => r.id),
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.4',
      },
    };
  }

  /**
   * Explain a specific value
   */
  private explainSpecificValue(
    value: typeof CORE_VALUES.values[0],
    question: string,
    context?: string
  ): PolicyExplanation {
    const relatedRules = getRulesByValue(value.id);

    return {
      question,
      applicableRules: relatedRules.map(rule => ({
        ruleId: rule.id,
        ruleNumber: rule.number,
        ruleName: rule.name,
        whyApplies: `Rule ${rule.number} relates to ${value.name} value`,
        howApplies: rule.fullText.substring(0, 200) + '...',
      })),
      applicableValues: [{
        valueId: value.id,
        valueName: value.name,
        whyApplies: `${value.name} is directly relevant to your question`,
        howApplies: value.description,
      }],
      explanation: `Core Value: ${value.name}\n\n${value.description}\n\nPrinciples:\n${value.principles.map(p => `- ${p}`).join('\n')}\n\nThis value is reflected in the following Ten Rules: ${relatedRules.map(r => `Rule ${r.number}`).join(', ')}.`,
      relatedRules: relatedRules.map(r => r.id),
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.4',
      },
    };
  }

  /**
   * Generate general explanation using AI
   */
  private async generateGeneralExplanation(
    question: string,
    context?: string
  ): Promise<PolicyExplanation> {
    const explanationPrompt = `Explain which Ten Rules and core values apply to the following question.

Question: ${question}
${context ? `Context: ${context}\n` : ''}

Available Ten Rules:
${TEN_RULES.map(r => `${r.number}. ${r.name} (${r.id}): ${r.fullText.substring(0, 150)}...`).join('\n')}

Available Core Values:
${CORE_VALUES.values.map(v => `- ${v.name} (${v.id}): ${v.description}`).join('\n')}

Provide a JSON response:
{
  "applicableRules": [
    {
      "ruleId": "rule_1",
      "ruleNumber": 1,
      "ruleName": "Truth Standard",
      "whyApplies": "explanation",
      "howApplies": "how it applies"
    }
  ],
  "applicableValues": [
    {
      "valueId": "truth",
      "valueName": "Truth and Factual Accuracy",
      "whyApplies": "explanation",
      "howApplies": "how it applies"
    }
  ],
  "explanation": "comprehensive explanation",
  "examples": ["example 1", "example 2"]
}`;

    try {
      let systemPrompt = 'You are an expert ethics policy explainer. Use The Ten Rules and core values as ground truth.';
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'full');
      
      const response = await aiService.call('anthropic', explanationPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 3000,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          question,
          applicableRules: parsed.applicableRules || [],
          applicableValues: parsed.applicableValues || [],
          explanation: parsed.explanation || 'Explanation generated',
          examples: parsed.examples,
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.4',
          },
        };
      }
    } catch (error) {
      // Fallback to basic explanation
    }

    // Fallback: return basic explanation
    return {
      question,
      applicableRules: [],
      applicableValues: [],
      explanation: `I can help explain which Ten Rules apply to your question: "${question}". Please provide more context or specify a particular rule or value to get a detailed explanation.`,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.4',
      },
    };
  }
})();
