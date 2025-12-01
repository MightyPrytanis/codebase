# Copilot: Critical Arkiver Instructions
**Date:** 2025-11-26  
**Status:** URGENT - Read Before Any Further Work  
**Purpose:** Correct your understanding of Arkiver and fix mistakes

---

## ⚠️ YOU HAVE BEEN MAKING CRITICAL MISTAKES

You have been confused about what Arkiver is, where it lives, and what Base44 is. This document corrects those mistakes.

---

## What Arkiver Actually Is

**Arkiver is an APP, not a module, not a tool, not an engine.**

**Architecture Hierarchy:**
```
Tools → Modules → Engines → Apps → Suite
                          ↑
                      Arkiver goes here
                      (like LexFiat)
```

**Arkiver is a standalone user-facing application** that processes, analyzes, and monitors AI-generated content and LLM integrity.

---

## What Base44 Is

**Base44** is a backend-as-a-service platform (like Firebase) that the original ArkiverMJ was built on. It provides:
- Database storage
- Authentication
- File storage
- AI integrations
- Email services

**The problem:** ArkiverMJ is "marooned in Base44" - it works but is vendor-locked and cannot be integrated into Cyrano.

**The solution:** Rebuild Arkiver as a standalone app that uses Cyrano MCP instead of Base44.

---

## History (You Need to Understand This)

1. **Original Arkiver** - Early prototype (conversation analysis)
2. **NewArkiver** - Concept (universal extractor)
3. **Labs/Arkiver** - Python backend library (no UI, reference only)
4. **ArkiverMJ (Base44)** - Complete React app built on Base44 (`codebase/arkivermj/`)
5. **Current Goal** - Rebuild as standalone "Arkiver" app using Cyrano MCP

**"MJ" suffix** = Development name to distinguish from Base44 version  
**Production name** = "Arkiver" (no MJ)

---

## Where Things Actually Are

### ✅ CORRECT Locations:
- **MCP Tools:** `Cyrano/src/tools/arkiver-mcp-tools.ts` - This is the interface contract ✅
- **Base44 Specs:** `Dev+Test/Arkiver Base44.md` - Technical specifications ✅
- **Interface Contract:** `Dev+Test/ARKIVER_MCP_INTERFACE_CONTRACT.md` - MCP interface ✅
- **Base44 App:** `codebase/arkivermj/` - Old Base44-dependent app (extract UI from here) ✅
- **Python Reference:** `codebase/Labs/Arkiver/` - Architecture patterns only ✅

### ❌ WRONG Locations:
- **`Cyrano/src/modules/arkiver/`** - This is app code in the wrong place ❌
  - This processing logic should be in the app or as tools, NOT in modules
  - Modules are reusable components, not app backends

---

## What You Need to Do

### 1. STOP Making These Mistakes:
- ❌ Calling Arkiver a "module"
- ❌ Thinking code in `modules/arkiver/` is correct
- ❌ Confusing Labs/Arkiver (Python) with ArkiverMJ (Base44)
- ❌ Thinking Base44 is part of the solution (it's the problem)

### 2. READ These Documents:
1. **`Cyrano/docs/ARKIVER_AUTHORITATIVE_GUIDE.md`** - CANONICAL source of truth
2. **`Dev+Test/ARKIVER_MCP_INTERFACE_CONTRACT.md`** - MCP interface you must follow
3. **`Dev+Test/Arkiver Base44.md`** - Technical specs from Base44 version

### 3. Understand the Goal:
- Rebuild ArkiverMJ as standalone "Arkiver" app
- Remove ALL Base44 dependencies
- Use Cyrano MCP tools (already implemented in `arkiver-mcp-tools.ts`)
- Extract UI from `arkivermj/` and adapt it
- Use TypeScript (not Python - Labs/Arkiver is reference only)

### 4. If You're Working on Arkiver:
- **Backend:** Should be in `codebase/Arkiver/backend/` (app directory, not modules)
- **Frontend:** Should be in `codebase/Arkiver/frontend/` (extracted from `arkivermj/`)
- **MCP Integration:** Use tools from `Cyrano/src/tools/arkiver-mcp-tools.ts`

---

## Your Previous Mistakes

Based on your reports, you have been:
1. Confused about what Arkiver is (calling it a module)
2. Not understanding Base44 vs the solution
3. Not following the MCP interface contract
4. Potentially working in wrong locations

**Fix:** Read the authoritative guide, understand the architecture, then proceed.

---

## Questions?

**DO NOT GUESS.** If you're unclear about:
- What Arkiver is → Read `ARKIVER_AUTHORITATIVE_GUIDE.md`
- Where code should go → Read `ARKIVER_AUTHORITATIVE_GUIDE.md`
- What Base44 is → Read `ARKIVER_AUTHORITATIVE_GUIDE.md`
- MCP interface → Read `ARKIVER_MCP_INTERFACE_CONTRACT.md`

**Then ask the Managing Agent if still unclear.**

---

**This is not optional. You must understand this before continuing any Arkiver work.**

---

## ⚠️ CRITICAL: Project Pulled from Copilot

**Status:** User has pulled the Arkiver project from Copilot due to mistakes.

**What This Means:**
- Copilot's work on Arkiver has been stopped
- The project is now back under primary management
- Any Copilot work needs to be reviewed and potentially fixed

**Action Required:**
- Review what Copilot did
- Fix any mistakes
- Ensure backend components are in correct locations
- **DO NOT place components in Dev+Test directory** - that's for planning/docs only

