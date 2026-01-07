/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Client-only type definitions for LexFiat entities
 * This file contains plain TypeScript types with no runtime imports
 */

export type User = {
  id: string;
  username: string;
  password: string;
};

export type Attorney = {
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
  createdAt: Date | string | null;
};

export type LegalCase = {
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
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export type Document = {
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
  dueDate: Date | string | null;
  createdAt: Date | string | null;
};

export type RedFlag = {
  id: string;
  documentId: string | null;
  caseId: string | null;
  type: string;
  description: string;
  severity: string;
  addressed: boolean | null;
  createdAt: Date | string | null;
};

export type WorkflowModule = {
  id: string;
  name: string;
  type: string;
  active: boolean | null;
  attorneyId: string | null;
  config: any | null;
  lastActivity: Date | string | null;
};

export type MaeWorkflow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config: any | null;
  isTemplate: boolean | null;
  isActive: boolean | null;
  attorneyId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export type MaeWorkflowStep = {
  id: string;
  workflowId: string | null;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config: any | null;
  isCompleted: boolean | null;
  createdAt: Date | string | null;
};

export type MaeWorkflowExecution = {
  id: string;
  workflowId: string | null;
  caseId: string | null;
  status: string;
  currentStep: number | null;
  results: any | null;
  executionData: any | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  createdAt: Date | string | null;
};

export type AiAnalysis = {
  id: string;
  documentId: string | null;
  analysisType: string;
  result: any | null;
  confidence: number | null;
  workflowModuleId: string | null;
  secondaryReview: any | null;
  secondaryReviewProvider: string | null;
  reviewStatus: string | null;
  createdAt: Date | string | null;
};

export type Feedback = {
  id: string;
  attorneyId: string | null;
  type: string;
  title: string;
  description: string;
  priority: string | null;
  status: string | null;
  attachments: any | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export type AiProvider = {
  id: string;
  attorneyId: string | null;
  provider: string;
  apiKey: string | null;
  enabled: boolean | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

// Insert types (for client-side form validation)
export type InsertAttorney = {
  name: string;
  email: string;
  specialization?: string | null;
  profilePhotoUrl?: string | null;
};

export type InsertLegalCase = {
  title: string;
  caseNumber?: string | null;
  clientName: string;
  court?: string | null;
  caseType: string;
  attorneyId?: string | null;
  clioMatterId?: string | null;
};

export type InsertDocument = {
  title: string;
  type: string;
  content?: string | null;
  source: string;
  sourceId?: string | null;
  caseId?: string | null;
  urgencyLevel?: string | null;
};

export type InsertRedFlag = {
  documentId?: string | null;
  caseId?: string | null;
  type: string;
  description: string;
  severity: string;
};

export type InsertFeedback = {
  attorneyId?: string | null;
  type: string;
  title: string;
  description: string;
  priority?: string | null;
  attachments?: any | null;
};

export type InsertAiProvider = {
  attorneyId?: string | null;
  provider: string;
  apiKey?: string | null;
  enabled?: boolean | null;
};

export type InsertMaeWorkflow = {
  name: string;
  type: string;
  description?: string | null;
  config?: any | null;
  isTemplate?: boolean | null;
  attorneyId?: string | null;
};

export type InsertMaeWorkflowStep = {
  workflowId?: string | null;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config?: any | null;
};

export type InsertMaeWorkflowExecution = {
  workflowId?: string | null;
  caseId?: string | null;
  status?: string;
  currentStep?: number | null;
  results?: any | null;
  executionData?: any | null;
};
