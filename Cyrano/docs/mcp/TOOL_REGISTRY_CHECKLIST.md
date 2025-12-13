---
Document ID: TOOL-REGISTRY-CHECKLIST
Title: Tool Registry Checklist
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# MCP Tool Registry Checklist

**Created:** 2025-11-24  
**Purpose:** Track MCP tool registration, schemas, and integration status for Cyrano

---

## Tool Registration Status

### Legend
- ✅ Registered and tested
- ⚠️ Registered but needs testing
- 🔨 Implementation complete, needs registration
- ❌ Not yet implemented
- 📝 Schema defined, awaiting implementation

---

## Core Legal Tools

### Document Processing
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `document_analyzer` | 🔨 | ✅ | ✅ | ❌ | In document-analyzer.ts |
| `document_processor` | 🔨 | ✅ | ✅ | ❌ | In document-processor.ts |
| `contract_comparator` | 🔨 | ✅ | ✅ | ❌ | In contract-comparator.ts (renamed from legal-comparator) |
| `legal_reviewer` | 🔨 | ✅ | ✅ | ❌ | In legal-reviewer.ts |

### Case Management
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `case_manager` | 🔨 | ✅ | ✅ | ❌ | In case-manager.ts |
| `workflow_manager` | 🔨 | ✅ | ✅ | ❌ | In workflow-manager.ts |

### Verification & Analysis
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `fact_checker` | 🔨 | ✅ | ✅ | ❌ | In fact-checker.ts |
| `compliance_checker` | 🔨 | ✅ | ✅ | ❌ | In compliance-checker.ts |
| `red_flag_finder` | 🔨 | ✅ | ✅ | ❌ | In red-flag-finder.ts |
| `quality_assessor` | 🔨 | ✅ | ✅ | ❌ | In quality-assessor.ts |
| `claim_extractor` | 🔨 | ✅ | ✅ | ❌ | In verification/claim-extractor.ts |
| `citation_checker` | 🔨 | ✅ | ✅ | ⚠️ | In verification/citation-checker.ts |
| `source_verifier` | 🔨 | ✅ | ✅ | ❌ | In verification/source-verifier.ts |
| `consistency_checker` | 🔨 | ✅ | ✅ | ❌ | In verification/consistency-checker.ts |

---

## Arkiver Tools

### Extraction
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `extract_pdf_content` | 🔨 | ✅ | ✅ | ❌ | PDF extractor ready |
| `extract_docx_content` | 🔨 | ✅ | ✅ | ❌ | DOCX extractor ready |
| `extract_text_content` | 📝 | ❌ | ❌ | ❌ | Needs MCP wrapper |
| `extract_email_content` | 📝 | ❌ | ❌ | ❌ | Needs MCP wrapper |

### Processing
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `process_text` | 📝 | ❌ | ❌ | ❌ | text-processor ready, needs wrapper |
| `process_email` | 📝 | ❌ | ❌ | ❌ | email-processor ready, needs wrapper |
| `extract_insights` | 📝 | ❌ | ❌ | ❌ | insight-processor ready, needs wrapper |
| `extract_entities` | 📝 | ❌ | ❌ | ❌ | entity-processor ready, needs wrapper |
| `extract_timeline` | 📝 | ❌ | ❌ | ❌ | timeline-processor ready, needs wrapper |

### Arkiver Pipeline
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `run_extraction_pipeline` | 🔨 | ✅ | ✅ | ❌ | In arkiver-mcp-tools.ts |
| `query_arkiver_database` | 🔨 | ✅ | ✅ | ❌ | In arkiver-mcp-tools.ts |

---

## AI & Orchestration

| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `ai_orchestrator` | 🔨 | ✅ | ✅ | ❌ | In ai-orchestrator.ts |
| `menlo_park` | 🔨 | ✅ | ✅ | ❌ | In menlo-park.ts |

---

## Integration Tools

### Clio
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `clio_get_matters` | 🔨 | ✅ | ✅ | ❌ | In clio-integration.ts |
| `clio_get_documents` | 🔨 | ✅ | ✅ | ❌ | In clio-integration.ts |
| `clio_sync` | 🔨 | ✅ | ✅ | ❌ | Needs OAuth flow |

