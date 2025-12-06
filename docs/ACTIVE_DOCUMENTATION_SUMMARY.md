---
Document ID: ACTIVE-DOCS-SUMMARY
Title: Active Documentation Summary - Pre-Consolidation
Subject(s): Documentation | Summary | Status
Project: Cyrano
Version: v549
Created: 2025-12-06 (2025-W49)
Last Substantive Revision: 2025-12-06 (2025-W49)
Last Format Update: 2025-12-06 (2025-W49)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Summary of all 41 active documentation files, prepared for external review and consolidation to 12-15 essential documents.
Status: Active
---

# Active Documentation Summary - Pre-Consolidation

**Total Active Documents:** 40 markdown files (Menlo Park architecture doc moved to IP/, not counted)  
**Date:** 2025-12-06 (Week 49)  
**Status:** All documents updated with current dates (v549)  
**Next Step:** External review (Perplexity/Gemini) to prune to 12-15 essential documents

---

## Why `LEXFIAT_UI_SPECIFICATION.md` Exists Separately

**Document:** `docs/ui/LEXFIAT_UI_SPECIFICATION.md`

**Reason for Separate Existence:**

`LEXFIAT_UI_SPECIFICATION.md` is the **authoritative UI/UX specification** for LexFiat, separate from architecture documentation. It serves a different purpose:

- **UI Specification:** Defines visual design, component structure, styling, colors, typography, layout, and user interaction patterns
- **Architecture Docs:** Define code structure, module organization, API design, and technical implementation

**Separation Rationale:**
1. **Different Audiences:** UI spec is for designers and frontend developers; architecture docs are for backend/system developers
2. **Different Update Cycles:** UI changes independently from architecture changes
3. **Different Scope:** UI spec covers visual/UX concerns; architecture covers technical/system concerns
4. **Reference Clarity:** Having separate documents makes it clear which document to reference for UI vs. architecture questions

**Related Documents:**
- `LEXFIAT_README_LEXFIAT.md` - LexFiat architecture and technical overview
- `CYRANO_UI_CYRANO_MCP_SERVER_-_IMPLEMENTATION_GUIDE.md` - Cyrano MCP server UI implementation guide

**Status:** This separation is intentional and should be maintained during consolidation.

---

## Complete List of 40 Active Documents

**Note:** Menlo Park documentation moved to `IP/` directory (not counted in active docs).

### Project Management (3)
1. `PROJECT_CHANGE_LOG.md` - Consolidated change log
2. `GENERAL_GUIDE_BETA_RELEASE_PROJECT_TRACKING.md` - Beta release project tracking
3. `GENERAL_GUIDE_REALISTIC_WORK_PLAN.md` - Master work plan

### Policies & Guides (5)
4. `GENERAL_GUIDE_PROJECT_POLICIES.md` - Project policies (versioning, documentation, work protocol, ethics)
5. `GENERAL_GUIDE_PRE_BETA_USER_CHECKLIST.md` - Pre-beta user checklist
6. `GENERAL_GUIDE_UNIVERSAL_AIHUMAN_INTERACTION_PROTOCOL.md` - Ethics protocol
7. `GENERAL_GUIDE_SECURITY_POLICY.md` - Security policy
8. `GENERAL_GUIDE_MONOREPO_STRUCTURE_WHERE_FILES_LIVE.md` - Monorepo structure guide

### Security & Audit (2)
9. `SECURITY_REVIEW_GUIDE.md` - Security review guide (Snyk + OWASP ZAP)
10. `CODE_AUDIT_GUIDE.md` - Code audit guide (GitHub Copilot Chat + VS Code Copilot)

### Architecture (4)
11. `ARCHITECTURE_ARCHITECTURE_COPILOT_ARCHITECTURE_DECISIONS.md` - Copilot architecture decisions
12. `ARCHITECTURE_ARCHITECTURE_ENGINE_ARCHITECTURE.md` - Engine layer architecture
13. `ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md` - Module layer architecture
14. `ARKIVER_ARCHITECTURE_GUIDE.md` - Arkiver architecture guide

