/**
 * Client-only types for LexFiat entities
 * No runtime imports - pure TypeScript types for frontend use
 */

export interface Attorney {
  id: string;
  name: string;
  email: string;
  specialization?: string | null;
  profilePhotoUrl?: string | null;
  clioApiKey?: string | null;
  gmailCredentials?: any | null;
  calendarConnected?: boolean | null;
  westlawConnected?: boolean | null;
  westlawApiKey?: string | null;
  claudeConnected?: boolean | null;
  claudeApiKey?: string | null;
  dashboardLayout?: any | null;
  createdAt?: string | Date | null;
}

export interface LegalCase {
  id: string;
  title: string;
  caseNumber?: string | null;
  clientName: string;
  court?: string | null;
  caseType: string;
  status: string;
  attorneyId?: string | null;
  clioMatterId?: string | null;
  balanceDue?: number | null;
  unbilledHours?: number | null;
  procedurePosture?: string | null;
  keyFacts?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  content?: string | null;
  source: string;
  sourceId?: string | null;
  caseId?: string | null;
  attorneyId?: string | null;
  analyzed?: boolean | null;
  urgencyLevel?: string | null;
  dueDate?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface RedFlag {
  id: string;
  documentId?: string | null;
  caseId?: string | null;
  type: string;
  description: string;
  severity: string;
  addressed?: boolean | null;
  createdAt?: string | Date | null;
}

export interface WorkflowModule {
  id: string;
  name: string;
  type: string;
  active?: boolean | null;
  attorneyId?: string | null;
  config?: any | null;
  lastActivity?: string | Date | null;
}

export interface AiAnalysis {
  id: string;
  documentId?: string | null;
  analysisType: string;
  result?: any | null;
  confidence?: number | null;
  workflowModuleId?: string | null;
  secondaryReview?: any | null;
  secondaryReviewProvider?: string | null;
  reviewStatus?: string | null;
  createdAt?: string | Date | null;
}

export interface Feedback {
  id: string;
  attorneyId?: string | null;
  type: string;
  title: string;
  description: string;
  priority?: string | null;
  status?: string | null;
  attachments?: any | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface AiProvider {
  id: string;
  attorneyId?: string | null;
  provider: string;
  apiKey?: string | null;
  enabled?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface MaeWorkflow {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  config?: any | null;
  isTemplate?: boolean | null;
  isActive?: boolean | null;
  attorneyId?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface MaeWorkflowStep {
  id: string;
  workflowId?: string | null;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config?: any | null;
  isCompleted?: boolean | null;
  createdAt?: string | Date | null;
}

export interface MaeWorkflowExecution {
  id: string;
  workflowId?: string | null;
  caseId?: string | null;
  status: string;
  currentStep?: number | null;
  results?: any | null;
  executionData?: any | null;
  startedAt?: string | Date | null;
  completedAt?: string | Date | null;
  createdAt?: string | Date | null;
}

// Insert types for client use
export interface InsertAttorney {
  name: string;
  email: string;
  specialization?: string;
  profilePhotoUrl?: string;
}

export interface InsertLegalCase {
  title: string;
  caseNumber?: string;
  clientName: string;
  court?: string;
  caseType: string;
  attorneyId?: string;
  clioMatterId?: string;
}

export interface InsertDocument {
  title: string;
  type: string;
  content?: string;
  source: string;
  sourceId?: string;
  caseId?: string;
  urgencyLevel?: string;
}

export interface InsertRedFlag {
  documentId?: string;
  caseId?: string;
  type: string;
  description: string;
  severity: string;
}

export interface InsertFeedback {
  attorneyId?: string;
  type: string;
  title: string;
  description: string;
  priority?: string;
  attachments?: any;
}

export interface InsertAiProvider {
  attorneyId?: string;
  provider: string;
  apiKey?: string;
  enabled?: boolean;
}

export interface InsertMaeWorkflow {
  name: string;
  type: string;
  description?: string;
  config?: any;
  isTemplate?: boolean;
  attorneyId?: string;
}

export interface InsertMaeWorkflowStep {
  workflowId?: string;
  stepOrder: number;
  stepType: string;
  stepName: string;
  config?: any;
}

export interface InsertMaeWorkflowExecution {
  workflowId?: string;
  caseId?: string;
  status?: string;
  currentStep?: number;
  results?: any;
  executionData?: any;
}
