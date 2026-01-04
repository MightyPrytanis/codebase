/*
 * Skill Executor Tool
 * MCP-callable tool for executing skills via the skill dispatcher.
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { skillRegistry } from '../skills/skill-registry.js';
import { skillDispatcher } from '../skills/skill-dispatcher.js';

const SkillExecutorSchema = z.object({
  skill_id: z.string().describe('Skill ID (e.g., "forensic-finance:dro-weatherpro-skill")'),
  input: z.record(z.string(), z.any()).describe('Input data matching the skill\'s input_schema'),
  context: z.record(z.string(), z.any()).optional().describe('Additional context (matter_id, user_id, etc.)'),
});

export const skillExecutor = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'skill_executor',
      description: 'Execute a skill by ID. Skills are declarative expertise modules defined in .cursor/skills or Cyrano/src/skills. Returns skill execution results with workflow metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          skill_id: {
            type: 'string',
            description: 'Skill ID (e.g., "forensic-finance:dro-weatherpro-skill")',
          },
          input: {
            type: 'object',
            description: 'Input data matching the skill\'s input_schema',
            additionalProperties: true,
          },
          context: {
            type: 'object',
            description: 'Additional context (matter_id, user_id, etc.)',
            additionalProperties: true,
          },
        },
        required: ['skill_id', 'input'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = SkillExecutorSchema.parse(args);

      // Get skill from registry
      const skill = skillRegistry.get(parsed.skill_id);
      if (!skill) {
        return this.createErrorResult(
          `Skill not found: ${parsed.skill_id}`
        );
      }

      // Execute skill via dispatcher
      const result = await skillDispatcher.execute(skill, {
        skillId: parsed.skill_id,
        input: parsed.input,
        context: parsed.context,
      });

      return result;
    } catch (error) {
      return this.createErrorResult(
        `Skill execution failed: ${error instanceof Error ? error.message : String(error)}`,
        'SKILL_EXECUTION_ERROR'
      );
    }
  }
})();
