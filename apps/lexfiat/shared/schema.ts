/**
 * LexFiat Schema Types (Client-Only Re-Export)
 * 
 * This file now only re-exports TypeScript types from the shared types package.
 * The runtime Drizzle schema has been moved to Cyrano/src/lexfiat-schema.ts
 * to prevent server-only dependencies from being pulled into the client bundle.
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
} from "../../../shared/types/lexfiat-types";
