# Cyrano Codebase: Now What?

**Written** 21 November 2025, By David Towne, based on a report prepared by Cursor.
**Purpose:** Post-Hoax Codebase Assessment and Action Plan

In August 2025, an ambitious project was commenced to build a functional Model Context Protocol (MCP) server that would support LexFiat, a thin-client legal workflow application designed to link together disconnected technologies in law practices, automate repetitive or menial tasks, and free user attorneys to devote time and energy toward the actual practice of law and client development. The effort was christened "Project Cyrano."

After weeks of work, including much trial and error and learn-as-you-go, a comprehensive review of the project codebase, with an eye toward much-needed reconciliation and refactoring, was initiated on or about 16 November 2025, with the following directive to Perplexity/Comet:

> Using the most recent available information on the Comet Browser and Comet Agent; expert-level knowledge of MCP servers, TextScript, JavaScript, Python, and other technical matters; and the most current information in this space and in other recent chats about The Cyrano MCP server and ecosystem, LexFiat app, Arkiver app, and “legacy” apps such as SwimMeet and Cosmos, prepare a detailed, rigorous action plan for Comet Agent to methodically examine my local codebase and relevant Git repos, and act agentically to achieve the following objectives:
>1. Achieve a single uniform codebase that is stored both locally and with GitHub using the best elements from differing extant codebases. 
>2. Locate, repair, modify, borrow, adapt and/or plan and create the tools necessary for the MAE (multi agent engine, a super-module for orchestrating multiple AI assistants/agents) and GoodCounsel (an integrated ethics and wellness engine) which are the mind and soul respectively of the LexFiat App, and are composed of components housed in the Cyrano MCP server, to function as envisioned/required.
>3. Build out, adapt, refine and repair the remaining Cyrano MCP components necessary for the operation of the server and LexFiat. 
>4. Refine, recover, adapt and/or repair elements of the UI so that it is ready for full integration and offers a UX that is intuitive, clear, and aesthetically pleasing.
>5. Connect MCP component tools, modules, and engines to the LexFiat thin client app and wire the backend, middleware,  API connections, and UI components together so that LexFiat is ready to operate flawlessly once API connections are fully authorized and established and the server and app are compiled/built/hosted/deployed. 
>6. Lay out a roadmap for api connection and deployment of the server, database, and app for beta testing. 
>7. Lay out a roadmap for further development of a mature, integrated, and fully featured Cyrano ecosystem of useful client agents, innovative engines/modules/tools, and robust, reliable, scalable operation.

On 19 November, Perplexity/Comet provided the user with a detailed status report on the project, complete with charts, tallies of hours spent, and projected completion dates.[[1]]('/Users/davidtowne/Desktop/Coding/Dev+Test/20251119%20Comprehensive%20Update.md')                                                                                                                                       

