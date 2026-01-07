/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { AIService } from '../services/ai-service.js';
import { skillRegistry } from '../skills/skill-registry.js';

const BetaTestSupportSchema = z.object({
  action: z.enum(['registration', 'onboarding', 'installation', 'evaluation', 'feedback', 'walkthrough', 'troubleshooting']).describe('Type of beta test support needed'),
  user_query: z.string().describe('User\'s question or issue description'),
  context: z.record(z.string(), z.any()).optional().describe('Additional context (invitation_token, user_id, step, error_message, feedback_type, etc.)'),
});

export const betaTestSupport = new (class extends BaseTool {
  public aiService: AIService;

  constructor() {
    super();
    this.aiService = new AIService();
  }

  getToolDefinition() {
    return {
      name: 'beta_test_support',
      description: 'Comprehensive beta testing support - handles registration, onboarding, installation, evaluation, and feedback management for beta testers',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['registration', 'onboarding', 'installation', 'evaluation', 'feedback', 'walkthrough', 'troubleshooting'],
            description: 'The type of beta test support needed',
          },
          user_query: {
            type: 'string',
            description: 'User\'s question or issue description',
          },
          context: {
            type: 'object',
            description: 'Additional context (invitation_token, user_id, step, error_message, feedback_type, etc.)',
            additionalProperties: true,
          },
        },
        required: ['action', 'user_query'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, user_query, context = {} } = BetaTestSupportSchema.parse(args);

      // Try to use beta-test-support skill if available
      const skill = skillRegistry.get('beta-test-support');
      if (skill) {
        try {
          const skillResult = await skill.skill.execute({
            action,
            user_query,
            context,
          });
          
          if (skillResult && !skillResult.isError) {
            return skillResult;
          }
        } catch (skillError) {
          // Fall back to built-in logic if skill execution fails
          console.warn('Beta test support skill execution failed, using fallback:', skillError);
        }
      }

      // Fallback: Built-in beta test support logic
      return await this.handleBetaTestSupport(action, user_query, context);
    } catch (error) {
      return this.createErrorResult(
        `Beta test support error: ${error instanceof Error ? error.message : String(error)}`,
        'beta-test-support'
      );
    }
  }

  async handleBetaTestSupport(action: string, userQuery: string, context: any) {
    const prompt = this.buildSupportPrompt(action, userQuery, context);
    
    const response = await this.aiService.call('perplexity', prompt, {
      systemPrompt: 'You are a helpful beta test support assistant. Provide clear, actionable guidance for beta testers.',
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: response,
        },
      ],
      isError: false,
    };
  }

  buildSupportPrompt(action: string, userQuery: string, context: any): string {
    let prompt = `Beta Test Support Request\n\n`;
    prompt += `Action: ${action}\n`;
    prompt += `User Query: ${userQuery}\n\n`;

    if (context.invitation_token) {
      prompt += `Invitation Token: ${context.invitation_token}\n`;
    }
    if (context.user_id) {
      prompt += `User ID: ${context.user_id}\n`;
    }
    if (context.step) {
      prompt += `Current Step: ${context.step}\n`;
    }
    if (context.error_message) {
      prompt += `Error: ${context.error_message}\n`;
    }
    if (context.feedback_type) {
      prompt += `Feedback Type: ${context.feedback_type}\n`;
    }
    if (context.platform) {
      prompt += `Platform: ${context.platform}\n`;
    }

    prompt += `\nProvide helpful guidance for this beta test support request. `;
    
    switch (action) {
      case 'registration':
        prompt += `Help with beta tester registration and invitation validation.`;
        break;
      case 'onboarding':
        prompt += `Guide the user through the beta test onboarding process.`;
        break;
      case 'installation':
        prompt += `Provide installation instructions and troubleshooting for the specified platform.`;
        break;
      case 'evaluation':
        prompt += `Help with beta test evaluation and testing procedures.`;
        break;
      case 'feedback':
        prompt += `Assist with submitting feedback, bug reports, or feature requests.`;
        break;
      case 'walkthrough':
        prompt += `Provide a step-by-step walkthrough of beta test features.`;
        break;
      case 'troubleshooting':
        prompt += `Help troubleshoot issues and resolve errors.`;
        break;
    }

    return prompt;
  }
})();
