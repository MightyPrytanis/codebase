#!/usr/bin/env tsx
/**
 * Comprehensive Tool Testing Script
 * Tests all registered tools with Perplexity (primary) and Anthropic (secondary)
 */

import dotenv from 'dotenv';
dotenv.config();

import { apiValidator } from './src/utils/api-validator.js';
import { aiService } from './src/services/ai-service.js';
import { PerplexityService } from './src/services/perplexity.js';

// Reload config after dotenv
apiValidator.reloadConfig();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  name: string;
  provider: string;
  success: boolean;
  error?: string;
  response?: string;
  duration?: number;
}

// Tool test configurations
const toolTests: Array<{
  name: string;
  importPath: string;
  exportName: string;
  testArgs: any;
  category: string;
}> = [
  // Legal AI Tools
  {
    name: 'document_analyzer',
    importPath: './src/tools/document-analyzer.js',
    exportName: 'documentAnalyzer',
    testArgs: { document_text: 'Test legal document for analysis.', analysis_type: 'summary' },
    category: 'Legal AI',
  },
  {
    name: 'contract_comparator',
    importPath: './src/tools/contract-comparator.js',
    exportName: 'contractComparator',
    testArgs: { document1_text: 'Document one content.', document2_text: 'Document two content.', comparison_type: 'comprehensive' },
    category: 'Legal AI',
  },
  {
    name: 'good_counsel',
    importPath: './src/tools/goodcounsel.js',
    exportName: 'goodCounsel',
    testArgs: { query: 'What are ethical considerations for client representation?' },
    category: 'Legal AI',
  },
  {
    name: 'fact_checker',
    importPath: './src/tools/fact-checker.js',
    exportName: 'factChecker',
    testArgs: { claim_text: 'The Michigan Supreme Court was established in 1836', verification_level: 'basic' },
    category: 'Legal AI',
  },
  {
    name: 'legal_reviewer',
    importPath: './src/tools/legal-reviewer.js',
    exportName: 'legalReviewer',
    testArgs: { document_text: 'Test legal document for review.', review_type: 'comprehensive' },
    category: 'Legal AI',
  },
  {
    name: 'compliance_checker',
    importPath: './src/tools/compliance-checker.js',
    exportName: 'complianceChecker',
    testArgs: { document_text: 'Test document for compliance checking.', compliance_type: 'general' },
    category: 'Legal AI',
  },
  {
    name: 'quality_assessor',
    importPath: './src/tools/quality-assessor.js',
    exportName: 'qualityAssessor',
    testArgs: { document_text: 'Test document for quality assessment.', assessment_type: 'comprehensive' },
    category: 'Legal AI',
  },
  {
    name: 'red_flag_finder',
    importPath: './src/tools/red-flag-finder.js',
    exportName: 'redFlagFinder',
    testArgs: { action: 'analyze_urgency', content: 'Test document with potential red flags.', document_type: 'other', urgency_threshold: 'medium' },
    category: 'Legal AI',
  },
  {
    name: 'workflow_manager',
    importPath: './src/tools/workflow-manager.js',
    exportName: 'workflowManager',
    testArgs: { action: 'list_workflows' },
    category: 'Legal AI',
  },
  {
    name: 'case_manager',
    importPath: './src/tools/case-manager.js',
    exportName: 'caseManager',
    testArgs: { action: 'list_cases' },
    category: 'Legal AI',
  },
  {
    name: 'document_processor',
    importPath: './src/tools/document-processor.js',
    exportName: 'documentProcessor',
    testArgs: { document_text: 'Test document for processing.', processing_type: 'extract' },
    category: 'Legal AI',
  },
  {
    name: 'ai_orchestrator',
    importPath: './src/tools/ai-orchestrator.js',
    exportName: 'aiOrchestrator',
    testArgs: { prompt: 'What is 2+2?', providers: ['perplexity'] },
    category: 'Legal AI',
  },
  {
    name: 'system_status',
    importPath: './src/tools/system-status.js',
    exportName: 'systemStatus',
    testArgs: {},
    category: 'System',
  },
  {
    // status-indicator tool archived - see Cyrano/archive/broken-tools/
    // name: 'status_indicator',
    // importPath: './src/tools/status-indicator.js',
    // exportName: 'statusIndicator',
    testArgs: { context: 'beta-release' },
    category: 'System',
  },
  {
    name: 'sync_manager',
    importPath: './src/tools/sync-manager.js',
    exportName: 'syncManager',
    testArgs: { action: 'status' },
    category: 'System',
  },
  {
    name: 'clio_integration',
    importPath: './src/tools/clio-integration.js',
    exportName: 'clioIntegration',
    testArgs: { action: 'get_matter_info', matter_id: 'test-123' },
    category: 'Integration',
  },
  {
    name: 'time_value_billing',
    importPath: './src/tools/time-value-billing.js',
    exportName: 'timeValueBilling',
    testArgs: { action: 'analyze_period', start: '2025-01-01T00:00:00Z', end: '2025-01-02T00:00:00Z', sources: {} },
    category: 'Timekeeping',
  },
  {
    name: 'auth',
    importPath: './src/tools/auth.js',
    exportName: 'authTool',
    testArgs: { action: 'login', username: 'test', password: 'test' },
    category: 'System',
  },
  // Arkiver Tools
  {
    name: 'extract_conversations',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'extractConversations',
    testArgs: { text: 'Test conversation text.' },
    category: 'Arkiver',
  },
  {
    name: 'extract_text_content',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'extractTextContent',
    testArgs: { content: 'Test content to extract.' },
    category: 'Arkiver',
  },
  {
    name: 'categorize_with_keywords',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'categorizeWithKeywords',
    testArgs: { text: 'Test text for categorization.', keywords: ['test', 'example'] },
    category: 'Arkiver',
  },
  {
    name: 'process_with_regex',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'processWithRegex',
    testArgs: { text: 'Test text for regex processing.', pattern: 'test' },
    category: 'Arkiver',
  },
  {
    name: 'generate_categorized_files',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'generateCategorizedFiles',
    testArgs: { data: { category: 'test', items: [] } },
    category: 'Arkiver',
  },
  {
    name: 'run_extraction_pipeline',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'runExtractionPipeline',
    testArgs: { config: { source: 'test' } },
    category: 'Arkiver',
  },
  {
    name: 'create_arkiver_config',
    importPath: './src/tools/arkiver-tools.js',
    exportName: 'createArkiverConfig',
    testArgs: { config: { name: 'test' } },
    category: 'Arkiver',
  },
  // Chronometric Tools
  {
    name: 'gap_identifier',
    importPath: './src/tools/gap-identifier.js',
    exportName: 'gapIdentifier',
    testArgs: { start_date: '2025-01-01', end_date: '2025-01-02' },
    category: 'Chronometric',
  },
  {
    name: 'email_artifact_collector',
    importPath: './src/tools/email-artifact-collector.js',
    exportName: 'emailArtifactCollector',
    testArgs: { start_date: '2025-01-01', end_date: '2025-01-02' },
    category: 'Chronometric',
  },
  {
    name: 'calendar_artifact_collector',
    importPath: './src/tools/calendar-artifact-collector.js',
    exportName: 'calendarArtifactCollector',
    testArgs: { start_date: '2025-01-01', end_date: '2025-01-02' },
    category: 'Chronometric',
  },
  {
    name: 'tasks_collector',
    importPath: './src/tools/tasks-collector.js',
    exportName: 'tasksCollector',
    testArgs: { provider: 'both' },
    category: 'Chronometric',
  },
  {
    name: 'contacts_collector',
    importPath: './src/tools/contacts-collector.js',
    exportName: 'contactsCollector',
    testArgs: { provider: 'both' },
    category: 'Chronometric',
  },
  {
    name: 'document_artifact_collector',
    importPath: './src/tools/document-artifact-collector.js',
    exportName: 'documentArtifactCollector',
    testArgs: { start_date: '2025-01-01', end_date: '2025-01-02' },
    category: 'Chronometric',
  },
  {
    name: 'recollection_support',
    importPath: './src/tools/recollection-support.js',
    exportName: 'recollectionSupport',
    testArgs: { query: 'test query' },
    category: 'Chronometric',
  },
  {
    name: 'pre_fill_logic',
    importPath: './src/tools/pre-fill-logic.js',
    exportName: 'preFillLogic',
    testArgs: { context: 'test context' },
    category: 'Chronometric',
  },
  {
    name: 'dupe_check',
    importPath: './src/tools/dupe-check.js',
    exportName: 'dupeCheck',
    testArgs: { items: [] },
    category: 'Chronometric',
  },
  {
    name: 'provenance_tracker',
    importPath: './src/tools/provenance-tracker.js',
    exportName: 'provenanceTracker',
    testArgs: { action: 'track', item: { id: 'test' } },
    category: 'Chronometric',
  },
  // Module/Engine Wrappers
  {
    name: 'chronometric_module',
    importPath: './src/tools/chronometric-module.js',
    exportName: 'chronometricModuleTool',
    testArgs: { action: 'status' },
    category: 'Module',
  },
  {
    name: 'mae_engine',
    importPath: './src/tools/mae-engine.js',
    exportName: 'maeEngineTool',
    testArgs: { action: 'analyze', document1: 'test1', document2: 'test2' },
    category: 'Engine',
  },
  {
    name: 'goodcounsel_engine',
    importPath: './src/tools/goodcounsel-engine.js',
    exportName: 'goodcounselEngineTool',
    testArgs: { action: 'list_workflows' },
    category: 'Engine',
  },
  {
    name: 'ethics_reviewer',
    importPath: './src/engines/goodcounsel/tools/ethics-reviewer.js',
    exportName: 'ethicsReviewer',
    testArgs: { document_text: 'Test document for ethics review.' },
    category: 'Engine',
  },
  {
    name: 'potemkin_engine',
    importPath: './src/tools/potemkin-engine.js',
    exportName: 'potemkinEngineTool',
    testArgs: { action: 'verify', content: 'test content' },
    category: 'Engine',
  },
  // Verification Tools
  {
    name: 'claim_extractor',
    importPath: './src/tools/verification/claim-extractor.js',
    exportName: 'claimExtractor',
    testArgs: { document_text: 'Test document with claims.' },
    category: 'Verification',
  },
  {
    name: 'citation_checker',
    importPath: './src/tools/verification/citation-checker.js',
    exportName: 'citationChecker',
    testArgs: { citation: '123 Mich. App. 456 (2020)' },
    category: 'Verification',
  },
  {
    name: 'citation_formatter',
    importPath: './src/tools/verification/citation-formatter.js',
    exportName: 'citationFormatter',
    testArgs: { citation: '123 Mich. App. 456', format: 'bluebook' },
    category: 'Verification',
  },
  {
    name: 'source_verifier',
    importPath: './src/tools/verification/source-verifier.js',
    exportName: 'sourceVerifier',
    testArgs: { source: 'test source', claim: 'test claim' },
    category: 'Verification',
  },
  {
    name: 'consistency_checker',
    importPath: './src/tools/verification/consistency-checker.js',
    exportName: 'consistencyChecker',
    testArgs: { documents: ['doc1', 'doc2'] },
    category: 'Verification',
  },
  // Arkiver Processor Tools
  {
    name: 'arkiver_process_text',
    importPath: './src/tools/arkiver-processor-tools.js',
    exportName: 'arkiverTextProcessor',
    testArgs: { text: 'Test text for processing.' },
    category: 'Arkiver',
  },
  {
    name: 'arkiver_process_email',
    importPath: './src/tools/arkiver-processor-tools.js',
    exportName: 'arkiverEmailProcessor',
    testArgs: { email: { subject: 'Test', body: 'Test body' } },
    category: 'Arkiver',
  },
  {
    name: 'arkiver_extract_entities',
    importPath: './src/tools/arkiver-processor-tools.js',
    exportName: 'arkiverEntityProcessor',
    testArgs: { text: 'Test text for entity extraction.' },
    category: 'Arkiver',
  },
  {
    name: 'arkiver_generate_insights',
    importPath: './src/tools/arkiver-processor-tools.js',
    exportName: 'arkiverInsightProcessor',
    testArgs: { data: { items: [] } },
    category: 'Arkiver',
  },
  {
    name: 'arkiver_extract_timeline',
    importPath: './src/tools/arkiver-processor-tools.js',
    exportName: 'arkiverTimelineProcessor',
    testArgs: { data: { items: [] } },
    category: 'Arkiver',
  },
  // Potemkin Tools
  {
    name: 'history_retriever',
    importPath: './src/engines/potemkin/tools/index.js',
    exportName: 'historyRetriever',
    testArgs: { query: 'test query' },
    category: 'Potemkin',
  },
  {
    name: 'drift_calculator',
    importPath: './src/engines/potemkin/tools/index.js',
    exportName: 'driftCalculator',
    testArgs: { baseline: 'test', current: 'test' },
    category: 'Potemkin',
  },
  {
    name: 'bias_detector',
    importPath: './src/engines/potemkin/tools/index.js',
    exportName: 'biasDetector',
    testArgs: { content: 'test content' },
    category: 'Potemkin',
  },
  {
    name: 'integrity_monitor',
    importPath: './src/engines/potemkin/tools/index.js',
    exportName: 'integrityMonitor',
    testArgs: { action: 'monitor', content: 'test' },
    category: 'Potemkin',
  },
  {
    name: 'alert_generator',
    importPath: './src/engines/potemkin/tools/index.js',
    exportName: 'alertGenerator',
    testArgs: { alert_type: 'test', message: 'test alert' },
    category: 'Potemkin',
  },
  // Legal Email Tools
  {
    name: 'draft_legal_email',
    importPath: './src/tools/legal-email-drafter.js',
    exportName: 'legalEmailDrafter',
    testArgs: { recipient: 'test@example.com', subject: 'Test', content: 'Test email content.' },
    category: 'Legal Email',
  },
  {
    name: 'refine_email_tone',
    importPath: './src/tools/legal-email-drafter.js',
    exportName: 'refineEmailTone',
    testArgs: { email_text: 'Test email text.', tone: 'professional' },
    category: 'Legal Email',
  },
  {
    name: 'validate_legal_language',
    importPath: './src/tools/legal-email-drafter.js',
    exportName: 'validateLegalLanguage',
    testArgs: { text: 'Test legal language.' },
    category: 'Legal Email',
  },
  // RAG and Other Tools
  {
    name: 'rag_query',
    importPath: './src/tools/rag-query.js',
    exportName: 'ragQuery',
    testArgs: { action: 'query', query: 'test query' },
    category: 'RAG',
  },
  {
    name: 'document_drafter',
    importPath: './src/tools/document-drafter.js',
    exportName: 'DocumentDrafterTool',
    testArgs: { prompt: 'Draft a test motion.', documentType: 'motion' },
    category: 'Document',
  },
  {
    name: 'tool_enhancer',
    importPath: './src/tools/tool-enhancer.js',
    exportName: 'toolEnhancer',
    testArgs: { tool_name: 'fact_checker', user_request: 'Enhance fact checking capabilities.' },
    category: 'Utility',
  },
];

