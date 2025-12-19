# Copilot Architecture Decisions
**Created:** 2025-11-25  
**Purpose:** Answer all architectural questions from Copilot to enable confident implementation  
**Status:** ✅ Complete - Ready for Copilot use

---

## Citations/Tests

### Policy: Michigan Citations with Periods

**Decision:** **Accept with warnings universally** - No reject cases for periods alone.

**Rationale:**
- Michigan Appellate Opinions Manual states "no periods in abbreviations" is a **rule**, but citations with periods are still **valid citations** (just non-compliant with Michigan style)
- The formatter **corrects** periods automatically when `correct: true`
- Citations are **never rejected** solely for having periods - they're flagged with warnings and corrected
- Only **structurally invalid** citations are rejected (missing volume, page, unrecognized reporter, etc.)

**Implementation:**
- Citations with periods → Warning code `W001` + auto-correction
- Structurally invalid citations → Error (missing required fields)
- See: `src/tools/verification/citation-formatter.ts` lines 219-311

### Authority: Governing Source

**Decision:** **Michigan Appellate Opinions Manual** takes precedence over Bluebook for Michigan state filings.

**Implementation:**
- `Jurisdiction.MICHIGAN` → Uses Michigan Appellate Opinions Manual rules
- `Jurisdiction.FEDERAL` → Uses Federal Rules + local court rules
- `Jurisdiction.BLUEBOOK` → Uses Bluebook format (supplemental/fallback)
- `Jurisdiction.AUTO` → Auto-detects based on citation content

**Reference:** See `src/tools/verification/citation-formatter.ts` line 5 and `docs/citation-formatter.md`

### Scope: Additional Jurisdictions

**Decision:** **Michigan only** for this release (Beta).

**Future jurisdictions** (post-Beta):
- Federal (Bluebook format)
- Other states (as needed)

**Current support:**
- ✅ Michigan (full support)
- ✅ Federal (basic support via Bluebook fallback)
- ⏳ Other states (not in scope for Beta)

### Tests: Canonical Runner and Criteria

**Test Runner:** `vitest` (already configured)

**Command:**
```bash
npm run test:mcp                    # MCP compliance tests
npm test -- michigan-citations      # Citation-specific tests
npm test -- citation-formatter      # Formatter tests
npm test -- --coverage              # With coverage
```

**Pass Criteria:**
- **Minimum cases per rule:** 10 valid + 5 warning/invalid per category (see `docs/tests/MICHIGAN_CITATION_TEST_MATRIX.md`)
- **Mandated negative cases:** Yes - must test:
  - Empty/whitespace inputs
  - Non-string inputs
  - SQL injection attempts
  - XSS attempts
  - Extremely long strings
  - Null/undefined inputs
- **Coverage threshold:** 90% minimum for validator logic
- **False positive/negative:** Zero tolerance

**Reference:** `docs/tests/MICHIGAN_CITATION_TEST_MATRIX.md` lines 130-180

### Warnings: Structure

**Decision:** **Stable warning codes** (not freeform messages)

**Warning Code Format:**
```typescript
{
  code: 'W001' | 'W002' | 'W003' | 'W004',
  message: string,  // Human-readable (can vary, but code is stable)
  position?: { start: number; end: number }
}
```

**Warning Codes:**
- `W001`: Periods in abbreviations
- `W002`: Parallel citations (no longer required)
- `W003`: Non-preferred format
- `W004`: Missing court designation

**Reference:** `docs/tests/MICHIGAN_CITATION_TEST_MATRIX.md` lines 106-128

### Parallel Citations

**Decision:** **Warn only** (not error)

**Rationale:**
- Parallel citations are no longer **required** in Michigan, but they're still **valid**
- They don't break citation validity
- Warning code `W002` is used

**Implementation:** See `src/tools/verification/citation-formatter.ts` line 116

---

## Processors

### Contracts: Input/Output Schemas

**Decision:** **Freeze current schemas** - Consider them stable for Beta.

**Current Schema Pattern:**
```typescript
export const ProcessorSchema = z.object({
  // Input fields
});

export type ProcessorInput = z.infer<typeof ProcessorSchema>;

export interface ProcessorOutput {
  // Output fields
}
```

