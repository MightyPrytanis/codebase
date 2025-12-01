---
Document ID: ARKIVERMJ-SPECS
Title: ArkiverMJ Technical Specifications
Subject(s): Arkiver
Project: Cyrano
Version: v505
Created: 2025-01-27 (2025-W05)
Last Substantive Revision: 2025-01-27 (2025-W05)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-01-27  
**Based on:** Base44 Arkiver specifications and MCP Interface Contract  
**Status:** Active Development

---

## Executive Summary

ArkiverMJ is a comprehensive document processing and insight extraction system for legal professionals. It provides file upload, extraction, processing, and AI integrity monitoring capabilities through an MCP-compliant interface.

**Key Features:**
- Multi-format file extraction (PDF, DOCX, text, email)
- Intelligent processing pipeline (text, entities, insights, timeline, citations)
- AI integrity testing and monitoring
- Customizable dashboards
- MCP-compliant tool interface

---

## Architecture Overview

### System Components

```
ArkiverMJ
├── Backend (TypeScript/Node.js)
│   ├── MCP Tools Layer
│   │   ├── arkiver_process_file
│   │   └── arkiver_job_status
│   ├── Module Layer
│   │   ├── Extractors (PDF, DOCX, text, email)
│   │   ├── Processors (text, entity, insight, timeline, email)
│   │   ├── Storage (local filesystem)
│   │   └── Queue (database-based async jobs)
│   └── Database Schema (Drizzle ORM)
│       ├── arkiver_files
│       ├── arkiver_insights
│       ├── arkiver_jobs
│       ├── arkiver_integrity_tests
│       └── arkiver_dashboards
└── Frontend (React/TypeScript) - Future
    ├── File Upload Interface
    ├── Dashboard
    ├── Insights Browser
    └── AI Integrity Tools
```

---

## Data Model

### Core Entities

#### 1. UploadedFile (`arkiver_files`)

**Purpose:** Tracks all files uploaded for processing

**Key Fields:**
- `id`: UUID primary key
- `filename`: Original filename
- `fileType`: 'pdf', 'docx', 'txt', 'eml', etc.
- `fileSize`: Size in bytes
- `storagePath`: Filesystem path
- `status`: 'uploaded', 'queued', 'processing', 'completed', 'failed'
- `processingProgress`: 0-100
- `sourceLLM`: Which LLM generated this (if applicable)
- `sourceType`: 'legal_document', 'conversation', 'email', etc.
- `extractionSettings`: Processing configuration (JSONB)
- `fileSummary`: AI-generated summary
- `insightCount`: Number of insights extracted

**Relationships:**
- One-to-many with `arkiver_insights`
- One-to-many with `arkiver_jobs`

#### 2. Insight (`arkiver_insights`)

**Purpose:** Stores extracted insights from files

**Key Fields:**
- `id`: UUID primary key
- `fileId`: Reference to source file
- `title`: Brief title/summary
- `type`: 'citation', 'entity', 'date', 'topic', 'summary', etc.
- `content`: The extracted insight text
- `context`: Surrounding context
- `entities`: Extracted entities object (JSONB)
- `citations`: Array of citations (JSONB)
- `caseId`: Optional LexFiat integration
- `confidence`: 0.0-1.0 confidence score
- `relevance`: 0.0-1.0 relevance score
- `tags`: User-defined or auto-generated tags
- `category`: High-level category
- `source`: 'system', 'llm:gpt4', 'llm:claude', 'user'
- `pageNumber`: Page where insight was found
- `position`: Document position (start, end, line)
- `structuredData`: Type-specific structured data (JSONB)

**Relationships:**
- Many-to-one with `arkiver_files`

#### 3. Job (`arkiver_jobs`)

**Purpose:** Tracks async processing jobs

