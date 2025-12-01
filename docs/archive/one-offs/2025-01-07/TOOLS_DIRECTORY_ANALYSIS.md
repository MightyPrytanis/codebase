---
Document ID: TOOLS-DIRECTORY-ANALYSIS
Title: Tools Directory Analysis Report
Subject(s): Tools | Code Organization | Architecture
Project: Cyrano
Version: v548
Created: 2025-11-29 (2025-W48)
Last Substantive Revision: 2025-11-29 (2025-W48)
Last Format Update: 2025-11-29 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Analysis of all tools directories in codebase to identify duplicates, lost tools, and consolidation opportunities.
Status: Active
---

# Tools Directory Analysis Report

**Date:** 2025-11-29  
**Purpose:** Identify duplicate tools, lost tools, and determine if consolidation is needed

---

## Tools Directory Locations

### 1. `Cyrano/src/tools/` - **PRIMARY TOOLS DIRECTORY** ✅
**Status:** Main tools directory - all MCP tools should be here  
**Count:** ~48 tool files  
**Purpose:** Core MCP tools registered in `mcp-server.ts`

**Key Tools:**
- `base-tool.ts` - Base class for all tools
- `ai-orchestrator.ts` - Multi-provider AI orchestration
- `document-analyzer.ts` - Document analysis
- `fact-checker.ts` - Fact checking
- `legal-reviewer.ts` - Legal document review
- `goodcounsel.ts` - GoodCounsel tool wrapper
- `goodcounsel-engine.ts` - GoodCounsel engine wrapper tool
- `mae-engine.ts` - MAE engine wrapper tool
- `potemkin-engine.ts` - Potemkin engine wrapper tool
- `arkiver-tools.ts` - Arkiver MCP tools
- `arkiver-mcp-tools.ts` - Arkiver MCP integration
- `arkiver-processor-tools.ts` - Arkiver processing tools
- Verification tools in `verification/` subdirectory

**Recommendation:** ✅ **KEEP** - This is the correct location for all MCP tools

---

### 2. `Cyrano/src/engines/goodcounsel/tools/` - **ENGINE-SPECIFIC TOOLS** ✅
**Status:** Engine-specific tools (NOT duplicates)  
**Count:** 2 tools  
**Purpose:** Tools specific to GoodCounsel engine functionality

**Tools:**
- `ethics-reviewer.ts` - Ethics review tool (used by GoodCounsel engine)
- `client-recommendations.ts` - Client relationship recommendations (used by GoodCounsel engine)

**Relationship to `src/tools/`:**
- These are **NOT duplicates**
- They are specialized tools used internally by the GoodCounsel engine
- The `goodcounsel-engine.ts` tool in `src/tools/` wraps the engine and exposes these tools via MCP

**Recommendation:** ✅ **KEEP** - These are engine-internal tools, correctly located

---

### 3. `Cyrano/src/engines/potemkin/tools/` - **ENGINE-SPECIFIC TOOLS** ✅
**Status:** Engine-specific tools (NOT duplicates)  
**Count:** 6 tools  
**Purpose:** Tools specific to Potemkin engine functionality

**Tools:**
- `alert-generator.ts` - Alert generation
- `bias-detector.ts` - Bias detection
- `drift-calculator.ts` - Drift calculation
- `history-retriever.ts` - History retrieval
- `integrity-monitor.ts` - Integrity monitoring
- `index.ts` - Tool exports

**Relationship to `src/tools/`:**
- These are **NOT duplicates**
- They are specialized tools used internally by the Potemkin engine
- The `potemkin-engine.ts` tool in `src/tools/` wraps the engine and exposes these tools via MCP

**Recommendation:** ✅ **KEEP** - These are engine-internal tools, correctly located

---

### 4. `Cyrano/src/engines/mae/tools/` - **EMPTY DIRECTORY** ⚠️
**Status:** Empty directory  
**Count:** 0 tools  
**Purpose:** Intended for MAE engine-specific tools

**Recommendation:** ⚠️ **REVIEW** - Directory exists but is empty. Either:
- Remove if not needed
- Or document why it exists (future tools planned?)

---

### 5. `Cyrano/tests/tools/` - **TEST FILES** ✅
**Status:** Test files (NOT tools)  
**Count:** Multiple test files  
**Purpose:** Unit tests for tools

**Recommendation:** ✅ **KEEP** - These are test files, not tools. Correctly located.

