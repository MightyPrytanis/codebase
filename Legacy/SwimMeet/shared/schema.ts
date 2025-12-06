import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  status: text("status").default('active'),
  lastLogin: timestamp("last_login"),
  encryptedCredentials: json("encrypted_credentials").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  query: text("query").notNull(),
  mode: text("mode").notNull().default("dive"), // dive, turn, work
  attachedFiles: json("attached_files").$type<{
    id: string;
    filename: string;
    size: number;
    type: string;
    objectPath: string;
    uploadedAt: string;
  }[]>().default([]),
  workflowState: json("workflow_state").$type<{
    originalQuery?: string;
    participatingAIs?: string[];
    currentStep?: number;
    totalSteps?: number;
    collaborativeDoc?: string;
    startedAt?: string;
    strategy?: 'sequential' | 'parallel_merge' | 'specialist_teams' | 'iterative_refinement' | 'competitive_selection';
    queryAnalysis?: {
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      type: 'analytical' | 'creative' | 'technical' | 'strategic' | 'research';
      scope: 'focused' | 'multi-faceted' | 'interdisciplinary';
      timeframe: 'immediate' | 'planning' | 'long-term';
      collaboration_need: 'low' | 'medium' | 'high' | 'critical';
    };
    steps?: {
      step: number;
      assignedAI: string;
      objective: string;
      prompt: string;
      completed: boolean;
      output: string;
      completedAt?: string;
    }[];
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  aiProvider: text("ai_provider").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, complete, error
  award: text("award"), // gold, silver, bronze, finished, quit, titanic
  responseTimeMs: varchar("response_time_ms"), // time taken to generate response
  verificationStatus: text("verification_status").default("none"), // none, pending, complete, failed
  verificationResults: json("verification_results").$type<{
    verifiedBy: string;
    accuracyScore: number;
    factualErrors: string[];
    strengths: string[];
    weaknesses: string[];
    overallAssessment: string;
    recommendations: string[];
  }[]>().default([]),
  workStep: varchar("work_step"), // For WORK mode: which step this response belongs to
  handoffData: json("handoff_data").$type<{
    previousStep?: number;
    nextAI?: string;
    contextSummary?: string;
    taskSpecification?: string;
    buildingBlocks?: string[];
  }>().default({}),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  query: true,
  mode: true,
  workflowState: true,
  attachedFiles: true,
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  conversationId: true,
  aiProvider: true,
  content: true,
  status: true,
  workStep: true,
  handoffData: true,
  metadata: true,
});

export const credentialsSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  microsoft: z.string().optional(),
  perplexity: z.string().optional(),
  deepseek: z.string().optional(),
  grok: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// File attachments table for standard file storage
export const fileAttachments = pgTable("file_attachments", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalName: varchar("original_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FileAttachment = typeof fileAttachments.$inferSelect;
export type InsertFileAttachment = typeof fileAttachments.$inferInsert;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;
export type Credentials = z.infer<typeof credentialsSchema>;

export interface AIProvider {
  id: string;
  name: string;
  company: string;
  requiresApiKey: boolean;
  status: 'connected' | 'setup_required' | 'error' | 'disabled';
}

export interface QueryRequest {
  query: string;
  selectedAIs: string[];
  conversationId?: string;
}

export interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  timestamp: string;
  award?: 'gold' | 'silver' | 'bronze' | 'finished' | 'quit' | 'titanic';
  awardSaved?: boolean;
  verificationStatus?: 'none' | 'pending' | 'complete' | 'failed';
  verificationResults?: {
    verifiedBy: string;
    accuracyScore: number;
    factualErrors: string[];
    strengths: string[];
    weaknesses: string[];
    overallAssessment: string;
    recommendations: string[];
  }[];
  metadata?: {
    critiqueResponse?: {
      sharedAt: string;
      aiResponse: string;
    };
    [key: string]: any;
  };
}

// Disposable access tokens for temporary AI entry
export const disposableTokens = pgTable("disposable_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  description: varchar("description"), // e.g., "AI access for ChatGPT analysis"
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DisposableToken = typeof disposableTokens.$inferSelect;
export type InsertDisposableToken = typeof disposableTokens.$inferInsert;
