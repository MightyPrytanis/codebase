---
Document ID: README
Title: Arkiver Application
Subject(s): Arkiver
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

Standalone document processing and insight extraction application.

## Architecture

- **Frontend**: React application with full UI matching Base44 Arkiver-MJ functionality
- **Backend**: Uses Cyrano MCP tools via HTTP bridge (processing logic in `Cyrano/src/modules/arkiver/`)

## Status

- ✅ Frontend complete with all pages (Dashboard, Extractor, Insights, AI Integrity, Assistant, Settings, Visualizations)
- ✅ API client for Cyrano MCP integration
- ✅ Styling matches LexFiat design system
- ⏳ Dependencies need to be installed (`npm install` in frontend directory)

## Pages

1. **Dashboard** - Overview of files, processing status, and insights
2. **Extractor** - File upload and processing with configurable extraction settings
3. **Insights** - Search, filter, and explore extracted insights
4. **AI Integrity** - Run integrity tests (opinion drift, bias, honesty, compliance)
5. **AI Assistant** - Interactive chat assistant with context from insights
6. **Settings** - User account, alerts, export, and data management
7. **Visualizations** - Timeline, topics, sources, and network views

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Integration with Cyrano

Arkiver uses Cyrano MCP tools via HTTP bridge:
- `arkiver_process_file` - Process uploaded files
- `arkiver_job_status` - Check processing status
- `arkiver_store_insight` - Store extracted insights
- `arkiver_query_insights` - Query and filter insights
- `arkiver_integrity_test` - Run AI integrity tests

## API Endpoints

- `POST /api/arkiver/upload` - Upload files
- `GET /api/arkiver/files/:fileId` - Get file status

## Environment Variables

- `VITE_CYRANO_API_URL` - Cyrano HTTP bridge URL (default: http://localhost:5002)
