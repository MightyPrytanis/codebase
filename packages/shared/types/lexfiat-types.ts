/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * LexFiat Client-Only Types
 * 
 * This file contains plain TypeScript type definitions for entities
 * used by both client and server. It has NO runtime imports to prevent
 * bundling server-only packages (drizzle-orm, pg, etc.) into the client.
 */

export interface Attorney {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  profilePhotoUrl: string | null;
  clioApiKey: string | null;
  gmailCredentials: any | null;
  calendarConnected: boolean | null;
  westlawConnected: boolean | null;
  westlawApiKey: string | null;
  claudeConnected: boolean | null;
  claudeApiKey: string | null;
  dashboardLayout: any | null;
  createdAt: Date | null;
}

export interface LegalCase {
  id: string;
  title: string;
  caseNumber: string | null;
  clientName: string;
  court: string | null;
  caseType: string;
  status: string;
  attorneyId: string | null;
  clioMatterId: string | null;
  balanceDue: number | null;
  unbilledHours: number | null;
  procedurePosture: string | null;
  keyFacts: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  content: string | null;
  source: string;
  sourceId: string | null;
  caseId: string | null;
  attorneyId: string | null;
  analyzed: boolean | null;
  urgencyLevel: string | null;
  dueDate: Date | null;
  createdAt: Date | null;
}

export interface RedFlag {
  id: string;
  documentId: string | null;
  caseId: string | null;
  type: string;
  description: string;
  severity: string;
  addressed: boolean | null;
  createdAt: Date | null;
}

export interface WorkflowModule {
  id: string;
  name: string;
  type: string;
  active: boolean | null;
  attorneyId: string | null;
  config: any | null;
  lastActivity: Date | null;
}

export interface AiAnalysis {
  id: string;
  documentId: string | null;
  analysisType: string;
  result: any | null;
  confidence: number | null;
  workflowModuleId: string | null;
  secondaryReview: any | null;
  secondaryReviewProvider: string | null;
  reviewStatus: string | null;
  createdAt: Date | null;
}

export interface Feedback {
  id: string;
  attorneyId: string | null;
  type: string;
  title: string;
  description: string;
  priority: string | null;
  status: string | null;
  attachments: any | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AiProvider {
  id: string;
  attorneyId: string | null;
  provider: string;
  apiKey: string | null;
  enabled: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MaeWorkflow {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config: any | null;
  isTemplate: boolean | null;
  isActive: boolean | null;
  attorneyId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MaeWorkflowStep {
  id: string;
  workflowId: string | null;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config: any | null;
  isCompleted: boolean | null;
  createdAt: Date | null;
}

export interface MaeWorkflowExecution {
  id: string;
  workflowId: string | null;
  caseId: string | null;
  status: string;
  currentStep: number | null;
  results: any | null;
  executionData: any | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date | null;
}

// Insert types for create operations
export interface InsertAttorney {
  name: string;
  email: string;
  specialization?: string | null;
  profilePhotoUrl?: string | null;
}

export interface InsertLegalCase {
  title: string;
  caseNumber?: string | null;
  clientName: string;
  court?: string | null;
  caseType: string;
  attorneyId?: string | null;
  clioMatterId?: string | null;
}

export interface InsertDocument {
  title: string;
  type: string;
  content?: string | null;
  source: string;
  sourceId?: string | null;
  caseId?: string | null;
  urgencyLevel?: string | null;
}

export interface InsertRedFlag {
  documentId?: string | null;
  caseId?: string | null;
  type: string;
  description: string;
  severity: string;
}

export interface InsertFeedback {
  attorneyId?: string | null;
  type: string;
  title: string;
  description: string;
  priority?: string | null;
  attachments?: any | null;
}

export interface InsertAiProvider {
  attorneyId?: string | null;
  provider: string;
  apiKey?: string | null;
  enabled?: boolean | null;
}

export interface InsertMaeWorkflow {
  name: string;
  type: string;
  description?: string | null;
  config?: any | null;
  isTemplate?: boolean | null;
  attorneyId?: string | null;
}

export interface InsertMaeWorkflowStep {
  workflowId?: string | null;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config?: any | null;
}

export interface InsertMaeWorkflowExecution {
  workflowId?: string | null;
  caseId?: string | null;
  status: string;
  currentStep?: number | null;
  results?: any | null;
  executionData?: any | null;
}