---

### 6. `Cyrano/docs/tools/` - **DOCUMENTATION** ✅
**Status:** Documentation files  
**Count:** 1 file  
**Purpose:** Tool documentation template

**Files:**
- `TEMPLATE_TOOL_DOC.md` - Template for documenting tools

**Recommendation:** ✅ **KEEP** - Documentation, not tools. Correctly located.

---

### 7. `Legacy/Cosmos/src/tools/` - **LEGACY CODE** ⚠️
**Status:** Legacy code (Cosmos project)  
**Count:** 1 tool  
**Purpose:** Legacy Cosmos project tool

**Tools:**
- `nextAction.ts` - Next action recommendation tool (Cosmos-specific)

**Recommendation:** ⚠️ **REVIEW** - Legacy code. Options:
- **Option A:** Keep if Cosmos functionality is still needed
- **Option B:** Archive if Cosmos is deprecated
- **Option C:** Extract useful logic to `Cyrano/src/tools/` if needed

**Note:** Cosmos is in `Legacy/` directory, suggesting it may be deprecated.

---

## Analysis Summary

### ✅ Correctly Organized
1. **`Cyrano/src/tools/`** - Primary MCP tools directory ✅
2. **`Cyrano/src/engines/goodcounsel/tools/`** - Engine-internal tools ✅
3. **`Cyrano/src/engines/potemkin/tools/`** - Engine-internal tools ✅
4. **`Cyrano/tests/tools/`** - Test files ✅
5. **`Cyrano/docs/tools/`** - Documentation ✅

### ⚠️ Needs Review
1. **`Cyrano/src/engines/mae/tools/`** - Empty directory
2. **`Legacy/Cosmos/src/tools/`** - Legacy code (may be deprecated)

### ❌ No Duplicates Found
- Engine tools in `engines/*/tools/` are **NOT duplicates** of `src/tools/`
- They serve different purposes:
  - `src/tools/` = MCP-exposed tools (registered in mcp-server.ts)
  - `engines/*/tools/` = Engine-internal tools (used by engines, exposed via engine wrapper tools)

---

## Architecture Pattern

The codebase follows a clear pattern:

```
src/tools/
  ├── base-tool.ts (base class)
  ├── goodcounsel.ts (tool wrapper)
  ├── goodcounsel-engine.ts (engine wrapper tool)
  ├── mae-engine.ts (engine wrapper tool)
  ├── potemkin-engine.ts (engine wrapper tool)
  └── [other MCP tools]

src/engines/goodcounsel/tools/
  ├── ethics-reviewer.ts (engine-internal)
  └── client-recommendations.ts (engine-internal)

src/engines/potemkin/tools/
  ├── alert-generator.ts (engine-internal)
  ├── bias-detector.ts (engine-internal)
  └── [other engine-internal tools]
```

**Flow:**
1. Engine-internal tools in `engines/*/tools/` are used by engines
2. Engine wrapper tools in `src/tools/` expose engine functionality via MCP
3. MCP tools in `src/tools/` are registered in `mcp-server.ts`

---

## Recommendations

### ✅ No Consolidation Needed
The current structure is **correct** and follows good architectural patterns:
- Separation of concerns (MCP tools vs engine-internal tools)
- Clear hierarchy (tools → engines → modules)
- No duplication

### ⚠️ Actions Needed
1. **Review `Cyrano/src/engines/mae/tools/`**
   - If MAE engine doesn't need internal tools, remove directory
   - If tools are planned, document in MAE engine README

2. **Review `Legacy/Cosmos/src/tools/`**
   - Determine if Cosmos is still active
   - If deprecated, archive or remove
   - If active, consider moving useful tools to `Cyrano/src/tools/`

3. **Documentation**
   - Update architecture docs to clarify the distinction between:
     - MCP tools (`src/tools/`)
     - Engine-internal tools (`engines/*/tools/`)

---

## Conclusion

**No duplicates or lost tools found.** The tools are correctly organized:
- MCP tools in `src/tools/` ✅
- Engine-internal tools in `engines/*/tools/` ✅
- Clear separation of concerns ✅

**Only cleanup needed:**
- Review empty `mae/tools/` directory
- Review legacy `Cosmos/tools/` directory

---

**Report Generated:** 2025-11-29  
**Next Review:** After MAE and Cosmos review

