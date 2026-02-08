# GitHub Copilot Instructions for Cyrano Ecosystem

> **Last Updated:** 2026-02-08  
> **Purpose:** Provide comprehensive guidelines for GitHub Copilot coding agent working on the Cyrano ecosystem  
> **Audience:** GitHub Copilot coding agent, developers, contributors

## Repository Overview

This is a monorepo consolidating all components of the Cyrano ecosystem - a legal workflow intelligence platform with AI orchestration capabilities.

**Repository:** [MightyPrytanis/codebase](https://github.com/MightyPrytanis/codebase)  
**Project Start:** July 2025  
**License:** Apache License 2.0  
**Copyright:** © 2025 Cognisint LLC

## Working with GitHub Copilot

### Task Assignment Best Practices

When assigned a task, follow these principles:

1. **Understand First, Code Second**
   - Read and understand the full issue description and any comments
   - Explore the relevant code areas before making changes
   - Ask clarifying questions if requirements are ambiguous

2. **Scope & Complexity**
   - This repository is suitable for low-to-medium complexity tasks
   - Focus on: bug fixes, refactoring, documentation, test coverage, tooling automation
   - Escalate: highly complex business logic, architectural changes, security-critical changes

3. **Minimal Changes**
   - Make the smallest possible changes to address the issue
   - Don't refactor unrelated code unless specifically requested
   - Preserve existing patterns and conventions

4. **Validation is Mandatory**
   - Always run linters, builds, and tests before completing work
   - Validate changes manually when appropriate (e.g., UI changes require screenshots)
   - Never assume changes work without verification

### Workflow Integration

1. **Creating Pull Requests**
   - All work is done on feature branches
   - Use `report_progress` tool frequently to commit and push changes
   - PR descriptions must include task summary and validation evidence

2. **Code Review & Iteration**
   - Use the `code_review` tool before finalizing work
   - Address all valid feedback from code reviews
   - Use the `codeql_checker` tool to scan for security vulnerabilities
   - Iterate until changes meet quality standards

3. **Solo Maintainer Workflow**
   - Repository uses GitHub Actions for auto-approval (`.github/workflows/solo-maintainer-auto-approve.yml`)
   - PRs created by the repository owner are automatically approved
   - Branch protection rules still apply via GitHub rulesets

### Examples of Well-Formed Tasks

**Good Task Examples:**

✅ **Specific and Actionable**
```
Title: Add unit tests for TimelineProcessor class
Description: Create unit tests for the TimelineProcessor class in 
apps/arkiver/src/processors/timeline-processor.ts covering:
- Event parsing from different date formats
- Chronological sorting
- Edge cases (empty input, invalid dates)
Use Vitest and follow existing test patterns in the project.
```

✅ **Clear Scope with Context**
```
Title: Fix memory leak in document extraction
Description: The PDF processor in Cyrano/src/modules/arkiver/extractors/pdf-extractor.ts
is not properly cleaning up resources after processing large files (>10MB).
Add proper cleanup in finally blocks and verify with memory profiling.
Acceptance criteria: Process 100MB PDF without memory growth.
```

✅ **Documentation Update**
```
Title: Update MAE engine documentation
Description: Add usage examples to Cyrano/README.md section on MAE (Master Adaptive Engine).
Include:
- Basic initialization example
- Sample workflow execution
- Common configuration options
Follow the existing documentation style and code formatting.
```

**Poor Task Examples:**

❌ **Too Vague**
```
Title: Fix the tests
Description: Some tests are failing, please fix them.
(Missing: Which tests? What's failing? Expected vs actual behavior?)
```

❌ **Too Broad**
```
Title: Refactor the entire codebase
Description: The code needs to be cleaner and more maintainable.
(Missing: Specific areas, criteria, scope limitations)
```

❌ **Missing Context**
```
Title: Add feature X
Description: We need feature X.
(Missing: What is feature X? Where should it go? Requirements? Acceptance criteria?)
```

### Critical Safety Rules

These rules are based on actual incidents in this repository and **MUST** be followed:

1. **NEVER Auto-Fix Without Validation**
   - Never blindly apply automated fixes to multiple files
   - Always validate each change individually
   - Reference: BraceCase Agent incident (2026-02-08) - 25 files corrupted by auto-adding closing delimiters

2. **Validate ALL Files, Not Just Build Path**
   - Check UI components, tests, scripts, documentation
   - Corruption can exist outside the TypeScript build path
   - Reference: BraceCase incident - corrupted files went undetected because they weren't in build path

3. **Human Review for Automated Changes**
   - Any batch operation must be reviewed file-by-file
   - Provide clear summary of changes made
   - Allow human verification before completing task

## Repository Structure

```
codebase/
├── Cyrano/              # MCP server, engines, modules, tools
├── LexFiat/            # Legal workflow platform (client + backend)
├── apps/
│   └── arkiver/        # Arkiver frontend application
├── docs/               # Active documentation
├── Labs/               # Experimental projects
└── Legacy/             # Archived projects (excluded from main branch)
```

## Key Projects

### Cyrano
MCP-compliant AI orchestration server with modular architecture:
- **Architecture:** Tools → Modules → Engines → Apps
- **Engines:** GoodCounsel (ethics/wellness), MAE (adaptive engine), Potemkin (workflow simulation)
- **Modules:** Arkiver (data extraction), Chronometric (time analysis), RAG (retrieval)
- **Tools:** 48+ MCP tools for legal workflow automation
- **Technology:** TypeScript, Node.js, MCP SDK, Vite, Vitest

### LexFiat
Legal intelligence platform with adaptive workflow:
- **Features:** Dashboard UI, workflow pipeline (Intake → Analysis → Draft → Review)
- **Technology:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, TanStack Query
- **UI Style:** Glass-morphism design

### Arkiver
Universal data extraction system:
- **Components:** Document extractors (PDF, DOCX), processors (text, email, entity, timeline)
- **Technology:** TypeScript, React

## Technologies & Frameworks

### Primary Stack
- **Language:** TypeScript 5.9+
- **Runtime:** Node.js with ES Modules (`"type": "module"`)
- **Build Tool:** TypeScript compiler (tsc), Vite
- **Testing:** Vitest, Playwright (E2E)
- **Package Manager:** npm

### Frontend
- **Framework:** React 19
- **Styling:** Tailwind CSS 4, PostCSS
- **UI Components:** Radix UI, Lucide React icons
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter

### Backend
- **Server:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Protocol:** MCP (Model Context Protocol) via @modelcontextprotocol/sdk
- **Authentication:** JWT, bcrypt

### AI Integration
- **Providers:** OpenAI, Anthropic Claude
- **SDKs:** @anthropic-ai/sdk, openai

### Document Processing
- **PDF:** pdf-parse, pdfjs-dist
- **DOCX:** mammoth, docx
- **OCR:** tesseract.js
- **Web Scraping:** puppeteer

## Build, Test, and Development Commands

### Cyrano
```bash
cd Cyrano
npm install          # Install dependencies
npm run build        # Build TypeScript
npm run dev          # Development mode (tsx)
npm run mcp          # Run MCP server (stdio mode)
npm run http         # Run HTTP bridge (REST API, port 5002)
npm start            # Start compiled build
npm test             # Run integration tests
npm run test:unit    # Run unit tests with Vitest
npm run test:mcp     # Run MCP compliance tests
npm run test:e2e     # Run Playwright E2E tests
npm run clean        # Clean build artifacts
npm run rebuild      # Clean and rebuild
```

### LexFiat
```bash
cd LexFiat
npm install          # Install dependencies
npm run dev          # Development server with Vite
npm run build        # Production build
npm run serve        # Preview production build
```

### Arkiver
```bash
cd apps/arkiver
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
```

## Coding Conventions

### TypeScript Configuration
- **Target:** ES2022
- **Module:** ESNext with Node resolution
- **Strict Mode:** Enabled
- **Source Maps:** Enabled
- **Declaration Files:** Generated
- **Output:** `dist/` directory
- **Source Root:** `src/` directory

### Code Style
- **License Headers:** All source files must include Apache License 2.0 header
- **Imports:** Use ES module syntax with `.js` extensions in imports (for TypeScript)
- **Naming:** 
  - Files: kebab-case (e.g., `base-tool.ts`)
  - Classes: PascalCase (e.g., `BaseEngine`)
  - Functions/variables: camelCase (e.g., `executeWorkflow`)
- **Error Handling:** Use structured error responses, sanitize errors for security
- **Validation:** Use Zod schemas for input validation

### Architecture Patterns

#### Tool Structure
```typescript
import { BaseTool } from './base-tool.js';
import { z } from 'zod';

export class MyTool extends BaseTool {
  name = 'my_tool';
  description = 'Tool description';
  inputSchema = z.object({ /* schema */ });
  
  async execute(input: any): Promise<any> {
    // Tool logic
  }
}
```

#### Module Structure
```typescript
import { BaseModule } from '../modules/base-module.js';

export class MyModule extends BaseModule {
  constructor() {
    super({
      name: 'my_module',
      description: 'Module description',
      version: '1.0.0',
    });
  }
  
  async execute(input: any): Promise<any> {
    // Module logic
  }
}
```

#### Engine Structure
```typescript
import { BaseEngine } from '../engines/base-engine.js';

export class MyEngine extends BaseEngine {
  constructor() {
    super({
      name: 'my_engine',
      description: 'Engine description',
      version: '1.0.0',
      modules: ['module1', 'module2'],
    });
  }
  
  async initialize(): Promise<void> {
    // Setup
  }
  
  async execute(input: any): Promise<any> {
    // Engine logic
  }
}
```

## Documentation Policy

### Critical Rule: DO NOT CREATE NEW DOCUMENTS
**Under no circumstances create new documentation files without explicit user authorization.**

### When Documentation is Needed
1. **Update Change Log** (`docs/PROJECT_CHANGE_LOG.md`) - For historical changes
2. **Update Existing Documents** - Increment version number and update "Last Substantive Revision"
3. **Update Document Headers** - For metadata changes
4. **Update Document Index** (`docs/ACTIVE_DOCUMENTATION_INDEX.md`) - Only if authorized
5. **Ask the User** - If none of the above options are sufficient

### Versioning System
Format: `vYWW` where Y = last digit of year, WW = ISO week number
- Example: `v549` = 2025, Week 49
- Version reflects the ISO week of the Last Substantive Revision date
- Format updates do NOT change version numbers

### Document Structure
All documentation files include standardized YAML frontmatter:
```yaml
---
Document ID: UNIQUE-ID
Title: Document Title
Subject(s): Topic | Category
Project: Cyrano
Version: vYWW
Created: YYYY-MM-DD (YYYY-WW)
Last Substantive Revision: YYYY-MM-DD (YYYY-WW)
Last Format Update: YYYY-MM-DD (YYYY-WW)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Brief description
Status: Active
---
```

## Security Guidelines

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as templates
- Store API keys and secrets in environment variables
- Sanitize errors before sending to clients

### Dependencies
- Keep dependencies up to date
- Review security advisories regularly
- Use npm audit to check for vulnerabilities

### Code Security
- Validate all user inputs with Zod schemas
- Sanitize outputs to prevent XSS
- Use parameterized queries for database operations
- Implement proper authentication and authorization

## Git Workflow

### Excluded from Repository
The following are in `.gitignore`:
- `IP/` - Intellectual property documents
- `.env` files - Environment variables and API keys
- `Legacy/` - Archived legacy code (in archive branch)
- `node_modules/` - Dependencies
- Build artifacts (`dist/`, `build/`)
- IDE files (`.vscode/`, `.idea/`)

### Branches
- **main** - Current active development (clean, production-ready code)
- **archive/2024-10-10-snapshot** - Historical preservation branch

## Testing Guidelines

### Unit Tests
- Use Vitest for unit testing
- Test files: `*.test.ts` or `*.spec.ts`
- Located in `tests/` directory or alongside source files

### E2E Tests
- Use Playwright for end-to-end testing
- Located in Cyrano project

### Integration Tests
- Shell scripts in project root (e.g., `test-integration.sh`)
- Requires `curl` and `jq` utilities

## MCP Protocol Compliance

Cyrano implements the Model Context Protocol (MCP):
- **Transport:** JSON-RPC over stdio or HTTP
- **Tools:** Expose tools via MCP protocol
- **Resources:** Support MCP resource management
- **Prompts:** Support MCP prompt templates
- **HTTP Bridge:** REST API wrapper on port 5002 (default)

## Common Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  return {
    isError: true,
    content: [{ 
      type: 'text', 
      text: sanitizeError(error) 
    }]
  };
}
```

### Tool Registration
Tools are auto-discovered from `src/tools/` directory and registered with the MCP server.

### Module Registration
Modules are registered in the engine's `initialize()` method.

## Important Notes

1. **Current Status:** Some components contain MOCK/PROTOTYPE implementations - verify real AI integration before production use
2. **Monorepo:** This is a consolidated monorepo; be aware of cross-project dependencies
3. **Active Development:** Project is in pre-beta "codebase optimization" phase
4. **Documentation:** Extensive documentation in `docs/` - consult `ACTIVE_DOCUMENTATION_INDEX.md` for complete list

## Feedback & Troubleshooting

### Providing Feedback to Copilot

When reviewing Copilot's work:
- Comment on the PR with `@copilot` mentions for specific feedback
- Be specific about what needs to change and why
- Reference files and line numbers when possible
- Copilot will iterate based on your feedback

### Common Issues & Solutions

1. **Build Failures**
   - Check if failure is related to your changes or pre-existing
   - Review build logs carefully
   - Run builds locally before pushing: `npm run build` in relevant project directory

2. **Test Failures**
   - Verify tests pass before your changes: establish baseline
   - Focus on tests related to your modifications
   - Don't remove tests to make them pass - fix the underlying issue

3. **Linting Issues**
   - Use existing linters: ESLint for TypeScript/JavaScript
   - Follow the repository's established code style
   - Don't disable linting rules without good reason

4. **Documentation Out of Sync**
   - Update documentation when changing APIs or behavior
   - Follow the versioning system: `vYWW` format
   - Never create new documentation without explicit authorization

### Quality Standards

Before marking work as complete:
- [ ] Code builds without errors
- [ ] Tests pass (at minimum, tests related to your changes)
- [ ] Linting passes
- [ ] Security scan passes (CodeQL)
- [ ] Code review feedback addressed
- [ ] Documentation updated if APIs/behavior changed
- [ ] Changes manually verified (screenshots for UI, logs for CLI)

## References

- **Documentation Index:** `docs/ACTIVE_DOCUMENTATION_INDEX.md`
- **Project Policies:** `docs/GENERAL_GUIDE_PROJECT_POLICIES.md`
- **Change Log:** `docs/PROJECT_CHANGE_LOG.md`
- **Main README:** `README.md`
- **Cyrano README:** `Cyrano/README.md`
