---
Document ID: README
Title: Readme
Subject(s): Cyrano | Reference
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Mae Engine

Multi-Agent Engine

## Overview

The MAE (Multi-Agent Engine) is the chief orchestrator and operator for all multi-AI service applications. It coordinates workflows involving multiple AI providers, modules, and complex multi-step processes.

## Architecture Hierarchy

```
MAE (Multi-Agent Engine)
├── Chief orchestrator and operator
├── Tools (MAE-specific tools):
│   └── AI Orchestrator (AIO) - Tool (extends BaseTool) for generic multi-provider orchestration
├── Services (utility classes under MAE's authority):
│   └── Multi-Model Service (MMS) - Utility class for role-based multi-model orchestration
├── Modules (MAE-orchestrated modules):
│   ├── Chronometric - Time reconstruction and billable time management
│   ├── ArkExtractor - Arkiver extraction tools and pipelines
│   ├── ArkProcessor - Arkiver text and email processing
│   ├── ArkAnalyst - Arkiver analysis and verification
│   ├── RagModule - RAG query and vector storage
│   ├── VerificationModule - Shared verification tools
│   └── LegalAnalysisModule - Legal document analysis tools
└── Workflows (MAE workflow definitions)
```

**Key Distinctions:**
- **Tools** (like AI Orchestrator) = MCP-callable, extend `BaseTool`, can be registered in MAE's tool registry
- **Services** (like Multi-Model Service) = Utility classes, provide functionality but don't compose tools or extend `BaseModule`
- **Modules** (like Chronometric) = Domain-specific components that compose tools, resources, and prompts (extend `BaseModule`)

## Tools

### AI Orchestrator

**Location:** `engines/mae/services/ai-orchestrator.ts` (moved from tools/ to services/)

Generic multi-provider orchestration tool supporting:
- Sequential execution
- Parallel execution
- Collaborative execution (analysis → verification → synthesis)

**Usage in Workflows:**
```typescript
{
  type: 'tool',
  target: 'ai_orchestrator',
  input: {
    task_description: 'Analyze legal document',
    ai_providers: ['perplexity', 'openai'],
    orchestration_mode: 'collaborative'
  }
}
```

### Common Tools

MAE engine also provides access to commonly used tools for workflows:
- `document_analyzer` - Document analysis and extraction
- `fact_checker` - Multi-model fact verification
- `workflow_manager` - Workflow creation and management
- `case_manager` - Case management operations
- `document_processor` - Document processing operations
- `document_drafter` - Legal document drafting
- `clio_integration` - Clio API integration
- `sync_manager` - Synchronization management

These tools are registered in MAE's tool registry and can be used directly in workflow steps.

## Services

### Multi-Model Service

**Location:** `engines/mae/services/multi-model-service.ts`

Role-based parallel multi-model verification with weighted confidence scoring. Supports:
- Fact-checking
- Trust chain analysis
- Socratic reasoning
- Verification modes: simple, standard, comprehensive, custom

**Access:**
```typescript
import { maeEngine } from './mae-engine.js';

const multiModelService = maeEngine.getMultiModelService();
const result = await multiModelService.executeVerification({
  mode: 'comprehensive',
  providerStrategy: 'mixed',
  claim: 'Claim to verify',
  // ... other config
});
```

## Modules

This engine orchestrates the following modules:
- **Chronometric**: Time reconstruction and billable time management
- **ArkExtractor**: Arkiver extraction tools and pipelines (extractConversations, extractTextContent, categorizeWithKeywords, etc.)
- **ArkProcessor**: Arkiver text and email processing (arkiverTextProcessor, arkiverEmailProcessor)
- **ArkAnalyst**: Arkiver analysis and verification (arkiverEntityProcessor, arkiverInsightProcessor, arkiverTimelineProcessor, verification tools)
- **RagModule**: RAG query and vector storage (ragQuery tool, chunker and vector_store resources)
- **VerificationModule**: Shared verification tools (claimExtractor, citationChecker, sourceVerifier, consistencyChecker)
- **LegalAnalysisModule**: Legal document analysis tools (documentAnalyzer, contractComparator, legalReviewer, complianceChecker, qualityAssessor, redFlagFinder)

## Workflows

