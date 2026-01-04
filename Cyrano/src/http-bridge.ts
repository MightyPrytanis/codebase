/**
 * Cyrano HTTP Bridge - Exposes MCP Server via HTTP
 * 
 * This bridge allows web applications like LexFiat to communicate
 * with the Cyrano MCP server via HTTP instead of stdio.
 * 
 * HYBRID LAZY-LOADING APPROACH WITH CRITICAL SAFEGUARDS:
 * - Essential infrastructure loads first (express, security, routes)
 * - Server starts immediately
 * - Tools load asynchronously in background after server starts
 * - Handlers use dynamic imports for on-demand tool loading
 * - Race condition protection (loading locks)
 * - Timeout protection (30s timeout prevents hangs)
 * - Circuit breaker (stops retrying after 5 failures)
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

console.error('[HTTP Bridge] Starting module load...');

// ============================================================================
// ESSENTIAL IMPORTS ONLY - These must load before server starts
// ============================================================================

import express from 'express';
console.error('[HTTP Bridge] Express imported');
import cors, { CorsOptions } from 'cors';
console.error('[HTTP Bridge] CORS imported');
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
console.error('[HTTP Bridge] Basic middleware imported');

// Load environment variables
dotenv.config();
console.error('[HTTP Bridge] Environment loaded');

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// Import security middleware (essential for server security)
console.error('[HTTP Bridge] Importing security middleware...');
import security from './middleware/security.js';
console.error('[HTTP Bridge] Security middleware imported');

// Import routes (these may import db, but server can start even if db fails)
console.error('[HTTP Bridge] Importing routes...');
import authRoutes from './routes/auth.js';
import libraryRoutes from './routes/library.js';
import onboardingRoutes from './routes/onboarding.js';
import betaRoutes from './routes/beta.js';
console.error('[HTTP Bridge] Routes imported');

// ============================================================================
// ENHANCED TOOL LOADER WITH CRITICAL SAFEGUARDS
// ============================================================================

interface ToolInstance {
  getToolDefinition: () => Tool;
  execute: (args: any) => Promise<CallToolResult>;
}

interface ToolMetadata {
  name: string;
  version?: string;
  dependencies?: string[];
  loadTime?: number;
  lastUsed?: Date;
  useCount: number;
  errorCount: number;
  lastError?: string;
  status: 'loaded' | 'loading' | 'error' | 'unloaded';
}

type ToolLoader = () => Promise<ToolInstance | { default: ToolInstance }>;

// Tool import map with metadata
const toolImportMap: Record<string, { loader: ToolLoader; metadata: Partial<ToolMetadata> }> = {
  // Legal AI Tools
  document_analyzer: {
    loader: () => import('./tools/document-analyzer.js').then(m => m.documentAnalyzer),
    metadata: { name: 'document_analyzer', dependencies: [] }
  },
  contract_comparator: {
    loader: () => import('./tools/contract-comparator.js').then(m => m.contractComparator),
    metadata: { name: 'contract_comparator', dependencies: [] }
  },
  good_counsel: {
    loader: () => import('./tools/goodcounsel.js').then(m => m.goodCounsel),
    metadata: { name: 'good_counsel', dependencies: [] }
  },
  fact_checker: {
    loader: () => import('./tools/fact-checker.js').then(m => m.factChecker),
    metadata: { name: 'fact_checker', dependencies: [] }
  },
  legal_reviewer: {
    loader: () => import('./tools/legal-reviewer.js').then(m => m.legalReviewer),
    metadata: { name: 'legal_reviewer', dependencies: [] }
  },
  compliance_checker: {
    loader: () => import('./tools/compliance-checker.js').then(m => m.complianceChecker),
    metadata: { name: 'compliance_checker', dependencies: [] }
  },
  quality_assessor: {
    loader: () => import('./tools/quality-assessor.js').then(m => m.qualityAssessor),
    metadata: { name: 'quality_assessor', dependencies: [] }
  },
  workflow_manager: {
    loader: () => import('./tools/workflow-manager.js').then(m => m.workflowManager),
    metadata: { name: 'workflow_manager', dependencies: [] }
  },
  case_manager: {
    loader: () => import('./tools/case-manager.js').then(m => m.caseManager),
    metadata: { name: 'case_manager', dependencies: [] }
  },
  document_processor: {
    loader: () => import('./tools/document-processor.js').then(m => m.documentProcessor),
    metadata: { name: 'document_processor', dependencies: [] }
  },
  ai_orchestrator: {
    loader: () => import('./engines/mae/services/ai-orchestrator.js').then(m => m.aiOrchestrator),
    metadata: { name: 'ai_orchestrator', dependencies: ['mae_engine'] }
  },
  system_status: {
    loader: () => import('./tools/system-status.js').then(m => m.systemStatus),
    metadata: { name: 'system_status', dependencies: [] }
  },
  rag_query: {
    loader: () => import('./tools/rag-query.js').then(m => m.ragQuery),
    metadata: { name: 'rag_query', dependencies: [] }
  },
  auth: {
    loader: () => import('./tools/auth.js').then(m => m.authTool),
    metadata: { name: 'auth', dependencies: [] }
  },
  sync_manager: {
    loader: () => import('./tools/sync-manager.js').then(m => m.syncManager),
    metadata: { name: 'sync_manager', dependencies: [] }
  },
  red_flag_finder: {
    loader: () => import('./tools/red-flag-finder.js').then(m => m.redFlagFinder),
    metadata: { name: 'red_flag_finder', dependencies: [] }
  },
  clio_integration: {
    loader: () => import('./tools/clio-integration.js').then(m => m.clioIntegration),
    metadata: { name: 'clio_integration', dependencies: [] }
  },
  micourt_query: {
    loader: () => import('./tools/micourt-query.js').then(m => m.micourtQuery),
    metadata: { name: 'micourt_query', dependencies: [] }
  },
  time_value_billing: {
    loader: () => import('./tools/time-value-billing.js').then(m => m.timeValueBilling),
    metadata: { name: 'time_value_billing', dependencies: [] }
  },
  tasks_collector: {
    loader: () => import('./tools/tasks-collector.js').then(m => m.tasksCollector),
    metadata: { name: 'tasks_collector', dependencies: [] }
  },
  contacts_collector: {
    loader: () => import('./tools/contacts-collector.js').then(m => m.contactsCollector),
    metadata: { name: 'contacts_collector', dependencies: [] }
  },
  document_drafter: {
    loader: () => import('./tools/document-drafter.js').then(m => m.documentDrafterTool),
    metadata: { name: 'document_drafter', dependencies: [] }
  },
  ethics_reviewer: {
    loader: () => import('./engines/goodcounsel/tools/ethics-reviewer.js').then(m => m.ethicsReviewer),
    metadata: { name: 'ethics_reviewer', dependencies: ['goodcounsel_engine'] }
  },
  ethical_ai_guard: {
    loader: () => import('./tools/ethical-ai-guard.js').then(m => m.ethicalAIGuard),
    metadata: { name: 'ethical_ai_guard', dependencies: [] }
  },
  ten_rules_checker: {
    loader: () => import('./tools/ten-rules-checker.js').then(m => m.tenRulesChecker),
    metadata: { name: 'ten_rules_checker', dependencies: [] }
  },
  ethics_policy_explainer: {
    loader: () => import('./tools/ethics-policy-explainer.js').then(m => m.ethicsPolicyExplainer),
    metadata: { name: 'ethics_policy_explainer', dependencies: [] }
  },
  
  // Arkiver Tools
  extract_conversations: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.extractConversations),
    metadata: { name: 'extract_conversations', dependencies: [] }
  },
  extract_text_content: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.extractTextContent),
    metadata: { name: 'extract_text_content', dependencies: [] }
  },
  categorize_with_keywords: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.categorizeWithKeywords),
    metadata: { name: 'categorize_with_keywords', dependencies: [] }
  },
  process_with_regex: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.processWithRegex),
    metadata: { name: 'process_with_regex', dependencies: [] }
  },
  generate_categorized_files: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.generateCategorizedFiles),
    metadata: { name: 'generate_categorized_files', dependencies: [] }
  },
  run_extraction_pipeline: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.runExtractionPipeline),
    metadata: { name: 'run_extraction_pipeline', dependencies: [] }
  },
  create_arkiver_config: {
    loader: () => import('./tools/arkiver-tools.js').then(m => m.createArkiverConfig),
    metadata: { name: 'create_arkiver_config', dependencies: [] }
  },
  arkiver_process_text: {
    loader: () => import('./tools/arkiver-processor-tools.js').then(m => m.arkiverTextProcessor),
    metadata: { name: 'arkiver_process_text', dependencies: [] }
  },
  arkiver_process_email: {
    loader: () => import('./tools/arkiver-processor-tools.js').then(m => m.arkiverEmailProcessor),
    metadata: { name: 'arkiver_process_email', dependencies: [] }
  },
  arkiver_extract_entities: {
    loader: () => import('./tools/arkiver-processor-tools.js').then(m => m.arkiverEntityProcessor),
    metadata: { name: 'arkiver_extract_entities', dependencies: [] }
  },
  arkiver_generate_insights: {
    loader: () => import('./tools/arkiver-processor-tools.js').then(m => m.arkiverInsightProcessor),
    metadata: { name: 'arkiver_generate_insights', dependencies: [] }
  },
  arkiver_extract_timeline: {
    loader: () => import('./tools/arkiver-processor-tools.js').then(m => m.arkiverTimelineProcessor),
    metadata: { name: 'arkiver_extract_timeline', dependencies: [] }
  },
  arkiver_process_file: {
    loader: () => import('./tools/arkiver-mcp-tools.js').then(m => m.arkiverProcessFileTool),
    metadata: { name: 'arkiver_process_file', dependencies: [] }
  },
  arkiver_job_status: {
    loader: () => import('./tools/arkiver-mcp-tools.js').then(m => m.arkiverJobStatusTool),
    metadata: { name: 'arkiver_job_status', dependencies: [] }
  },
  arkiver_integrity_test: {
    loader: () => import('./tools/arkiver-integrity-test.js').then(m => m.arkiverIntegrityTestTool),
    metadata: { name: 'arkiver_integrity_test', dependencies: [] }
  },
  
  // Chronometric Tools
  gap_identifier: {
    loader: () => import('./tools/gap-identifier.js').then(m => m.gapIdentifier),
    metadata: { name: 'gap_identifier', dependencies: [] }
  },
  email_artifact_collector: {
    loader: () => import('./tools/email-artifact-collector.js').then(m => m.emailArtifactCollector),
    metadata: { name: 'email_artifact_collector', dependencies: [] }
  },
  calendar_artifact_collector: {
    loader: () => import('./tools/calendar-artifact-collector.js').then(m => m.calendarArtifactCollector),
    metadata: { name: 'calendar_artifact_collector', dependencies: [] }
  },
  document_artifact_collector: {
    loader: () => import('./tools/document-artifact-collector.js').then(m => m.documentArtifactCollector),
    metadata: { name: 'document_artifact_collector', dependencies: [] }
  },
  recollection_support: {
    loader: () => import('./tools/recollection-support.js').then(m => m.recollectionSupport),
    metadata: { name: 'recollection_support', dependencies: [] }
  },
  pre_fill_logic: {
    loader: () => import('./tools/pre-fill-logic.js').then(m => m.preFillLogic),
    metadata: { name: 'pre_fill_logic', dependencies: [] }
  },
  dupe_check: {
    loader: () => import('./tools/dupe-check.js').then(m => m.dupeCheck),
    metadata: { name: 'dupe_check', dependencies: [] }
  },
  provenance_tracker: {
    loader: () => import('./tools/provenance-tracker.js').then(m => m.provenanceTracker),
    metadata: { name: 'provenance_tracker', dependencies: [] }
  },
  workflow_archaeology: {
    loader: () => import('./tools/workflow-archaeology.js').then(m => m.workflowArchaeology),
    metadata: { name: 'workflow_archaeology', dependencies: [] }
  },
  
  // Module/Engine Wrappers
  chronometric_module: {
    loader: () => import('./tools/chronometric-module.js').then(m => m.chronometricModuleTool),
    metadata: { name: 'chronometric_module', dependencies: [] }
  },
  mae_engine: {
    loader: () => import('./tools/mae-engine.js').then(m => m.maeEngineTool),
    metadata: { name: 'mae_engine', dependencies: [] }
  },
  goodcounsel_engine: {
    loader: () => import('./tools/goodcounsel-engine.js').then(m => m.goodcounselEngineTool),
    metadata: { name: 'goodcounsel_engine', dependencies: [] }
  },
  potemkin_engine: {
    loader: () => import('./tools/potemkin-engine.js').then(m => m.potemkinEngineTool),
    metadata: { name: 'potemkin_engine', dependencies: [] }
  },
  forecast_engine: {
    loader: () => import('./tools/forecast-engine.js').then(m => m.forecastEngineTool),
    metadata: { name: 'forecast_engine', dependencies: [] }
  },
  
  // Verification Tools
  claim_extractor: {
    loader: () => import('./tools/verification/claim-extractor.js').then(m => m.claimExtractor),
    metadata: { name: 'claim_extractor', dependencies: [] }
  },
  citation_checker: {
    loader: () => import('./tools/verification/citation-checker.js').then(m => m.citationChecker),
    metadata: { name: 'citation_checker', dependencies: [] }
  },
  citation_formatter: {
    loader: () => import('./tools/verification/citation-formatter.js').then(m => m.citationFormatter),
    metadata: { name: 'citation_formatter', dependencies: [] }
  },
  source_verifier: {
    loader: () => import('./tools/verification/source-verifier.js').then(m => m.sourceVerifier),
    metadata: { name: 'source_verifier', dependencies: [] }
  },
  consistency_checker: {
    loader: () => import('./tools/verification/consistency-checker.js').then(m => m.consistencyChecker),
    metadata: { name: 'consistency_checker', dependencies: [] }
  },
  
  // Potemkin Tools
  history_retriever: {
    loader: () => import('./engines/potemkin/tools/index.js').then(m => m.historyRetriever),
    metadata: { name: 'history_retriever', dependencies: ['potemkin_engine'] }
  },
  drift_calculator: {
    loader: () => import('./engines/potemkin/tools/index.js').then(m => m.driftCalculator),
    metadata: { name: 'drift_calculator', dependencies: ['potemkin_engine'] }
  },
  bias_detector: {
    loader: () => import('./engines/potemkin/tools/index.js').then(m => m.biasDetector),
    metadata: { name: 'bias_detector', dependencies: ['potemkin_engine'] }
  },
  integrity_monitor: {
    loader: () => import('./engines/potemkin/tools/index.js').then(m => m.integrityMonitor),
    metadata: { name: 'integrity_monitor', dependencies: ['potemkin_engine'] }
  },
  alert_generator: {
    loader: () => import('./engines/potemkin/tools/index.js').then(m => m.alertGenerator),
    metadata: { name: 'alert_generator', dependencies: ['potemkin_engine'] }
  },
  
  // Legal Email Tools
  draft_legal_email: {
    loader: () => import('./tools/legal-email-drafter.js').then(m => m.legalEmailDrafter),
    metadata: { name: 'draft_legal_email', dependencies: [] }
  },
  refine_email_tone: {
    loader: () => import('./tools/legal-email-drafter.js').then(m => m.refineEmailTone),
    metadata: { name: 'refine_email_tone', dependencies: [] }
  },
  validate_legal_language: {
    loader: () => import('./tools/legal-email-drafter.js').then(m => m.validateLegalLanguage),
    metadata: { name: 'validate_legal_language', dependencies: [] }
  },
  
  // Other Tools
  cyrano_pathfinder: {
    loader: () => import('./tools/cyrano-pathfinder.js').then(m => m.cyranoPathfinder),
    metadata: { name: 'cyrano_pathfinder', dependencies: [] }
  },
  custodian_engine: {
    loader: () => import('./tools/custodian-engine.js').then(m => m.custodianEngineTool),
    metadata: { name: 'custodian_engine', dependencies: [] }
  },
  skill_executor: {
    loader: () => import('./tools/skill-executor.js').then(m => m.skillExecutor),
    metadata: { name: 'skill_executor', dependencies: [] }
  },
  beta_test_support: {
    loader: () => import('./tools/beta-test-support.js').then(m => m.betaTestSupport),
    metadata: { name: 'beta_test_support', dependencies: [] }
  },
  mcr_validator: {
    loader: () => import('./tools/mcr-validator.js').then(m => m.mcrValidator),
    metadata: { name: 'mcr_validator', dependencies: [] }
  },
  
  // Ethics Tools (special handling for getEthicsAuditTool/getEthicsStatsTool)
  get_ethics_audit: {
    loader: () => import('./tools/ethics-audit-tools.js').then(m => m.getEthicsAuditTool()),
    metadata: { name: 'get_ethics_audit', dependencies: [] }
  },
  get_ethics_stats: {
    loader: () => import('./tools/ethics-audit-tools.js').then(m => m.getEthicsStatsTool()),
    metadata: { name: 'get_ethics_stats', dependencies: [] }
  },
  
  // Wellness Tools
  wellness_journal: {
    loader: () => import('./tools/wellness-journal.js').then(m => m.wellnessJournalTool),
    metadata: { name: 'wellness_journal', dependencies: [] }
  },
  
  // GoodCounsel Prompt Tools
  get_goodcounsel_prompts: {
    loader: () => import('./tools/goodcounsel-prompts.js').then(m => m.getGoodCounselPromptsTool),
    metadata: { name: 'get_goodcounsel_prompts', dependencies: [] }
  },
  dismiss_goodcounsel_prompt: {
    loader: () => import('./tools/goodcounsel-prompts.js').then(m => m.dismissGoodCounselPromptTool),
    metadata: { name: 'dismiss_goodcounsel_prompt', dependencies: [] }
  },
  snooze_goodcounsel_prompt_type: {
    loader: () => import('./tools/goodcounsel-prompts.js').then(m => m.snoozeGoodCounselPromptTypeTool),
    metadata: { name: 'snooze_goodcounsel_prompt_type', dependencies: [] }
  },
  get_goodcounsel_prompt_history: {
    loader: () => import('./tools/goodcounsel-prompts.js').then(m => m.getGoodCounselPromptHistoryTool),
    metadata: { name: 'get_goodcounsel_prompt_history', dependencies: [] }
  },
  evaluate_goodcounsel_context: {
    loader: () => import('./tools/goodcounsel-prompts.js').then(m => m.evaluateGoodCounselContextTool),
    metadata: { name: 'evaluate_goodcounsel_context', dependencies: [] }
  },
  
  // Workflow Status Tool
  workflow_status: {
    loader: () => import('./tools/workflow-status.js').then(m => m.workflowStatusTool),
    metadata: { name: 'workflow_status', dependencies: [] }
  },
  
};

// Tool cache with enhanced metadata
const toolCache = new Map<string, ToolInstance>();
const toolMetadata = new Map<string, ToolMetadata>();

// CRITICAL SAFEGUARD 1: Loading locks - prevent race conditions
const loadingLocks = new Map<string, Promise<ToolInstance>>();

// CRITICAL SAFEGUARD 2: Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const MAX_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
const TOOL_LOAD_TIMEOUT = 30000; // 30 seconds

// Frequently used tools (preload these first)
const frequentlyUsedTools = [
  'system_status',
  'auth',
  'document_analyzer',
  'contract_comparator',
  'good_counsel',
  'cyrano_pathfinder'
];

// Load a tool dynamically with ALL THREE CRITICAL SAFEGUARDS
async function loadTool(toolName: string, loadDependencies: boolean = true): Promise<ToolInstance> {
  // Fast path: Check cache first
  if (toolCache.has(toolName)) {
    const metadata = toolMetadata.get(toolName);
    if (metadata) {
      metadata.lastUsed = new Date();
      metadata.useCount++;
    }
    return toolCache.get(toolName)!;
  }
  
  // SAFEGUARD 1: Check circuit breaker
  const breaker = circuitBreakers.get(toolName);
  if (breaker?.isOpen) {
    const timeSinceFailure = Date.now() - breaker.lastFailureTime;
    if (timeSinceFailure < CIRCUIT_BREAKER_TIMEOUT) {
      throw new Error(`Tool ${toolName} is in circuit breaker (too many failures). Retry after ${Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceFailure) / 1000)}s`);
    } else {
      // Reset circuit breaker after timeout
      circuitBreakers.delete(toolName);
    }
  }
  
  // SAFEGUARD 2: Check if already loading (race condition protection)
  const existingLoad = loadingLocks.get(toolName);
  if (existingLoad) {
    // Wait for the existing load to complete
    return existingLoad;
  }
  
  // Get tool config
  const toolConfig = toolImportMap[toolName];
  if (!toolConfig) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  // Initialize metadata
  const metadata: ToolMetadata = {
    name: toolName,
    ...toolConfig.metadata,
    status: 'loading',
    useCount: 0,
    errorCount: 0,
  };
  toolMetadata.set(toolName, metadata);
  
  // Create loading promise with ALL SAFEGUARDS
  const loadPromise = (async () => {
    try {
      // Load dependencies first if requested
      if (loadDependencies && toolConfig.metadata.dependencies) {
        for (const dep of toolConfig.metadata.dependencies) {
          if (!toolCache.has(dep)) {
            console.error(`[Tool Loader] Loading dependency ${dep} for ${toolName}...`);
            await loadTool(dep, true);
          }
        }
      }
      
      // Load tool with timing
      const startTime = Date.now();
      
      // SAFEGUARD 3: Timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Tool load timeout after ${TOOL_LOAD_TIMEOUT}ms`)), TOOL_LOAD_TIMEOUT);
      });
      
      // Race between load and timeout
      const tool = await Promise.race([
        toolConfig.loader(),
        timeoutPromise
      ]);
      
      const loadTime = Date.now() - startTime;
      
      // Handle both default export and named export
      const toolInstance = (tool as any).default || tool;
      
      // Cache it
      toolCache.set(toolName, toolInstance);
      metadata.status = 'loaded';
      metadata.loadTime = loadTime;
      metadata.lastUsed = new Date();
      metadata.useCount = 1;
      
      // Reset circuit breaker on success
      circuitBreakers.delete(toolName);
      
      console.error(`[Tool Loader] Loaded ${toolName} in ${loadTime}ms`);
      return toolInstance;
    } catch (error) {
      metadata.status = 'error';
      metadata.errorCount++;
      metadata.lastError = error instanceof Error ? error.message : String(error);
      
      // Update circuit breaker
      const breaker = circuitBreakers.get(toolName) || { failures: 0, lastFailureTime: 0, isOpen: false };
      breaker.failures++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failures >= MAX_FAILURES) {
        breaker.isOpen = true;
        console.error(`[Tool Loader] Circuit breaker opened for ${toolName} after ${breaker.failures} failures`);
      }
      
      circuitBreakers.set(toolName, breaker);
      
      console.error(`[Tool Loader] Failed to load tool ${toolName}:`, error);
      throw error;
    } finally {
      // Remove loading lock
      loadingLocks.delete(toolName);
    }
  })();
  
  // Store loading lock
  loadingLocks.set(toolName, loadPromise);
  
  return loadPromise;
}

// Reload a tool (hot reloading)
async function reloadTool(toolName: string): Promise<boolean> {
  console.error(`[Tool Loader] Reloading tool ${toolName}...`);
  
  // Remove from cache
  toolCache.delete(toolName);
  const metadata = toolMetadata.get(toolName);
  if (metadata) {
    metadata.status = 'unloaded';
  }
  
  // Reset circuit breaker
  circuitBreakers.delete(toolName);
  
  try {
    await loadTool(toolName, false); // Don't reload dependencies
    console.error(`[Tool Loader] Successfully reloaded ${toolName}`);
    return true;
  } catch (error) {
    console.error(`[Tool Loader] Failed to reload ${toolName}:`, error);
    return false;
  }
}

// Load all tool definitions (for /mcp/tools endpoint)
async function loadAllToolDefinitions(): Promise<Tool[]> {
  const tools: Tool[] = [];
  const errors: string[] = [];
  
  // Load tools in parallel batches
  const toolNames = Object.keys(toolImportMap);
  const batchSize = 10;
  
  for (let i = 0; i < toolNames.length; i += batchSize) {
    const batch = toolNames.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (toolName) => {
        try {
          const tool = await loadTool(toolName, true);
          return tool.getToolDefinition();
        } catch (error) {
          errors.push(`${toolName}: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        tools.push(result.value);
      }
    }
  }
  
  if (errors.length > 0) {
    console.warn(`[Tool Loader] Some tools failed to load: ${errors.join(', ')}`);
  }
  
  return tools;
}

// Preload frequently used tools first, then others
let toolsPreloading = false;
let toolsPreloaded = false;
async function preloadToolsInBackground() {
  if (toolsPreloading || toolsPreloaded) return;
  toolsPreloading = true;
  
  console.error('[Tool Loader] Starting background tool preloading...');
  
  try {
    // Preload frequently used tools first
    console.error(`[Tool Loader] Preloading ${frequentlyUsedTools.length} frequently used tools...`);
    await Promise.allSettled(
      frequentlyUsedTools.map(toolName => loadTool(toolName, true))
    );
    
    // Then preload all other tools
    const remainingTools = Object.keys(toolImportMap).filter(
      name => !frequentlyUsedTools.includes(name)
    );
    console.error(`[Tool Loader] Preloading ${remainingTools.length} remaining tools...`);
    
    const batchSize = 10;
    for (let i = 0; i < remainingTools.length; i += batchSize) {
      const batch = remainingTools.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(toolName => loadTool(toolName, true))
      );
    }
    
    toolsPreloaded = true;
    const loadedCount = Array.from(toolMetadata.values()).filter(m => m.status === 'loaded').length;
    console.error(`[Tool Loader] Preloaded ${loadedCount}/${Object.keys(toolImportMap).length} tools`);
  } catch (error) {
    console.error('[Tool Loader] Background preloading failed (non-fatal):', error);
  } finally {
    toolsPreloading = false;
  }
}

// Get tool health status
function getToolHealth(): {
  total: number;
  loaded: number;
  loading: number;
  errors: number;
  circuitBreakers: number;
  tools: ToolMetadata[];
} {
  const tools = Array.from(toolMetadata.values());
  const openBreakers = Array.from(circuitBreakers.values()).filter(b => b.isOpen).length;
  return {
    total: tools.length,
    loaded: tools.filter(t => t.status === 'loaded').length,
    loading: tools.filter(t => t.status === 'loading').length,
    errors: tools.filter(t => t.status === 'error').length,
    circuitBreakers: openBreakers,
    tools: tools.map(t => ({ ...t }))
  };
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY_COUNT ? parseInt(process.env.TRUST_PROXY_COUNT) : 1);
const port = process.env.PORT || 5002;

app.disable('x-powered-by');
app.use(security.secureHeaders);
app.use(cookieParser());

// CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  ignoreMethods: process.env.NODE_ENV === 'test' ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE', 'PATCH'] : undefined,
});
if (process.env.NODE_ENV !== 'test') {
  app.use(csrfProtection);
}

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
// Add cognisint.com to allowed origins for beta portal
const defaultOrigins = [
  'https://cognisint.com',
  'https://www.cognisint.com',
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [...defaultOrigins, ...envOrigins];

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be set in production environment');
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin && !isProduction) {
      return callback(null, true);
    }
    if (!origin && isProduction) {
      return callback(new Error('CORS: Origin header required in production'));
    }
    if (!isProduction && allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// HTTPS enforcement
app.use((req, res, next) => {
  const isSecure = req.secure || req.get('X-Forwarded-Proto') === 'https';
  if (isProduction && !isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  if (!isProduction && process.env.FORCE_HTTPS === 'true' && !isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));
app.use(security.sanitizeInputs);
app.use(security.authenticatedLimiter);
app.use(security.unauthenticatedLimiter);

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// MCP Server instance
const mcpServer = new Server(
  {
    name: 'cyrano-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// MCP HANDLERS - Use dynamic tool loading
// ============================================================================

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const tools = await loadAllToolDefinitions();
    return { tools };
  } catch (error) {
    console.error('[MCP] Failed to load tools:', error);
    return { tools: [] };
  }
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const tool = await loadTool(name);
    return await tool.execute(args);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// HTTP ROUTES
// ============================================================================

app.get('/mcp/tools', async (req, res) => {
  try {
    const allTools = await loadAllToolDefinitions();
    
    // Filter out admin-only tools for non-admin users
    const adminOnlyTools = [
      'custodian_engine',
      'custodian_status',
      'custodian_health_check',
      'custodian_update_dependencies',
      'custodian_apply_fix',
      'custodian_alert_admin',
      'custodian_failsafe',
    ];
    
    // Check if user is admin
    try {
      const { isAdminRequest } = await import('./utils/admin-auth.js');
      const isAdmin = isAdminRequest(req);
      
      // Filter tools based on admin status
      const tools = isAdmin 
        ? allTools 
        : allTools.filter(tool => !adminOnlyTools.includes(tool.name));
      
      res.json({ tools });
    } catch {
      // If admin auth check fails, filter out admin tools (fail secure)
      const tools = allTools.filter(tool => !adminOnlyTools.includes(tool.name));
      res.json({ tools });
    }
  } catch (error) {
    console.error('[HTTP] Failed to get tools:', error);
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

app.post('/mcp/execute', async (req, res) => {
  try {
    const ExecuteRequestSchema = z.object({
      tool: z.string().min(1, 'Tool name is required'),
      input: z.any().optional(),
      arguments: z.any().optional(),
    });
    
    const validationResult = ExecuteRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.issues,
      });
    }
    
    const { tool, input, arguments: args } = validationResult.data;
    const toolInput = input || args || {};
    
    // Check if tool is admin-only (Custodian tools)
    const adminOnlyTools = [
      'custodian_engine',
      'custodian_status',
      'custodian_health_check',
      'custodian_update_dependencies',
      'custodian_apply_fix',
      'custodian_alert_admin',
      'custodian_failsafe',
    ];
    
    if (adminOnlyTools.includes(tool)) {
      // Import admin auth utility
      try {
        const { isAdminRequest } = await import('./utils/admin-auth.js');
        if (!isAdminRequest(req)) {
          return res.status(403).json({
            content: [
              {
                type: 'text',
                text: 'Admin access required. This tool is only available to administrators.',
              },
            ],
            isError: true,
          });
        }
      } catch {
        // If admin auth check fails, deny access (fail secure)
        return res.status(403).json({
          content: [
            {
              type: 'text',
              text: 'Admin access required. This tool is only available to administrators.',
            },
          ],
          isError: true,
        });
      }
    }
    
    const toolInstance = await loadTool(tool);
    const result = await toolInstance.execute(toolInput);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    });
  }
});

app.get('/mcp/status', (req, res) => {
  const health = getToolHealth();
  res.json({ 
    status: 'running', 
    server: 'cyrano-mcp-http-bridge',
    tools: health
  });
});

// Tool health monitoring endpoint
app.get('/mcp/tools/health', (req, res) => {
  const health = getToolHealth();
  res.json(health);
});

// Hot reload endpoint (admin only - should add auth in production)
app.post('/mcp/tools/:toolName/reload', async (req, res) => {
  const { toolName } = req.params;
  
  if (!toolImportMap[toolName]) {
    return res.status(404).json({ error: `Tool ${toolName} not found` });
  }
  
  const success = await reloadTool(toolName);
  if (success) {
    res.json({ success: true, message: `Tool ${toolName} reloaded successfully` });
  } else {
    res.status(500).json({ success: false, message: `Failed to reload tool ${toolName}` });
  }
});

// GoodCounsel API endpoint
app.get('/api/good-counsel/overview', async (req, res) => {
  try {
    const goodCounsel = await loadTool('good_counsel');
    const result = await goodCounsel.execute({});
    const textContent = (result.content[0] && result.content[0].type === 'text' && 'text' in result.content[0]) ? result.content[0].text : '';
    if (textContent && typeof textContent === 'string') {
      try {
        const parsed = JSON.parse(textContent);
        res.json(parsed);
      } catch (parseError) {
        res.json({ content: textContent });
      }
    } else {
      res.json({ error: 'No content available' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get GoodCounsel overview',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Authentication routes
app.use('/auth', authRoutes);

// Security endpoints
app.get('/csrf-token', security.getCSRFToken);
app.get('/security/status', security.securityStatus);

// Clio Webhooks (Track Zeta)
import { clioWebhookHandler } from './integrations/clio-webhooks.js';
app.post('/webhooks/clio', clioWebhookHandler);

// Zapier Webhooks (Track Theta)
import { zapierWebhookHandler } from './integrations/zapier-webhooks.js';
app.post('/webhooks/zapier', zapierWebhookHandler);

// Apply prompt injection defense to all tool executions
import { sanitizePromptInput, filterSensitiveData, detectPromptInjection } from './middleware/prompt-injection-defense.js';

app.get('/health', (req, res) => {
  const health = getToolHealth();
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tools: {
      loaded: health.loaded,
      total: health.total,
      preloaded: toolsPreloaded,
      circuitBreakers: health.circuitBreakers
    },
    uptime: process.uptime(),
    security: {
      jwtEnabled: !!process.env.JWT_SECRET,
      csrfProtection: true,
      rateLimiting: true,
    }
  });
});

app.get('/mcp/tools/info', async (req, res) => {
  try {
    const tools = await loadAllToolDefinitions();
    const toolsInfo = tools.map(tool => ({
      category: 'Tool',
      ...tool
    }));
    
    res.json({ 
      tools: toolsInfo,
      summary: {
        total_tools: toolsInfo.length,
        tools_loaded: toolCache.size,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tools info' });
  }
});

// Arkiver File Upload Endpoint
app.post('/api/arkiver/upload', security.authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided in request',
        },
      });
    }
    
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size ${file.size} exceeds maximum allowed size of ${maxFileSize} bytes`,
        },
      });
    }
    
    if (req.body.metadata) {
      const MetadataSchema = z.object({
        sourceType: z.enum(['user-upload', 'email', 'clio', 'courtlistener', 'westlaw', 'manual']).optional(),
      }).passthrough();
      
      const metadataValidation = MetadataSchema.safeParse(
        typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata
      );
      
      if (!metadataValidation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_METADATA',
            message: 'Invalid metadata format',
            details: metadataValidation.error.issues,
          },
        });
      }
    }

    const { defaultStorage } = await import('./modules/arkiver/storage/local.js');
    const { db } = await import('./db.js');
    const { arkiverFiles } = await import('./modules/arkiver/schema.js');
    const path = await import('path');
    const { eq } = await import('drizzle-orm');
    
    let metadata: any = {};
    if (req.body.metadata) {
      try {
        metadata = typeof req.body.metadata === 'string' 
          ? JSON.parse(req.body.metadata) 
          : req.body.metadata;
      } catch {
        // Ignore invalid JSON
      }
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const fileType = ext.replace('.', '') || 'unknown';
    const mimeType = file.mimetype || 'application/octet-stream';

    const storageResult = await defaultStorage.upload(
      file.buffer,
      file.originalname,
      mimeType
    );

    if (!storageResult.success || !storageResult.file) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: storageResult.error || 'Failed to store file',
        },
      });
    }

    const user = (req as any).user;
    const userId = user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required to upload files',
        },
      });
    }

    const [savedFile] = await db
      .insert(arkiverFiles)
      .values({
        filename: file.originalname,
        fileType: fileType,
        fileSize: file.size,
        storagePath: storageResult.file.storagePath,
        mimeType: mimeType,
        status: 'uploaded',
        uploadedBy: userId,
        sourceType: metadata.sourceType || 'user-upload',
      })
      .returning();

    if (!savedFile) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to save file record to database',
        },
      });
    }

    return res.json({
      success: true,
      fileId: savedFile.id,
      fileName: savedFile.filename,
      fileSize: savedFile.fileSize,
      mimeType: savedFile.mimeType,
      uploadedAt: savedFile.createdAt?.toISOString(),
      status: savedFile.status,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown upload error',
      },
    });
  }
});

// Arkiver File Status Endpoint
app.get('/api/arkiver/files/:fileId', async (req, res) => {
  try {
    const FileIdSchema = z.object({
      fileId: z.string().uuid('File ID must be a valid UUID'),
    });
    
    const validationResult = FileIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format',
          details: validationResult.error.issues,
        },
      });
    }
    
    const { fileId } = validationResult.data;
    const { db } = await import('./db.js');
    const { arkiverFiles } = await import('./modules/arkiver/schema.js');
    const { eq } = await import('drizzle-orm');
    
    const [file] = await db
      .select()
      .from(arkiverFiles)
      .where(eq(arkiverFiles.id, fileId))
      .limit(1);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${fileId}`,
        },
      });
    }

    return res.json({
      success: true,
      file: {
        fileId: file.id,
        fileName: file.filename,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.createdAt?.toISOString(),
        status: file.status,
      },
    });
  } catch (error) {
    console.error('File status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Mount library routes
app.use('/api', libraryRoutes);

// Mount onboarding routes
app.use('/api', onboardingRoutes);

// Mount beta portal routes
app.use('/api/beta', betaRoutes);

// ============================================================================
// SERVER STARTUP
// ============================================================================

export { app };

// Load skills at startup (non-blocking)
async function loadSkillsBeforeStartup() {
  try {
    const { skillRegistry } = await import('./skills/skill-registry.js');
    await skillRegistry.loadAll();
    console.error(`[Skills] Loaded ${skillRegistry.getCount()} skills`);
  } catch (error) {
    console.error('[Skills] Failed to load skills:', error);
  }
}

// Start server if this file is run directly
const shouldStartServer = !process.env.VITEST;

if (shouldStartServer) {
  console.error('[HTTP Bridge] Starting server...');
  console.error(`[HTTP Bridge] Port: ${port}`);
  
  try {
    const server = app.listen(port, () => {
      console.error(`✅ Cyrano MCP HTTP Bridge running on port ${port}`);
      console.error(`Available endpoints:`);
      console.error(`  GET  /health - Health check`);
      console.error(`  GET  /mcp/tools - List available tools`);
      console.error(`  GET  /mcp/tools/info - Detailed tool information`);
      console.error(`  GET  /mcp/tools/health - Tool health monitoring`);
      console.error(`  POST /mcp/tools/:toolName/reload - Hot reload a tool`);
      console.error(`  POST /mcp/execute - Execute a tool`);
      console.error(`  GET  /mcp/status - Server status`);
      console.error(`  POST /api/arkiver/upload - Upload file to Arkiver`);
      console.error(`  GET  /api/arkiver/files/:fileId - Get file status`);
      console.error(`  POST /api/onboarding/practice-profile - Save practice profile`);
      console.error(`  GET  /api/onboarding/practice-profile - Get practice profile`);
      console.error(`  POST /api/library/locations - Add/update library location`);
      console.error(`  GET  /api/library/locations - List library locations`);
      console.error(`  GET  /api/library/items - List library items`);
      console.error(`  POST /api/library/items/:id/pin - Toggle pin status`);
      console.error(`  POST /api/library/items/:id/ingest - Enqueue for RAG ingestion`);
      console.error(`  GET  /api/health/library - Library health status`);
      console.error(`[HTTP Bridge] Server started - tools will load on-demand`);
    });
    
    server.on('error', (error: Error) => {
      console.error('[HTTP Bridge] Failed to start server:', error);
      process.exit(1);
    });
    
    // Start background tasks (non-blocking)
    loadSkillsBeforeStartup().catch((error) => {
      console.error('[HTTP Bridge] Failed to load skills (non-blocking):', error);
    });
    
    // Preload tools in background (non-blocking)
    preloadToolsInBackground().catch((error) => {
      console.error('[HTTP Bridge] Failed to preload tools (non-blocking):', error);
    });
    
    // Initialize Custodian engine automatically (non-blocking)
    import('./engines/registry.js').then(({ engineRegistry }) => {
      const custodian = engineRegistry.get('custodian');
      if (custodian) {
        custodian.initialize().catch((error) => {
          console.error('[HTTP Bridge] Failed to initialize Custodian (non-blocking):', error);
        });
      }
    }).catch((error) => {
      console.error('[HTTP Bridge] Failed to load engine registry:', error);
    });
    
    console.error('[HTTP Bridge] Startup sequence complete.');
  } catch (error) {
    console.error('[HTTP Bridge] Fatal error during startup:', error);
    process.exit(1);
  }
} else {
  console.error('[HTTP Bridge] Not starting server (test environment detected)');
}