**Key Fields:**
- `id`: UUID primary key
- `fileId`: Reference to file being processed
- `type`: 'file_extraction', 'insight_processing', 'integrity_test', etc.
- `status`: 'queued', 'processing', 'completed', 'failed', 'cancelled'
- `progress`: 0-100
- `config`: Job configuration (JSONB)
- `result`: Job results (JSONB)
- `error`: Error details if failed (JSONB)
- `attempts`: Number of retry attempts
- `maxAttempts`: Maximum retries (default: 3)

**Relationships:**
- Many-to-one with `arkiver_files`

#### 4. IntegrityTest (`arkiver_integrity_tests`)

**Purpose:** Stores AI integrity monitoring test results

**Key Fields:**
- `id`: UUID primary key
- `testName`: Name of the test
- `testType`: 'opinion_drift', 'bias_detection', 'honesty_assessment', 'ten_rules_compliance'
- `targetLLM`: LLM being tested
- `topic`: Topic being tested (for opinion drift)
- `score`: Overall score (0.0-1.0)
- `driftScore`: Opinion drift score (if applicable)
- `biasIndicators`: Detected biases (JSONB)
- `findings`: Human-readable findings
- `aiAnalysis`: LLM-generated analysis
- `recommendations`: Suggested actions (JSONB)
- `alertTriggered`: Whether alert was triggered
- `alertLevel`: 'info', 'warning', 'critical'

#### 5. Dashboard (`arkiver_dashboards`)

**Purpose:** User-customizable dashboards

**Key Fields:**
- `id`: UUID primary key
- `name`: Dashboard name
- `description`: Dashboard description
- `userId`: Owner user ID
- `isDefault`: Whether this is the default dashboard
- `widgets`: Array of widget configurations (JSONB)
- `layout`: Layout type ('grid', 'flex', 'custom')

---

## Processing Pipeline

### Extraction Modes

1. **Standard** (default)
   - Balanced extraction depth
   - Standard entity recognition
   - Basic citation extraction
   - Estimated time: 30-60 seconds per file

2. **Deep**
   - Comprehensive extraction
   - Advanced entity recognition
   - Full citation validation
   - Timeline reconstruction
   - Estimated time: 2-5 minutes per file

3. **Fast**
   - Quick scan mode
   - Basic extraction only
   - Minimal processing
   - Estimated time: 10-20 seconds per file

### Processing Steps

1. **File Upload**
   - File stored in local filesystem
   - Metadata recorded in database
   - Status: 'uploaded'

2. **Job Creation**
   - Async job created
   - Status: 'queued'

3. **Text Extraction**
   - PDF: PDF parser extracts text
   - DOCX: DOCX parser extracts text
   - Text: Direct read
   - Email: Email parser extracts headers and body
   - Status: 'processing'

4. **Text Processing**
   - Word count, sentence analysis
   - Document structure analysis
   - Language detection

5. **Entity Extraction**
   - Named entity recognition
   - People, organizations, locations
   - Dates, money amounts, statutes, cases

6. **Citation Extraction**
   - Legal citation detection
   - Jurisdiction-specific formatting
   - Validation

7. **Timeline Extraction**
   - Temporal event extraction
   - Chronological sorting
   - Gap identification

8. **Insight Generation**
   - Pattern detection
   - Relationship identification
   - Summary generation

9. **Completion**
   - All insights saved
   - File summary generated
   - Status: 'completed'

---

## MCP Tools Interface

### Tool: `arkiver_process_file`

**Purpose:** Initiates processing of an uploaded file

**Input Schema:**
```typescript
{
  fileId: string;              // File ID from upload endpoint
  processingSettings: {
    extractionMode: 'standard' | 'deep' | 'fast';
    enableOCR?: boolean;       // Enable OCR for scanned documents
    categories?: string[];      // Pre-defined categories
    extractCitations?: boolean; // Extract legal citations (default: true)
    extractEntities?: boolean;  // Extract entities (default: true)
    extractTimeline?: boolean; // Extract timeline (default: true)
    caseId?: string;           // Associate with LexFiat case
    jurisdiction?: 'michigan' | 'federal' | 'bluebook' | 'auto';
  };
}
```