MAE provides 20 pre-configured workflows. **Status:** Structure complete, execution validated via integration tests (tests exist in `tests/integration/mae-workflows.test.ts` - 169 tests passing as of 2025-12-28).

**Core Legal Workflows:**
- `time_reconstruction` - Complete workflow for reconstructing billable time
- `motion_response` - End-to-end orchestration for responding to served motions
- `document_comparison` - Compare documents with multi-model verification
- `contract_analysis` - Deep contract analysis with risk assessment
- `legal_research` - Comprehensive legal research with multi-model fact verification
- `due_diligence` - Transaction due diligence with multi-model verification

**Discovery and Case Management:**
- `discovery_management` - Complete discovery process with artifact collection
- `settlement_negotiation` - Settlement preparation with liability assessment
- `deposition_preparation` - Witness analysis and question generation
- `trial_preparation` - Evidence organization and strategy development

**Court Proceedings:**
- `exhibit_preparation` - Exhibit numbering and organization
- `hearing_preparation` - Case analysis and argument preparation
- `pretrial_preparation` - Status conference preparation
- `mediation_preparation` - Position papers and settlement analysis

**Specialized Workflows:**
- `phi_ferpa_redaction_scan` - Automated PHI/HIPAA, FERPA, PII redaction (redaction action implemented)
- `tax_return_forecast` - Tax return forecasts with PDF form filling (implemented)
- `child_support_forecast` - Child support forecasts with PDF form filling (implemented)
- `qdro_forecast` - QDRO forecasts with PDF form filling (implemented)

**Note:** All workflows have been validated via integration tests. PDF form filling and redaction actions are fully implemented in document_processor.

## Usage

### Execute Workflow

```typescript
import { maeEngine } from './mae-engine.js';

const result = await maeEngine.execute({
  action: 'execute_workflow',
  workflow_id: 'motion_response',
  input: {
    case_id: 'case-123',
    motion_content: '...'
  }
});
```

### List Workflows

```typescript
const result = await maeEngine.execute({
  action: 'list_workflows'
});
```

### Access Services

```typescript
// Get Multi-Model Service
const multiModelService = maeEngine.getMultiModelService();

// Use in custom logic
const verificationResult = await multiModelService.executeVerification({
  mode: 'comprehensive',
  providerStrategy: 'single',
  claim: 'Claim to verify'
});
```

## Workflow Step Types

MAE workflows support the following step types:
- `module` - Execute a module action
- `tool` - Execute a tool (MAE tools or common tools)
- `ai` - Execute an AI provider call (with auto-select support)
- `condition` - Conditional branching
- `engine` - Call another engine (Potemkin, GoodCounsel, etc.)

**Example: Calling Another Engine**
```typescript
{
  id: 'potemkin_verification',
  type: 'engine',
  target: 'potemkin',
  input: {
    action: 'verify_document',
    content: '{{document_content}}'
  }
}
```

## Configuration

MAE is configured with:
- **Modules:** Chronometric, ArkExtractor, ArkProcessor, ArkAnalyst, RagModule, VerificationModule, LegalAnalysisModule
- **Tools:** AI Orchestrator, documentAnalyzer, factChecker, workflowManager, caseManager, documentProcessor, documentDrafter, clioIntegration, syncManager
- **AI Providers:** OpenAI, Anthropic, Google, Perplexity, xAI, DeepSeek, OpenRouter (user-selectable via UI)

---

## Complete Cyrano MCP Ecosystem Catalog

**Last Updated:** 2025-12-21  
**Purpose:** Comprehensive catalog of all tools, modules, engines, and services for integration reference

### Engines (5 Total)

Engines are registered in `Cyrano/src/engines/registry.ts`:

1. **MAE (Multi-Agent Engine)** - `mae`
   - **Location:** `Cyrano/src/engines/mae/mae-engine.ts`
   - **Purpose:** Chief orchestrator for multi-AI workflows
   - **Workflows:** 20 pre-configured workflows
   - **Modules Orchestrated:** ArkExtractor, ArkProcessor, ArkAnalyst, RagModule, VerificationModule, LegalAnalysisModule
   - **Tools:** AI Orchestrator
   - **Services:** Multi-Model Service

