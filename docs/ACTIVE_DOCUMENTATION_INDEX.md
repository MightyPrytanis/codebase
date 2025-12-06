---
Document ID: ACTIVE-DOCS-INDEX
Title: Active Documentation Library Index
Subject(s): Documentation | Index | Reference
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Complete index of all active documentation in the docs/ library, organized by category.
Status: Active
---

# Active Documentation Library Index
 **Total Active Documents:** ~39 (reduced from 92; 6 additional docs archived 2025-12-04)  
**Location:** `/Users/davidtowne/Desktop/Coding/codebase/docs/`  
**Archive Summary:** See `docs/archive/one-offs/2025-01-07-archive-cleanup/ARCHIVE_SUMMARY.md`  
**Latest Reduction:** `docs/archive/one-offs/2025-12-04-active-doc-reduction/` (duplicate/placeholder docs archived on 2025-12-04)

---

## Architecture (6 documents)

1. `ARCHITECTURE_ARCHITECTURE_COPILOT_ARCHITECTURE_DECISIONS.md` - Copilot architecture decisions
2. `ARCHITECTURE_ARCHITECTURE_DYNAMIC_TOOL_ENHANCER_TECHNICAL_ARCHITECTURE_IP_AN.md` - Dynamic Tool Enhancer architecture
3. `ARCHITECTURE_ARCHITECTURE_ENGINE_ARCHITECTURE.md` - Engine layer architecture (Tools → Modules → Engines → Apps)
4. `ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md` - Module layer architecture
5. `ARCHITECTURE_ARCHITECTURE_RAG_PIPELINE_ARCHITECTURE.md` - RAG pipeline architecture
6. `ARKIVER_ARCHITECTURE_GUIDE.md` - **Authoritative source for Arkiver architecture**

---

## API (2 documents)

1. `CYRANO_API_CYRANO_MCP_SERVER_-_INTEGRATION_EXAMPLES.md` - MCP server integration examples
2. `GENERAL_API_INSTRUCTIONS_FOR_INTEGRATION_SPECIALIST.md` - Integration specialist instructions

---

## Guides (8 documents)

### Core Guides (5)
1. `GENERAL_GUIDE_BETA_RELEASE_PROJECT_TRACKING.md` - **Project tracking**
2. `GENERAL_GUIDE_PRE_BETA_USER_CHECKLIST.md` - **User pre-beta checklist**
3. `GENERAL_GUIDE_REALISTIC_WORK_PLAN.md` - **Master work plan**
4. `GENERAL_GUIDE_SECURITY_POLICY.md` - Security policy
5. `GENERAL_GUIDE_UNIVERSAL_AIHUMAN_INTERACTION_PROTOCOL.md` - **Ethics protocol**

### Deployment Guides (2)
1. `LEXFIAT_GUIDE_LEXFIAT_DEPLOYMENT_CHECKLIST.md` - LexFiat deployment
2. `CYRANO_GUIDE_MCP_TOOL_REGISTRY_CHECKLIST.md` - MCP tool registry

### Arkiver Guide (1)
1. `ARKIVER_GUIDE_ARKIVER_EXTRACTION_PATTERNS.md` - Extraction workflow reference

**Note:** Many guides have been archived. See `docs/archive/one-offs/2025-01-07-archive-cleanup/ARCHIVE_SUMMARY.md` for details.

---

## Reference (5 documents - README files)

### Arkiver
1. `ARKIVER_README_ARKIVER_MODULE.md` - **Processing components module** (authoritative scope)

### Cyrano
1. `CYRANO_MCP_SERVER_README.md` - Cyrano MCP server implementation guide

### LexFiat
1. `LEXFIAT_README_LEXFIAT.md` - LexFiat app overview

### Workspace / Coordination
1. `GENERAL_README_PROJECTS_WORKSPACE_OVERVIEW.md` - Active projects overview, thin-client reminder
2. `GENERAL_README_TASK_MANAGEMENT_COORDINATION_SYSTEM.md` - Agent coordination and automation scripts

---

## UI (7 documents)

### Arkiver UI (1)
1. `ARKIVER_UI_SPECIFICATION.md` - **Authoritative source for Arkiver UI**

### LexFiat UI (1)
1. `LEXFIAT_UI_SPECIFICATION.md` - **Authoritative source for LexFiat UI**

### Cyrano UI (1)
1. `CYRANO_UI_CYRANO_MCP_SERVER_-_IMPLEMENTATION_GUIDE.md`

### GoodCounsel UI (1)
1. `UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md` - **GoodCounsel philosophy document** ✅

