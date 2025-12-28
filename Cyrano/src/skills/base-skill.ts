/*
 * Skill interfaces for the Cyrano expertise layer.
 * A Skill is a declarative, frontmatter-led wrapper around ModuleConfig
 * so users can author expertise without TypeScript changes.
 * 
 * Skills follow CrewAI/LangGraph/Claude patterns:
 * - Contract-based (input/output schemas, side effects, usage policy)
 * - Testable independently
 * - Composable into workflows
 */
import { ModuleConfig } from '../modules/base-module.js';

/**
 * JSON Schema-like structure for skill inputs/outputs
 * Supports both inline schema objects and references to Zod schemas
 */
export interface SkillSchema {
  type: string;
  required?: string[];
  properties?: Record<string, any>;
  description?: string;
  // For referencing external Zod schemas
  schema_ref?: string;
}

/**
 * Side effects declaration (what the skill reads/writes)
 */
export interface SkillSideEffects {
  reads?: string[]; // e.g., ['clio_integration', 'internal_library']
  writes?: string[]; // e.g., ['library_db', 'audit_log']
  external_calls?: string[]; // e.g., ['lexis_api', 'westlaw_api']
}

/**
 * Usage policy - when the agent should/shouldn't call this skill
 */
export interface SkillUsagePolicy {
  should_call_when?: string[];
  should_not_call_when?: string[];
  requires_context?: string[]; // Required context keys (e.g., ['matter_id', 'jurisdiction'])
}

/**
 * Error modes - expected failure scenarios
 */
export interface SkillErrorMode {
  code: string; // e.g., 'MISSING_MATTER', 'INSUFFICIENT_DATA'
  description: string;
  recoverable?: boolean;
}

export interface SkillFrontmatter {
  // Core metadata
  name: string;
  description: string;
  version: string;
  domain: string; // e.g., 'forensic-finance', 'legal-reasoning'
  proficiency: string[]; // e.g., ['QDRO', 'Michigan family law']
  
  // Stability level (for testing/sharing)
  stability?: 'experimental' | 'beta' | 'stable';
  
  // Resources and prompts (existing)
  resources?: string[];
  prompts?: string[];
  checklist?: string[];
  
  // Contract definition (new)
  input_schema?: SkillSchema;
  output_schema?: SkillSchema;
  side_effects?: SkillSideEffects;
  usage_policy?: SkillUsagePolicy;
  error_modes?: SkillErrorMode[];
  
  // Workflow binding (new)
  workflow_id?: string; // References a workflow in an engine (e.g., 'forecast:qdro_forecast_v1')
  engine?: string; // Target engine name (e.g., 'forecast', 'mae')
  
  // Knowledge scoping (CrewAI-style)
  knowledge_scope?: {
    per_skill?: string[]; // Resource IDs scoped to this skill only
    shared?: string[]; // Resource IDs shared across skills in domain
  };
}

export interface Skill extends ModuleConfig {
  frontmatter: SkillFrontmatter;
  content: string;
  skillId: string;
}

export interface LoadedSkill {
  skill: Skill;
  frontmatter: SkillFrontmatter;
}