2. **Chronometric Engine** - `chronometric`
   - **Location:** `Cyrano/src/engines/chronometric/chronometric-engine.ts`
   - **Purpose:** Forensic time capture and workflow archaeology
   - **Workflows:** time_reconstruction, forensic_reconstruction, pattern_learning, cost_estimation
   - **Modules:** time_reconstruction, pattern_learning, cost_estimation
   - **Tools:** None (tools are in modules)

3. **GoodCounsel Engine** - `goodcounsel`
   - **Location:** `Cyrano/src/engines/goodcounsel/goodcounsel-engine.ts`
   - **Purpose:** Ethics and wellness guidance
   - **Workflows:** wellness_check, ethics_review
   - **Tools:** ethics_reviewer, client_recommendations
   - **Services:** Ethics Rules Service, Client Analyzer Service

4. **Potemkin Engine** - `potemkin`
   - **Location:** `Cyrano/src/engines/potemkin/potemkin-engine.ts`
   - **Purpose:** Verification and integrity checking
   - **Workflows:** verify_document, detect_bias, monitor_integrity
   - **Tools:** history_retriever, drift_calculator, bias_detector, integrity_monitor, alert_generator
   - **Uses:** Shared verification tools (claim_extractor, citation_checker, source_verifier, consistency_checker)

5. **Forecast Engine** - `forecast`
   - **Location:** `Cyrano/src/engines/forecast/forecast-engine.ts`
   - **Purpose:** Legal forecast generation (tax, child support, QDRO)
   - **Modules:** tax_forecast, child_support_forecast, qdro_forecast
   - **Tools:** pdf_form_filler (via modules)

### Modules (9 Total)

Modules are registered in `Cyrano/src/modules/registry.ts`:

1. **Time Reconstruction Module** - `time_reconstruction`
   - **Location:** `Cyrano/src/engines/chronometric/modules/time-reconstruction-module.ts`
   - **Engine:** Chronometric
   - **Tools:** gap_identifier, email_artifact_collector, calendar_artifact_collector, document_artifact_collector, recollection_support, pre_fill_logic, dupe_check, provenance_tracker
   - **Actions:** identify_gaps, collect_artifacts, reconstruct_time, reconstruct_period, check_duplicates, recollection_support, pre_fill, track_provenance

2. **Pattern Learning Module** - `pattern_learning`
   - **Location:** `Cyrano/src/engines/chronometric/modules/pattern-learning-module.ts`
   - **Engine:** Chronometric
   - **Tools:** gap_identifier, time_value_billing
   - **Services:** baseline-config, pattern-learning, profitability-analyzer
   - **Actions:** setup_baseline, get_baseline, learn_patterns, get_patterns, analyze_profitability, get_at_risk_matters, get_profitability_summary, add_time_entries

3. **Cost Estimation Module** - `cost_estimation`
   - **Location:** `Cyrano/src/engines/chronometric/modules/cost-estimation-module.ts`
   - **Engine:** Chronometric
   - **Services:** cost-estimation
   - **Actions:** learn_from_matter, estimate_cost, generate_proposal

4. **Tax Forecast Module** - `tax_forecast`
   - **Location:** `Cyrano/src/modules/forecast/tax-forecast-module.ts`
   - **Engine:** Forecast
   - **Tools:** pdf_form_filler
   - **Actions:** generate_tax_forecast

5. **Child Support Forecast Module** - `child_support_forecast`
   - **Location:** `Cyrano/src/modules/forecast/child-support-forecast-module.ts`
   - **Engine:** Forecast
   - **Tools:** pdf_form_filler
   - **Actions:** generate_child_support_forecast

6. **QDRO Forecast Module** - `qdro_forecast`
   - **Location:** `Cyrano/src/modules/forecast/qdro-forecast-module.ts`
   - **Engine:** Forecast
   - **Tools:** pdf_form_filler
   - **Actions:** generate_qdro_forecast

7. **EthicalAI Module** - `ethical_ai`
   - **Location:** `Cyrano/src/modules/ethical-ai/ethical-ai-module.ts`
   - **Tools:** ethical_ai_guard, ten_rules_checker, ethics_policy_explainer
   - **Actions:** check_recommendations, check_content, explain_policy

