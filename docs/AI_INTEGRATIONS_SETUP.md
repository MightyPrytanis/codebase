# AI Integrations Setup Guide

**Date:** 2025-12-21  
**Status:** ✅ Complete  
**Providers:** Perplexity, OpenRouter (ready), Clio API (structure ready)  
**Note:** MiFile integration removed - replaced with MiCourt (light footprint, user-initiated queries only)

---

## Overview

AI integrations have been configured to use:
1. **Perplexity API** - Already integrated, uses existing `PERPLEXITY_API_KEY`
2. **OpenRouter** - New integration added, uses `OPENROUTER_API_KEY` (OpenAI-compatible)
3. **Clio API** - Service structure created, ready for API key

---

## Perplexity Integration

### Status: ✅ Already Integrated

Perplexity is already fully integrated in the codebase:
- Service: `Cyrano/src/services/perplexity.ts`
- Used by: `ai-service.ts`, `document-analyzer.ts`, `goodcounsel.ts`, `red-flag-finder.ts`
- Environment Variable: `PERPLEXITY_API_KEY` (must start with `pplx-`)

### Usage

The Perplexity service is automatically used when:
- `PERPLEXITY_API_KEY` is set in environment variables
- Tools default to Perplexity for real-time data tasks
- Multi-model orchestration prefers Perplexity for fact-checking

---

## OpenRouter Integration

### Status: ✅ Newly Added

OpenRouter has been added as a new AI provider option:
- Service: `Cyrano/src/services/openrouter.ts`
- Integration: Added to `ai-service.ts` and `api-validator.ts`
- Environment Variable: `OPENROUTER_API_KEY`

### Setup

1. **Get OpenRouter API Key:**
   - Sign up at https://openrouter.ai
   - Get your API key from the dashboard

2. **Set Environment Variable:**
   ```bash
   export OPENROUTER_API_KEY="your_api_key_here"
   ```
   Or add to `.env`:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Optional Configuration:**
   ```bash
   SITE_URL=https://cyrano.legal  # For leaderboard ranking
   SITE_NAME=Cyrano Legal AI      # For leaderboard ranking
   ```

### Available Models

OpenRouter provides access to many models. Free models available:
- `google/gemma-2-9b-it:free` (default free model)
- `mistralai/mistral-7b-instruct:free`

Paid models (low cost):
- `google/gemini-2.0-flash-001`
- `mistralai/mistral-7b-instruct`
- `meta-llama/llama-3-8b-instruct`

High performance models:
- `openai/gpt-4o`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro`

See https://openrouter.ai/models for full list.

### Usage

OpenRouter is now available as a provider option:
- In AI service: `aiService.call('openrouter', prompt, options)`
- In tools: Specify `ai_provider: 'openrouter'` in tool calls
- Default model: Uses free model if no model specified

### Implementation Details

- Uses OpenAI SDK (OpenRouter is OpenAI-compatible)
- Automatically includes HTTP-Referer and X-Title headers for leaderboard ranking
- Supports all OpenAI-compatible features (streaming, temperature, etc.)

---

## Clio API Integration

### Status: ✅ Structure Ready (Awaiting API Key)

A comprehensive Clio API service has been created:
- Service: `Cyrano/src/services/clio-api.ts`
- MCP-compliant structure
- Ready for OAuth or API key authentication

### Setup (When API Key Available)

1. **Get Clio API Access:**
   - Apply for Clio API access at https://www.clio.com/api/
   - Complete OAuth setup or get API key

2. **Set Environment Variables:**
   ```bash
   # Option 1: API Key (if available)
   export CLIO_API_KEY="your_api_key_here"
   
   # Option 2: OAuth (recommended)
   export CLIO_ACCESS_TOKEN="your_access_token"
   export CLIO_REFRESH_TOKEN="your_refresh_token"
   export CLIO_REGION="US"  # US, CA, EU, or AU
   ```

3. **OAuth Setup (if using OAuth):**
   ```bash
   export CLIO_CLIENT_ID="your_client_id"
   export CLIO_CLIENT_SECRET="your_client_secret"
   ```

### Available Endpoints

The Clio API service provides methods for:

- **Matters:**
  - `listMatters()` - List all matters with filtering
  - `getMatter(id)` - Get specific matter
  - `createMatter(matter)` - Create new matter

- **Contacts:**
  - `listContacts()` - List contacts (Person/Company)

- **Activities:**
  - `listActivities()` - List time entries and expenses
  - `createActivity(activity)` - Create time entry or expense

- **Tasks:**
  - `listTasks()` - List tasks with filtering

- **Documents:**
  - `listDocuments()` - List documents with filtering

- **Bills:**
  - `listBills()` - List bills with filtering

### Features

- **Rate Limiting:** Automatically tracks and respects Clio rate limits (50 req/min default)
- **Field Selection:** Automatically includes required `fields` parameter
- **Pagination:** Supports cursor-based pagination for large datasets
- **Regional Support:** Handles US, CA, EU, AU regions
- **Error Handling:** Comprehensive error handling with clear messages

### Integration with Existing Clio Tool

The existing `clio-integration.ts` tool can be updated to use `ClioAPIService` when the API key is available. Currently it uses mock data as a fallback.

---

## Provider Priority

When multiple providers are available, the system prioritizes:

1. **Perplexity** - For real-time data, fact-checking, web search tasks
2. **OpenRouter** - For general tasks, cost-effective options, free models
3. **Other providers** - As fallbacks or for specific use cases

---

## Environment Variables Summary

```bash
# Perplexity (already configured)
PERPLEXITY_API_KEY=pplx-...

# OpenRouter (new)
OPENROUTER_API_KEY=sk-or-...
SITE_URL=https://cyrano.legal  # Optional
SITE_NAME=Cyrano Legal AI        # Optional

# Clio (ready for key)
CLIO_API_KEY=...                 # When available
CLIO_ACCESS_TOKEN=...            # OAuth option
CLIO_REFRESH_TOKEN=...           # OAuth option
CLIO_REGION=US                   # US, CA, EU, AU
CLIO_CLIENT_ID=...               # OAuth setup
CLIO_CLIENT_SECRET=...           # OAuth setup
```

---

## Testing

### Test Perplexity
```typescript
import { aiService } from './services/ai-service.js';
const result = await aiService.call('perplexity', 'What is the capital of France?');
```

### Test OpenRouter
```typescript
import { aiService } from './services/ai-service.js';
const result = await aiService.call('openrouter', 'What is the capital of France?', {
  model: 'google/gemma-2-9b-it:free'
});
```

### Test Clio (when key available)
```typescript
import { ClioAPIService } from './services/clio-api.js';
const clio = new ClioAPIService({
  apiKey: process.env.CLIO_API_KEY,
  region: 'US'
});
const matters = await clio.listMatters({ limit: 10 });
```

---

## Next Steps

1. ✅ Perplexity - Already working, no action needed
2. ✅ OpenRouter - Ready to use, just add API key
3. ⏳ Clio - Structure ready, waiting for API key/access approval

---

**Last Updated:** 2025-12-21
