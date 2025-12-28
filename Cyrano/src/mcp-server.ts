#!/usr/bin/env node

/*
Copyright 2025 Cognisint LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { gapIdentifier } from './tools/gap-identifier.js';
import { emailArtifactCollector } from './tools/email-artifact-collector.js';
import { calendarArtifactCollector } from './tools/calendar-artifact-collector.js';
import { documentArtifactCollector } from './tools/document-artifact-collector.js';
import { tasksCollector } from './tools/tasks-collector.js';
import { contactsCollector } from './tools/contacts-collector.js';
import { recollectionSupport } from './tools/recollection-support.js';
import { preFillLogic } from './tools/pre-fill-logic.js';
import { dupeCheck } from './tools/dupe-check.js';
import { provenanceTracker } from './tools/provenance-tracker.js';
import { chronometricModuleTool } from './tools/chronometric-module.js';
import { maeEngineTool } from './tools/mae-engine.js';
import { goodcounselEngineTool } from './tools/goodcounsel-engine.js';
import { ethicsReviewer } from './engines/goodcounsel/tools/ethics-reviewer.js';
import { ethicalAIGuard } from './tools/ethical-ai-guard.js';
import { tenRulesChecker } from './tools/ten-rules-checker.js';
import { ethicsPolicyExplainer } from './tools/ethics-policy-explainer.js';
import { getEthicsAuditTool, getEthicsStatsTool } from './tools/ethics-audit-tools.js';
import { potemkinEngineTool } from './tools/potemkin-engine.js';
import { forecastEngineTool } from './tools/forecast-engine.js';
// Import shared verification tools
import { claimExtractor } from './tools/verification/claim-extractor.js';
import { citationChecker } from './tools/verification/citation-checker.js';
import { citationFormatter } from './tools/verification/citation-formatter.js';
import { sourceVerifier } from './tools/verification/source-verifier.js';
import { consistencyChecker } from './tools/verification/consistency-checker.js';
import { arkiverProcessFileTool, arkiverJobStatusTool } from './tools/arkiver-mcp-tools.js';
import { arkiverIntegrityTestTool } from './tools/arkiver-integrity-test.js';
import {
  arkiverTextProcessor,
  arkiverEmailProcessor,
  arkiverEntityProcessor,
  arkiverInsightProcessor,
  arkiverTimelineProcessor,
} from './tools/arkiver-processor-tools.js';
// Import Potemkin-specific tools
import {
  historyRetriever,
  driftCalculator,
  biasDetector,
  integrityMonitor,
  alertGenerator,
} from './engines/potemkin/tools/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

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
import { aiOrchestrator } from './engines/mae/services/ai-orchestrator.js';
import { systemStatus } from './tools/system-status.js';
// status-indicator tool archived - see Cyrano/archive/broken-tools/
import { ragQuery } from './tools/rag-query.js';
import { authTool } from './tools/auth.js';  // Add auth tool import
import { syncManager } from './tools/sync-manager.js';
import { redFlagFinder } from './tools/red-flag-finder.js';
import { clioIntegration } from './tools/clio-integration.js';
import { micourtQuery } from './tools/micourt-query.js';
import { timeValueBilling } from './tools/time-value-billing.js';
import { documentDrafterTool } from './tools/document-drafter.js';
import { workflowStatusTool } from './tools/workflow-status.js';
import { workflowArchaeology } from './tools/workflow-archaeology.js';
import {
  getGoodCounselPromptsTool,
  dismissGoodCounselPromptTool,
  snoozeGoodCounselPromptTypeTool,
  getGoodCounselPromptHistoryTool,
  evaluateGoodCounselContextTool,
} from './tools/goodcounsel-prompts.js';
import { wellnessJournalTool } from './tools/wellness-journal.js';
import {
  legalEmailDrafter,
  refineEmailTone,
  validateLegalLanguage,
} from './tools/legal-email-drafter.js';
import {
  extractConversations,
  extractTextContent,
  categorizeWithKeywords,
  processWithRegex,
  generateCategorizedFiles,
  runExtractionPipeline,
  createArkiverConfig
} from './tools/arkiver-tools.js';
import { cyranoPathfinder } from './tools/cyrano-pathfinder.js';
import { skillExecutor } from './tools/skill-executor.js';

class CyranoMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.setupToolHandlers();
    this.loadSkills();
  }

  /**
   * Load all skills at startup
   */
  private async loadSkills(): Promise<void> {
    try {
      const { skillRegistry } = await import('./skills/skill-registry.js');
      await skillRegistry.loadAll();
      console.error(`[Skills] Loaded ${skillRegistry.getCount()} skills`);
    } catch (error) {
      console.error('[Skills] Failed to load skills:', error);
      // Don't fail startup if skills fail to load
    }
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          authTool.getToolDefinition(),  // Add auth tool first
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
          extractConversations.getToolDefinition(),
          extractTextContent.getToolDefinition(),
          categorizeWithKeywords.getToolDefinition(),
          processWithRegex.getToolDefinition(),
          generateCategorizedFiles.getToolDefinition(),
          runExtractionPipeline.getToolDefinition(),
          createArkiverConfig.getToolDefinition(),
          timeValueBilling.getToolDefinition(),
          gapIdentifier.getToolDefinition(),
          emailArtifactCollector.getToolDefinition(),
          calendarArtifactCollector.getToolDefinition(),
          tasksCollector.getToolDefinition(),
          contactsCollector.getToolDefinition(),
          documentArtifactCollector.getToolDefinition(),
          recollectionSupport.getToolDefinition(),
          preFillLogic.getToolDefinition(),
          dupeCheck.getToolDefinition(),
          provenanceTracker.getToolDefinition(),
          workflowArchaeology.getToolDefinition(),
          chronometricModuleTool.getToolDefinition(),
          maeEngineTool.getToolDefinition(),
          goodcounselEngineTool.getToolDefinition(),
          ethicsReviewer.getToolDefinition(),
          // EthicalAI Tools
          ethicalAIGuard.getToolDefinition(),
          tenRulesChecker.getToolDefinition(),
          ethicsPolicyExplainer.getToolDefinition(),
          getEthicsAuditTool.getToolDefinition(),
          getEthicsStatsTool.getToolDefinition(),
          potemkinEngineTool.getToolDefinition(),
          forecastEngineTool.getToolDefinition(),
          // Shared verification tools (used by Potemkin and Arkiver)
          claimExtractor.getToolDefinition(),
          citationChecker.getToolDefinition(),
          citationFormatter.getToolDefinition(),
          sourceVerifier.getToolDefinition(),
          consistencyChecker.getToolDefinition(),
          // Potemkin-specific tools
          historyRetriever.getToolDefinition(),
          driftCalculator.getToolDefinition(),
          biasDetector.getToolDefinition(),
          integrityMonitor.getToolDefinition(),
          alertGenerator.getToolDefinition(),
          // Arkiver processor tools
          arkiverTextProcessor.getToolDefinition(),
          arkiverEmailProcessor.getToolDefinition(),
          arkiverEntityProcessor.getToolDefinition(),
          arkiverInsightProcessor.getToolDefinition(),
          arkiverTimelineProcessor.getToolDefinition(),
          // Arkiver job tools
          arkiverProcessFileTool.getToolDefinition(),
          arkiverJobStatusTool.getToolDefinition(),
          // Arkiver integrity testing (uses Potemkin engine)
          arkiverIntegrityTestTool.getToolDefinition(),
          // RAG Pipeline
          ragQuery.getToolDefinition(),
          // Office/Acrobat Integration
          documentDrafterTool.getToolDefinition(),
          // Legal Email Drafting Tools
          legalEmailDrafter.getToolDefinition(),
          refineEmailTone.getToolDefinition(),
          validateLegalLanguage.getToolDefinition(),
          // Workflow Status
          workflowStatusTool.getToolDefinition(),
          // GoodCounsel Prompts
          getGoodCounselPromptsTool.getToolDefinition(),
          dismissGoodCounselPromptTool.getToolDefinition(),
          snoozeGoodCounselPromptTypeTool.getToolDefinition(),
          getGoodCounselPromptHistoryTool.getToolDefinition(),
          evaluateGoodCounselContextTool.getToolDefinition(),
          // Wellness Journaling
          wellnessJournalTool.getToolDefinition(),
          // Cyrano Pathfinder - Unified Chat Interface
          cyranoPathfinder.getToolDefinition(),
          // Skills Executor
          skillExecutor.getToolDefinition(),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: CallToolResult;

        switch (name) {
          case 'auth':  // Add auth tool case
            result = await authTool.execute(args);
            break;
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
        case 'micourt_query':
          result = await micourtQuery.execute(args);
          break;
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
          case 'time_value_billing':
            result = await timeValueBilling.execute(args);
            break;
          case 'document_drafter':
            result = await documentDrafterTool.execute(args);
            break;
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
          case 'workflow_archaeology':
            result = await workflowArchaeology.execute(args) as CallToolResult;
            break;
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
          // EthicalAI Tools
          case 'ethical_ai_guard':
            result = await ethicalAIGuard.execute(args);
            break;
          case 'ten_rules_checker':
            result = await tenRulesChecker.execute(args);
            break;
          case 'ethics_policy_explainer':
            result = await ethicsPolicyExplainer.execute(args);
            break;
          case 'get_ethics_audit':
            result = await getEthicsAuditTool.execute(args);
            break;
          case 'get_ethics_stats':
            result = await getEthicsStatsTool.execute(args);
            break;
          case 'potemkin_engine':
            result = await potemkinEngineTool.execute(args);
            break;
          case 'forecast_engine':
            const forecastResult = await forecastEngineTool.execute(args);
            // Normalize result to match CallToolResult type
            if (forecastResult && typeof forecastResult === 'object' && 'content' in forecastResult && Array.isArray(forecastResult.content)) {
              result = {
                ...forecastResult,
                content: forecastResult.content.map((item: any) => {
                  if (item && typeof item === 'object' && 'type' in item && 'text' in item) {
                    return {
                      type: 'text' as const,
                      text: item.text,
                      ...(item.annotations ? { annotations: item.annotations } : {}),
                      ...(item._meta ? { _meta: item._meta } : {}),
                    };
                  }
                  return item;
                }),
              } as CallToolResult;
            } else {
              result = forecastResult as CallToolResult;
            }
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
          case 'workflow_status':
            result = await workflowStatusTool.execute(args);
            break;
          case 'get_goodcounsel_prompts':
            result = await getGoodCounselPromptsTool.execute(args);
            break;
          case 'dismiss_goodcounsel_prompt':
            result = await dismissGoodCounselPromptTool.execute(args);
            break;
          case 'snooze_goodcounsel_prompt_type':
            result = await snoozeGoodCounselPromptTypeTool.execute(args);
            break;
          case 'get_goodcounsel_prompt_history':
            result = await getGoodCounselPromptHistoryTool.execute(args);
            break;
          case 'evaluate_goodcounsel_context':
            result = await evaluateGoodCounselContextTool.execute(args);
            break;
          case 'wellness_journal':
            result = await wellnessJournalTool.execute(args);
            break;
          case 'cyrano_pathfinder':
            result = await cyranoPathfinder.execute(args);
            break;
          case 'skill_executor':
            result = await skillExecutor.execute(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return result as CallToolResult;
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        } as CallToolResult;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cyrano MCP Server running on stdio');
  }
}

// Export the class for use in other modules
export { CyranoMCPServer };

// Start the server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new CyranoMCPServer();
  server.run().catch(console.error);
}
