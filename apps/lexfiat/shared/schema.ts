/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * LexFiat Schema - Type-Only Re-exports
 * 
 * This file provides type-only re-exports for the frontend.
 * All types are plain TypeScript with no runtime dependencies.
 * 
 * Server-side runtime schema is located at: Cyrano/src/lexfiat-schema.ts
 * Client-side type definitions are located at: packages/shared/types/lexfiat-types.ts
 */

// Re-export all types from the shared types package
export type {
  User,
  Attorney,
  InsertAttorney,
  LegalCase,
  InsertLegalCase,
  Document,
  InsertDocument,
  RedFlag,
  InsertRedFlag,
  WorkflowModule,
  MaeWorkflow,
  InsertMaeWorkflow,
  MaeWorkflowStep,
  InsertMaeWorkflowStep,
  MaeWorkflowExecution,
  InsertMaeWorkflowExecution,
  AiAnalysis,
  Feedback,
  InsertFeedback,
  AiProvider,
  InsertAiProvider,
} from '../../../packages/shared/types/lexfiat-types.js';