8. **Billing Reconciliation Module** - `billing_reconciliation`
   - **Location:** `Cyrano/src/modules/billing-reconciliation/billing-reconciliation-module.ts`
   - **Tools:** gap_identifier, email_artifact_collector, calendar_artifact_collector, document_artifact_collector, clio_integration
   - **Actions:** generate_reconciliation_report, compare_with_clio, identify_discrepancies

9. **Legal Analysis Module** - `legal_analysis`
   - **Location:** `Cyrano/src/modules/legal-analysis/legal-analysis-module.ts`
   - **Tools:** document_analyzer, contract_comparator, legal_reviewer, compliance_checker, quality_assessor, red_flag_finder
   - **Actions:** analyze_document, compare_contracts, review_legal, check_compliance, assess_quality, find_red_flags

**Note:** ArkExtractor, ArkProcessor, ArkAnalyst, RagModule, and VerificationModule are also modules but are primarily orchestrated by MAE engine rather than registered in the module registry.

### Tools (52+ Total)

Tools are registered in `Cyrano/src/http-bridge.ts` and `Cyrano/src/mcp-server.ts`:

#### Legal AI Tools (8)
1. `document_analyzer` - Document analysis and extraction
2. `contract_comparator` - Contract comparison
3. `good_counsel` - GoodCounsel advice
4. `fact_checker` - Multi-model fact verification
5. `legal_reviewer` - Legal document review
6. `compliance_checker` - Compliance checking
7. `quality_assessor` - Quality assessment
8. `red_flag_finder` - Red flag detection

#### Document Processing Tools (2)
9. `document_processor` - Document processing (extract, transform, validate, format, fill_pdf_forms, apply_forecast_branding, redact)
10. `document_drafter` - Legal document drafting

#### Integration Tools (2)
11. `clio_integration` - Clio API integration (12 actions: get_item_tracking, get_matter_info, get_workflow_status, get_client_info, get_document_info, get_calendar_events, search_matters, get_red_flags, get_tasks, get_contacts, get_case_status, search_documents)
12. `micourt_query` - MiCourt docket queries (user-initiated, light footprint)

#### Chronometric Tools (9)
13. `gap_identifier` - Time gap identification
14. `email_artifact_collector` - Email artifact collection (requires OAuth)
15. `calendar_artifact_collector` - Calendar artifact collection
16. `document_artifact_collector` - Document artifact collection
17. `tasks_collector` - Task collection
18. `contacts_collector` - Contact collection
19. `recollection_support` - Time recollection support
20. `pre_fill_logic` - Time entry pre-filling
21. `dupe_check` - Duplicate detection
22. `provenance_tracker` - Provenance tracking
23. `workflow_archaeology` - Workflow history analysis
24. `time_value_billing` - Time value billing calculations

#### Arkiver Tools (8)
25. `extract_conversations` - Extract conversations from files
26. `extract_text_content` - Extract text content
27. `categorize_with_keywords` - Categorize with keywords
28. `process_with_regex` - Process with regex
29. `generate_categorized_files` - Generate categorized files
30. `run_extraction_pipeline` - Run extraction pipeline
31. `create_arkiver_config` - Create Arkiver config
32. `arkiver_process_file` - Process file (async job)
33. `arkiver_job_status` - Get job status

#### Arkiver Processor Tools (5)
34. `arkiver_process_text` - Text processing
35. `arkiver_process_email` - Email processing
36. `arkiver_extract_entities` - Entity extraction
37. `arkiver_generate_insights` - Insight generation
38. `arkiver_extract_timeline` - Timeline extraction

#### Verification Tools (5) - Shared by Potemkin and Arkiver
39. `claim_extractor` - Extract claims from content
40. `citation_checker` - Check citation format and validity
41. `citation_formatter` - Format citations
42. `source_verifier` - Verify source credibility
43. `consistency_checker` - Check consistency across documents

#### Ethics Tools (5)
44. `ethics_reviewer` - Rule-based ethics evaluation
45. `ethical_ai_guard` - Pre-action ethics checking
46. `ten_rules_checker` - Content compliance checking
47. `ethics_policy_explainer` - Rule explanation
48. `get_ethics_audit` - Get ethics audit trail
49. `get_ethics_stats` - Get ethics statistics

