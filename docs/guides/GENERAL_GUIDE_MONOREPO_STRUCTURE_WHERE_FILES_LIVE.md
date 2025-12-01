---
Document ID: MONOREPO-STRUCTURE-CLARIFICATION
Title: Monorepo Structure: Where Files Live
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-11-26  
**Purpose:** Clarify where shared and UI code lives in the monorepo

---

## Architecture Overview

**Cyrano** = MCP Server that hosts tools  
**LexFiat** = App that uses Cyrano tools  
**Arkiver** = App that uses Cyrano tools

---

## Where Files Live

### 1. Cyrano (MCP Server)
**Location:** `packages/cyrano/`

**Contains:**
- MCP tools (`src/tools/`)
- Modules (`src/modules/`)
- Engines (`src/engines/`)
- Services (`src/services/`)
- Cyrano's own schema (`src/schema.ts`)
- Utilities (`src/utils/`)

**Purpose:** Hosts and exposes tools via MCP protocol

---

### 2. Shared Code
**Location:** `packages/shared/`

**Contains:**
- **Types** - TypeScript types/interfaces used by:
  - Cyrano tools (tool input/output types)
  - Apps (when calling Cyrano tools)
  - Common data structures
- **Utils** - Utilities used by:
  - Cyrano tools
  - Apps
  - Common helper functions

**Examples:**
- Tool interface types
- Common data models
- Shared validation utilities
- Common error types

**NOT in shared:**
- Database schemas (each app has its own)
- App-specific types
- Cyrano-specific utilities

---

### 3. Shared UI Components
**Location:** `packages/ui/` (optional)

**Contains:**
- React components used by BOTH LexFiat AND Arkiver
- Design system components
- Common UI patterns

**Examples:**
- Shared button components
- Shared form components
- Shared layout components

**Note:** This is OPTIONAL. If LexFiat and Arkiver have different UIs, this may be empty or not needed.

**Current Status:** LexFiat has its own UI components in `LexFiat/client/src/components/ui/`. Arkiver UI doesn't exist yet. Shared UI may not be needed initially.

---

### 4. Apps
**Location:** `apps/LexFiat/` and `apps/Arkiver/`

**Each app contains:**
- Its own database schema (app-specific)
- Its own UI components (unless using shared UI)
- Its own app logic
- Its own configuration

**LexFiat:**
- Schema: `apps/LexFiat/shared/schema.ts` (or similar)
- UI: `apps/LexFiat/client/src/components/`
- Calls Cyrano tools via MCP

**Arkiver:**
- Schema: `apps/Arkiver/src/schema.ts` (or similar)
- UI: `apps/Arkiver/frontend/src/components/` (when created)
- Calls Cyrano tools via MCP

---

## Current Reality vs. Monorepo Structure

### Current Structure:
```
codebase/
├── Cyrano/          # MCP server
│   └── src/
│       ├── schema.ts  # Cyrano schema
│       └── tools/     # Tools
├── LexFiat/         # App
│   └── shared/
│       └── schema.ts  # LexFiat schema
└── arkivermj/        # Old Base44 app
```

### Target Monorepo Structure:
```
codebase/
├── packages/
│   ├── cyrano/       # MCP server
│   │   └── src/
│   │       ├── schema.ts  # Cyrano schema (stays here)
│   │       └── tools/     # Tools
│   ├── shared/       # Shared types/utils (NEW - may be minimal initially)
│   │   ├── types/
│   │   └── utils/
│   └── ui/           # Shared UI (OPTIONAL - may be empty initially)
│       └── components/
└── apps/
    ├── LexFiat/      # App
    │   └── shared/
    │       └── schema.ts  # LexFiat schema (stays in app)
    └── Arkiver/       # App (when created)
        └── src/
            └── schema.ts  # Arkiver schema (stays in app)
```

---

## Key Points

1. **Cyrano hosts tools** - Tools live in `packages/cyrano/src/tools/`
2. **Shared code** - Only code used by Cyrano AND apps goes in `packages/shared/`
3. **App schemas** - Each app keeps its own schema (not in shared)
4. **Shared UI** - Only if both apps actually share components (may not be needed)
5. **Cyrano has no UI** - It's a server, not an app

---

## What Goes Where

| Type of Code | Location | Example |
|--------------|----------|---------|
| MCP Tools | `packages/cyrano/src/tools/` | `document-analyzer.ts` |
| Cyrano Schema | `packages/cyrano/src/schema.ts` | Users table |
| Shared Types | `packages/shared/types/` | Tool input/output types |
| Shared Utils | `packages/shared/utils/` | Common helpers |
| LexFiat Schema | `apps/LexFiat/shared/schema.ts` | Cases, documents |
| LexFiat UI | `apps/LexFiat/client/src/components/` | Dashboard components |
| Arkiver Schema | `apps/Arkiver/src/schema.ts` | Files, insights |
| Arkiver UI | `apps/Arkiver/frontend/src/components/` | (when created) |
| Shared UI | `packages/ui/components/` | (if both apps use same components) |

---

**Summary:** Shared code lives in `packages/shared/` (types/utils), shared UI in `packages/ui/` (if needed). Each app keeps its own schema and most UI components.

