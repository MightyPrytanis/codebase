# Library + RAG Onboarding Guide

**Version:** v551  
**Created:** 2025-12-15 (2025-50)  
**Last Updated:** 2025-12-15 (2025-50)  
**Status:** Active

## Overview

The Library + RAG Onboarding system provides a comprehensive legal document management and retrieval system integrated with the Cyrano RAG (Retrieval-Augmented Generation) engine. It enables law firms to manage jurisdiction-specific legal resources, templates, and playbooks with AI-powered search and retrieval.

## System Components

### Backend Components

1. **Library Models** (`Cyrano/src/modules/library/library-model.ts`)
   - `PracticeProfile`: User practice area and jurisdiction settings
   - `LibraryLocation`: Storage connector configuration (local, OneDrive, Google Drive, S3)
   - `LibraryItem`: Document metadata with legal-specific fields
   - `IngestQueueItem`: RAG ingestion queue management

2. **Library Service** (`Cyrano/src/services/library-service.ts`)
   - CRUD operations for library items, locations, and profiles
   - Ingest queue management
   - Document versioning (superseded items)
   - **Note:** Currently uses in-memory storage (Maps) - requires database migration for production

3. **Storage Connectors** (`Cyrano/src/modules/library/connectors/`)
   - `local.ts`: Local filesystem scanning
   - `onedrive.ts`: Microsoft OneDrive integration
   - `gdrive.ts`: Google Drive integration
   - `s3.ts`: AWS S3 integration
   - **Status:** Stub implementations - require API integration

4. **RAG Integration**
   - `rag-library.ts`: Library-specific RAG ingestion with metadata
   - `rag-service.ts`: Extended with filters for county, court, judge, issue tags, effective dates
   - `vector-store.ts`: Extended metadata support for legal documents

5. **Jobs & Automation**
   - `library-ingest-worker.ts`: Queue processor (extract → classify → tag → ingest)
   - `nightly-library-refresh.ts`: Scheduled sync and cleanup
   - `cron-nightly-library-refresh.sh`: Cron wrapper script

6. **API Endpoints** (`Cyrano/src/routes/library.ts`)
   ```
   POST /api/onboarding/practice-profile  - Create/update practice profile
   GET  /api/onboarding/practice-profile  - Get practice profile
   POST /api/library/locations            - Add/update storage location
   GET  /api/library/locations            - List storage locations
   GET  /api/library/items                - List library items (with filters)
   GET  /api/library/items/:id            - Get single item
   POST /api/library/items/:id/pin        - Toggle pin status
   POST /api/library/items/:id/ingest     - Enqueue for RAG ingestion
   GET  /api/health/library               - Health and statistics
   ```

### Frontend Components

1. **Library Page** (`LexFiat/client/src/pages/library.tsx`)
   - Document listing with filters
   - Source type, county, court, ingested/pinned filters
   - Health status display
   - Pin and ingest actions

2. **API Client** (`LexFiat/client/src/lib/library-api.ts`)
   - Type-safe API functions
   - Practice profile management
   - Library operations (fetch, pin, ingest)
   - Health monitoring

3. **Navigation**
   - Sidebar link with BookOpen icon
   - Dashboard widget/tile
   - Route: `/library`

## Getting Started

### 1. Backend Setup

#### Start Cyrano HTTP Bridge
```bash
cd Cyrano
npm run http
```

The server will start on port 5002 (default) and expose library endpoints.

### 2. Seed Initial Data

Run the Michigan family law seed script:

```bash
cd Cyrano
npx tsx scripts/seed-library.ts [userId]
```

This creates 11 sample library items:
- Michigan Court Rules (MCR-3)
- Wayne, Oakland, Macomb County local rules
- Standing orders
- Templates (complaint, motion, judgment)
- Playbooks (consultation, property division, custody)

### 3. Configure Practice Profile

Use the onboarding endpoint to set up user practice profile:

```bash
curl -X POST http://localhost:5002/api/onboarding/practice-profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default-user",
    "primaryJurisdiction": "Michigan",
    "practiceAreas": ["Family Law"],
    "counties": ["Wayne", "Oakland", "Macomb"],
    "courts": ["Wayne County Circuit Court", "Oakland County Circuit Court"],
    "issueTags": ["divorce", "custody", "parenting-time"],
    "llmProvider": "openai"
  }'
```

### 4. Add Storage Locations

Configure storage connectors:

```bash
curl -X POST http://localhost:5002/api/library/locations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default-user",
    "type": "local",
    "name": "Local Documents",
    "path": "/path/to/legal/documents"
  }'
```

### 5. Access Frontend

Navigate to: `http://localhost:5173/library` (or your LexFiat dev server URL)

## Library Metadata Schema

Library items support comprehensive legal metadata:

```typescript
{
  // File information
  filename: string
  filepath: string
  fileType: string
  fileSize: number
  
  // Document classification
  title: string
  description?: string
  sourceType: 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other'
  
  // Jurisdictional metadata
  jurisdiction?: string     // e.g., "Michigan"
  county?: string          // e.g., "Wayne"
  court?: string           // e.g., "Wayne County Circuit Court"
  judgeReferee?: string    // Specific judge/referee
  
  // Content classification
  issueTags: string[]      // e.g., ["divorce", "custody"]
  practiceAreas: string[]  // e.g., ["Family Law"]
  
  // Date metadata
  effectiveFrom?: Date     // When rule/order became effective
  effectiveTo?: Date       // When rule/order was superseded
  
  // RAG integration
  ingested: boolean        // Whether ingested into RAG
  vectorIds?: string[]     // Vector store IDs
  
  // Status
  pinned: boolean          // User-pinned for quick access
  superseded: boolean      // Replaced by newer version
  supersededBy?: string    // ID of replacement document
}
```

## RAG Query Filters

When querying the RAG system, you can apply library-specific filters:

```typescript
{
  filterBySourceType?: string[]      // ['rule', 'template']
  filterByCounty?: string            // 'Wayne'
  filterByCourt?: string             // 'Wayne County Circuit Court'
  filterByJudgeReferee?: string      // 'Hon. Smith'
  filterByIssueTags?: string[]       // ['divorce', 'custody']
  filterByEffectiveDate?: {
    from?: Date                      // Effective after date
    to?: Date                        // Effective before date
  }
}
```

**Important:** Filters are applied BEFORE taking topK results to ensure precision.

## Scheduled Jobs

### Nightly Library Refresh

Add to crontab for automated syncing:

```bash
# Run at 2 AM daily
0 2 * * * /path/to/Cyrano/scripts/cron-nightly-library-refresh.sh
```

This job:
1. Pulls items from top counties based on practice profile
2. Syncs all enabled storage locations
3. Enqueues new/modified items for ingestion
4. Evicts superseded/expired items

## Production Considerations

### Required Migrations

1. **Database Storage**
   - Convert in-memory Maps to database tables
   - Use existing Drizzle ORM infrastructure
   - Tables needed: `library_items`, `library_locations`, `practice_profiles`, `ingest_queue`

2. **Storage Connector Implementation**
   - Implement actual API integrations for OneDrive, Google Drive, S3
   - Add OAuth flows for cloud storage authentication
   - Implement change detection and delta sync

3. **Document Processing**
   - Integrate actual document extraction (PDF, DOCX parsing)
   - Add AI-based classification and metadata extraction
   - Implement OCR for scanned documents

4. **Authentication & Authorization**
   - Replace `default-user` with actual user IDs from auth system
   - Implement multi-tenant isolation
   - Add role-based access control for library management

5. **Queue Management**
   - Consider Redis or RabbitMQ for production queue
   - Add retry logic and dead-letter queue
   - Implement priority queue processing

## Environment Variables

Required for production:

```bash
# Cyrano HTTP Bridge
PORT=5002
ALLOWED_ORIGINS=https://your-domain.com

# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# Cloud storage (if used)
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Database
DATABASE_URL=postgresql://...
```

## Monitoring

Health endpoint: `GET /api/health/library`

Returns:
```json
{
  "status": "healthy",
  "totalItems": 150,
  "ingestedItems": 145,
  "pendingIngestion": 5,
  "lastSyncAt": "2025-12-15T09:00:00Z",
  "lastError": null,
  "queueDepth": 5
}
```

## Troubleshooting

### Items not appearing in library
1. Check health endpoint for errors
2. Verify storage location is enabled
3. Check connector logs in console
4. Ensure file paths are accessible

### RAG search not returning items
1. Verify items are ingested (`ingested: true`)
2. Check if filters are too restrictive
3. Ensure OPENAI_API_KEY is set for embeddings
4. Check vector store has documents

### Ingest queue stuck
1. Check library-ingest-worker logs
2. Verify document files are accessible
3. Check if max retries exceeded
4. Restart ingest worker

## Future Enhancements

- [ ] AI-powered metadata extraction from documents
- [ ] Automatic classification by document type
- [ ] Smart recommendations based on practice profile
- [ ] Cross-reference detection between documents
- [ ] Version control and diff views
- [ ] Collaborative annotations
- [ ] Export to practice management systems
- [ ] Mobile app integration
- [ ] Real-time sync notifications

## Support

For issues or questions:
- Check logs: `Cyrano/logs/nightly-library-refresh-*.log`
- Review health endpoint for errors
- Contact: Cyrano development team

---

**Copyright © 2025 Cognisint LLC**  
Licensed under the Apache License, Version 2.0
