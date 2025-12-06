# SwimMeet Transfer Package - Complete Documentation

## Project Export Contents
- **Source Code**: Complete React/Express application
- **Database Schema**: PostgreSQL with Drizzle ORM
- **Assets**: All logos, icons, and project files
- **Configuration**: Complete build and deployment setup

## Transfer Package Location
File: `swimeet-transfer-YYYYMMDD-HHMMSS.tar.gz`

## What Works (Verified)
✅ User authentication and registration
✅ Multi-AI provider connections (OpenAI, Anthropic, Gemini, Perplexity)
✅ DIVE mode multi-AI querying
✅ File upload system with local storage
✅ Response rating and statistics
✅ Professional UI with SwimMeet branding
✅ Database persistence for all data

## Known Issues
❌ TURN escalation system UI display broken
❌ Some AI providers need API keys (DeepSeek, Grok, Mistral)

## Environment Variables Needed
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=pplx-...
SESSION_SECRET=your-secret
```

## Quick Start After Transfer
1. Extract: `tar -xzf swimeet-transfer-*.tar.gz`
2. Install: `npm install`
3. Setup environment: Copy `.env.example` to `.env` and add keys
4. Database: `npm run db:push`
5. Start: `npm run dev`

## Complete Codebase Structure
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Express + TypeScript + PostgreSQL
- Build: Vite + ESBuild
- Auth: JWT + bcrypt
- Storage: Local filesystem (primary), cloud ready

## Data Export
All user data, conversations, and responses are stored in PostgreSQL database.
Export using standard pg_dump commands.

Package created for complete project transfer away from Replit platform.