**Stability:**
- ✅ Current shapes are **stable** for Beta
- ⚠️ Breaking changes require version bump post-Beta
- 📝 All schemas documented in processor files

**Reference:** See `src/modules/arkiver/processors/` for examples

### Idempotency

**Decision:** **Strictly idempotent** - Identical inputs must produce identical outputs.

**Requirements:**
- Same input → Same output (deterministic)
- No side effects from repeated calls
- Timestamps excluded from idempotency checks

**Implementation:** Processors should be pure functions where possible

### Failures: Partial Results, Retries, DLQ

**Decision:**
- **Partial results:** Return what was successfully processed + error list
- **Retries:** 3 attempts with exponential backoff (configurable)
- **DLQ:** Not implemented for Beta (failures logged)
- **Error schema:** Standardized (see Error Handling section)

**Error Object Schema:**
```typescript
{
  code: string,           // Error code (e.g., 'PROCESSING_ERROR')
  message: string,        // Human-readable message
  details?: any,          // Additional context
  retryable: boolean      // Whether operation can be retried
}
```

**Reference:** See `src/modules/arkiver/queue/database-queue.ts` for retry logic

### Performance: SLOs

**Decision:** **No formal SLOs for Beta** - Optimize for correctness first.

**Guidelines:**
- Process single documents in < 5 seconds (target)
- Batch processing: No hard limit (document-based)
- Monitor and optimize post-Beta

**Future:** SLOs will be defined based on Beta usage data

### Ops: Environment Variables

**Required Env Vars (Document Now):**
```bash
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
XAI_API_KEY=xai-...
DEEPSEEK_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...

# Server
PORT=5002

# Optional
NODE_ENV=production|development
LOG_LEVEL=info|debug|error
```

**Feature Flags:** None for Beta (all features enabled)

**Reference:** See `.env.example` (create if missing)

---

## MCP Integration

### Tool List: Registration Priority

**Canonical Tool Names** (snake_case):
1. Core Legal: `document_analyzer`, `contract_comparator`, `fact_checker`, `legal_reviewer`, `compliance_checker`, `quality_assessor`
2. Case Management: `case_manager`, `workflow_manager`
3. Verification: `citation_checker`, `citation_formatter`, `claim_extractor`, `source_verifier`, `consistency_checker`
4. Arkiver: `arkiver_process_file`, `arkiver_job_status`
5. Chronometric: `gap_identifier`, `email_artifact_collector`, `calendar_artifact_collector`, `document_artifact_collector`, `recollection_support`, `pre_fill_logic`, `dupe_check`, `provenance_tracker`
6. Modules/Engines: `chronometric_module`, `mae_engine`, `goodcounsel_engine`, `potemkin_engine`
7. System: `system_status`, `ai_orchestrator`

**Reference:** `src/mcp-server.ts` and `src/http-bridge.ts` for full list

### Schemas: Zod as Canonical

**Decision:** **Yes** - Zod schemas are canonical for tool I/O and errors.

**Pattern:**
```typescript
export const ToolNameSchema = z.object({
  param1: z.string().describe('Description'),
  param2: z.number().optional(),
});

export type ToolNameInput = z.infer<typeof ToolNameSchema>;
```

**Validation:**
- All tool inputs validated with Zod
- Errors use Zod error messages
- Schemas exported for documentation

**Reference:** See any tool in `src/tools/` for examples

### HTTP Bridge: Stable Endpoints

**Stable Endpoints (Versioned for UI):**
- `GET /mcp/tools` - List all tools (stable)
- `POST /mcp/execute` - Execute tool (stable)
- `GET /mcp/status` - Server status (stable)
- `GET /mcp/tools/info` - Detailed tool info (stable)
- `GET /health` - Health check (stable)

**Versioning:** Not implemented for Beta (all endpoints stable)

**Reference:** `src/http-bridge.ts` lines 200-647

### Errors: Standard Envelope

**Error Envelope:**
```typescript
{
  content: [{
    type: 'text',
    text: string  // Error message
  }],
  isError: true
}
```

