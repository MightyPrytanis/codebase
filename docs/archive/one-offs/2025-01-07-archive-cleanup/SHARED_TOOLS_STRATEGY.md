# Shared Tools Strategy: Potemkin & Arkiver
**Date:** 2025-01-27  
**Purpose:** Avoid duplication between Potemkin and Arkiver tool requirements

---

## Problem Statement

Both Potemkin and Arkiver require functionally identical tools for:
- **Claim Extraction** - Extract claims and assertions from documents
- **Citation Checking** - Verify and validate citations
- **Source Verification** - Verify sources and references
- **Document Analysis** - Parse and analyze document content

Creating separate implementations would lead to code duplication and maintenance overhead.

---

## Solution: Shared Verification Tools Module

### Architecture

Create a shared `verification-tools` module that provides reusable tools for both engines:

```
Cyrano/src/tools/verification/
├── claim-extractor.ts       # Extract claims/assertions from documents
├── citation-checker.ts      # Verify and validate citations
├── source-verifier.ts       # Verify sources and references
├── document-analyzer.ts      # Parse and analyze document content (enhanced)
├── consistency-checker.ts   # Check consistency across claims
└── index.ts                 # Export all tools
```

### Tool Descriptions

#### 1. `claim_extractor`
**Purpose:** Extract claims, assertions, and factual statements from documents  
**Used By:**
- Potemkin: `verify_document` workflow
- Arkiver: Document analysis and insight extraction

**Input:**
- `documentId` or `content` (string)
- `extractionType`: 'all' | 'factual' | 'legal' | 'citations'

**Output:**
- Array of extracted claims with:
  - Text content
  - Confidence score
  - Claim type
  - Source location (page/line)

#### 2. `citation_checker`
**Purpose:** Verify and validate citations in documents  
**Used By:**
- Potemkin: `verify_document` workflow
- Arkiver: Citation extraction and validation

**Input:**
- `citations`: Array of citation strings
- `documentContext`: Optional document content for context

**Output:**
- Validation results for each citation:
  - Valid/invalid status
  - Source URL (if found)
  - Confidence score
  - Issues found

#### 3. `source_verifier`
**Purpose:** Verify sources and references  
**Used By:**
- Potemkin: `assess_honesty` workflow
- Arkiver: Source verification in insights

**Input:**
- `sources`: Array of source references
- `verificationLevel`: 'basic' | 'comprehensive'

**Output:**
- Verification results:
  - Source accessibility
  - Content match
  - Reliability score

#### 4. `document_analyzer` (Enhanced)
**Purpose:** Parse and analyze document content  
**Used By:**
- Potemkin: All workflows (document parsing)
- Arkiver: Document extraction and processing

**Note:** This already exists as `document-analyzer.ts` but may need enhancement for shared use.

#### 5. `consistency_checker`
**Purpose:** Check consistency across claims and statements  
**Used By:**
- Potemkin: `assess_honesty` workflow
- Arkiver: Cross-reference checking in insights

**Input:**
- `claims`: Array of claims to check
- `documentContext`: Full document content

**Output:**
- Consistency report:
  - Conflicting claims
  - Supporting claims
  - Consistency score

---

## Implementation Strategy

### Phase 1: Create Shared Tools Module

1. **Create directory structure**
   ```bash
   mkdir -p Cyrano/src/tools/verification
   ```

2. **Implement shared tools**
   - Start with `claim-extractor.ts`
   - Then `citation-checker.ts`
   - Then `source-verifier.ts`
   - Then `consistency-checker.ts`

3. **Register tools in MCP server**
   - Add to `mcp-server.ts`
   - Add to `http-bridge.ts`

### Phase 2: Update Potemkin Workflows

1. **Update workflow tool targets**
   - Change `claim_extractor` → use shared tool
   - Change `citation_checker` → use shared tool
   - Change `source_verifier` → use shared tool
   - Change `consistency_checker` → use shared tool

2. **Update Potemkin engine**
   - Reference shared tools in workflows
   - Remove duplicate tool references

### Phase 3: Update Arkiver Integration

1. **Use shared tools in Arkiver**
   - Replace any duplicate extraction logic
   - Use shared `citation_checker` for citation validation
   - Use shared `source_verifier` for source verification

2. **Update Arkiver MCP tools**
   - Reference shared tools where applicable
   - Avoid re-implementing shared functionality

---

## Tool Registration

### In MCP Server

```typescript
// Import shared verification tools
import { claimExtractor } from './tools/verification/claim-extractor.js';
import { citationChecker } from './tools/verification/citation-checker.js';
import { sourceVerifier } from './tools/verification/source-verifier.js';
import { consistencyChecker } from './tools/verification/consistency-checker.js';

// Register in tools array
tools: [
  // ... other tools
  claimExtractor.getToolDefinition(),
  citationChecker.getToolDefinition(),
  sourceVerifier.getToolDefinition(),
  consistencyChecker.getToolDefinition(),
]
```

### In Potemkin Workflows

```typescript
// Update workflow steps to use registered tool names
{
  id: 'extract_claims',
  type: 'tool',
  target: 'claim_extractor',  // Uses shared tool
  input: { documentId: '...' },
}
```

---

## Benefits

1. **Code Reuse** - Single implementation for shared functionality
2. **Consistency** - Same behavior across Potemkin and Arkiver
3. **Maintainability** - Fix bugs once, benefit everywhere
4. **Testing** - Test once, use everywhere
5. **Performance** - Optimize once, benefit everywhere

---

## Migration Path

1. **Create shared tools** (Phase 1)
2. **Update Potemkin** to use shared tools (Phase 2)
3. **Update Arkiver** to use shared tools (Phase 3)
4. **Remove duplicate code** from both engines
5. **Test integration** with both engines

---

## Notes

- Shared tools should be generic enough for both use cases
- Potemkin-specific logic (bias detection, opinion drift) remains in Potemkin
- Arkiver-specific logic (categorization, extraction pipeline) remains in Arkiver
- Only truly shared functionality goes into verification tools

---

**Status:** Strategy defined, ready for implementation  
**Priority:** Medium (can be done after core engine implementation)

