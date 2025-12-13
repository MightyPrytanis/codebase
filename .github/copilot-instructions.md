# GitHub Copilot Instructions for Cyrano Ecosystem

## Repository Overview

This is a monorepo consolidating all components of the Cyrano ecosystem - a legal workflow intelligence platform with AI orchestration capabilities.

**Repository:** [MightyPrytanis/codebase](https://github.com/MightyPrytanis/codebase)  
**Project Start:** July 2025  
**License:** Apache License 2.0  
**Copyright:** © 2025 Cognisint LLC

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

## References

- **Documentation Index:** `docs/ACTIVE_DOCUMENTATION_INDEX.md`
- **Project Policies:** `docs/GENERAL_GUIDE_PROJECT_POLICIES.md`
- **Change Log:** `docs/PROJECT_CHANGE_LOG.md`
- **Main README:** `README.md`
- **Cyrano README:** `Cyrano/README.md`