async function testTool(toolTest: typeof toolTests[0], provider: 'perplexity' | 'anthropic'): Promise<TestResult> {
  const start = Date.now();
  try {
    const module = await import(toolTest.importPath);
    const tool = module[toolTest.exportName] || module.default;
    
    if (!tool) {
      return {
        name: `${toolTest.name} (${provider})`,
        provider,
        success: false,
        error: `Tool not found. Available: ${Object.keys(module).join(', ')}`,
        duration: Date.now() - start,
      };
    }

    // Handle class-based tools (like DocumentDrafterTool)
    const toolInstance = typeof tool === 'function' && tool.prototype?.execute ? new tool() : tool;
    
    const result = await toolInstance.execute(toolTest.testArgs);
    
    if (!result) {
      return {
        name: `${toolTest.name} (${provider})`,
        provider,
        success: false,
        error: 'Tool returned undefined result',
        duration: Date.now() - start,
      };
    }

    if (result.isError) {
      return {
        name: `${toolTest.name} (${provider})`,
        provider,
        success: false,
        error: result.content?.[0]?.text || 'Unknown error',
        duration: Date.now() - start,
      };
    }

    return {
      name: `${toolTest.name} (${provider})`,
      provider,
      success: true,
      response: result.content?.[0]?.text?.substring(0, 100) || 'Success',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: `${toolTest.name} (${provider})`,
      provider,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

async function runAllTests() {
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Comprehensive Tool Testing${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const allResults: TestResult[] = [];
  const categories = new Set(toolTests.map(t => t.category));
  
  // Test with Perplexity (primary)
  console.log(`${colors.yellow}Testing with Perplexity (Primary)...${colors.reset}\n`);
  for (const category of categories) {
    const categoryTools = toolTests.filter(t => t.category === category);
    console.log(`${colors.cyan}${category} (${categoryTools.length} tools)${colors.reset}`);
    
    for (const toolTest of categoryTools) {
      const result = await testTool(toolTest, 'perplexity');
      allResults.push(result);
      const icon = result.success ? `${colors.green}✅` : `${colors.red}❌`;
      console.log(`  ${icon} ${result.name}${result.duration ? ` (${result.duration}ms)` : ''}${colors.reset}`);
      if (!result.success && result.error) {
        console.log(`    ${colors.gray}${result.error.substring(0, 80)}${colors.reset}`);
      }
    }
    console.log('');
  }

  // Test with Anthropic (secondary) - only for tools that use AI
  const aiTools = toolTests.filter(t => 
    ['Legal AI', 'RAG', 'Document', 'Legal Email'].includes(t.category)
  );
  
  console.log(`\n${colors.yellow}Testing AI Tools with Anthropic (Secondary)...${colors.reset}\n`);
  for (const toolTest of aiTools.slice(0, 10)) { // Test first 10 AI tools with Anthropic
    const result = await testTool(toolTest, 'anthropic');
    allResults.push(result);
    const icon = result.success ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(`  ${icon} ${result.name}${result.duration ? ` (${result.duration}ms)` : ''}${colors.reset}`);
  }

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  const byCategory = new Map<string, { success: number; total: number }>();

  allResults.forEach(r => {
    const category = toolTests.find(t => r.name.includes(t.name))?.category || 'Unknown';
    if (!byCategory.has(category)) {
      byCategory.set(category, { success: 0, total: 0 });
    }
    const stats = byCategory.get(category)!;
    stats.total++;
    if (r.success) stats.success++;
  });

  console.log(`${colors.green}✅ Successful: ${successful.length}/${allResults.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed.length}/${allResults.length}${colors.reset}\n`);

  console.log(`${colors.cyan}By Category:${colors.reset}`);
  byCategory.forEach((stats, category) => {
    const pct = ((stats.success / stats.total) * 100).toFixed(1);
    const color = stats.success === stats.total ? colors.green : stats.success > 0 ? colors.yellow : colors.red;
    console.log(`  ${category}: ${color}${stats.success}/${stats.total} (${pct}%)${colors.reset}`);
  });

  if (failed.length > 0) {
    console.log(`\n${colors.red}Failed Tools:${colors.reset}`);
    failed.forEach(r => {
      console.log(`  - ${r.name}: ${r.error?.substring(0, 100)}`);
    });
  }

  return allResults;
}

runAllTests()
  .then(results => {
    const successCount = results.filter(r => r.success).length;
    process.exit(successCount > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });

