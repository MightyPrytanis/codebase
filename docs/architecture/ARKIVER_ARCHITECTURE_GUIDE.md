---
Document ID: ARKIVER-ARCHITECTURE-GUIDE
Title: Arkiver Architecture Guide
Subject(s): Arkiver | Architecture | Base44 | History
Project: Cyrano
Version: v550
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-12-12 (2025-W50)
Last Format Update: 2025-12-12 (2025-W50)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Clear, definitive explanation of Arkiver, ArkiverMJ, Base44, and project history. Authoritative source for Arkiver architecture and design decisions.
Status: Active
Related Documents: ARKIVER-UI-SPEC, ARKIVER-TOOL-MODULARITY
---

# Arkiver Architecture Guide

## Executive Summary

**Arkiver** is a standalone user-facing application (an APP in the Cyrano ecosystem hierarchy) for processing, analyzing, and monitoring AI-generated content and LLM integrity. It is NOT a module, NOT a tool, NOT an engine - it is an APP like LexFiat.

**Production Name:** "Arkiver"  
**Development Name:** "ArkiverMJ" (used to distinguish from Base44 version during development)

---

## What is Base44?

**Base44** is a backend-as-a-service platform (similar to Firebase or Supabase) that provides:
- Database/Entity Storage (managed data storage)
- Authentication (user login, profiles, sessions)
- File Storage (managed file uploads)
- AI Integrations (LLM calls, image generation, data extraction)
- Email Services (sending notifications)
- Automatic Routing (file-based routing for React apps)

**The original ArkiverMJ was built entirely on Base44**, meaning every database operation, file upload, AI call, and authentication went through Base44's APIs.

---

## History and Evolution

### 1. Original Arkiver (Early Prototype)
- Conversation analysis tool
- Basic functionality
- No longer in active use

### 2. NewArkiver Concept
- Universal data extractor concept
- Designed to be more extensible
- Never fully implemented as standalone

### 3. Labs/Arkiver (Python Backend Library) - ARCHIVED
- **Location:** `codebase/Legacy/Arkiver/` (moved from Labs/Arkiver)
- **Status:** ⚠️ ARCHIVED - Experimental Python implementation, no longer in use
- **What it was:** Backend extraction engine ("the car engine")
- **What it was NOT:** A web application, had no UI
- **Architecture:** Excellent modular design (extractors → processors → outputs)
- **MCP Integration:** 7 ready-to-use MCP tools (Python-based)
- **Reusability:** Patterns extracted and adapted to TypeScript
- **Use:** Reference for architecture patterns only - TypeScript implementations are in `Cyrano/src/modules/arkiver/`
- **Note:** All Python code is archived. Production uses TypeScript implementations.

### 4. ArkiverMJ (Base44 Version)
- **Location:** `codebase/arkivermj/`
- **Status:** ⚠️ Fully functional but locked into Base44
- **What it is:** Complete React web application ("the whole car with dashboard, seats, steering wheel")
- **Live URL:** `https://arkiver.base44.app`
- **Dependencies:** Entirely dependent on Base44 platform
- **Problem:** "Marooned in Base44" - cannot be integrated into Cyrano ecosystem
- **Solution:** Extract UI patterns and components, rebuild backend without Base44

### 5. Current Project Goal
- **Goal:** Recreate ArkiverMJ functionality as standalone app
- **Name:** "Arkiver" (drop "MJ" suffix for production)
- **Requirements:**
  - Remove ALL Base44 dependencies
  - Integrate with Cyrano MCP server (not Base44 APIs)
  - Use TypeScript (not Python)
  - Standalone app in Cyrano ecosystem
  - Follow MCP interface contract

---

## Architecture Hierarchy

**Arkiver is an APP, not a module:**

```
Tools → Modules → Engines → Apps → Suite
                          ↑
                      Arkiver goes here
                      (like LexFiat)
```

**Current Implementation (CORRECT):**
- Processing code in `Cyrano/src/modules/arkiver/` ✅ CORRECT
- This follows the same pattern as LexFiat: thin client apps use Cyrano MCP server for backend
- Modules contain shared processing logic used by MCP tools
- MCP tools (`arkiver-mcp-tools.ts`, `arkiver-tools.ts`) expose the functionality to the app

**Extraction Capabilities:**
- **File Format Extractors**: PDF, DOCX, Text, Markdown
- **LLM Conversation Extractors**: ChatGPT JSON, Claude format, plain text/markdown conversations
- **Processing Pipeline**: Text, Entity, Insight, Timeline, Email processors
- **Verification Tools**: Citation checking, claim extraction (shared with other modules)
- **Source Verification**: Automatic verification of sources and citations in insights (2025-12-12)
- **Consistency Checking**: Cross-reference validation for extracted insights (2025-12-12)
- **Hybrid Potemkin Integration**: Uses Potemkin engine for complex workflows, tools directly for simple operations (2025-12-12)

