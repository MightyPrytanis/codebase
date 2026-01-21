/*
 * Skill Dispatcher
 * Routes skill execution to appropriate engine workflows based on skill frontmatter.
 * Implements CrewAI/LangGraph-style skill → workflow binding.
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { LoadedSkill } from './base-skill.js';
import { engineRegistry } from '../engines/registry.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logicAuditService } from '../services/logic-audit-service.js';

export interface SkillExecutionRequest {
  skillId: string;
  input: Record<string, any>;
  context?: Record<string, any>;
}

export interface SkillExecutionResult extends CallToolResult {
  skillId: string;
  skillName: string;
  workflowUsed?: string;
  engineUsed?: string;
}

/**
 * Skill Dispatcher
 * 
 * Routes skills to engine workflows based on frontmatter configuration.
 * Handles:
 * - Workflow resolution (engine:workflow_id format)
 * - Input validation against skill schema
 * - Error mode handling
 * - Audit logging
 */
export class SkillDispatcher {
  /**
   * Execute a skill by routing to its configured workflow
   */
  async execute(
    skill: LoadedSkill,
    request: SkillExecutionRequest
  ): Promise<SkillExecutionResult> {
    const { skill: skillDef, frontmatter } = skill;
    const startTime = Date.now();

    try {
      // Step 1: Validate input against schema
      const validationResult = this.validateInput(request.input, frontmatter.input_schema);
      if (!validationResult.valid) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'INPUT_VALIDATION_FAILED',
                message: 'Input does not match skill schema',
                details: validationResult.errors,
              }, null, 2),
            },
          ],
          isError: true,
          skillId: skillDef.skillId,
          skillName: frontmatter.name,
        };
      }

      // Step 2: Check required context
      if (frontmatter.usage_policy?.requires_context) {
        const missingContext = frontmatter.usage_policy.requires_context.filter(
          key => !request.context?.[key] && !request.input[key]
        );
        if (missingContext.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'MISSING_CONTEXT',
                  message: 'Required context keys missing',
                  missing: missingContext,
                }, null, 2),
              },
            ],
            isError: true,
            skillId: skillDef.skillId,
            skillName: frontmatter.name,
          };
        }
      }

      // Step 3: Resolve workflow
      const workflowInfo = this.resolveWorkflow(frontmatter);
      if (!workflowInfo) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'WORKFLOW_NOT_FOUND',
                message: `Could not resolve workflow for skill ${skillDef.skillId}`,
                frontmatter: {
                  engine: frontmatter.engine,
                  workflow_id: frontmatter.workflow_id,
                },
              }, null, 2),
            },
          ],
          isError: true,
          skillId: skillDef.skillId,
          skillName: frontmatter.name,
        };
      }

      // Step 4: Prepare workflow input
      // Merge input and context - workflow steps will use this as their context
      const workflowInput = {
        ...request.context,
        ...request.input,
        // Add skill metadata for workflow steps that might need it
        _skill_metadata: {
          skillId: skillDef.skillId,
          domain: frontmatter.domain,
          proficiency: frontmatter.proficiency,
        },
      };

      // Step 5: Execute workflow
      const workflowResult = await workflowInfo.engine.executeWorkflow(
        workflowInfo.workflowId,
        workflowInput
      );

      // Step 6: Validate output against schema (if provided)
      if (frontmatter.output_schema && !workflowResult.isError) {
        const outputValidation = this.validateOutput(workflowResult, frontmatter.output_schema);
        if (!outputValidation.valid) {
          // Log but don't fail - output validation is advisory
          await logicAuditService.capture({
            timestamp: new Date().toISOString(),
            engine: workflowInfo.engineName,
            stepId: workflowInfo.workflowId,
            input: workflowInput,
            error: 'Output schema validation warning',
            metadata: {
              skillId: skillDef.skillId,
              validationErrors: outputValidation.errors,
            },
          });
        }
      }

      // Step 7: Map error modes if workflow failed
      if (workflowResult.isError) {
        const errorMode = this.mapErrorToMode(workflowResult, frontmatter.error_modes);
        if (errorMode) {
          workflowResult.metadata = {
            ...workflowResult.metadata,
            error_mode: errorMode.code,
            recoverable: errorMode.recoverable,
          };
        }
      }

      // Step 8: Return result with skill metadata
      return {
        ...workflowResult,
        skillId: skillDef.skillId,
        skillName: frontmatter.name,
        workflowUsed: workflowInfo.workflowId,
        engineUsed: workflowInfo.engineName,
        metadata: {
          ...workflowResult.metadata,
          execution_time_ms: Date.now() - startTime,
          skill_version: frontmatter.version,
          skill_stability: frontmatter.stability || 'beta',
        },
      };
    } catch (error) {
      // Capture unexpected errors
      await logicAuditService.capture({
        timestamp: new Date().toISOString(),
        engine: frontmatter.engine || 'unknown',
        stepId: frontmatter.workflow_id || 'unknown',
        input: request.input,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          skillId: skillDef.skillId,
          skillName: frontmatter.name,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'SKILL_EXECUTION_FAILED',
              message: error instanceof Error ? error.message : String(error),
              skillId: skillDef.skillId,
            }, null, 2),
          },
        ],
        isError: true,
        skillId: skillDef.skillId,
        skillName: frontmatter.name,
      };
    }
  }

  /**
   * Resolve workflow from frontmatter (engine:workflow_id format)
   */
  private resolveWorkflow(frontmatter: LoadedSkill['frontmatter']): {
    engine: any; // BaseEngine instance
    engineName: string;
    workflowId: string;
  } | null {
    if (!frontmatter.workflow_id && !frontmatter.engine) {
      return null;
    }

    // Parse workflow_id (format: "engine:workflow_id" or just "workflow_id")
    let engineName: string;
    let workflowId: string;

    if (frontmatter.workflow_id?.includes(':')) {
      [engineName, workflowId] = frontmatter.workflow_id.split(':', 2);
    } else {
      engineName = frontmatter.engine || 'mae';
      workflowId = frontmatter.workflow_id || '';
    }

    // Get engine from registry
    const engine = engineRegistry.get(engineName);
    if (!engine) {
      return null;
    }

    // Verify workflow exists
    const workflow = engine.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    return { engine, engineName, workflowId };
  }

  /**
   * Validate input against skill schema
   */
  private validateInput(
    input: Record<string, any>,
    schema?: LoadedSkill['frontmatter']['input_schema']
  ): { valid: boolean; errors: string[] } {
    if (!schema) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in input) || input[field] === undefined || input[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check type constraints (basic validation)
    if (schema.properties) {
      for (const [field, spec] of Object.entries(schema.properties)) {
        if (field in input) {
          const value = input[field];
          const expectedType = spec.type;

          if (expectedType === 'string' && typeof value !== 'string') {
            errors.push(`Field ${field} must be a string`);
          } else if (expectedType === 'number' && typeof value !== 'number') {
            errors.push(`Field ${field} must be a number`);
          } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
            errors.push(`Field ${field} must be a boolean`);
          } else if (expectedType === 'array' && !Array.isArray(value)) {
            errors.push(`Field ${field} must be an array`);
          } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            errors.push(`Field ${field} must be an object`);
          }

          // Check enum constraints
          if (spec.enum && !spec.enum.includes(value)) {
            errors.push(`Field ${field} must be one of: ${spec.enum.join(', ')}`);
          }

          // Check min/max for numbers
          if (expectedType === 'number') {
            if (spec.minimum !== undefined && value < spec.minimum) {
              errors.push(`Field ${field} must be >= ${spec.minimum}`);
            }
            if (spec.maximum !== undefined && value > spec.maximum) {
              errors.push(`Field ${field} must be <= ${spec.maximum}`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate output against skill schema (advisory)
   */
  private validateOutput(
    result: CallToolResult,
    schema?: LoadedSkill['frontmatter']['output_schema']
  ): { valid: boolean; errors: string[] } {
    if (!schema || result.isError) {
      return { valid: true, errors: [] };
    }

    // Extract JSON from result content
    let output: any;
    try {
      const textContent = result.content.find(c => c.type === 'text')?.text || '{}';
      output = JSON.parse(textContent);
    } catch {
      return { valid: true, errors: [] }; // Can't validate non-JSON output
    }

    const errors: string[] = [];

    // Basic structure validation (can be enhanced)
    if (schema.properties) {
      for (const [field, spec] of Object.entries(schema.properties)) {
        if (schema.required?.includes(field) && !(field in output)) {
          errors.push(`Missing required output field: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }


  /**
   * Map workflow error to skill error mode
   */
  private mapErrorToMode(
    result: CallToolResult,
    errorModes?: LoadedSkill['frontmatter']['error_modes']
  ): NonNullable<LoadedSkill['frontmatter']['error_modes']>[number] | null {
    if (!errorModes || !Array.isArray(errorModes) || errorModes.length === 0 || !result.isError) {
      return null;
    }

    // Try to extract error code from result
    let errorText = '';
    try {
      const textContent = result.content.find(c => c.type === 'text')?.text || '';
      const parsed = JSON.parse(textContent);
      errorText = parsed.error || parsed.message || '';
    } catch {
      errorText = result.content.find(c => c.type === 'text')?.text || '';
    }

    // Match against error modes (errorModes is guaranteed to be array here)
    // TypeScript needs explicit narrowing after the guard clause
    const modes: LoadedSkill['frontmatter']['error_modes'] = errorModes;
    for (const mode of modes) {
      if (errorText.toUpperCase().includes(mode.code)) {
        return mode;
      }
    }

    // Return first error mode as fallback (modes is guaranteed non-empty array here)
    // We already checked length > 0 in the guard clause, so modes[0] is safe
    // Type assertion needed because TypeScript doesn't narrow the tuple type properly
    const firstMode = modes[0];
    return firstMode as NonNullable<LoadedSkill['frontmatter']['error_modes']>[number];
  }
}

export const skillDispatcher = new SkillDispatcher();