### Cyrano MCP Server (3)
16. `CYRANO_MCP_SERVER_README.md` - Cyrano MCP server implementation guide
17. `CYRANO_UI_CYRANO_MCP_SERVER_-_IMPLEMENTATION_GUIDE.md` - Cyrano MCP server UI implementation
18. `CYRANO_GUIDE_MCP_TOOL_REGISTRY_CHECKLIST.md` - MCP tool registry checklist

### LexFiat (4)
19. `LEXFIAT_README_LEXFIAT.md` - LexFiat architecture and overview
20. `LEXFIAT_UI_SPECIFICATION.md` - LexFiat UI/UX specification (separate by design)
21. `LEXFIAT_GUIDE_LEXFIAT_DEPLOYMENT_CHECKLIST.md` - LexFiat deployment checklist
22. `LEXFIAT_INTEGRATION_STATUS.md` - LexFiat integration status

### Arkiver (3)
23. `ARKIVER_README_ARKIVER_MODULE.md` - Arkiver module (processing components)
24. `ARKIVER_UI_SPECIFICATION.md` - Arkiver UI specification
25. `ARKIVER_GUIDE_ARKIVER_EXTRACTION_PATTERNS.md` - Arkiver extraction patterns

### Engines & Modules (3)
26. `GENERAL_README_GOODCOUNSEL_ENGINE.md` - GoodCounsel engine
27. `GENERAL_README_POTEMKIN_ENGINE.md` - Potemkin engine
28. `GENERAL_README_CHRONOMETRIC_MODULE.md` - Chronometric module

### Integration & API (3)
29. `CYRANO_API_CYRANO_MCP_SERVER_-_INTEGRATION_EXAMPLES.md` - MCP server integration examples
30. `GENERAL_API_INSTRUCTIONS_FOR_INTEGRATION_SPECIALIST.md` - API integration instructions
31. `RAG_INTEGRATION_GUIDE.md` - RAG integration guide (architecture + usage)

### UI & Design (4)
32. `ARKIVER_UI_SOURCE_OF_TRUTH.md` - Arkiver UI source of truth
33. `UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md` - GoodCounsel philosophy
34. `ICON_SYSTEM_PROPOSAL.md` - Icon system proposal
35. `LEXFIAT_UI_SPECIFICATION.md` - (listed above, counted once)

### Status & Implementation (3)
36. `IMPLEMENTATION_STATUS_USER_SOVEREIGNTY.md` - User sovereignty implementation status
37. `LEXFIAT_RESOLUTION_SUMMARY.md` - LexFiat resolution summary
38. `TOOLS_DIRECTORY_ANALYSIS.md` - Tools directory analysis

### Reference & Index (2)
39. `ACTIVE_DOCUMENTATION_INDEX.md` - Active documentation index
40. `ACTIVE_DOCUMENTATION_SUMMARY.md` - This document

### Proposals (1)
41. `PROPOSALS_GOODCOUNSEL_MERGE_AND_DOCUMENT_CREATION_RULE.md` - Document creation rule proposal

---

## Consolidation Plan (After Security Review & Audit)

### Target: 12-15 Essential Documents

**Proposed Structure:**
1. **Project Overview** (1 doc) - Project overview, timeline, policies
2. **Cyrano MCP Server** (1 doc) - Architecture, implementation, tools
3. **LexFiat** (1 doc) - Architecture + UI specification
4. **Arkiver** (1 doc) - Architecture + UI specification
5. **Engines/Modules/Tools** (1 doc) - All engines, modules, and tools layer
6. **Security & Audit** (1 doc) - Security review and audit guides
7. **Integration** (1 doc) - API integration, RAG, deployment
8. **Project Management** (2 docs) - Work plan + change log
9. **User Guides** (1-2 docs) - Pre-beta checklist, deployment guides
10. **Reference** (1-2 docs) - Index, quick reference

**Note:** Consolidation will occur AFTER security review and audit are complete.

---

## Document Status Verification

**All 41 documents have been verified:**
- ✅ Dates updated to 2025-12-06 (W49) or later
- ✅ Version numbers updated to v549
- ✅ No January 2025 dates present
- ✅ Headers standardized
- ✅ Status: Active

**Ready for external review and consolidation.**

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-12-06