**Error Codes (for internal use):**
- `VALIDATION_ERROR` - Zod validation failed
- `TOOL_NOT_FOUND` - Unknown tool name
- `EXECUTION_ERROR` - Tool execution failed
- `PROCESSING_ERROR` - Processing pipeline error
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `AUTH_ERROR` - Authentication failed

**Reference:** `src/tools/base-tool.ts` for `createErrorResult()` pattern

---

## AI Providers

### Models: Default Models

**Default Models per Provider:**
- **Perplexity:** `sonar` (default), `sonar-deep-research` (trust chain), `sonar-reasoning` (Socratic reasoning)
- **Gemini:** `gemini-pro` (default), `gemini-pro-vision` (if images)
- **xAI Grok:** `grok-beta` (default)
- **DeepSeek:** `deepseek-chat` (default)

**Multi-Model Verification:**
- Fact-checker supports parallel multi-model execution with verification modes: simple (1 model), standard (2 models), comprehensive (3 models), custom (user-defined)
- User preferences for verification modes are persisted and respected (user sovereignty)
- Default mode: standard (first-time users), user preference (returning users)
- **Multi-Model Service** (MAE utility service) provides role-based parallel multi-model verification with weighted confidence scoring
- **AI Orchestrator** (MAE tool) provides generic multi-provider orchestration (sequential, parallel, collaborative)
- Both are organized under MAE's hierarchy as MAE is the chief orchestrator for all multi-AI service applications

**Configuration:** 
- Multi-model verification: Set via `verification_mode` parameter in `fact_checker` tool
- Generic orchestration: Set via `ai_providers` parameter in `ai_orchestrator` tool

**Reference:** 
- Multi-Model Service: `src/engines/mae/services/multi-model-service.ts`
- AI Orchestrator: `src/engines/mae/tools/ai-orchestrator.ts`
- Fact Checker: `src/tools/fact-checker.ts`

### Fallbacks: Cross-Provider Routing

**Strategy:** **Priority-based with health checks**

**Priority Order:**
1. Perplexity (research/real-time data)
2. OpenAI (general purpose)
3. Anthropic (safety-critical)
4. Google (data processing)
5. xAI (direct analysis)
6. DeepSeek (comprehensive analysis)

**Health Checks:**
- Check API availability before routing
- Fallback to next provider on failure
- Log provider usage for cost tracking

**Cost Caps:** Not implemented for Beta (monitor manually)

**Reference:** `src/tools/ai-orchestrator.ts` for routing logic

### Limits: Rate Limits and Retries

**Rate Limits:**
- Document per provider's API documentation
- Implement exponential backoff
- Retry budget: 3 attempts per request

**Backoff Strategy:**
- Initial delay: 1 second
- Max delay: 30 seconds
- Exponential multiplier: 2x

**Reference:** Implement in `src/services/ai-service.ts` (if not already)

### Telemetry: Metrics

**Required Metrics:**
- Latency (p50, p95, p99)
- Cost per request (tokens × cost per token)
- Token counts (input/output)
- Error classes (by provider, by error type)
- Success rate per provider

**Sink:** Console logging for Beta (structured JSON logs)

**Future:** Prometheus/DataDog integration post-Beta

### Secrets: Environment Variable Names

**Confirmed Names:**
- `GEMINI_API_KEY` ✅
- `XAI_API_KEY` ✅
- `DEEPSEEK_API_KEY` ✅
- `OPENAI_API_KEY` ✅
- `ANTHROPIC_API_KEY` ✅
- `PERPLEXITY_API_KEY` ✅

**Scopes:** Full API access (no scoped keys for Beta)

**Reference:** `src/tools/ai-orchestrator.ts` lines 68-73

---

## Reconciliation

### Canonical: Conflict Resolution

**Decision:** **Local Cyrano wins** - Local is source of truth for Beta.

**Strategy:**
- Local changes take precedence
- GitHub used as reference/backup
- Manual review required for conflicts
- Document conflicts in diff report

**Branch/Tag:** Use `main` branch from GitHub as reference

