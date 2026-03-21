# SwimMeet — Competitive AI Document Drafting

A standalone multi-model AI document writing app with multi-stage workflow orchestration. Connected to Cyrano's MAE (Multi-Agent Engine).

## Overview

SwimMeet lets you pit multiple AI models against each other using six distinct workflow types:

| Workflow | Description |
|---|---|
| **Head-to-Head (Parallel)** | All models run the same prompt simultaneously — maximum diversity |
| **Relay** | Sequential chain: M1 drafts → M2 refines → M3 polishes, etc. |
| **Committee** | Parallel drafts → synthesizer combines the best elements |
| **Critique Round** | Parallel draft → rotating cross-critique → synthesizer revises |
| **EBOM Pipeline** | Synthesizer creates brief → models draft → synthesizer combines → models critique → final revision |
| **Expert Panel** | Each model gets an expert persona → synthesizer combines all perspectives |

## Architecture

```
apps/mae-client/
├── backend/        # Express API (port 5003)
│   └── src/
│       ├── index.ts              # Server entry point
│       ├── version-control.ts    # In-memory document store
│       ├── workflow-engine.ts    # Multi-stage workflow orchestration
│       └── routes/
│           ├── documents.ts      # Document CRUD
│           ├── generate.ts       # Simple multi-model generation (proxies to Cyrano)
│           └── workflow.ts       # Workflow run endpoint
└── frontend/       # React 19 + Vite SPA (port 5174)
    └── src/
        ├── App.tsx
        ├── lib/api.ts                    # Typed API client
        ├── pages/
        │   └── DocumentList.tsx          # Document list page
        └── components/
            ├── DocumentEditor.tsx        # Main editing interface
            ├── ModelSelector.tsx         # AI model selector
            ├── VersionPanel.tsx          # Version history and comparison
            ├── WorkflowSelector.tsx      # Workflow type picker
            └── WorkflowStagePanel.tsx    # Workflow stage timeline display
```

## Quick Start

### Prerequisites

- Cyrano HTTP bridge running (`npm run http` in `Cyrano/`) — default port 5002
- Node.js 20+

### Backend

```bash
cd apps/mae-client/backend
npm install
npm run dev     # starts on port 5003
```

Environment variables (optional):
```
SWIM_MEET_PORT=5003          # or MAE_CLIENT_PORT for backward compat
CYRANO_URL=http://localhost:5002
```

### Frontend

```bash
cd apps/mae-client/frontend
npm install
npm run dev     # starts on port 5174
```

Then open http://localhost:5174

## Workflow API

`POST /api/workflow/run`

```json
{
  "documentId": "...",
  "prompt": "Draft a settlement agreement...",
  "models": [{ "provider": "openai", "model": "gpt-4o" }, { "provider": "anthropic", "model": "claude-3-5-sonnet-20241022" }],
  "synthesizer": { "provider": "openai", "model": "gpt-4o" },
  "workflowType": "committee",
  "anonymize": false
}
```

Returns `{ stages: WorkflowStage[] }` where each stage contains outputs from all models at that step.

## Cyrano Integration

The backend proxies to Cyrano's HTTP bridge:

- `POST /api/mae/write` — Single model generation
- `POST /api/mae/write/multi` — Parallel multi-model generation

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 3, Radix UI, TanStack Query
- **Backend:** Express 5, TypeScript, Zod validation
- **Storage:** In-memory (suitable for local use; can be extended to a database)

## Copyright

Copyright 2025 Cognisint LLC  
Licensed under the Apache License, Version 2.0