### GoodCounsel
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `goodcounsel_query` | 🔨 | ✅ | ✅ | ❌ | In goodcounsel.ts |
| `goodcounsel_engine` | 🔨 | ✅ | ✅ | ❌ | In goodcounsel-engine.ts |

---

## Utility Tools

| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `system_status` | 🔨 | ✅ | ✅ | ❌ | In system-status.ts |
| `auth_manager` | 🔨 | ✅ | ✅ | ❌ | In auth.ts |
| `sync_manager` | 🔨 | ✅ | ✅ | ❌ | In sync-manager.ts |
| `provenance_tracker` | 🔨 | ✅ | ✅ | ❌ | In provenance-tracker.ts |
| `dupe_checker` | 🔨 | ✅ | ✅ | ❌ | In dupe-check.ts |
| `gap_identifier` | 🔨 | ✅ | ✅ | ❌ | In gap-identifier.ts |

---

## Specialized Tools

### MAE (Mutual Assent Engine)
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `mae_analyze` | 🔨 | ✅ | ✅ | ❌ | In mae-engine.ts |

### Potemkin
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `potemkin_verify` | 🔨 | ✅ | ✅ | ❌ | In potemkin-engine.ts |

### Chronometric
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `chronometric_analyze` | 🔨 | ✅ | ✅ | ❌ | In chronometric-module.ts |

### Recollection Support
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `recollection_support` | 🔨 | ✅ | ✅ | ❌ | In recollection-support.ts |

### Artifact Collectors
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `collect_document_artifacts` | 🔨 | ✅ | ✅ | ❌ | In document-artifact-collector.ts |
| `collect_email_artifacts` | 🔨 | ✅ | ✅ | ❌ | In email-artifact-collector.ts |
| `collect_calendar_artifacts` | 🔨 | ✅ | ✅ | ❌ | In calendar-artifact-collector.ts |

### Billing
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `time_value_billing` | 🔨 | ✅ | ✅ | ❌ | In time-value-billing.ts |

### Pre-fill
| Tool Name | Status | Schema | Error Handling | Tests | Notes |
|-----------|--------|--------|----------------|-------|-------|
| `pre_fill_logic` | 🔨 | ✅ | ✅ | ❌ | In pre-fill-logic.ts |

---

## Schema Standards

### Required Fields (All Tools)
```typescript
{
  name: string;           // Tool identifier (snake_case)
  description: string;    // Clear, concise description
  inputSchema: {
    type: 'object';
    properties: { ... };  // Zod-validated properties
    required: string[];   // Required parameter names
  };
}
```

### Input Schema Pattern
```typescript
export const ToolNameSchema = z.object({
  param1: z.string().describe('Parameter description'),
  param2: z.number().optional().default(10),
  param3: z.array(z.string()).optional(),
});

export type ToolNameInput = z.infer<typeof ToolNameSchema>;
```

### Error Handling Pattern
```typescript
try {
  const validated = ToolNameSchema.parse(args);
  const result = await performOperation(validated);
  return this.createSuccessResult(result);
} catch (error) {
  if (error instanceof z.ZodError) {
    return this.createErrorResult(`Validation error: ${error.message}`);
  }
  return this.createErrorResult(
    `Operation failed: ${error instanceof Error ? error.message : String(error)}`
  );
}
```

### Response Format (Success)
```typescript
{
  content: [{
    type: 'text',
    text: string // JSON.stringify(result) or plain text
  }],
  isError: false
}
```

### Response Format (Error)
```typescript
{
  content: [{
    type: 'text',
    text: string // Error message
  }],
  isError: true
}
```

---

## Registration Checklist (Per Tool)

### Implementation
- [ ] Tool class extends `BaseTool`
- [ ] `getToolDefinition()` implemented with complete schema
- [ ] `execute()` implemented with proper error handling
- [ ] Zod schema defined and exported
- [ ] Input type exported from schema
- [ ] All parameters have descriptions
- [ ] Required vs optional parameters clearly marked

### Error Handling
- [ ] Zod validation errors caught and formatted
- [ ] Operation errors caught and formatted
- [ ] Clear error messages provided
- [ ] No sensitive data in error messages
- [ ] Errors use `createErrorResult()` helper