**Output:**
```typescript
{
  success: boolean;
  jobId: string;              // Job ID for status checking
  fileId: string;
  status: 'queued';
  message: 'Processing started';
}
```

**Behavior:**
- Validates file exists and is in 'uploaded' status
- Creates async job
- Updates file status to 'processing'
- Returns immediately with job ID
- Processing happens asynchronously

### Tool: `arkiver_job_status`

**Purpose:** Check status of a processing job

**Input Schema:**
```typescript
{
  jobId: string;              // Job ID from arkiver_process_file
}
```

**Output:**
```typescript
{
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;           // 0-100
  fileId: string;
  result?: {
    insightsCreated: number;
    processingTime: number;
    summary: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## Citation Formatting

### Supported Jurisdictions

1. **Michigan**
   - Follows Michigan Appellate Opinions Manual
   - MANDATORY: No periods in abbreviations
   - Example: `People v Smith, 500 NW2d 100 (2020)`

2. **Federal**
   - Follows Federal Court Rules and Bluebook
   - Example: `Smith v. Jones, 500 F.3d 100 (6th Cir. 2020)`

3. **Bluebook**
   - Standard Bluebook format
   - Example: `Smith v. Jones, 500 F.3d 100 (6th Cir. 2020)`

4. **Auto-Detect**
   - Automatically detects jurisdiction from citation content
   - Applies appropriate formatting rules

---

## Base44 Dependencies (Removed)

**Original Base44 Dependencies:**
- `base44.entities.*` - Entity CRUD operations
- `base44.auth.*` - Authentication
- `base44.integrations.Core.*` - AI integrations

**MCP Replacement:**
- Database operations via Drizzle ORM
- Authentication via Cyrano auth system
- AI integrations via Cyrano AI service

---

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# File Storage
ARKIVER_STORAGE_PATH=/path/to/storage

# Processing
ARKIVER_MAX_FILE_SIZE=104857600  # 100MB
ARKIVER_ENABLE_OCR=true
ARKIVER_DEFAULT_EXTRACTION_MODE=standard

# Job Queue
ARKIVER_JOB_TIMEOUT=3600000  # 1 hour
ARKIVER_MAX_RETRIES=3
```

### Extraction Settings

```typescript
interface ExtractionSettings {
  extractionMode: 'standard' | 'deep' | 'fast';
  enableOCR?: boolean;
  categories?: string[];
  extractCitations?: boolean;
  extractEntities?: boolean;
  extractTimeline?: boolean;
  caseId?: string;
  jurisdiction?: 'michigan' | 'federal' | 'bluebook' | 'auto';
}
```

---

## Integration Points

### With LexFiat
- Case association via `caseId` field
- Shared citation formatter
- Shared verification tools

### With Potemkin Engine
- Uses shared verification tools
- Citation checker integration
- Claim extractor integration

### With MCP Server
- All tools registered via MCP
- Accessible via stdio and HTTP bridges
- Full MCP protocol compliance

---

## Future Enhancements

1. **OCR Support**
   - Scanned document processing
   - Image text extraction

2. **Advanced Entity Recognition**
   - Relationship extraction
   - Entity linking

3. **Semantic Search**
   - Vector embeddings
   - Similarity search

4. **Real-time Processing**
   - WebSocket updates
   - Progress streaming

5. **Cloud Storage**
   - S3 integration
   - Multi-region support

---

## Status

✅ **Complete:**
- Database schema
- File storage (local filesystem)
- Job queue (database-based)
- PDF/DOCX extractors
- All 5 processors
- Citation formatter
- MCP integration

🟡 **In Progress:**
- Frontend integration
- End-to-end testing
- Performance optimization

📋 **Planned:**
- OCR implementation
- Advanced entity recognition
- Semantic search
- Cloud storage

---

**Last Updated:** 2025-01-27  
**Maintainer:** Cyrano Development Team


