# MAE Document Writer — Thin Client

A lightweight standalone web application for writing documents using multiple AI models simultaneously. Connected to Cyrano's MAE (Multi-Agent Engine).

## Overview

The MAE Document Writer lets you:

- Write documents iteratively using different AI models (OpenAI GPT-4o, Claude 3.5 Sonnet, etc.)
- Generate multiple versions of the same content in parallel
- Compare different versions side by side
- Maintain document history and version control
- Export content for further use

This is modeled after the multi-model document drafting process used to create technical specifications (like the EBOM spec) — where you send the same prompt to several models and compare/merge the results.

## Architecture

```
apps/mae-client/
├── backend/        # Express API (port 5003)
│   └── src/
│       ├── index.ts            # Server entry point
│       ├── version-control.ts  # In-memory document store
│       └── routes/
│           ├── documents.ts    # Document CRUD
│           └── generate.ts     # Multi-model generation (proxies to Cyrano)
└── frontend/       # React 19 + Vite SPA (port 5174)
    └── src/
        ├── App.tsx
        ├── lib/api.ts              # Typed API client
        ├── pages/
        │   └── DocumentList.tsx    # Document list page
        └── components/
            ├── DocumentEditor.tsx  # Main editing interface
            ├── ModelSelector.tsx   # AI model selector
            └── VersionPanel.tsx    # Version history and comparison
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
MAE_CLIENT_PORT=5003
CYRANO_URL=http://localhost:5002
```

### Frontend

```bash
cd apps/mae-client/frontend
npm install
npm run dev     # starts on port 5174
```

Then open http://localhost:5174

## Cyrano Integration

The backend proxies document generation requests to Cyrano's HTTP bridge:

- `POST /api/mae/write` — Single model generation
- `POST /api/mae/write/multi` — Parallel multi-model generation
- `GET /api/mae/models` — Available models list

These endpoints are registered on the Cyrano HTTP bridge (`Cyrano/src/http-bridge.ts`).

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 3, Radix UI, TanStack Query
- **Backend:** Express 5, TypeScript, Zod validation
- **Storage:** In-memory (suitable for local use; can be extended to a database)

## Copyright

Copyright 2025 Cognisint LLC  
Licensed under the Apache License, Version 2.0