### Testing
- [ ] Unit tests for core logic
- [ ] Integration tests with MCP server
- [ ] Error case tests
- [ ] Edge case tests
- [ ] Performance tests (if applicable)

### Documentation
- [ ] Tool doc file created in `docs/tools/`
- [ ] Usage examples provided
- [ ] Input/output formats documented
- [ ] Error scenarios documented
- [ ] Dependencies listed

### Registration
- [ ] Tool exported from tool file
- [ ] Tool added to server's tool list
- [ ] Tool appears in MCP `tools/list` response
- [ ] Tool callable via MCP `tools/call`
- [ ] HTTP bridge endpoint created (if needed)

---

## HTTP Bridge Endpoints

Tools exposed via HTTP bridge for UI integration:

| Tool | Endpoint | Method | Status |
|------|----------|--------|--------|
| document_analyzer | `/analyze` | POST | 🔨 |
| case_manager | `/cases` | GET/POST | 🔨 |
| arkiver pipeline | `/arkiver/extract` | POST | 🔨 |
| [Add more as created] | | | |

---

## Priority Registration Queue

### Phase 1: Core Legal (Week 1)
1. document_analyzer
2. contract_comparator
3. citation_checker (already has tests)
4. fact_checker
5. case_manager

### Phase 2: Verification (Week 2)
1. claim_extractor
2. source_verifier
3. consistency_checker
4. compliance_checker
5. red_flag_finder

### Phase 3: Arkiver Integration (Week 3)
1. Create MCP wrappers for 5 processors
2. Test extraction pipeline
3. Add HTTP bridge endpoints
4. Document usage patterns

### Phase 4: Integrations (Week 4)
1. Clio integration (OAuth flow)
2. GoodCounsel integration
3. AI orchestrator
4. Tool enhancer

### Phase 5: Utilities (Week 5)
1. System status
2. Auth manager
3. Sync manager
4. Artifact collectors

---

## Tool Naming Conventions

### Format
- Use snake_case for tool names
- Start with verb: `extract_`, `analyze_`, `check_`, `verify_`, `create_`, etc.
- Be specific: `extract_pdf_content` not `pdf_tool`
- Avoid abbreviations unless universal: `pdf` OK, `doc` unclear

### Examples
- ✅ `extract_pdf_content`
- ✅ `analyze_document_structure`
- ✅ `verify_citation_format`
- ❌ `pdf` (too vague)
- ❌ `docProc` (not snake_case, abbreviation)
- ❌ `tool1` (meaningless)

---

## Testing Requirements

### Unit Tests
- Test schema validation (valid and invalid inputs)
- Test core logic with mocked dependencies
- Test error handling paths
- Test edge cases (empty input, large input, special chars)

### Integration Tests
- Test tool via MCP protocol
- Test tool via HTTP bridge (if applicable)
- Test with real dependencies (databases, APIs)
- Test performance with realistic data

### Coverage Target
- Minimum 80% code coverage
- 100% coverage of error paths
- All public methods tested
- All input validation tested

---

## Dependencies Checklist

### Per Tool, Document:
- [ ] External npm packages used
- [ ] Environment variables required
- [ ] Database dependencies
- [ ] API dependencies (external services)
- [ ] File system dependencies
- [ ] Other tool dependencies

---

## Migration Notes

### From Old System
- Preserve tool names where possible for backward compatibility
- Map old tool names to new implementations
- Document breaking changes
- Provide migration guide for tool consumers

---

## Versioning Strategy

### Tool Versions
- Tools follow semantic versioning
- Breaking changes → major version bump
- New features → minor version bump
- Bug fixes → patch version bump

### Deprecation Process
1. Mark tool as deprecated in schema
2. Log warning when deprecated tool called
3. Provide migration path in warning
4. Remove after 2 major versions

---

## Notes

- All tools must extend `BaseTool`
- Zod schemas are mandatory for input validation
- Error messages must be user-friendly
- No sensitive data in logs or error messages
- Tools should be idempotent where possible
- Document side effects clearly

---

**Last Updated:** 2025-11-24  
**Total Tools Implemented:** 40+  
**Total Tools Registered:** TBD (awaiting registration phase)  
**Target Registration Date:** TBD
