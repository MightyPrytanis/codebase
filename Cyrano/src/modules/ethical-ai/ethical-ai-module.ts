/**
 * EthicalAI Module
 * 
 * Shared ethics enforcement module for Ten Rules and professional ethics.
 * Provides structured access to values, rules, and ethics tools.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule, ModuleConfig, ModuleResource } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ethicalAIGuard } from '../../tools/ethical-ai-guard.js';
import { tenRulesChecker } from '../../tools/ten-rules-checker.js';
import { ethicsPolicyExplainer } from '../../tools/ethics-policy-explainer.js';
import { CORE_VALUES, VALUES_JSON } from './values.js';
import { TEN_RULES, TEN_RULES_JSON } from './ten-rules.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class EthicalAIModule extends BaseModule {
  constructor() {
    const config: ModuleConfig = {
      name: 'ethical_ai',
      description: 'EthicalAI Module - Shared ethics enforcement module for Ten Rules and professional ethics',
      version: '1.4.0',
      tools: [
        ethicalAIGuard,
        tenRulesChecker,
        ethicsPolicyExplainer,
      ],
      resources: [
        {
          id: 'values',
          type: 'data',
          content: CORE_VALUES,
          description: 'Core values definition (truth, user sovereignty, transparency, portability, value, sustainability)',
          version: '1.4',
        },
        {
          id: 'ten_rules',
          type: 'data',
          content: TEN_RULES,
          description: 'The Ten Rules for Ethical AI/Human Interactions (Version 1.4)',
          version: '1.4',
        },
        {
          id: 'values_json',
          type: 'data',
          content: VALUES_JSON,
          description: 'Core values as JSON string',
          version: '1.4',
        },
        {
          id: 'ten_rules_json',
          type: 'data',
          content: TEN_RULES_JSON,
          description: 'Ten Rules as JSON string',
          version: '1.4',
        },
        {
          id: 'ethics_md',
          type: 'file',
          path: join(__dirname, '../../../../ethics.md'),
          description: 'Full ethics.md document (The Ten Rules)',
          version: '1.4',
        },
      ],
      prompts: [
        {
          id: 'ethics_injection',
          template: `You must follow The Ten Rules for Ethical AI/Human Interactions (Version 1.4):

{{rules_summary}}

[Context-specific rule adaptations: {{context}}]`,
          variables: ['rules_summary', 'context'],
          description: 'Template for injecting Ten Rules into system prompts',
        },
        {
          id: 'ethics_review',
          template: `Review the following {{content_type}} against The Ten Rules:

Content: {{content}}

Context: {{context}}

Check for compliance with all Ten Rules, especially:
- Rule 1 (Truth Standard): Are facts verifiable?
- Rule 2 (Classification): Are statements properly classified?
- Rule 4 (Foundation): Are sources cited?
- Rule 9 (Transparency): Are limitations disclosed?`,
          variables: ['content_type', 'content', 'context'],
          description: 'Template for ethics review prompts',
        },
      ],
    };

    super(config);
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // Module is ready to use - resources are already loaded
    // Could add initialization logic here if needed (e.g., loading external data)
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    const { tool, args } = input;

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: No tool specified. Available tools: ethical_ai_guard, ten_rules_checker, ethics_policy_explainer',
          },
        ],
        isError: true,
      };
    }

    // Route to appropriate tool
    switch (tool) {
      case 'ethical_ai_guard':
      case 'guard':
        return await this.executeTool('ethical_ai_guard', args);
      
      case 'ten_rules_checker':
      case 'checker':
      case 'check':
        return await this.executeTool('ten_rules_checker', args);
      
      case 'ethics_policy_explainer':
      case 'explainer':
      case 'explain':
        return await this.executeTool('ethics_policy_explainer', args);
      
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Unknown tool "${tool}". Available tools: ethical_ai_guard, ten_rules_checker, ethics_policy_explainer`,
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for this module
  }

  /**
   * Get core values
   */
  getValues() {
    return CORE_VALUES;
  }

  /**
   * Get Ten Rules
   */
  getTenRules() {
    return TEN_RULES;
  }

  /**
   * Get a specific rule by ID
   */
  getRule(ruleId: string) {
    return TEN_RULES.find(r => r.id === ruleId);
  }

  /**
   * Get a specific value by ID
   */
  getValue(valueId: string) {
    return CORE_VALUES.values.find(v => v.id === valueId);
  }
}

/**
 * Export singleton instance
 */
export const ethicalAIModule = new EthicalAIModule();

