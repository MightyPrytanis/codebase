---
Document ID: COPILOT-AUDIT-INFORMATION
Title: Codebase Information for GitHub Copilot Chat + VS Code Copilot Audit
Subject(s): Audit | Code Review | GitHub Copilot | VS Code Copilot
Project: Cyrano
Version: v548
Created: 2025-01-07 (2025-W01)
Last Substantive Revision: 2025-01-07 (2025-W01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Essential codebase information for conducting audit with GitHub Copilot Chat and VS Code Copilot.
Status: Active
---

# Codebase Information for Copilot Audit

**Purpose:** Provide essential information about the codebase for GitHub Copilot Chat and VS Code Copilot reviewers  
**Last Updated:** 2025-01-07

---

## Project Overview

**Project Name:** Cyrano / LexFiat / Arkiver  
**Type:** Legal Technology Platform  
**Architecture:** Multi-layered (Tools → Modules → Engines → Apps)  
**Primary Language:** TypeScript  
**Frameworks:** React (frontend), Express (backend), Node.js

---

## Codebase Structure

### Backend: Cyrano MCP Server

**Location:** `/Cyrano/`  
**Type:** Model Context Protocol (MCP) Server  
**Port:** 5001 (default)

**Key Directories:**
- `src/tools/` - 71 MCP tools (legal tools, AI tools, integration tools)
- `src/modules/` - Module layer (Chronometric, RAG, Arkiver processing)
- `src/engines/` - Engine layer (MAE, GoodCounsel, Potemkin)
- `src/services/` - Core services (AI, auth, embedding, etc.)
- `src/utils/` - Utilities (API validation, demo mode, error handling)
- `src/http-bridge.ts` - HTTP bridge for MCP (main entry point)
- `src/db/` - Database access (Drizzle ORM)

**Key Technologies:**
- Express.js for HTTP server
- Model Context Protocol (MCP) SDK
- Multiple AI providers (OpenAI, Anthropic, Perplexity, Google, xAI, DeepSeek)
- Drizzle ORM for database access
- TypeScript

### Frontend: LexFiat

**Location:** `/LexFiat/client/`  
**Type:** React Single Page Application  
**Port:** 5173 (dev), 4173 (preview)

**Key Directories:**
- `src/pages/` - Page components (dashboard, settings, etc.)
- `src/components/` - React components
- `src/lib/` - API clients, utilities
- `src/components/demo/` - Demo mode UI components

**Key Technologies:**
- React 19
- Vite
- TypeScript
- @tanstack/react-query
- Radix UI components
- Tailwind CSS

### Frontend: Arkiver

**Location:** `/apps/arkiver/frontend/`  
**Type:** React Single Page Application  
**Port:** 5174 (dev), 4174 (preview)

**Key Directories:**
- `src/pages/` - Page components
- `src/components/` - React components
- `src/lib/` - API clients

**Key Technologies:**
- React 18
- Vite
- TypeScript
- @tanstack/react-query
- React Router
- Tailwind CSS

---

## Architecture Principles

### 1. User Sovereignty
- **Principle:** Users have absolute discretion to select AI provider/model for every AI-enhanced function
- **Implementation:** All tools support `ai_provider` parameter with 'auto' default
- **Exception:** MAE default provider is Perplexity (user can change)
- **Files:** All tools in `Cyrano/src/tools/`, `Cyrano/src/services/ai-provider-selector.ts`

### 2. Demo Mode
- **Principle:** Clear indication when demo/mock data is displayed
- **Implementation:** Demo mode utilities, UI components, warnings
- **Files:** `Cyrano/src/utils/demo-mode.ts`, `LexFiat/client/src/components/demo/`

### 3. Performance Tracking
- **Principle:** Track AI provider performance for intelligent selection
- **Implementation:** `AIPerformanceTracker` tracks latency, success rate, cost
- **Files:** `Cyrano/src/services/ai-performance-tracker.ts`

### 4. Auto-Select Logic
- **Principle:** Auto-select optimal provider based on task profile and performance
- **Implementation:** `AIProviderSelector` with task profile matching
- **Files:** `Cyrano/src/services/ai-provider-selector.ts`

---

## Key Files to Review

### Critical Backend Files

1. **Cyrano/src/http-bridge.ts**
   - HTTP bridge implementation
   - Tool registration (71 tools)
   - CORS configuration
   - Authentication middleware
   - Error handling

2. **Cyrano/src/services/ai-service.ts**
   - AI provider integration
   - Performance tracking integration
   - Error handling
   - Provider selection

3. **Cyrano/src/services/ai-provider-selector.ts**
   - User sovereignty implementation
   - Auto-select logic
   - MAE default provider management

4. **Cyrano/src/services/ai-performance-tracker.ts**
   - Performance metrics tracking
   - Provider recommendations
   - Task profile matching

5. **Cyrano/src/services/auth-service.ts**
   - Authentication logic
   - Session management
   - Password hashing

6. **Cyrano/src/tools/** (Sample critical tools)
   - `legal-reviewer.ts` - Legal document review
   - `fact-checker.ts` - Fact verification
   - `document-drafter.ts` - Document drafting
   - `red-flag-finder.ts` - Red flag detection
   - `mae-engine.ts` - MAE engine tool

7. **Cyrano/src/engines/mae/mae-engine.ts**
   - Multi-Agent Engine
   - Workflow orchestration
   - Provider selection support

### Critical Frontend Files

1. **LexFiat/client/src/App.tsx**
   - Application structure
   - Routing
   - Error boundaries
   - Demo mode banner

2. **LexFiat/client/src/lib/cyrano-api.ts**
   - API client for Cyrano MCP
   - Error handling
   - Request/response handling

3. **LexFiat/client/src/pages/dashboard.tsx**
   - Main dashboard
   - Component integration
   - State management

4. **LexFiat/client/src/pages/mae-workflows.tsx**
   - MAE workflow management UI
   - Provider selection UI
   - Workflow execution

5. **apps/arkiver/frontend/src/pages/Extractor.tsx**
   - File extraction UI
   - LLM provider selection
   - API integration

---

## Security Considerations

### Authentication & Authorization
- **Location:** `Cyrano/src/services/auth-service.ts`, `Cyrano/auth-server/`
- **Check:** Password hashing, session management, JWT handling

### API Security
- **Location:** `Cyrano/src/http-bridge.ts`
- **Check:** CORS configuration, rate limiting, input validation

### Data Security
- **Location:** All database access files
- **Check:** SQL injection prevention, parameterized queries

### Environment Variables
- **Location:** `.env` files (should be in `.gitignore`)
- **Check:** No secrets in code, proper secret management

---

## Testing

### Test Locations
- `Cyrano/tests/` - Backend tests
- `Cyrano/tests/e2e/` - E2E tests (Playwright)

### Key Test Files
- `Cyrano/tests/michigan-citation-test.ts` - Citation tests (all passing)
- `Cyrano/test-all-integrations.ts` - Integration tests

---

## Known Issues & Technical Debt

### Current Status
- **Build Status:** LexFiat and Arkiver builds in progress
- **Test Status:** Michigan citation tests fixed (100% pass rate)
- **Demo Mode:** Implemented with UI components
- **Provider Selection:** Implemented with auto-select

### Areas Needing Review
- Some tools may still have hardcoded providers (see `docs/IMPLEMENTATION_STATUS_USER_SOVEREIGNTY.md`)
- TypeScript type safety improvements needed
- Error handling consistency
- Test coverage expansion

---

## Review Priorities

### P0 (Critical) - Must Review
1. Authentication/authorization implementation
2. API security (CORS, rate limiting, input validation)
3. Data handling and encryption
4. Error handling (no sensitive data exposure)
5. SQL injection prevention

### P1 (High) - Should Review
1. All tool implementations
2. AI provider integration
3. Frontend security (XSS prevention)
4. Session management
5. API key handling

### P2 (Medium) - Nice to Have
1. Code quality and patterns
2. Performance optimizations
3. Documentation completeness
4. Test coverage

### P3 (Low) - Future
1. Code style consistency
2. Refactoring opportunities
3. Documentation improvements

---

## Prompt Templates for Copilot

### Architecture Review
```
Review the overall architecture of this codebase:
- Location: /Users/davidtowne/Desktop/Coding/codebase/
- Backend: Cyrano/ (MCP server)
- Frontend: LexFiat/client/ and apps/arkiver/frontend/
- Architecture: Tools → Modules → Engines → Apps

Focus on:
1. Architecture patterns and design decisions
2. Module organization and structure
3. Separation of concerns
4. Scalability and maintainability
5. Potential architectural improvements
```

### Security Review
```
Review security aspects of this codebase:
- Authentication: Cyrano/src/services/auth-service.ts
- API Security: Cyrano/src/http-bridge.ts
- Database: All files in Cyrano/src/db/
- Input Validation: All tools in Cyrano/src/tools/

Focus on:
1. Authentication and authorization
2. Input validation and sanitization
3. API security (CORS, rate limiting)
4. Secret management
5. SQL injection prevention
6. XSS prevention
```

### Code Quality Review
```
Review code quality in [specific file or directory]:
- Focus on code smells, technical debt
- Error handling consistency
- Type safety
- Performance concerns
- Best practices violations
```

---

## Key Metrics

- **Total Tools:** 71 MCP tools
- **Engines:** 3 (MAE, GoodCounsel, Potemkin)
- **Modules:** Multiple (Chronometric, RAG, Arkiver)
- **AI Providers:** 6 (OpenAI, Anthropic, Perplexity, Google, xAI, DeepSeek)
- **Frontend Apps:** 2 (LexFiat, Arkiver)
- **Test Coverage:** Partial (expanding)

---

## Documentation

**Active Documentation:**
- `docs/IMPLEMENTATION_STATUS_USER_SOVEREIGNTY.md` - Implementation status
- `docs/guides/GENERAL_GUIDE_PRE_BETA_USER_CHECKLIST.md` - Pre-beta checklist
- `docs/PROJECT_CHANGE_LOG.md` - Project changelog
- `docs/architecture/` - Architecture documentation

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-01-07


