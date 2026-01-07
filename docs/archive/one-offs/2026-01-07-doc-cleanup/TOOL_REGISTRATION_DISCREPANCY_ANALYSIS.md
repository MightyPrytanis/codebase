---
Document ID: TOOL-REGISTRATION-DISCREPANCY
Title: Tool Registration Discrepancy Analysis - HTTP Bridge vs MCP Server
Subject(s): Tools | Registration | Analysis
Project: Cyrano
Version: v601
Created: 2025-12-31 (2026-W01)
Last Substantive Revision: 2025-12-31 (2026-W01)
Last Format Update: 2025-12-31 (2026-W01)
Owner: Executor Agent / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Analysis of why HTTP bridge has 82 tools registered while MCP server had only 79 tools (now fixed to 82).
Status: Active
---

# Tool Registration Discrepancy Analysis

**Date:** 2025-12-31 (2026-W01)  
**Issue:** HTTP bridge had 82 tools registered, MCP server had 79 tools  
**Discrepancy:** 3 tools missing from MCP server  
**Status:** ✅ **FIXED** - All 3 tools now added to MCP server (2025-12-31)

---

## Summary

The HTTP bridge uses **hybrid dynamic loading** with a `toolImportMap` containing 82 tools. The MCP server uses **static imports** and now lists 82 tools in its `ListToolsRequestSchema` handler (after adding the 3 missing tools).

**Root Cause:** Some tools were added to HTTP bridge during the hybrid dynamic loading migration but were not added to the MCP server's static tool list.

---

## Missing Tools from MCP Server (NOW FIXED)

The following 3 tools were registered in HTTP bridge but missing from MCP server's tool list (now fixed):

1. **`custodian_engine`** - Custodian Engine tool (admin-only) ✅ **ADDED**
2. **`beta_test_support`** - Beta test support tool ✅ **ADDED**
3. **`micourt_query`** - MiCourt docket query tool (had case handler but wasn't in tool list) ✅ **ADDED**

**Fix Applied (2025-12-31):**
- Added imports for `custodianEngineTool` and `betaTestSupport`
- Added all 3 tools to `ListToolsRequestSchema` handler tool list
- Added case handlers for `custodian_engine` and `beta_test_support`
- `micourt_query` already had a case handler, just needed to be added to tool list
- `get_ethics_audit` and `get_ethics_stats` - Handled via function calls in MCP server
- `wellness_journal` - Present in MCP server (line 254)
- `get_goodcounsel_prompts` - Present in MCP server (line 248)
- `dismiss_goodcounsel_prompt` - Present in MCP server (line 249)
- `snooze_goodcounsel_prompt_type` - Present in MCP server (line 250)
- `get_goodcounsel_prompt_history` - Present in MCP server (line 251)
- `evaluate_goodcounsel_context` - Present in MCP server (line 252)
- `workflow_status` - Present in MCP server (line 246)
- `mcr_validator` - Present in MCP server (line 260)

---

## Technical Details

### HTTP Bridge Registration
- **Method:** Dynamic lazy loading via `toolImportMap`
- **Location:** `Cyrano/src/http-bridge.ts` (lines 89-442)
- **Count:** 82 tools in `toolImportMap`
- **Advantages:**
  - Server starts immediately
  - Tools load on-demand
  - Better startup performance
  - Easier to add new tools

### MCP Server Registration
- **Method:** Static imports and direct registration
- **Location:** `Cyrano/src/mcp-server.ts` (lines 161-269)
- **Count:** 82 tools in `ListToolsRequestSchema` handler (after fix)
- **Advantages:**
  - All tools available immediately
  - No dynamic loading overhead
  - Simpler execution path

---

## Why the Discrepancy Exists

1. **Migration in Progress:**
   - HTTP bridge was migrated to hybrid dynamic loading
   - New tools were added to HTTP bridge's `toolImportMap`
   - MCP server's static list was not updated

2. **Different Use Cases:**
   - HTTP bridge serves web applications (LexFiat, Arkiver)
   - MCP server serves stdio-based MCP clients
   - Some tools may be HTTP-only by design

3. **Admin-Only Tools:**
   - `custodian_engine` is admin-only
   - May be intentionally HTTP-only for security

---

## Impact

### For HTTP Bridge Users
- ✅ All 82 tools available
- ✅ No impact

### For MCP Server Users
- ✅ **FIXED** - All 82 tools now available
- ✅ All 3 missing tools added to tool list
- ✅ All case handlers in place
- ✅ MCP clients can now discover all tools

---

## Recommendations

### Option 1: Add Missing Tools to MCP Server (Recommended)
Add the 3 missing tools to MCP server's tool list:

```typescript
// In Cyrano/src/mcp-server.ts, add imports (if not already present):
import { custodianEngineTool } from './tools/custodian-engine.js';
import { betaTestSupport } from './tools/beta-test-support.js';
// micourtQuery is already imported

// In setupToolHandlers(), add to tools array:
micourtQuery.getToolDefinition(),  // Add this (already has handler)
custodianEngineTool.getToolDefinition(),
betaTestSupport.getToolDefinition(),

// Also add case handlers for custodian_engine and beta_test_support if needed
```

**Pros:**
- ✅ Full feature parity
- ✅ MCP clients can discover all tools
- ✅ Consistent tool availability

**Cons:**
- ⚠️ Adds 2 more static imports
- ⚠️ Slightly larger startup footprint

### Option 2: Document as HTTP-Only Tools
If these tools are intentionally HTTP-only:

1. Document in tool descriptions
2. Add comments explaining why
3. Update documentation

**Pros:**
- ✅ Maintains current architecture
- ✅ No code changes needed

**Cons:**
- ⚠️ Inconsistent tool availability
- ⚠️ Confusing for MCP users

### Option 3: Migrate MCP Server to Dynamic Loading
Migrate MCP server to use the same `toolImportMap` as HTTP bridge:

**Pros:**
- ✅ Single source of truth
- ✅ Automatic synchronization
- ✅ Easier maintenance

**Cons:**
- ⚠️ Significant refactoring
- ⚠️ Changes MCP server architecture
- ⚠️ May impact startup performance

---

## Conclusion

The discrepancy exists because:
1. HTTP bridge was migrated to hybrid dynamic loading
2. New tools were added to HTTP bridge
3. MCP server's static list was not updated

**Action Taken (2025-12-31):** ✅ All 3 missing tools (`custodian_engine`, `beta_test_support`, `micourt_query`) have been added to MCP server's tool list. Full feature parity achieved.

**Why They Were Missing:**
1. **Migration Oversight:** During the HTTP bridge migration to hybrid dynamic loading, new tools were added to `toolImportMap` but the MCP server's static tool list wasn't updated
2. **Different Registration Methods:** HTTP bridge uses dynamic loading (easier to add tools), MCP server uses static imports (requires manual updates)
3. **Incomplete Migration:** `micourt_query` had a case handler added but was never added to the tool list, suggesting the migration was partially completed

---

**Last Updated:** 2025-12-31 (2026-W01)
