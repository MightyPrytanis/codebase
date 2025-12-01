import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const attorneys = pgTable("attorneys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  specialization: text("specialization"),
  profilePhotoUrl: text("profile_photo_url"),
  clioApiKey: text("clio_api_key"),
  gmailCredentials: json("gmail_credentials"),
  // Additional integration settings
  calendarConnected: boolean("calendar_connected").default(false),
  westlawConnected: boolean("westlaw_connected").default(false),
  westlawApiKey: text("westlaw_api_key"),
  claudeConnected: boolean("claude_connected").default(false),
  claudeApiKey: text("claude_api_key"),
  // Dashboard layout preferences
  dashboardLayout: json("dashboard_layout"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const legalCases = pgTable("legal_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  caseNumber: text("case_number"),
  clientName: text("client_name").notNull(),
  court: text("court"),
  caseType: text("case_type").notNull(), // 'family', 'civil', 'criminal', etc.
  status: text("status").notNull().default('active'), // 'active', 'closed', 'pending'
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  clioMatterId: text("clio_matter_id"),
  balanceDue: integer("balance_due").default(0),
  unbilledHours: integer("unbilled_hours").default(0),
  procedurePosture: text("procedure_posture"),
  keyFacts: text("key_facts"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'motion', 'pleading', 'discovery', 'order', etc.
  content: text("content"),
  source: text("source").notNull(), // 'gmail', 'upload', 'generated'
  sourceId: text("source_id"), // Gmail message ID, etc.
  caseId: varchar("case_id").references(() => legalCases.id),
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  analyzed: boolean("analyzed").default(false),
  urgencyLevel: text("urgency_level").default('normal'), // 'low', 'normal', 'high', 'critical'
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redFlags = pgTable("red_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  caseId: varchar("case_id").references(() => legalCases.id),
  type: text("type").notNull(), // 'allegation', 'deadline', 'disclosure', 'risk'
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  addressed: boolean("addressed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowModules = pgTable("workflow_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'document_intelligence', 'emergency_response', 'mae_compare', 'mae_critique', 'mae_collaborate', 'mae_custom', etc.
  active: boolean("active").default(true),
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  config: json("config"),
  lastActivity: timestamp("last_activity"),
});

// Multi-Agent Engine (MAE) Workflows
export const maeWorkflows = pgTable("mae_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'compare', 'critique', 'collaborate', 'custom'
  description: text("description"),
  config: json("config"), // Workflow configuration and steps
  isTemplate: boolean("is_template").default(false),
  isActive: boolean("is_active").default(true),
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const maeWorkflowSteps = pgTable("mae_workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => maeWorkflows.id),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // 'agent_action', 'human_review', 'automation', 'integration'
  stepName: text("step_name").notNull(),
  config: json("config"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maeWorkflowExecutions = pgTable("mae_workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => maeWorkflows.id),
  caseId: varchar("case_id").references(() => legalCases.id),
  status: text("status").notNull().default('pending'), // 'pending', 'running', 'completed', 'failed', 'paused'
  currentStep: integer("current_step").default(1),
  results: json("results"),
  executionData: json("execution_data"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiAnalyses = pgTable("ai_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  analysisType: text("analysis_type").notNull(), // 'red_flags', 'response_draft', 'summary'
  result: json("result"),
  confidence: integer("confidence"), // 0-100
  workflowModuleId: varchar("workflow_module_id").references(() => workflowModules.id),
  // Cross-check with secondary AI
  secondaryReview: json("secondary_review"),
  secondaryReviewProvider: text("secondary_review_provider"),
  reviewStatus: text("review_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  type: text("type").notNull(), // 'bug', 'feature', 'improvement', 'comment'
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"),
  status: text("status").default("open"),
  attachments: json("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiProviders = pgTable("ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attorneyId: varchar("attorney_id").references(() => attorneys.id),
  provider: text("provider").notNull(), // 'perplexity', 'anthropic', 'openai', 'gemini', 'grok', 'deepseek', 'mapleai'
  apiKey: text("api_key"),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttorneySchema = createInsertSchema(attorneys).pick({
  name: true,
  email: true,
  specialization: true,
  profilePhotoUrl: true,
});

export const insertLegalCaseSchema = createInsertSchema(legalCases).pick({
  title: true,
  caseNumber: true,
  clientName: true,
  court: true,
  caseType: true,
  attorneyId: true,
  clioMatterId: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  type: true,
  content: true,
  source: true,
  sourceId: true,
  caseId: true,
  urgencyLevel: true,
});

export const insertRedFlagSchema = createInsertSchema(redFlags).pick({
  documentId: true,
  caseId: true,
  type: true,
  description: true,
  severity: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  attorneyId: true,
  type: true,
  title: true,
  description: true,
  priority: true,
  attachments: true,
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).pick({
  attorneyId: true,
  provider: true,
  apiKey: true,
  enabled: true,
});

export const insertMaeWorkflowSchema = createInsertSchema(maeWorkflows).pick({
  name: true,
  type: true,
  description: true,
  config: true,
  isTemplate: true,
  attorneyId: true,
});

export const insertMaeWorkflowStepSchema = createInsertSchema(maeWorkflowSteps).pick({
  workflowId: true,
  stepOrder: true,
  stepType: true,
  stepName: true,
  config: true,
});

export const insertMaeWorkflowExecutionSchema = createInsertSchema(maeWorkflowExecutions).pick({
  workflowId: true,
  caseId: true,
  status: true,
  currentStep: true,
  results: true,
  executionData: true,
});

export type InsertAttorney = z.infer<typeof insertAttorneySchema>;
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertRedFlag = z.infer<typeof insertRedFlagSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;
export type InsertMaeWorkflow = z.infer<typeof insertMaeWorkflowSchema>;
export type InsertMaeWorkflowStep = z.infer<typeof insertMaeWorkflowStepSchema>;
export type InsertMaeWorkflowExecution = z.infer<typeof insertMaeWorkflowExecutionSchema>;

export type Attorney = typeof attorneys.$inferSelect;
export type LegalCase = typeof legalCases.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type RedFlag = typeof redFlags.$inferSelect;
export type WorkflowModule = typeof workflowModules.$inferSelect;
export type AiAnalysis = typeof aiAnalyses.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type AiProvider = typeof aiProviders.$inferSelect;
export type MaeWorkflow = typeof maeWorkflows.$inferSelect;
export type MaeWorkflowStep = typeof maeWorkflowSteps.$inferSelect;
export type MaeWorkflowExecution = typeof maeWorkflowExecutions.$inferSelect;
