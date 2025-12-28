# Tool Categorization

**Date:** 2025-12-21  
**Purpose:** Accurate categorization of all tools per Perplexity audit clarification

## Tool Categories

### Production-Grade Tools (~19)
**Fully functional, production-ready tools with real implementations:**

1. `auth` - Authentication and authorization
2. `document_processor` - Document processing (extract, transform, validate, format, fill_pdf_forms, apply_forecast_branding, redact)
3. `case_manager` - Case/matter management
4. `workflow_manager` - Workflow management
5. `system_status` - System status and health
6. `sync_manager` - External service synchronization
7. `gap_identifier` - Time gap identification
8. `email_artifact_collector` - Email artifact collection (requires OAuth)
9. `calendar_artifact_collector` - Calendar artifact collection
10. `document_artifact_collector` - Document artifact collection
11. `tasks_collector` - Task collection
12. `contacts_collector` - Contact collection
13. `recollection_support` - Time recollection support
14. `pre_fill_logic` - Time entry pre-filling
15. `dupe_check` - Duplicate detection
16. `provenance_tracker` - Provenance tracking
17. `workflow_archaeology` - Workflow history analysis
18. `chronometric_module` - Chronometric module wrapper
19. `micourt_query` - MiCourt docket queries (user-initiated)

### Mock AI Tools (~15)
**Tools that use mock AI responses instead of real AI calls:**

1. `document_analyzer` - Document analysis (mock AI)
2. `contract_comparator` - Contract comparison (mock AI)
3. `good_counsel` - GoodCounsel advice (mock AI)
4. `fact_checker` - Fact checking (mock AI)
5. `legal_reviewer` - Legal document review (mock AI)
6. `compliance_checker` - Compliance checking (mock AI)
7. `quality_assessor` - Quality assessment (mock AI)
8. `red_flag_finder` - Red flag detection (mock AI)
9. `ai_orchestrator` - AI orchestration (mock AI)
10. `clio_integration` - Clio integration (mock fallback when no API key)
11. `document_drafter` - Document drafting (uses real AI if configured, mock otherwise)
12. `wellness_journal` - Wellness journaling (real service, but may use AI)
13. `ethics_reviewer` - Ethics review (rule-based, not AI)
14. `client_recommendations` - Client recommendations (may use AI)
15. `mae_engine` - MAE engine (orchestrates workflows, some use mock AI)

### Credential-Dependent Tools (~10)
**Tools that require external credentials/OAuth to function:**

1. `email_artifact_collector` - Requires Gmail/Outlook OAuth (no mock fallback)
2. `clio_integration` - Requires Clio API key (has mock fallback)
3. `gmail_service` - Requires Gmail OAuth
4. `outlook_service` - Requires Outlook OAuth
5. `rag_query` - Requires OpenAI API key for embeddings
6. `ai_orchestrator` - Requires AI provider API keys
7. `document_drafter` - Requires AI provider API keys
8. `forecast_engine` - May require AI provider for some features
9. `goodcounsel_engine` - May require AI provider for some features
10. `potemkin_engine` - May require AI provider for some features

### Non-Functional or Placeholders (~8)
**Tools that are stubs, placeholders, or not fully implemented:**

1. `status_indicator` - Archived (see archive/broken-tools/)
2. `tool_enhancer` - Commented out in http-bridge.ts
3. Some workflow steps that reference non-existent tools
4. Placeholder implementations in some forecast modules
5. Some integration tools awaiting API access

## Mock AI Scope Clarification

**Mock AI applies to:**
- AI-heavy workflows (document analysis, fact checking, legal research)
- Tools that would normally call external AI APIs but use mock responses
- Workflows that use AI for content generation or analysis

**Mock AI does NOT apply to:**
- RAG service (real vector embeddings and similarity search)
- Arkiver processors (real text processing, regex, entity extraction)
- Security middleware (real JWT, CSRF, rate limiting, encryption)
- Document processor (real text processing, redaction patterns, PDF operations)
- Chronometric module (real time tracking and artifact processing)
- Data processing tools (real file operations, data transformation)

## Total Tool Count

**Registered in MCP Server:** ~52 tools  
**Breakdown:**
- Production-grade: ~19
- Mock AI: ~15
- Credential-dependent: ~10
- Non-functional/placeholders: ~8

**Note:** Some tools may fall into multiple categories (e.g., credential-dependent tools that also use mock AI when credentials are missing).