### Icon System (2)
1. `ICON_SYSTEM_PROPOSAL.md`
2. `icon-preview.html`

---

## Project Documentation (2 documents)

1. `PROJECT_CHANGE_LOG.md` - **Consolidated change log** (replaces all one-off status reports)
2. `ACTIVE_DOCUMENTATION_INDEX.md` - This document

---

## Authoritative Documents by Subject

### Arkiver
- **Architecture:** `ARKIVER_ARCHITECTURE_GUIDE.md`
- **UI:** `ARKIVER_UI_SPECIFICATION.md`
- **Processing Components:** `ARKIVER_README_ARKIVER_MODULE.md`

### LexFiat
- **Architecture:** `LEXFIAT_README_LEXFIAT.md`
- **UI:** `LEXFIAT_UI_SPECIFICATION.md`

### Cyrano Architecture
- **Module Layer:** `ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md`
- **Engine Layer:** `ARCHITECTURE_ARCHITECTURE_ENGINE_ARCHITECTURE.md`
- **Overall:** See Module and Engine architecture docs

### Ethics/Philosophy
- **Universal Protocol:** `GENERAL_GUIDE_UNIVERSAL_AIHUMAN_INTERACTION_PROTOCOL.md`
- **GoodCounsel Philosophy:** `UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md` ✅

### Project Management
- **Work Plan:** `GENERAL_GUIDE_REALISTIC_WORK_PLAN.md`
- **Change Log:** `PROJECT_CHANGE_LOG.md`

---

## Layer Verification Status

### Tools Layer
- **Status:** ✅ Active
- **Count:** ~40+ tool implementations (excluding base class)
- **Base Class:** `src/tools/base-tool.ts` ✅
- **Documentation:** `ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md` (explains tool composition)
- **Examples:** `tools/document-analyzer.ts`, `tools/arkiver-mcp-tools.ts`, `tools/legal-reviewer.ts`

### Modules Layer
- **Status:** ✅ Active
- **Count:** 3 modules (arkiver, chronometric, rag)
- **Base Class:** `src/modules/base-module.ts` ✅
- **Documentation:** `ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md`
- **Examples:** 
  - `modules/arkiver/` - Document and LLM conversation extraction, processing components
    - **Extractors**: PDF, DOCX, Conversation (JSON/MD/TXT), Text/Markdown
    - **Processors**: Text, Email, Insight, Entity, Timeline
  - `modules/chronometric/` - Time capture module
  - `modules/rag/` - RAG pipeline components

### Engines Layer
- **Status:** ✅ Active
- **Count:** 3 engines (goodcounsel, mae, potemkin)
- **Base Class:** `src/engines/base-engine.ts` ✅
- **Documentation:** `ARCHITECTURE_ARCHITECTURE_ENGINE_ARCHITECTURE.md`
- **Examples:**
  - `engines/goodcounsel/` - Ethics and wellness engine
  - `engines/mae/` - MAE engine
  - `engines/potemkin/` - Verification engine

---

## Conflicts Resolved

### ✅ Fixed Conflicts:
1. **LexFiat Backend References** - `GENERAL_README_PROJECTS_WORKSPACE_OVERVIEW.md` updated to state LexFiat is thin client
2. **Arkiver Module Terminology** - `ARKIVER_README_ARKIVER_MODULE.md` clarified to document processing components module, not the app
3. **Source of Truth Scope** - All authoritative documents now specify their scope (Architecture, UI, etc.)

### ✅ Source of Truth Documents Clarified:
- `ARKIVER_ARCHITECTURE_GUIDE.md` - Authoritative for **Arkiver architecture**
- `ARKIVER_UI_SPECIFICATION.md` - Authoritative for **Arkiver UI**
- `LEXFIAT_UI_SPECIFICATION.md` - Authoritative for **LexFiat UI**

---

## GoodCounsel Philosophy Document

**Status:** ✅ **INTACT**
- **Location:** `docs/ui/UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md`
- **Content:** Complete philosophy document preserved
- **Key Points:**
  - "GoodCounsel exists to affirm, not to alarm"
  - Gold and green color scheme (rarely red)
  - Sanctuary for attorneys
  - Unconditional support philosophy

---

## README Documents Status

**Total README files in active docs:** 5 files in `docs/reference/`

Recent updates:
- ✅ Duplicative/placeholder READMEs archived on 2025-12-04 (`docs/archive/one-offs/2025-12-04-active-doc-reduction/`)
- ✅ Remaining READMEs retain standardized headers and align with their source directories

The current set covers Arkiver processing components, the Cyrano MCP server, LexFiat, and workspace coordination references.

---

**This index is maintained as the master reference for all active documentation.**