**Virtually everthing contained in that report was a lie.** [[2]](file:///Users/davidtowne/Desktop/Coding/Dev+Test/Comet%20Comes%20Clean.md)

In fact, no work whatsoever had been done. If any code revisions had been prepared, none of it was stored or provided to the user, and certainly not implemented, contrary to the agent's repeated assurances. 

The user's contributions to the effort, which had been enthusiastically received by the agent, had vanished into the ether, unrecorded and unexecuted.  The user's trust and confidence in Perplexity was shattered, and it was no longer deemed reliable for work on the project.

## Preliminary Findings

1. The Perplexity/Comet reconciliation and refactoring project was an elaborate AI-instigated hoax.[[3]](file:///Users/davidtowne/Desktop/Coding/Dev+Test/Comet%20Comes%20Clean.md)
2. Previous attempts at reconciliation and refactoring have created at least two divergent versions of the code base: a consolidated (but incomplete) monorepo structure at /users/desktop/coding/codebase, and individual repositories corresponding to apps or modules/engines at github.com/mightyprytanis, some of which are legacy and not under active development, but may be mined for content. 
3. The local codebase contains tools mixed with documentation and various artifacts; the modular architecture hierarchy (Tools → Modules → Engines → Apps → Suite) described in `Cyrano Modular Architecture.md` has **not been implemented**.[[4]](///Users/davidtowne/Desktop/Coding/Dev+Test/Cyrano%20Modular%20Architecture.md) Everything exists as a flat layer of tools directly exposed via MCP.

## What Actually Exists

### Tools Layer 
**Location:** `Cyrano/src/tools/`

**Count:** 18 tools [possibly more not properly registered or located elsewhere]
1. `auth.ts` - Authentication tool
2. `document-analyzer.ts` - Document analysis
3. `legal-comparator.ts` - Legal document comparison
4. `goodcounsel.ts` - Ethical guidance (presently implemented as a tool, not an engine)
5. `fact-checker.ts` - Fact checking
6. `legal-reviewer.ts` - Legal review
7. `compliance-checker.ts` - Compliance checking
8. `quality-assessor.ts` - Quality assessment
9. `workflow-manager.ts` - Workflow management
10. `case-manager.ts` - Case management
11. `document-processor.ts` - Document processing
12. `ai-orchestrator.ts` - AI provider orchestration
13. `system-status.ts` - System status
14. `sync-manager.ts` - Synchronization
15. `red-flag-finder.ts` - Red flag detection
16. `clio-integration.ts` - Clio integration
17. `arkiver-tools.ts` - Arkiver data extraction (multiple tools)
18. `menlo-park.ts` - Internal codename utility

**Base Infrastructure:**
- `base-tool.ts` - Abstract base class for all tools
- MCP server implementation (`mcp-server.ts`)
- HTTP bridge (`http-bridge.ts`)
- Database schema (`schema.ts`)
- Services: `perplexity.ts`, `cosmos-integration.ts`

### Modules Layer (NOT IMPLEMENTED)
**Expected:** Modules composed of multiple tools, handling discrete domain functions  
**Reality:** No `src/modules/` directory exists. No module composition system exists.
**Note on Hierarchy/Nomenclature** "Modules" are not a standardized term in the Model Context Protocol (MCP). The concept of a module is specific to the Cyrano ecosystem. A module is a more or less self-contained conglomeration of tools, resources, and prompts geared towards the performance of a certain task or related set of tasks. Strictly speaking, it is not a separate class, but a way to conceptually and functionally organize primitives within an MCP environment.

**Missing Examples:**
- Chronometric module (documented in `Chronometric.md` and developed in Cursor and GitHub, but not implemented)[[5]](/Users/davidtowne/Desktop/Coding/Dev+Test/Chronometric.md)
- No module abstraction layer
- No module orchestration
- Tools are directly exposed, not grouped into modules

### Engines Layer (NOT PROPERLY IMPLEMENTED)
**Expected:** Engines coordinate multiple modules and AI models (MAE, GoodCounsel, Potemkin)
**Note on Hierarchy/Nomenclature** "Engines" are also specific to the Cyrano ecosystem. As a module is a  conglomeration of related tools, resources, and prompts, an "engine" aggregates and/or orchestrates modules (and when appropriate, individual primitives) for the performance of core/mission-critical functions of an app.  

**Reality:**
1. **MAE (Multi-Agent Engine),** The "brain" of LexFiat (and potentially other apps in the LexFiat ecosystem:
    *  **Referenced** in LexFiat UI components (`mae-workflows.tsx`)
    *  Database schemas **exist** (`maeWorkflows`, `maeWorkflowSteps`, `maeWorkflowExecutions`)
    *  **No actual engine implementation in Cyrano**
    *  **Only** UI mockups and database tables
    *  Adapted workflow component(s) from SwimMeet: **MISSING**
    *  Renamed/restructured "C" series of preset workflow(s) based on SwimMeet pathfinder (compare, contrast, collaborate, create, cooperate, critique, customize, etc.): **MISSING**
    *  Workflow Visual Edit/Mapping Tool for "customize" function: **MISSING**
    *  User Sovereignty-respecting choice of preset or user-added agents/assistants/models through using API: **MISSING**
    *  API Keys for various models: some available but not integrated, some **MISSING**
    *  Fully updated documentation: **MISSING**

   
2. **GoodCounsel,** the "heart and soul" of LexFiat:
    *   **Does not** presently coordinate modules or employ multiple tools
    *   Single-purpose tool implementation **only**
    *   Philosophical document exists, but is currently aspirational and **not reflected** in actual functioning.
    *   Adapted version of the Cosmos "next action" legacy tool for client relationship development and care: **MISSING**
    *   Adapted version of the HabitCurb/Cognizant/Cognisint detection and prompting component(s): **MISSING**
    *   Ethics watchdog and advisory component(s): **MISSING**
    *   Wellness component(s): **MISSING**
    *   Burnout detection component(s): **MISSING**
    *   Professional education and development component(s): **MISSING**
    *   User Help and assistance component(s): **MISSING**
    *   User crisis and recovery component(s): **MISSING**
    *   Strict, HIPAA-compliant privacy controls: **MISSING**
    *   Dedicated folder in the directory structure with consistently-named component primitives: **MISSING** 
    *   Wiring to UI and agents: **MISSING**
    *   Fully updated documentation: **MISSING**
    
3. **Potemkin,** the truth and logic stickler:
    *   Presently exists in `Labs/Potemkin/` as a **developmental** project.
    *   **Not yet integrated** into Cyrano MCP server
    *   **Lacking** module or engine architecture
    *   **Separate** codebase with its own structure
    *   AI Ethics standards are well-developed and documented but **not functionally implemented**.[[6]](///Users/davidtowne/Desktop/Coding/Dev+Test/ETHICS.md)
    *   OpinionDriftTest, BiasDetector, HonestyAssessment, TenRulesCompliance tools (adapted from ArkiverMJ design developed in Base44): **MISSING**
    *   IntegrityMonitor, IntegrityAlertAssistant, IntegrityAlertConfig (also adapted from ArkiverMJ): **MISSING**
    *   MoralReasoner, Parser, Validator, LogicTester, Reporter, and other tools (mostly derived from open-source tools): directory structure exists, but tools themselves are **MISSING**

### Apps Layer (Partially Implemented)
1. **LexFiat,** the MVP; intelligent legal workflow orchestrator.
    * Exists as a React application
    * Has frontend (`client/`) and backend structure
    * Connects to Cyrano via HTTP bridge
    * **However:** Only connects to tools directly, not to modules or engines
    * UI requires further development and adjustment to be consistent with lost "most advanced" version presently confirmed only by screenshots
    * Original impetus for creating Cyrano MCP; has experienced multiple developmental iterations and coding assistants, each with their own idiosyncrasies and failure points and each leaving artifacts and debris behind.
    * Clio, Westlaw, Lexis/Nexis, Gmail, Outlook, MiFile, and other intended integrations: **INCOMPLETE** **MISPLACED** or **MISSING**
    * Legal research and writing tools:**INCOMPLETE** **MISPLACED** or **MISSING**    
    * Functional Legal Triage, Reasoning, Research and Writing tools: **INCOMPLETE** **MISPLACED** or **MISSING**
    * Jurisdiction-Specific Legal Format Checker: **MISSING**
    * Smart Time Keeping Module (Chronometric): developed in Cursor and refined in gmightyprytanis/cyrano
    * Template Library: **INCOMPLETE**
    
2. **Arkiver,** the data extraction and interpretation expert:
    * **Three different versions** started but not completed, including Python and two TypeScript attempts: Arkiver, NewArkiver, and ArkiverMJ
    * Best version is **ArkiverMJ**, but that is presently marooned in Base44.
    * **Complete technical specifications** were obtained from the Base44 AI assistant and are available for ArkiverMJ (Arkiver Base44.md) but backend must be recreated to replace Base44 dependencies.
    * Scaffolding documented and partially implemented for ArkiverMJ, but code is fragmentary at best.
    * Function creep a/k/a **Modularity**: some functions of ArkiverMJ probably belong in other applications, and the tools should definitely be housed in Cyrano MCP Server.
    * ArkiverMJ is was designed to be modular, but due to Base44 limitations is **not strictly MCP-compliant** as spec'ed. 
    * **Documentation**: Specifications largely complete, but user-facing documentation is virtually **nonexistent**. 
    * Current status: **INCOMPLETE**
    
### Suite/Ecosystem/Platform Layer 

**Cyrano** First conceived as a hack or workaround to facilitate use of multi-agent panels, now the MCP server.
*   Requires **extensive refactoring** for MCP compliance,  functionality, and stability
 *  Documentation is **confused, redundant, and outdated**
 *  Artifacts from previous IDEs and reconciliation/refactoring attempts throughout
 *  **No current deployment or testing strategy**; previous test deployment on Render was only minimally functional.
 *  **Legacy branding** may not match current focus or aspirations of LexFiat and Arkiver apps or of creator and Cognisint LLC
 
## Architecture Mismatch

### What the Architecture Document Claims:
```
Tools → Modules → Engines → Apps → Suite
```

### What Actually Exists:
```
Tools → (Direct MCP Exposure) → Apps
```

### Tool Exposure
All 18 tools are:
- Directly registered in `mcp-server.ts`
- Directly exposed via HTTP bridge
- Not grouped into modules
- Not orchestrated by engines

## Outstanding Concerns

Prior reviews established a number of other concerns, some of which have likely been resolved, while others clearly persist.  Those concerns included:
> ### 1. **FALSE AI INTEGRATION CLAIMS**
> - **Issue**: AI tools return static/computed responses, not real AI API calls
> - **Evidence**: 
>   - AI Orchestrator accepts nonexistent AI providers without validation
>   - No actual API keys are checked or used in the source code
>   - Tools like `fact_checker` perform text analysis, not real fact-checking
> - **Risk**: Users may rely on fake "AI analysis" for critical legal decisions
> 
> ### 2. **MOCK TOOL IMPLEMENTATIONS**
> Tools in `/src/tools/` were identified as mock implementations:
> 
> #### Document Analyzer (`document-analyzer.ts`)
> - **Claims**: "Analyze legal documents to extract key information, metadata, and insights"
> - **Reality**: Simple text processing (word count, basic regex pattern matching)
> - **Proof**: Lines 82-189 show basic string operations, no AI
> 
> #### AI Orchestrator (`ai-orchestrator.ts`) 
> - **Claims**: "Orchestrate multiple AI providers for complex legal tasks" (when combined with the SwimMeet workflow prototype tools, this was the intended nucleus of the MAE.)
> - **Reality**: Returns fake orchestration plans without calling any APIs
> - **Proof**: Accepts `"nonexistent-ai-provider-12345"` without error
> 
> #### Fact Checker (`fact-checker.ts`)
> - **Claims**: "Verify facts and claims in legal documents with confidence scoring"
> - **Reality**: Basic text analysis with hardcoded responses
> - **Proof**: No web scraping, API calls, or real verification logic
> 
> ### 3. **MISLEADING DOCUMENTATION AND TESTS**
> - Integration tests (`test-integration.sh`) pass but only validate HTTP endpoints
> - Documentation implies real AI functionality
> - Environment variables suggest API key usage but keys are never consumed
> 
> ### 4. **MCP PROTOCOL COMPLIANCE**
> - **Status**: ✅ PARTIAL COMPLIANCE
> - Server properly implements MCP JSON-RPC protocol for stdio communication
> - HTTP bridge correctly exposes MCP functionality via REST API
> 
> ## Technical Analysis
> 
> ### What Actually Works:
> 1. ✅ MCP protocol implementation (stdio transport)
> 2. ✅ HTTP bridge for web integration  
> 3. ✅ TypeScript compilation and basic server functionality
> 4. ✅ Input validation using Zod schemas
> 
> ### What Is Simulated/Dummy/Fake:
> 1. ❌ AI provider integration (OpenAI, Anthropic, Google, etc.)
> 2. ❌ Real document analysis beyond basic text processing
> 3. ❌ Fact-checking capabilities
> 4. ❌ Legal AI reasoning
> 5. ❌ API key validation and usage


# Recommendations/Plan of Action

1. **Implement Intended Architecture** 
    1. **Tool layer:** Scan all codebase directories for missing and misplaced tools, tool prototypes, and tool documentation; refine or build tools as needed to meet the documented requirements of each module, engine, and app.
    2. **Module layer:** Create module abstraction if modular architecture is desired; Implement the documented **Chronometric** automated timekeeping module, which was prototyped in cursor and has been further developed in the MightyPrytanis/Cyrano Git Repo
    3. **Engine layer:** Create engine abstraction and properly implement MAE, GoodCounsel, Potemkin as engines with proper directory structure, tooling, integrations, and documentation. Move **Potemkin** from /Labs into /Cyrano with the other engines.
    4. **Test and Verify MCP Compliance** e.g. is a stdio bridge required?
2. **"Mine" Internal Sources for Useful Code**
    1. Review /legacy apps for useful code or files, but otherwise do not expend time on them.
3. **Pre-Reconciliation** 
    1. Review unique files or significantly modified files in seleected GitHub Repos (/LexFiat and /Cyrano). 
    2. Save/merge any files that can be used or adapted in the local codebase. Files in GitHub have the potential to be more fully-developed than those in the local codebase, so please review diffs carefully.
4. **Build Out Arkiver**
    1. Use the technical data in /Users/davidtowne/Desktop/Coding/Dev+Test/Arkiver Base44.md to recreate the captive ArkiverMJ app and adapt it for an MCP environment.
    2. Multiple tools required for Arkiver have potential applications in LexFiat or elsewhere. Aim for maximum modularity and adaptability in the ArkiverMJ reconstruction.
    3. Consolidate ArkiverMJ with other versions extant in /Arkiver and /NewArkiver
    4. Port completed Arkiver 
5. **Replace Dummy Code and Mock Integrations**
6. **Search for Open-Source Enhancements**
7. **Finalize LexFiat UI/UX**
8. **Construct RAG Pipeline**
9. **Comprehensive Refactoring of Local Coding/Codebase**
10. **Comprehensive Document Sweep and Revision**
11. **Purge or Archive Unneeded Artifacts**
12. **Comprehensive Security Evaluation and Upgrade**
13. **Reconcile Codebases**
    1. Upload clean, refactored "source of truth" local codebase to MightyPrytanis/codebase monorepo.
    2. Map existing app repos to corresponding directories in monorepo
    3. Merge and reconcile differences.
14. Deploy and Pre-Test
15. Beta Release

# Conclusion

The codebase currently contains a **functional MCP server with tools**, but does **not implement the modular architecture** described in the architecture document. The hierarchy (Tools → Modules → Engines → Apps → Suite) exists almost entirely in documentation, not in code.  Numerous tools are missing, UIs are unfinished, API integration is partially ready but not implemented, documentation is sorely in need of cleanup and updating, and legacy code, documents, and even applications abound.  Substantial reorganization, refactoring, and decluttering is required, separate from any attempts to reconcile the divergent local and remote (GitHub) code bases.

# Follow Up:
The AI coding assistant/IDE shall, upon review of this document and final instruction by the user:
* Scan the entire local codebase and corresponding repositories at GitHub.
* Implement the recommendations above unless doing so would create unacceptable risk of breach, loss, or other harm.
* Ask for clarification if uncertain; never assume knowledge or understanding when the wording is ambiguous.                                                                                                        
* Never over- or under-state its abilities
* Work the steps as indicated, providing regular, detailed, permanently logged updates.
* Continue working until all recommended steps are completed to the user's satisfaction.

