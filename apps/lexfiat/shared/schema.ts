/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * LexFiat Client Schema - Type Re-exports Only
 * 
 * This file re-exports types from the shared types package to prevent
 * bundling server-only runtime packages (drizzle-orm, drizzle-zod, pg)
 * into the client bundle.
 * 
 * For runtime schema definitions, see: Cyrano/src/lexfiat-schema.ts
 */

export type {
  Attorney,
  LegalCase,
  Document,
  RedFlag,
  WorkflowModule,
  AiAnalysis,
  Feedback,
  AiProvider,
  MaeWorkflow,
  MaeWorkflowStep,
  MaeWorkflowExecution,
  InsertAttorney,
  InsertLegalCase,
  InsertDocument,
  InsertRedFlag,
  InsertFeedback,
  InsertAiProvider,
  InsertMaeWorkflow,
  InsertMaeWorkflowStep,
  InsertMaeWorkflowExecution,
} from "../../../packages/shared/types/lexfiat-types";
