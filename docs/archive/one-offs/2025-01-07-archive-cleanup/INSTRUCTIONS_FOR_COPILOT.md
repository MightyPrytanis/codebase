# Instructions for Copilot - ArkiverMJ Development

**Date:** 2025-11-22  
**Status:** Approved - Begin Development  
**Primary Contact:** User (coordination)  
**Cyrano Contact:** Cursor (MCP interface questions)

---

## Naming Convention

**Important:** During development, the application is referred to as "ArkiverMJ" to distinguish it from the Base44 version and Labs prototype. **The production version will be called "Arkiver"** (without the "MJ" suffix). You may use either name during development, but be aware that the final product will be "Arkiver".

---

## Delegation Approval

Your proposal to handle Arkiver (development name: ArkiverMJ) development in parallel with Cursor's Cyrano/LexFiat work has been **approved with modifications**.

**Key Decision:** TypeScript-first implementation (not Python). Use Labs/Arkiver Python code as an **architectural blueprint**, not a direct port.

---

## Your Responsibilities

### 1. ArkiverMJ Backend (TypeScript)
- Rewrite Labs/Arkiver architecture in TypeScript
- Implement extractors (PDF, DOCX, email, OCR)
- Implement processors (citations, entities, timelines)
- Create database storage layer
- Integrate with Cyrano MCP tools (per interface contract)

**Estimated Effort:** 40-50 hours

### 2. ArkiverMJ Frontend (React)
- Build React web application
- File upload interface (following Base44 design)
- Dashboard and visualizations
- Search and filtering UI
- AI integrity monitoring interface
- Settings and configuration UI

**Estimated Effort:** 50-60 hours

### 3. MCP Client Integration
- Implement MCP client to call Cyrano tools
- Handle file processing workflows
- Manage data persistence via Cyrano
- Error handling and user feedback

**Estimated Effort:** 6-8 hours

### 4. Testing & Documentation
- Unit tests for extractors/processors
- Integration tests with Cyrano MCP (using mock server initially)
- UI/UX testing against live ArkiverMJ reference (https://arkiver.base44.app)
- User documentation
- Developer handoff documentation

**Estimated Effort:** 20-25 hours

**Total Estimated Effort:** 120-140 hours over 10-12 weeks

---

## Critical Interface Contract

**READ THIS FIRST:** `/Coding/Dev+Test/ARKIVER_MCP_INTERFACE_CONTRACT.md`

This document defines:
- File upload protocol (HTTP endpoint, not MCP tool)
- MCP tool definitions (all 5 tools)
- Async job pattern (for long-running operations)
- Error handling standards
- Authentication method

**You must implement to this contract exactly.** Any deviations require approval from Cursor and the user.

---

## Development Workflow

### Week 3 (Now)
1. ✅ Review interface contract document
2. ✅ Set up mock MCP server for testing
3. ✅ Begin TypeScript backend architecture
4. ✅ Start file upload UI (can work against mock)

### Week 4
- Cursor will implement real MCP tools
- You continue with mock server
- Begin integration planning

### Week 6
- Backend MVP complete
- Begin integration testing with real Cyrano MCP server
- Frontend development continues

### Week 8
- Frontend MVP complete
- Full integration testing
- Bug fixes and refinements

### Week 9-10
- Final integration testing
- Performance optimization
- Documentation completion

### Week 10
- Beta release

---

## Key Technical Decisions

1. **TypeScript Only:** No Python bridge. Rewrite Labs/Arkiver in TypeScript using it as a blueprint.

2. **File Upload:** Use HTTP endpoint (`POST /api/arkiver/upload`), not MCP tool. See contract for details.

3. **Async Operations:** Use job queue pattern. Process file returns `jobId`, poll `arkiver_job_status` for progress.

4. **Authentication:** Use Cyrano's `auth` MCP tool to get token, include in all requests.

5. **Error Handling:** Follow standardized error format in contract document.

---

## Mock MCP Server

**You need to create a mock MCP server** that implements the interface contract for development/testing. This allows you to:

- Develop independently before Cyrano tools are ready
- Test error conditions
- Test async job polling logic
- Develop UI without waiting for backend

The mock should:
- Accept all 5 MCP tools defined in contract
- Return realistic responses
- Simulate async job pattern (queued → processing → completed)
- Support various error scenarios

---

## Reference Materials

1. **Interface Contract:** `/Coding/Dev+Test/ARKIVER_MCP_INTERFACE_CONTRACT.md` ⭐ **READ FIRST**
2. **Base44 Specs:** Reference the live app at https://arkiver.base44.app
3. **Labs/Arkiver:** `/Coding/codebase/Labs/Arkiver/` (architectural blueprint)
4. **Open Source Libraries:** `/Coding/Dev+Test/OPEN_SOURCE_RESEARCH.md` (recommended libraries)
5. **Code Extraction Plan:** `/Coding/Dev+Test/CODE_EXTRACTION_PLAN.md` (context on legacy code)

---

## Communication Protocol

### Weekly Status Updates
- Provide brief status update every Friday
- Include: What's done, what's in progress, blockers, next week's plan
- Keep updates concise (1-2 paragraphs)

### Questions/Blockers
- **MCP Interface Questions:** Ask Cursor (via user if needed)
- **Architecture Questions:** Ask user
- **Base44 Spec Questions:** Reference live app, ask user if unclear

### Integration Sync
- Week 6: First integration sync with Cursor
- Week 8: Second integration sync
- Week 10: Final integration review

---

## Success Criteria

Your work is successful if:
- ✅ ArkiverMJ can upload files and process them end-to-end
- ✅ Insights are stored and queryable via MCP tools
- ✅ Integrity tests can be run
- ✅ UI matches Base44 design (functionally, not necessarily visually)
- ✅ All integration tests pass
- ✅ Documentation is complete

---

## Important Notes

1. **Don't Block Cursor:** If you have questions, work around them or use mocks. Don't wait for answers.

2. **TypeScript First:** This is a TypeScript rewrite, not a Python integration. Use Labs/Arkiver as a reference, not a dependency.

3. **Follow Contract:** The interface contract is the source of truth. Implement it exactly.

4. **Test Independently:** Use mock MCP server for development. Only integrate with real Cyrano in Week 6+.

5. **User Priority:** User's priority is LexFiat MVP. Arkiver is secondary. Don't create blockers.

---

## Questions?

If anything is unclear:
1. Check the interface contract document first
2. Reference the Base44 live app
3. Ask the user (they'll coordinate with Cursor if needed)

**Good luck!** 🚀

---

**Status:** Ready to Begin  
**Start Date:** Week 3 (Now)  
**Target Completion:** Week 10 (Beta Release)

