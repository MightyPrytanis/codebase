/**
 * Cyrano HTTP Bridge - Exposes MCP Server via HTTP
 * 
 * This bridge allows web applications like LexFiat to communicate
 * with the Cyrano MCP server via HTTP instead of stdio.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

// Load environment variables
dotenv.config();
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// Import security middleware
import security from './middleware/security.js';
import authRoutes from './routes/auth.js';

// Import tool implementations
import { documentAnalyzer } from './tools/document-analyzer.js';
import { contractComparator } from './tools/contract-comparator.js';
import { goodCounsel } from './tools/goodcounsel.js';
import { factChecker } from './tools/fact-checker.js';
import { legalReviewer } from './tools/legal-reviewer.js';
import { complianceChecker } from './tools/compliance-checker.js';
import { qualityAssessor } from './tools/quality-assessor.js';
import { workflowManager } from './tools/workflow-manager.js';
import { caseManager } from './tools/case-manager.js';
import { documentProcessor } from './tools/document-processor.js';
import { aiOrchestrator } from './engines/mae/tools/ai-orchestrator.js';
import { systemStatus } from './tools/system-status.js';
// status-indicator tool archived - see Cyrano/archive/broken-tools/
import { ragQuery } from './tools/rag-query.js';
import { authTool } from './tools/auth.js';
import { syncManager } from './tools/sync-manager.js';
import { redFlagFinder } from './tools/red-flag-finder.js';
import { clioIntegration } from './tools/clio-integration.js';
import { timeValueBilling } from './tools/time-value-billing.js';
import { tasksCollector } from './tools/tasks-collector.js';
import { contactsCollector } from './tools/contacts-collector.js';
import { DocumentDrafterTool } from './tools/document-drafter.js';
// import { toolEnhancer } from './tools/tool-enhancer.js'; // TODO: File doesn't exist
import { ethicsReviewer } from './engines/goodcounsel/tools/ethics-reviewer.js';
import {
  arkiverTextProcessor,
  arkiverEmailProcessor,
  arkiverEntityProcessor,
  arkiverInsightProcessor,
  arkiverTimelineProcessor,
} from './tools/arkiver-processor-tools.js';
import {
  legalEmailDrafter,
  refineEmailTone,
  validateLegalLanguage,
} from './tools/legal-email-drafter.js';

// Import Arkiver tools
import {
  extractConversations,
  extractTextContent,
  categorizeWithKeywords,
  processWithRegex,
  generateCategorizedFiles,
  runExtractionPipeline,
  createArkiverConfig
} from './tools/arkiver-tools.js';

// Import Chronometric tools
import { gapIdentifier } from './tools/gap-identifier.js';
import { emailArtifactCollector } from './tools/email-artifact-collector.js';
import { calendarArtifactCollector } from './tools/calendar-artifact-collector.js';
import { documentArtifactCollector } from './tools/document-artifact-collector.js';
import { recollectionSupport } from './tools/recollection-support.js';
import { preFillLogic } from './tools/pre-fill-logic.js';
import { dupeCheck } from './tools/dupe-check.js';
import { provenanceTracker } from './tools/provenance-tracker.js';

// Import Module/Engine wrappers
import { chronometricModuleTool } from './tools/chronometric-module.js';
import { maeEngineTool } from './tools/mae-engine.js';
import { goodcounselEngineTool } from './tools/goodcounsel-engine.js';
import { potemkinEngineTool } from './tools/potemkin-engine.js';
// Import shared verification tools
import { claimExtractor } from './tools/verification/claim-extractor.js';
import { citationChecker } from './tools/verification/citation-checker.js';
import { citationFormatter } from './tools/verification/citation-formatter.js';
import { sourceVerifier } from './tools/verification/source-verifier.js';
import { consistencyChecker } from './tools/verification/consistency-checker.js';
import { arkiverProcessFileTool, arkiverJobStatusTool } from './tools/arkiver-mcp-tools.js';
import { arkiverIntegrityTestTool } from './tools/arkiver-integrity-test.js';
// Import Potemkin-specific tools
import {
  historyRetriever,
  driftCalculator,
  biasDetector,
  integrityMonitor,
  alertGenerator,
} from './engines/potemkin/tools/index.js';
import { cyranoPathfinder } from './tools/cyrano-pathfinder.js';

// Import library routes
import libraryRoutes from './routes/library.js';

const app = express();
app.enable('trust proxy');
const port = process.env.PORT || 5002;

// Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

// Security: Apply Helmet.js for secure headers
app.use(security.secureHeaders);

// Cookie parser for session management
app.use(cookieParser());

// CSRF protection: require valid CSRF tokens for state-changing requests
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});
app.use(csrfProtection);

// Middleware - CORS and HTTPS enforcement
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

// Require ALLOWED_ORIGINS in production
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be set in production environment');
}

// Configure CORS with origin validation
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) in development only
    if (!origin && !isProduction) {
      return callback(null, true);
    }
    // In production, require origin
    if (!origin && isProduction) {
      return callback(new Error('CORS: Origin header required in production'));
    }
    // In development, if no whitelist is configured, allow all origins
    if (!isProduction && allowedOrigins.length === 0) {
      return callback(null, true);
    }
    // Check if origin is in whitelist
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

// Enforce HTTPS in production (auto-enforce, not just when FORCE_HTTPS=true)
app.use((req, res, next) => {
  // Check both req.secure (direct) and X-Forwarded-Proto (behind proxy)
  const isSecure = req.secure || req.get('X-Forwarded-Proto') === 'https';
  
  // In production, always enforce HTTPS
  if (isProduction && !isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  
  // In development, allow FORCE_HTTPS override
  if (!isProduction && process.env.FORCE_HTTPS === 'true' && !isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  
  next();
});
app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));

// Security: Input sanitization
app.use(security.sanitizeInputs);

// Security: Rate limiting (applies to all routes)
// Tool execution through MCP protocol is already rate-limited by these global limiters
app.use(security.authenticatedLimiter);
app.use(security.unauthenticatedLimiter);

// Multer configuration for file uploads
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

// Setup MCP server handlers
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Legal AI Tools
      documentAnalyzer.getToolDefinition(),
      contractComparator.getToolDefinition(),
      goodCounsel.getToolDefinition(),
      factChecker.getToolDefinition(),
      legalReviewer.getToolDefinition(),
      complianceChecker.getToolDefinition(),
      qualityAssessor.getToolDefinition(),
      workflowManager.getToolDefinition(),
      caseManager.getToolDefinition(),
      documentProcessor.getToolDefinition(),
      aiOrchestrator.getToolDefinition(),
      systemStatus.getToolDefinition(),
      // status-indicator tool archived - see Cyrano/archive/broken-tools/
      syncManager.getToolDefinition(),
      redFlagFinder.getToolDefinition(),
      clioIntegration.getToolDefinition(),
      timeValueBilling.getToolDefinition(),
      authTool.getToolDefinition(),
      
      // Arkiver Data Extraction Tools
      extractConversations.getToolDefinition(),
      extractTextContent.getToolDefinition(),
      categorizeWithKeywords.getToolDefinition(),
      processWithRegex.getToolDefinition(),
      generateCategorizedFiles.getToolDefinition(),
      runExtractionPipeline.getToolDefinition(),
      createArkiverConfig.getToolDefinition(),
      
      // Chronometric Tools
      gapIdentifier.getToolDefinition(),
      emailArtifactCollector.getToolDefinition(),
      calendarArtifactCollector.getToolDefinition(),
      documentArtifactCollector.getToolDefinition(),
      recollectionSupport.getToolDefinition(),
      preFillLogic.getToolDefinition(),
      dupeCheck.getToolDefinition(),
      provenanceTracker.getToolDefinition(),
      
      // Module/Engine Wrappers
      chronometricModuleTool.getToolDefinition(),
      maeEngineTool.getToolDefinition(),
      goodcounselEngineTool.getToolDefinition(),
      potemkinEngineTool.getToolDefinition(),
      
      // Shared Verification Tools (used by Potemkin and Arkiver)
      claimExtractor.getToolDefinition(),
      citationChecker.getToolDefinition(),
      citationFormatter.getToolDefinition(),
      sourceVerifier.getToolDefinition(),
      consistencyChecker.getToolDefinition(),
      // Arkiver MCP tools
      arkiverProcessFileTool.getToolDefinition(),
      arkiverJobStatusTool.getToolDefinition(),
      // Potemkin-specific tools
      historyRetriever.getToolDefinition(),
      driftCalculator.getToolDefinition(),
      biasDetector.getToolDefinition(),
      integrityMonitor.getToolDefinition(),
      alertGenerator.getToolDefinition(),
      // Legal Email Drafting Tools
      legalEmailDrafter.getToolDefinition(),
      refineEmailTone.getToolDefinition(),
      validateLegalLanguage.getToolDefinition(),
      // Cyrano Pathfinder - Unified Chat Interface
      cyranoPathfinder.getToolDefinition(),
    ],
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: CallToolResult;

        switch (name) {
          // Legal AI Tools
          case 'document_analyzer':
            result = await documentAnalyzer.execute(args);
            break;
          case 'contract_comparator':
            result = await contractComparator.execute(args);
            break;
          case 'good_counsel':
            result = await goodCounsel.execute(args);
            break;
          case 'fact_checker':
            result = await factChecker.execute(args);
            break;
          case 'legal_reviewer':
            result = await legalReviewer.execute(args);
            break;
          case 'compliance_checker':
            result = await complianceChecker.execute(args);
            break;
          case 'quality_assessor':
            result = await qualityAssessor.execute(args);
            break;
          case 'workflow_manager':
            result = await workflowManager.execute(args);
            break;
          case 'case_manager':
            result = await caseManager.execute(args);
            break;
          case 'document_processor':
            result = await documentProcessor.execute(args);
            break;
          case 'ai_orchestrator':
            result = await aiOrchestrator.execute(args);
            break;
          case 'system_status':
            result = await systemStatus.execute(args);
            break;
          // status-indicator tool archived - see Cyrano/archive/broken-tools/
          case 'sync_manager':
            result = await syncManager.execute(args);
            break;
          case 'red_flag_finder':
            result = await redFlagFinder.execute(args);
            break;
          case 'clio_integration':
            result = await clioIntegration.execute(args);
            break;
          case 'time_value_billing':
            result = await timeValueBilling.execute(args);
            break;
          case 'auth':
            result = await authTool.execute(args);
            break;
            
          // Arkiver Data Extraction Tools
          case 'extract_conversations':
            result = await extractConversations.execute(args);
            break;
          case 'extract_text_content':
            result = await extractTextContent.execute(args);
            break;
          case 'categorize_with_keywords':
            result = await categorizeWithKeywords.execute(args);
            break;
          case 'process_with_regex':
            result = await processWithRegex.execute(args);
            break;
          case 'generate_categorized_files':
            result = await generateCategorizedFiles.execute(args);
            break;
          case 'run_extraction_pipeline':
            result = await runExtractionPipeline.execute(args);
            break;
          case 'create_arkiver_config':
            result = await createArkiverConfig.execute(args);
            break;
            
          // Chronometric Tools
          case 'gap_identifier':
            result = await gapIdentifier.execute(args);
            break;
          case 'email_artifact_collector':
            result = await emailArtifactCollector.execute(args);
            break;
          case 'calendar_artifact_collector':
            result = await calendarArtifactCollector.execute(args);
            break;
          case 'tasks_collector':
            result = await tasksCollector.execute(args);
            break;
          case 'contacts_collector':
            result = await contactsCollector.execute(args);
            break;
          case 'document_artifact_collector':
            result = await documentArtifactCollector.execute(args);
            break;
          case 'recollection_support':
            result = await recollectionSupport.execute(args);
            break;
          case 'pre_fill_logic':
            result = await preFillLogic.execute(args);
            break;
          case 'dupe_check':
            result = await dupeCheck.execute(args);
            break;
          case 'provenance_tracker':
            result = await provenanceTracker.execute(args);
            break;
            
          // Module/Engine Wrappers
          case 'chronometric_module':
            result = await chronometricModuleTool.execute(args);
            break;
          case 'mae_engine':
            result = await maeEngineTool.execute(args);
            break;
          case 'goodcounsel_engine':
            result = await goodcounselEngineTool.execute(args);
            break;
          case 'ethics_reviewer':
            result = await ethicsReviewer.execute(args);
            break;
          case 'potemkin_engine':
            result = await potemkinEngineTool.execute(args);
            break;
          // Shared verification tools
          case 'claim_extractor':
            result = await claimExtractor.execute(args);
            break;
          case 'citation_checker':
            result = await citationChecker.execute(args);
            break;
          case 'citation_formatter':
            result = await citationFormatter.execute(args);
            break;
          case 'arkiver_process_file':
            result = await arkiverProcessFileTool.execute(args);
            break;
          case 'arkiver_job_status':
            result = await arkiverJobStatusTool.execute(args);
            break;
          case 'arkiver_integrity_test':
            result = await arkiverIntegrityTestTool.execute(args);
            break;
          case 'arkiver_process_text':
            result = await arkiverTextProcessor.execute(args);
            break;
          case 'arkiver_process_email':
            result = await arkiverEmailProcessor.execute(args);
            break;
          case 'arkiver_extract_entities':
            result = await arkiverEntityProcessor.execute(args);
            break;
          case 'arkiver_generate_insights':
            result = await arkiverInsightProcessor.execute(args);
            break;
          case 'arkiver_extract_timeline':
            result = await arkiverTimelineProcessor.execute(args);
            break;
          case 'rag_query':
            result = await ragQuery.execute(args);
            break;
          case 'document_drafter':
            result = await new DocumentDrafterTool().execute(args);
            break;
          case 'tool_enhancer':
            // TODO: tool_enhancer not implemented
            result = {
              content: [{ type: 'text', text: 'Tool enhancer not available' }],
              isError: true,
            };
            break;
          case 'source_verifier':
            result = await sourceVerifier.execute(args);
            break;
          case 'consistency_checker':
            result = await consistencyChecker.execute(args);
            break;
          // Potemkin-specific tools
          case 'history_retriever':
            result = await historyRetriever.execute(args);
            break;
          case 'drift_calculator':
            result = await driftCalculator.execute(args);
            break;
          case 'bias_detector':
            result = await biasDetector.execute(args);
            break;
          case 'integrity_monitor':
            result = await integrityMonitor.execute(args);
            break;
          case 'alert_generator':
            result = await alertGenerator.execute(args);
            break;
          // Legal Email Drafting Tools
          case 'draft_legal_email':
            result = await legalEmailDrafter.execute(args);
            break;
          case 'refine_email_tone':
            result = await refineEmailTone.execute(args);
            break;
          case 'validate_legal_language':
            result = await validateLegalLanguage.execute(args);
            break;
          case 'cyrano_pathfinder':
            result = await cyranoPathfinder.execute(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

    return result;
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

// HTTP Routes
app.get('/mcp/tools', async (req, res) => {
  try {
    // Return the tools list directly
    const tools = [
      // Legal AI Tools
      documentAnalyzer.getToolDefinition(),
      contractComparator.getToolDefinition(),
      goodCounsel.getToolDefinition(),
      factChecker.getToolDefinition(),
      legalReviewer.getToolDefinition(),
      complianceChecker.getToolDefinition(),
      qualityAssessor.getToolDefinition(),
      workflowManager.getToolDefinition(),
      caseManager.getToolDefinition(),
      documentProcessor.getToolDefinition(),
      aiOrchestrator.getToolDefinition(),
      systemStatus.getToolDefinition(),
      
      // Arkiver Tools
      extractConversations.getToolDefinition(),
      extractTextContent.getToolDefinition(),
      categorizeWithKeywords.getToolDefinition(),
      processWithRegex.getToolDefinition(),
      generateCategorizedFiles.getToolDefinition(),
      runExtractionPipeline.getToolDefinition(),
      createArkiverConfig.getToolDefinition(),
      
      // Chronometric Tools
      gapIdentifier.getToolDefinition(),
      emailArtifactCollector.getToolDefinition(),
      calendarArtifactCollector.getToolDefinition(),
      documentArtifactCollector.getToolDefinition(),
      recollectionSupport.getToolDefinition(),
      preFillLogic.getToolDefinition(),
      dupeCheck.getToolDefinition(),
      provenanceTracker.getToolDefinition(),
      
      // Module/Engine Wrappers
      chronometricModuleTool.getToolDefinition(),
      maeEngineTool.getToolDefinition(),
      goodcounselEngineTool.getToolDefinition(),
      potemkinEngineTool.getToolDefinition(),
      
      // Shared Verification Tools (used by Potemkin and Arkiver)
      claimExtractor.getToolDefinition(),
      citationChecker.getToolDefinition(),
      citationFormatter.getToolDefinition(),
      sourceVerifier.getToolDefinition(),
      consistencyChecker.getToolDefinition(),
      // Arkiver MCP tools
      arkiverProcessFileTool.getToolDefinition(),
      arkiverJobStatusTool.getToolDefinition(),
      // Potemkin-specific tools
      historyRetriever.getToolDefinition(),
      driftCalculator.getToolDefinition(),
      biasDetector.getToolDefinition(),
      integrityMonitor.getToolDefinition(),
      alertGenerator.getToolDefinition(),
      // Legal Email Drafting Tools
      legalEmailDrafter.getToolDefinition(),
      refineEmailTone.getToolDefinition(),
      validateLegalLanguage.getToolDefinition(),
      // Cyrano Pathfinder - Unified Chat Interface
      cyranoPathfinder.getToolDefinition(),
    ];
    
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

app.post('/mcp/execute', async (req, res) => {
  try {
    // Support both 'input' and 'arguments' for compatibility
    const { tool, input, arguments: args } = req.body;
    const toolInput = input || args || {};
    
    // Execute the tool directly
    let result;
    switch (tool) {
      case 'document_analyzer':
        result = await documentAnalyzer.execute(toolInput);
        break;
      case 'contract_comparator':
        result = await contractComparator.execute(toolInput);
        break;
      case 'good_counsel':
        result = await goodCounsel.execute(toolInput);
        break;
      case 'fact_checker':
        result = await factChecker.execute(toolInput);
        break;
      case 'legal_reviewer':
        result = await legalReviewer.execute(toolInput);
        break;
      case 'compliance_checker':
        result = await complianceChecker.execute(toolInput);
        break;
      case 'quality_assessor':
        result = await qualityAssessor.execute(toolInput);
        break;
      case 'workflow_manager':
        result = await workflowManager.execute(toolInput);
        break;
      case 'case_manager':
        result = await caseManager.execute(toolInput);
        break;
      case 'document_processor':
        result = await documentProcessor.execute(toolInput);
        break;
      case 'ai_orchestrator':
        result = await aiOrchestrator.execute(toolInput);
        break;
      case 'system_status':
        result = await systemStatus.execute(toolInput);
        break;
      // status-indicator tool archived - see Cyrano/archive/broken-tools/
      case 'sync_manager':
        result = await syncManager.execute(toolInput);
        break;
      case 'red_flag_finder':
        result = await redFlagFinder.execute(toolInput);
        break;
      case 'clio_integration':
        result = await clioIntegration.execute(toolInput);
        break;
      case 'time_value_billing':
        result = await timeValueBilling.execute(toolInput);
        break;
      case 'auth':
        result = await authTool.execute(toolInput);
        break;
      case 'extract_conversations':
        result = await extractConversations.execute(toolInput);
        break;
      case 'extract_text_content':
        result = await extractTextContent.execute(toolInput);
        break;
      case 'categorize_with_keywords':
        result = await categorizeWithKeywords.execute(toolInput);
        break;
      case 'process_with_regex':
        result = await processWithRegex.execute(toolInput);
        break;
      case 'generate_categorized_files':
        result = await generateCategorizedFiles.execute(toolInput);
        break;
      case 'run_extraction_pipeline':
        result = await runExtractionPipeline.execute(toolInput);
        break;
      case 'create_arkiver_config':
        result = await createArkiverConfig.execute(toolInput);
        break;
        
      // Chronometric Tools
      case 'gap_identifier':
        result = await gapIdentifier.execute(toolInput);
        break;
      case 'email_artifact_collector':
        result = await emailArtifactCollector.execute(toolInput);
        break;
      case 'calendar_artifact_collector':
        result = await calendarArtifactCollector.execute(toolInput);
        break;
      case 'tasks_collector':
        result = await tasksCollector.execute(toolInput);
        break;
      case 'contacts_collector':
        result = await contactsCollector.execute(toolInput);
        break;
      case 'document_artifact_collector':
        result = await documentArtifactCollector.execute(toolInput);
        break;
      case 'recollection_support':
        result = await recollectionSupport.execute(toolInput);
        break;
      case 'pre_fill_logic':
        result = await preFillLogic.execute(toolInput);
        break;
      case 'dupe_check':
        result = await dupeCheck.execute(toolInput);
        break;
      case 'provenance_tracker':
        result = await provenanceTracker.execute(toolInput);
        break;
        
      // Module/Engine Wrappers
      case 'chronometric_module':
        result = await chronometricModuleTool.execute(toolInput);
        break;
      case 'mae_engine':
        result = await maeEngineTool.execute(toolInput);
        break;
      case 'goodcounsel_engine':
        result = await goodcounselEngineTool.execute(toolInput);
        break;
      case 'ethics_reviewer':
        result = await ethicsReviewer.execute(toolInput);
        break;
      case 'potemkin_engine':
        result = await potemkinEngineTool.execute(toolInput);
        break;
        
      // Shared verification tools
      case 'claim_extractor':
        result = await claimExtractor.execute(toolInput);
        break;
      case 'citation_checker':
        result = await citationChecker.execute(toolInput);
        break;
      case 'citation_formatter':
        result = await citationFormatter.execute(toolInput);
        break;
      case 'arkiver_process_file':
        result = await arkiverProcessFileTool.execute(toolInput);
        break;
      case 'arkiver_job_status':
        result = await arkiverJobStatusTool.execute(toolInput);
        break;
      case 'arkiver_integrity_test':
        result = await arkiverIntegrityTestTool.execute(toolInput);
        break;
      case 'arkiver_process_text':
        result = await arkiverTextProcessor.execute(toolInput);
        break;
      case 'arkiver_process_email':
        result = await arkiverEmailProcessor.execute(toolInput);
        break;
      case 'arkiver_extract_entities':
        result = await arkiverEntityProcessor.execute(toolInput);
        break;
      case 'arkiver_generate_insights':
        result = await arkiverInsightProcessor.execute(toolInput);
        break;
      case 'arkiver_extract_timeline':
        result = await arkiverTimelineProcessor.execute(toolInput);
        break;
      case 'rag_query':
        result = await ragQuery.execute(toolInput);
        break;
      case 'document_drafter':
        result = await new DocumentDrafterTool().execute(toolInput);
        break;
      case 'tool_enhancer':
        // TODO: tool_enhancer not implemented
        result = {
          content: [{ type: 'text', text: 'Tool enhancer not available' }],
          isError: true,
        };
        break;
      case 'source_verifier':
        result = await sourceVerifier.execute(toolInput);
        break;
      case 'consistency_checker':
        result = await consistencyChecker.execute(toolInput);
        break;
        
      // Potemkin-specific tools
      case 'history_retriever':
        result = await historyRetriever.execute(toolInput);
        break;
      case 'drift_calculator':
        result = await driftCalculator.execute(toolInput);
        break;
      case 'bias_detector':
        result = await biasDetector.execute(toolInput);
        break;
      case 'integrity_monitor':
        result = await integrityMonitor.execute(toolInput);
        break;
      case 'alert_generator':
        result = await alertGenerator.execute(toolInput);
        break;
      
      // Cyrano Pathfinder
      case 'cyrano_pathfinder':
        result = await cyranoPathfinder.execute(toolInput);
        break;
        
      default:
        res.status(400).json({
          content: [
            {
              type: 'text',
              text: `Tool not found: ${tool}`,
            },
          ],
          isError: true,
        });
        return;
    }
    
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
  res.json({ status: 'running', server: 'cyrano-mcp-http-bridge' });
});

// GoodCounsel API endpoint for LexFiat integration
app.get('/api/good-counsel/overview', async (req, res) => {
  try {
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tools_count: 32,
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
    const toolsInfo = [
      // Legal AI Tools
      { category: 'Legal AI', ...documentAnalyzer.getToolDefinition() },
      { category: 'Legal AI', ...contractComparator.getToolDefinition() },
      { category: 'Legal AI', ...goodCounsel.getToolDefinition() },
      { category: 'Legal AI', ...factChecker.getToolDefinition() },
      { category: 'Legal AI', ...legalReviewer.getToolDefinition() },
      { category: 'Legal AI', ...complianceChecker.getToolDefinition() },
      { category: 'Legal AI', ...qualityAssessor.getToolDefinition() },
      { category: 'Legal AI', ...workflowManager.getToolDefinition() },
      { category: 'Legal AI', ...caseManager.getToolDefinition() },
      { category: 'Legal AI', ...documentProcessor.getToolDefinition() },
      { category: 'Legal AI', ...aiOrchestrator.getToolDefinition() },
      { category: 'System', ...systemStatus.getToolDefinition() },
      
      // Arkiver Tools
      { category: 'Data Processing', ...extractConversations.getToolDefinition() },
      { category: 'Data Processing', ...extractTextContent.getToolDefinition() },
      { category: 'Data Processing', ...categorizeWithKeywords.getToolDefinition() },
      { category: 'Data Processing', ...processWithRegex.getToolDefinition() },
      { category: 'Data Processing', ...generateCategorizedFiles.getToolDefinition() },
      { category: 'Data Processing', ...runExtractionPipeline.getToolDefinition() },
      { category: 'Data Processing', ...createArkiverConfig.getToolDefinition() },
      
      // Chronometric Tools
      { category: 'Timekeeping', ...gapIdentifier.getToolDefinition() },
      { category: 'Timekeeping', ...emailArtifactCollector.getToolDefinition() },
      { category: 'Timekeeping', ...calendarArtifactCollector.getToolDefinition() },
      { category: 'Timekeeping', ...documentArtifactCollector.getToolDefinition() },
      { category: 'Timekeeping', ...recollectionSupport.getToolDefinition() },
      { category: 'Timekeeping', ...preFillLogic.getToolDefinition() },
      { category: 'Timekeeping', ...dupeCheck.getToolDefinition() },
      { category: 'Timekeeping', ...provenanceTracker.getToolDefinition() },
      
      // Module/Engine Wrappers
      { category: 'Module', ...chronometricModuleTool.getToolDefinition() },
      { category: 'Engine', ...maeEngineTool.getToolDefinition() },
      { category: 'Engine', ...goodcounselEngineTool.getToolDefinition() },
      { category: 'Engine', ...potemkinEngineTool.getToolDefinition() },
    ];
    
    res.json({ 
      tools: toolsInfo,
      summary: {
        total_tools: toolsInfo.length,
        legal_ai_tools: toolsInfo.filter(t => t.category === 'Legal AI').length,
        data_processing_tools: toolsInfo.filter(t => t.category === 'Data Processing').length,
        timekeeping_tools: toolsInfo.filter(t => t.category === 'Timekeeping').length,
        modules: toolsInfo.filter(t => t.category === 'Module').length,
        engines: toolsInfo.filter(t => t.category === 'Engine').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tools info' });
  }
});

// Arkiver File Upload Endpoint
app.post('/api/arkiver/upload', upload.single('file'), async (req, res) => {
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

    // Import required modules
    const { defaultStorage } = await import('./modules/arkiver/storage/local.js');
    const { db } = await import('./db.js');
    const { arkiverFiles } = await import('./modules/arkiver/schema.js');
    const path = await import('path');
    const { eq } = await import('drizzle-orm');
    
    // Parse metadata if provided
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

    // Determine file type from extension
    const ext = path.extname(file.originalname).toLowerCase();
    const fileType = ext.replace('.', '') || 'unknown';
    const mimeType = file.mimetype || 'application/octet-stream';

    // Upload to storage
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

    // Get user ID (for now, use default user ID 1 - should be from auth)
    const userId = 1; // TODO: Get from authentication

    // Save file record to database
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
    const { fileId } = req.params;
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

// Start server
// Export app for testing
export { app };

// Start server if this file is run directly (not imported)
// In test environments, the app will be imported and a test server created
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('http-bridge.ts')) {
  const server = app.listen(port, () => {
    console.log(`Cyrano MCP HTTP Bridge running on port ${port}`);
    console.log(`Available endpoints:`);
    console.log(`  GET  /health - Health check`);
    console.log(`  GET  /mcp/tools - List available tools`);
    console.log(`  GET  /mcp/tools/info - Detailed tool information`);
    console.log(`  POST /mcp/execute - Execute a tool`);
    console.log(`  GET  /mcp/status - Server status`);
    console.log(`  POST /api/arkiver/upload - Upload file to Arkiver`);
    console.log(`  GET  /api/arkiver/files/:fileId - Get file status`);
    console.log(`  POST /api/onboarding/practice-profile - Save practice profile`);
    console.log(`  GET  /api/onboarding/practice-profile - Get practice profile`);
    console.log(`  POST /api/library/locations - Add/update library location`);
    console.log(`  GET  /api/library/locations - List library locations`);
    console.log(`  GET  /api/library/items - List library items`);
    console.log(`  POST /api/library/items/:id/pin - Toggle pin status`);
    console.log(`  POST /api/library/items/:id/ingest - Enqueue for RAG ingestion`);
    console.log(`  GET  /api/health/library - Library health status`);
  });
}
