# Cyrano GitHub vs Local Comparison Report
**Date:** 2025-01-27  
**Purpose:** Document differences between GitHub and local Cyrano codebases

---

## Executive Summary

**Local Codebase Status:** More advanced architecture (modules/engines)  
**GitHub Codebase Status:** More complete service implementations  
**Recommendation:** Merge GitHub services into local, preserve local architecture

---

## Key Differences

### 1. Architecture Differences

#### Local Has (GitHub Missing):
- ✅ **Modules Layer** (`src/modules/`)
  - `chronometric/` - Complete Chronometric module
  - `registry.ts` - Module registry system
  - `base-module.ts` - Module abstraction

- ✅ **Engines Layer** (`src/engines/`)
  - `mae/` - Multi-Agent Engine
  - `goodcounsel/` - GoodCounsel engine
  - `potemkin/` - Potemkin engine
  - `registry.ts` - Engine registry system
  - `base-engine.ts` - Engine abstraction

- ✅ **New Chronometric Tools**
  - `gap-identifier.ts`
  - `email-artifact-collector.ts`
  - `calendar-artifact-collector.ts`
  - `document-artifact-collector.ts`
  - `recollection-support.ts`
  - `pre-fill-logic.ts`
  - `dupe-check.ts`
  - `provenance-tracker.ts`
  - `chronometric-module.ts` (wrapper)

- ✅ **Engine Wrapper Tools**
  - `mae-engine.ts`
  - `goodcounsel-engine.ts`
  - `potemkin-engine.ts`

- ✅ **Enhanced AI Service**
  - `services/ai-service.ts` - More comprehensive than GitHub's `llm-service.ts`
  - Supports: OpenAI, Anthropic, Perplexity, Google, xAI, DeepSeek

#### GitHub Has (Local Missing):
- ✅ **Service Implementations**
  - `services/clio-client.ts` - Complete Clio API client
  - `services/value-billing-engine.ts` - Value-based billing calculations
  - `services/westlaw-import.ts` - Westlaw data import
  - `services/email-imap.ts` - Email IMAP integration
  - `services/llm-service.ts` - Simpler LLM service (superseded by local `ai-service.ts`)

- ✅ **Tools**
  - `tools/time-value-billing.ts` - Time value billing tool

- ✅ **Documentation**
  - Various deployment and hosting guides
  - Migration guides

---

## File-by-File Comparison

### Modified Files (Significant Differences)

#### `src/mcp-server.ts`
- **Local:** Has new module/engine tools registered
- **GitHub:** Has `time-value-billing` tool
- **Action:** Merge - Add `time-value-billing` to local, keep local's new tools

#### `src/http-bridge.ts`
- **Status:** Both differ, need comparison
- **Action:** Review and merge

#### `src/tools/clio-integration.ts`
- **Status:** Both differ
- **Action:** Review - GitHub may have more complete Clio integration

#### `src/tools/red-flag-finder.ts`
- **Status:** Both differ
- **Action:** Review and merge best features

#### `src/services/perplexity.ts`
- **Status:** Both differ
- **Action:** Review - ensure local has latest improvements

---

## Services to Merge from GitHub

### Priority 1: High Value Services

1. **`services/clio-client.ts`**
   - **Value:** Complete Clio API client with proper error handling
   - **Action:** Copy to local, integrate with existing `clio-integration.ts`
   - **Risk:** Low - standalone service

2. **`services/value-billing-engine.ts`**
   - **Value:** Value-based billing calculations (normative rules, AI inference)
   - **Action:** Copy to local
   - **Risk:** Low - standalone service

3. **`services/westlaw-import.ts`**
   - **Value:** Westlaw CSV import functionality
   - **Action:** Copy to local
   - **Risk:** Low - standalone service

### Priority 2: Medium Value Services

4. **`services/email-imap.ts`**
   - **Value:** Email IMAP integration
   - **Action:** Copy to local if email integration needed
   - **Risk:** Medium - may conflict with existing email tools

5. **`tools/time-value-billing.ts`**
   - **Value:** Time value billing tool
   - **Action:** Copy to local, register in `mcp-server.ts`
   - **Risk:** Low - standalone tool

### Priority 3: Documentation

6. **Deployment Guides**
   - Various `.md` files in GitHub root
   - **Action:** Review and copy useful guides
   - **Risk:** None

---

## Merge Strategy

### Step 1: Copy High-Priority Services
1. Copy `clio-client.ts` → `Cyrano/src/services/clio-client.ts`
2. Copy `value-billing-engine.ts` → `Cyrano/src/services/value-billing-engine.ts`
3. Copy `westlaw-import.ts` → `Cyrano/src/services/westlaw-import.ts`

### Step 2: Copy Tools
1. Copy `time-value-billing.ts` → `Cyrano/src/tools/time-value-billing.ts`
2. Register in `mcp-server.ts` and `http-bridge.ts`

### Step 3: Review and Merge Modified Files
1. Compare `clio-integration.ts` - merge best features
2. Compare `red-flag-finder.ts` - merge best features
3. Compare `perplexity.ts` - ensure local has latest
4. Compare `http-bridge.ts` - merge configurations

### Step 4: Update Documentation
1. Copy useful deployment guides
2. Update README if needed

---

## Files to Ignore

- `services/llm-service.ts` - Superseded by local `ai-service.ts`
- GitHub's older architecture (no modules/engines)

---

## Reconciliation Checklist

- [ ] Copy `clio-client.ts` to local
- [ ] Copy `value-billing-engine.ts` to local
- [ ] Copy `westlaw-import.ts` to local
- [ ] Copy `time-value-billing.ts` to local
- [ ] Register `time-value-billing` in `mcp-server.ts`
- [ ] Review and merge `clio-integration.ts`
- [ ] Review and merge `red-flag-finder.ts`
- [ ] Review and merge `perplexity.ts`
- [ ] Review and merge `http-bridge.ts`
- [ ] Copy useful documentation
- [ ] Test merged code
- [ ] Update reconciliation log

---

## Notes

- Local codebase is architecturally superior (modules/engines)
- GitHub has more complete service implementations
- Merge strategy: Preserve local architecture, add GitHub services
- No conflicts expected - services are standalone

---

**Report Generated:** 2025-01-27  
**Next Steps:** Execute merge strategy