**Correct Structure:**
```
codebase/
├── Cyrano/          # MCP server with tools/modules/engines
│   └── src/
│       ├── modules/
│       │   └── arkiver/  ✅ (Processing logic - CORRECT)
│       │       ├── extractors/
│       │       ├── processors/
│       │       ├── queue/
│       │       └── schema.ts
│       └── tools/
│           └── arkiver-mcp-tools.ts  ✅ (MCP interface - CORRECT)
├── LexFiat/         # App (thin client, uses Cyrano MCP)
└── Arkiver/         # App (thin client, uses Cyrano MCP)
    └── frontend/    # React UI (from arkivermj/)
```

**Architecture Pattern:**
- **Apps** (LexFiat, Arkiver) = Thin clients, no backend
- **MCP Tools** = Interfaces that expose functionality
- **Modules** = Shared processing logic used by tools
- **Engines** = Higher-level orchestrators

---

## MCP Interface Contract

**Critical Document:** `/Users/davidtowne/Desktop/Coding/Dev+Test/ARKIVER_MCP_INTERFACE_CONTRACT.md`

This defines:
- File upload protocol (HTTP endpoint, not MCP tool)
- MCP tool definitions (5 tools)
- Async job pattern (for long-running operations)
- Error handling standards
- Authentication method

**MCP Tools (in Cyrano):**

**File Processing Tools** (`arkiver-mcp-tools.ts`):
- `arkiver_process_file` - Initiates file processing (async job pattern)
  - Supports: PDF, DOCX, TXT, MD, JSON (LLM conversations)
  - Auto-detects file type and uses appropriate extractor
- `arkiver_job_status` - Check processing job status

**Data Extraction Tools** (`arkiver-tools.ts`):
- `extract_conversations` - Extract LLM conversation data (ChatGPT, Claude, etc.)
- `extract_text_content` - Extract content from text files
- `categorize_with_keywords` - Categorize text using keyword matching
- `process_with_regex` - Process text with regex patterns
- `generate_categorized_files` - Generate categorized output files
- `run_extraction_pipeline` - Run complete extraction pipeline
- `create_arkiver_config` - Create configuration files

**Insight Management Tools** (to be implemented):
- `arkiver_store_insight` - Store extracted insight
- `arkiver_query_insights` - Search and retrieve insights
- `arkiver_integrity_test` - Run AI integrity tests

**Location:** `Cyrano/src/tools/arkiver-mcp-tools.ts` ✅ CORRECT

---

## What Needs to Happen

### 1. Backend Processing Code
**Current Location:** `Cyrano/src/modules/arkiver/` ✅ CORRECT  
**Status:** Code is in the correct location. Modules contain shared processing logic that MCP tools use, following the same pattern as `modules/chronometric/` and other modules.

**Architecture:** 
- Thin client apps (LexFiat, Arkiver) call MCP tools
- MCP tools (`arkiver-mcp-tools.ts`) use module processing logic
- This matches LexFiat's architecture pattern

### 2. Frontend UI
**Current Location:** `codebase/arkivermj/` (Base44-dependent)  
**Should Be:** `codebase/Arkiver/frontend/`  
**Action:** Extract UI components, remove Base44 dependencies, integrate with Cyrano MCP

### 3. MCP Tools
**Current Location:** `Cyrano/src/tools/arkiver-mcp-tools.ts` ✅ CORRECT  
**Status:** Already implemented, this is the interface contract

---

## Key Documents

1. **ARKIVER_MCP_INTERFACE_CONTRACT.md** - Interface between Cyrano and Arkiver app
2. **Arkiver Base44.md** - Technical specifications extracted from Base44 version
3. **ARKIVER_INVENTORY_AND_AGENT_DELEGATION_PROPOSAL.md** - Labs/Arkiver analysis
4. **INSTRUCTIONS_FOR_COPILOT.md** - Copilot's development instructions

---

## Common Mistakes to Avoid

1. ❌ **Calling Arkiver a "module"** - It's an APP (thin client)
2. ❌ **Thinking `modules/arkiver/` is wrong** - It's CORRECT. Modules contain processing logic used by MCP tools, just like `modules/chronometric/`
3. ❌ **Confusing Labs/Arkiver (Python) with ArkiverMJ (Base44)** - Different things
4. ❌ **Thinking Base44 is part of the solution** - It's the problem we're escaping from
5. ❌ **Using "ArkiverMJ" in production** - Production name is "Arkiver"
6. ❌ **Thinking apps need their own backend** - Apps are thin clients; backend is in Cyrano MCP server

---

## Status Summary

- ✅ MCP interface tools implemented (`arkiver-mcp-tools.ts`)
- ✅ Backend processing code in correct location (`modules/arkiver/`)
- ⚠️ Frontend still Base44-dependent (`arkivermj/`)
- ⚠️ Standalone app frontend needs to be extracted (`Arkiver/frontend/`)
- ✅ Technical specifications extracted from Base44
- ✅ Architecture patterns documented from Labs/Arkiver

---

**This document is the authoritative source for Arkiver architecture. For UI specifications, see ARKIVER-UI-SPEC. For processing component details, see ARKIVER-PROCESSING-COMPONENTS-README.**

