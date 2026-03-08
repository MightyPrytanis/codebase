/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * GoodCounsel Prompt Tools
 * MCP tools for managing event-driven GoodCounsel prompts
 */

import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  eventDrivenGoodCounsel,
  PromptContext,
} from '../engines/goodcounsel/event-driven-prompts.js';

const GetPromptsSchema = z.object({
  userId: z.string().describe('User ID'),
});

const DismissPromptSchema = z.object({
  promptId: z.string().describe('Prompt ID to dismiss'),
});

const SnoozePromptTypeSchema = z.object({
  userId: z.string().describe('User ID'),
  promptType: z.string().describe('Prompt type to snooze'),
  hours: z.number().describe('Hours to snooze'),
});

const GetPromptHistorySchema = z.object({
  userId: z.string().describe('User ID'),
  limit: z.number().optional().default(50).describe('Maximum number of prompts to return'),
});

const EvaluateContextSchema = z.object({
  userId: z.string().describe('User ID'),
  focusSessionDuration: z.number().optional().describe('Focus session duration in minutes'),
  lastClientContact: z.string().optional().describe('ISO date string of last client contact'),
  activeMatters: z.array(z.string()).optional().describe('Array of active matter IDs'),
  emergencyFilingsCount: z.number().optional().describe('Count of emergency filings'),
  redFlagAlertsCount: z.number().optional().describe('Count of red flag alerts'),
  timeSinceLastPrompt: z.number().optional().describe('Minutes since last prompt'),
});

export const getGoodCounselPromptsTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'get_goodcounsel_prompts',
      description: 'Get active GoodCounsel prompts for a user',
      inputSchema: {
        type: 'object' as const,
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
          },
        },
        required: ['userId'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const { userId } = GetPromptsSchema.parse(args);
      const prompts = eventDrivenGoodCounsel.getActivePrompts(userId);
      return this.createSuccessResult(JSON.stringify(prompts, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Failed to get prompts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

export const dismissGoodCounselPromptTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'dismiss_goodcounsel_prompt',
      description: 'Dismiss a GoodCounsel prompt',
      inputSchema: {
        type: 'object' as const,
        properties: {
          promptId: {
            type: 'string',
            description: 'Prompt ID to dismiss',
          },
        },
        required: ['promptId'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const { promptId } = DismissPromptSchema.parse(args);
      eventDrivenGoodCounsel.dismissPrompt(promptId);
      return this.createSuccessResult(JSON.stringify({ success: true, promptId }));
    } catch (error) {
      return this.createErrorResult(
        `Failed to dismiss prompt: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

export const snoozeGoodCounselPromptTypeTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'snooze_goodcounsel_prompt_type',
      description: 'Snooze a GoodCounsel prompt type for a user',
      inputSchema: {
        type: 'object' as const,
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
          },
          promptType: {
            type: 'string',
            description: 'Prompt type to snooze',
          },
          hours: {
            type: 'number',
            description: 'Hours to snooze',
          },
        },
        required: ['userId', 'promptType', 'hours'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const { userId, promptType, hours } = SnoozePromptTypeSchema.parse(args);
      eventDrivenGoodCounsel.snoozePromptType(userId, promptType as any, hours);
      return this.createSuccessResult(
        JSON.stringify({ success: true, userId, promptType, hours })
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to snooze prompt type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

export const getGoodCounselPromptHistoryTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'get_goodcounsel_prompt_history',
      description: 'Get GoodCounsel prompt history for a user',
      inputSchema: {
        type: 'object' as const,
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of prompts to return',
            default: 50,
          },
        },
        required: ['userId'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const { userId, limit } = GetPromptHistorySchema.parse(args);
      const history = eventDrivenGoodCounsel.getPromptHistory(userId, limit);
      return this.createSuccessResult(JSON.stringify(history, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Failed to get prompt history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

export const evaluateGoodCounselContextTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'evaluate_goodcounsel_context',
      description: 'Evaluate context and generate GoodCounsel prompts',
      inputSchema: {
        type: 'object' as const,
        properties: {
          userId: {
            type: 'string',
            description: 'User ID',
          },
          focusSessionDuration: {
            type: 'number',
            description: 'Focus session duration in minutes',
          },
          lastClientContact: {
            type: 'string',
            description: 'ISO date string of last client contact',
          },
          activeMatters: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of active matter IDs',
          },
          emergencyFilingsCount: {
            type: 'number',
            description: 'Count of emergency filings',
          },
          redFlagAlertsCount: {
            type: 'number',
            description: 'Count of red flag alerts',
          },
          timeSinceLastPrompt: {
            type: 'number',
            description: 'Minutes since last prompt',
          },
        },
        required: ['userId'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const parsed = EvaluateContextSchema.parse(args);
      const context: PromptContext = {
        userId: parsed.userId,
        focusSessionDuration: parsed.focusSessionDuration,
        lastClientContact: parsed.lastClientContact ? new Date(parsed.lastClientContact) : undefined,
        activeMatters: parsed.activeMatters,
        emergencyFilingsCount: parsed.emergencyFilingsCount,
        redFlagAlertsCount: parsed.redFlagAlertsCount,
        timeSinceLastPrompt: parsed.timeSinceLastPrompt,
      };

      const prompts = eventDrivenGoodCounsel.evaluateContext(context);
      return this.createSuccessResult(JSON.stringify(prompts, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Failed to evaluate context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