#### Potemkin-Specific Tools (5)
50. `history_retriever` - Retrieve verification history
51. `drift_calculator` - Calculate opinion drift
52. `bias_detector` - Detect bias in content
53. `integrity_monitor` - Monitor integrity
54. `alert_generator` - Generate alerts

#### Legal Email Drafting Tools (3)
55. `legal_email_drafter` - Draft legal emails
56. `refine_email_tone` - Refine email tone
57. `validate_legal_language` - Validate legal language

#### Management Tools (4)
58. `workflow_manager` - Workflow creation and management
59. `case_manager` - Case/matter management
60. `sync_manager` - External service synchronization
61. `system_status` - System health and status

#### AI Tools (2)
62. `ai_orchestrator` - Multi-provider AI orchestration
63. `cyrano_pathfinder` - Unified chat interface

#### Authentication Tools (1)
64. `auth` - Authentication and authorization

#### Engine/Module Wrappers (5)
65. `chronometric_module` - Chronometric Engine wrapper
66. `mae_engine` - MAE Engine wrapper
67. `goodcounsel_engine` - GoodCounsel Engine wrapper
68. `potemkin_engine` - Potemkin Engine wrapper
69. `forecast_engine` - Forecast Engine wrapper

#### Wellness Tools (1)
70. `wellness_journal` - Wellness journaling

#### GoodCounsel Prompt Tools (5)
71. `get_goodcounsel_prompts` - Get prompts
72. `dismiss_goodcounsel_prompt` - Dismiss prompt
73. `snooze_goodcounsel_prompt_type` - Snooze prompt type
74. `get_goodcounsel_prompt_history` - Get prompt history
75. `evaluate_goodcounsel_context` - Evaluate context

### Services

Services are utility classes that don't extend BaseTool or BaseModule:

#### Chronometric Services
- `baseline-config.ts` - User baseline configuration
- `pattern-learning.ts` - Pattern learning from historical data
- `profitability-analyzer.ts` - Matter profitability analysis
- `cost-estimation.ts` - Cost estimation with learning
- `forensic-reconstruction.ts` - Forensic reconstruction service

#### MAE Services
- `multi-model-service.ts` - Multi-model verification service
- `ai-orchestrator.ts` - AI orchestration service (also exposed as tool)

#### GoodCounsel Services
- `ethics-rules-service.ts` - Ethics rules evaluation
- `client-analyzer.ts` - Client relationship analysis

#### Shared Services
- `ai-service.ts` - Centralized AI provider calls
- `rag-service.ts` - RAG query service
- `embedding-service.ts` - Vector embeddings
- `workflow-archaeology.ts` - Shared workflow archaeology

### Design Philosophy

**Hierarchy:**
- **Tools** → Atomic, single-purpose, stateless, extend `BaseTool`
- **Modules** → Domain-specific compositions of tools, resources, and prompts, extend `BaseModule`
- **Engines** → Higher-level orchestrators, coordinate modules and AI providers, extend `BaseEngine`
- **Services** → Utility classes for shared functionality, do not extend `BaseTool` or `BaseModule`

**Modularity:**
- Tools are exposed individually for maximum reuse
- Modules compose tools for domain-specific orchestration
- Engines orchestrate modules and tools for complex workflows
- Dual exposure pattern: Tools available individually AND via modules/engines

**Integration Requirements:**
- New apps/features must integrate with:
  1. **MCP Protocol** - Tools must extend `BaseTool` and implement `getToolDefinition()` and `execute()`
  2. **Module Registry** - Modules must extend `BaseModule` and register in `moduleRegistry`
  3. **Engine Registry** - Engines must extend `BaseEngine` and register in `engineRegistry`
  4. **HTTP Bridge** - Tools must be registered in `http-bridge.ts` for web access
  5. **MCP Server** - Tools must be registered in `mcp-server.ts` for MCP access
  6. **Ethics Framework** - All content generation must use ethics checking
  7. **Input Validation** - All tools must use Zod schemas
  8. **Error Handling** - All tools must return `CallToolResult` with proper error handling

**For New Integrations:**
- Use existing tools when possible (check tool reuse analysis)
- Compose tools into modules for domain-specific functionality
- Orchestrate modules via engines for complex workflows
- Register in appropriate registries
- Follow MCP protocol compliance
- Integrate with ethics framework
- Document in this catalog