### Scope: Exclusions

**Exclude from Diff:**
- `dist/` - Build artifacts
- `node_modules/` - Dependencies
- `*.log` - Log files
- `.env*` - Environment files
- `*.cache` - Cache files
- `coverage/` - Test coverage
- `*.map` - Source maps
- Images (`.png`, `.jpg`, `.svg`) - Binary files

**Include:**
- All source code (`src/`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`docs/`)
- Tests (`tests/`)

### Output: Diff Report Format

**Decision:** **Semantic summaries** + file-level details

**Report Structure:**
```markdown
# Cyrano Reconciliation Report

## Summary
- Files only in GitHub: X
- Files only locally: Y
- Modified files: Z

## Semantic Changes
- [Category]: [Summary of changes]

## File-Level Details
- [File path]: [Change type] - [Brief description]
```

**Reference:** See `COPILOT_DELEGATION_GUIDE.md` Task 3.1

---

## Documentation

### IA: Documentation Structure

**Structure under `docs/`:**
```
docs/
├── tools/              # Tool documentation
├── research/           # Research findings
├── reconciliation/     # Reconciliation reports
├── mcp/               # MCP protocol docs
├── providers/          # AI provider integration
└── tests/             # Test documentation
```

**Reference:** Existing structure in `docs/`

### Style: Documentation Guide

**Style Guide:**
- **Headings:** Use `##` for main sections, `###` for subsections
- **Code fences:** Use language tags (```typescript, ```bash)
- **Admonitions:** Use `> **Note:**` or `> ⚠️ **Warning:**`
- **Examples:** Include before/after code examples
- **Links:** Use relative paths for internal docs

**Template:** See `docs/tools/` for examples

### Ownership: Approval Process

**Decision:** **No formal approval process for Beta** - Document and review internally.

**Post-Beta:** Will establish approval workflow

**Current:** All docs reviewed during code review

---

## Zero-Risk Next Actions

### Files to Create (Per Copilot Questions)

1. ✅ `docs/tests/MICHIGAN_CITATION_TEST_MATRIX.md` - **Already exists**
2. ⏳ `docs/extraction/ARKIVER_PATTERNS.md` - Create per Step 2.1
3. ⏳ `docs/reconciliation/CYRANO_DIFF_REPORT.md` - Create per Step 3.1
4. ✅ `docs/mcp/TOOL_REGISTRY_CHECKLIST.md` - **Already exists**
5. ⏳ `docs/providers/PROVIDER_INTEGRATION_GUIDE.md` - Create
6. ⏳ `docs/tools/TEMPLATE_TOOL_DOC.md` - Create
7. ⏳ `docs/research/OPEN_SOURCE_LIBRARIES.md` - Create per Step 6.1

---

## Critical Decisions Summary

### ✅ Locked Decisions

1. **Citations:** Accept with warnings (no reject for periods alone)
2. **Warning Structure:** Stable codes (W001-W004)
3. **Parallel Citations:** Warn only
4. **Authority:** Michigan Appellate Opinions Manual for Michigan
5. **Jurisdictions:** Michigan only for Beta
6. **Test Runner:** Vitest
7. **Schemas:** Zod is canonical
8. **Error Envelope:** MCP CallToolResult format
9. **Reconciliation:** Local wins conflicts
10. **Provider Env Vars:** Confirmed names above

### ⏳ Pending Decisions (Can Proceed Without)

1. **SLOs:** Define post-Beta based on usage
2. **DLQ:** Not needed for Beta
3. **Versioning:** Not needed for Beta (all endpoints stable)
4. **Telemetry Sink:** Console logging for Beta
5. **Approval Process:** Informal for Beta

---

## Next Steps for Copilot

1. **Create missing documentation files** (listed in Zero-Risk section)
2. **Implement provider integrations** using confirmed env var names
3. **Follow established patterns** for tool registration and error handling
4. **Use Zod schemas** for all tool I/O
5. **Reference existing code** in `src/tools/` for patterns

---

**Last Updated:** 2025-11-25  
**Status:** ✅ Complete - All questions answered  
**Ready for:** Copilot implementation tasks

