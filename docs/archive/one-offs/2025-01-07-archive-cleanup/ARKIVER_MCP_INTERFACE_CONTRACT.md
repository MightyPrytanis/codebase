# Arkiver MCP Interface Contract
**Created:** 2025-11-22  
**Status:** DRAFT - Awaiting Approval  
**Purpose:** Define the interface between Cyrano MCP Server and Arkiver application  
**Version:** 1.0

---

## Naming Convention

**Important:** This document uses "ArkiverMJ" as the development/internal name for the application. The "MJ" suffix was used to distinguish the Base44 version from the Labs prototype. **The production version will be called "Arkiver"** (without the "MJ" suffix). During development, either name may be used, but the eventual switchover to "Arkiver" for production is acknowledged.

---

## Executive Summary

This document defines the complete interface contract for integrating Arkiver (development name: ArkiverMJ) with Cyrano's MCP server. The contract includes:

1. **File Upload Protocol** (HTTP endpoint, separate from MCP)
2. **MCP Tool Definitions** (synchronous operations)
3. **Async Job Pattern** (for long-running operations)
4. **Error Handling** (standardized responses)
5. **Authentication** (how Arkiver authenticates to Cyrano)

**Critical Design Decisions:**
- File uploads use HTTP endpoints (not MCP tools) due to size limitations
- Long-running operations use async job pattern with status polling
- All MCP tools return standardized JSON responses
- TypeScript-first implementation (no Python bridge needed)

---

## 1. File Upload Protocol

### 1.1 Upload Endpoint

**Endpoint:** `POST /api/arkiver/upload`

**Purpose:** Upload files to Cyrano for processing by ArkiverMJ

**Request:**
```typescript
// Content-Type: multipart/form-data
FormData {
  file: File,                    // The file to upload
  metadata?: {                    // Optional metadata
    caseId?: string,              // Associate with LexFiat case
    tags?: string[],              // Initial tags
    description?: string          // User-provided description
  }
}
```

**Response:**
```typescript
{
  success: true,
  fileId: string,                 // Unique identifier for the file
  fileName: string,               // Original filename
  fileSize: number,               // Size in bytes
  mimeType: string,              // Detected MIME type
  uploadedAt: string,            // ISO 8601 timestamp
  status: 'uploaded'             // Initial status
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: string,                 // Error code (see Error Codes section)
    message: string,              // Human-readable message
    details?: any                 // Additional error details
  }
}
```

**Supported File Types:**
- PDF documents (`.pdf`)
- Word documents (`.docx`, `.doc`)
- Text files (`.txt`, `.md`)
- Email files (`.eml`, `.msg`)
- Images for OCR (`.png`, `.jpg`, `.jpeg`, `.tiff`)

**File Size Limits:**
- Maximum file size: 100 MB per file
- Maximum batch size: 500 MB total

**Rate Limiting:**
- 10 uploads per minute per user
- 100 uploads per hour per user

---

### 1.2 File Status Endpoint

**Endpoint:** `GET /api/arkiver/files/:fileId`

**Purpose:** Check upload status and retrieve file metadata

**Response:**
```typescript
{
  success: true,
  file: {
    fileId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    uploadedAt: string,
    status: 'uploaded' | 'processing' | 'processed' | 'failed',
    processingJobId?: string,    // If processing has started
    error?: string                // If status is 'failed'
  }
}
```

---

## 2. MCP Tool Definitions

### 2.1 Process File (Async Job Pattern)

**Tool Name:** `arkiver_process_file`

**Description:** Initiates processing of an uploaded file. Returns immediately with a job ID. Use `arkiver_job_status` to check progress.

**Input Schema:**
```typescript
{
  type: "object",
  properties: {
    fileId: {
      type: "string",
      description: "File ID from upload endpoint"
    },
    processingSettings: {
      type: "object",
      properties: {
        extractionMode: {
          type: "string",
          enum: ["standard", "deep", "fast"],
          description: "Extraction depth: standard (balanced), deep (comprehensive), fast (quick scan)"
        },
        enableOCR: {
          type: "boolean",
          description: "Enable OCR for scanned documents/images"
        },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Pre-defined categories to apply"
        },
        extractCitations: {
          type: "boolean",
          default: true,
          description: "Extract legal citations"
        },
        extractEntities: {
          type: "boolean",
          default: true,
          description: "Extract entities (parties, attorneys, judges)"
        },
        extractTimeline: {
          type: "boolean",
          default: true,
          description: "Extract dates and create timeline"
        },
        caseId: {
          type: "string",
          description: "Optional: Associate with LexFiat case"
        }
      },
      required: ["extractionMode"]
    }
  },
  required: ["fileId", "processingSettings"]
}
```

**Output Schema:**
```typescript
{
  success: true,
  jobId: string,                  // Job identifier for status polling
  fileId: string,                 // Confirms which file is being processed
  status: "queued",               // Initial status
  estimatedDuration?: number,     // Estimated seconds (if available)
  message: "Processing started"
}
```

**Error Output:**
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Processing States:**
- `queued` - Job created, waiting in queue
- `processing` - Currently being processed
- `completed` - Processing finished successfully
- `failed` - Processing failed (check error field)

**Typical Processing Times:**
- Small files (<1MB): 5-15 seconds
- Medium files (1-10MB): 15-60 seconds
- Large files (10-100MB): 1-5 minutes

---

### 2.2 Job Status

**Tool Name:** `arkiver_job_status`

**Description:** Check the status of a processing job. Poll this tool periodically until status is `completed` or `failed`.

**Input Schema:**
```typescript
{
  type: "object",
  properties: {
    jobId: {
      type: "string",
      description: "Job ID from arkiver_process_file"
    }
  },
  required: ["jobId"]
}
```

**Output Schema:**
```typescript
{
  success: true,
  jobId: string,
  status: "queued" | "processing" | "completed" | "failed",
  progress: number,              // 0-100 percentage
  fileId: string,
  startedAt?: string,            // ISO 8601 timestamp
  completedAt?: string,          // ISO 8601 timestamp (if completed)
  result?: {                     // Only present if status is "completed"
    insights: Insight[],         // Array of extracted insights
    metadata: {
      pageCount?: number,        // For PDFs
      wordCount?: number,
      processingTime: number,    // Seconds
      extractorsUsed: string[],
      processorsUsed: string[]
    }
  },
  error?: {                      // Only present if status is "failed"
    code: string,
    message: string,
    details?: any
  }
}
```

**Polling Recommendations:**
- Initial poll: 2 seconds after job creation
- While `processing`: Poll every 3-5 seconds
- While `queued`: Poll every 5-10 seconds
- Maximum polling duration: 10 minutes (then consider job failed)

---

### 2.3 Store Insight

**Tool Name:** `arkiver_store_insight`

**Description:** Store an extracted insight in the Cyrano database. This is typically called after processing completes, but can also be used to store manually created insights.

**Input Schema:**
```typescript
{
  type: "object",
  properties: {
    fileId: {
      type: "string",
      description: "File this insight is derived from"
    },
    insight: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short title/summary of the insight"
        },
        content: {
          type: "string",
          description: "Full content of the insight"
        },
        sourceLLM: {
          type: "string",
          description: "Which LLM generated this (e.g., 'claude-3-5-sonnet', 'gpt-4')"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Categorization tags"
        },
        entities: {
          type: "object",
          description: "Extracted entities (parties, attorneys, etc.)",
          additionalProperties: true
        },
        citations: {
          type: "array",
          items: { type: "string" },
          description: "Legal citations found"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence score (0-1)"
        },
        pageNumber?: {
          type: "number",
          description: "Page number in source document (if applicable)"
        },
        caseId?: {
          type: "string",
          description: "Optional: Associate with LexFiat case"
        }
      },
      required: ["title", "content", "sourceLLM"]
    }
  },
  required: ["fileId", "insight"]
}
```

**Output Schema:**
```typescript
{
  success: true,
  insightId: string,             // Unique identifier for the stored insight
  storedAt: string,               // ISO 8601 timestamp
  message: "Insight stored successfully"
}
```

---

### 2.4 Query Insights

**Tool Name:** `arkiver_query_insights`

**Description:** Search and retrieve stored insights with filtering, sorting, and pagination.

**Input Schema:**
```typescript
{
  type: "object",
  properties: {
    filters: {
      type: "object",
      properties: {
        keywords?: {
          type: "string",
          description: "Full-text search across title and content"
        },
        sourceLLM?: {
          type: "string",
          description: "Filter by LLM source"
        },
        tags?: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags (AND logic - all tags must match)"
        },
        fileId?: {
          type: "string",
          description: "Filter by source file"
        },
        caseId?: {
          type: "string",
          description: "Filter by LexFiat case"
        },
        dateRange?: {
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          },
          description: "Filter by creation date range"
        },
        minConfidence?: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Minimum confidence score"
        }
      }
    },
    sort?: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["createdAt", "confidence", "relevance"],
          description: "Field to sort by"
        },
        order: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc"
        }
      }
    },
    pagination?: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Number of results per page"
        },
        offset: {
          type: "number",
          minimum: 0,
          default: 0,
          description: "Number of results to skip"
        }
      }
    }
  }
}
```

**Output Schema:**
```typescript
{
  success: true,
  insights: Insight[],           // Array of matching insights
  total: number,                  // Total number of matching insights (before pagination)
  pagination: {
    limit: number,
    offset: number,
    hasMore: boolean              // True if more results available
  }
}

// Insight type:
interface Insight {
  insightId: string,
  fileId: string,
  title: string,
  content: string,
  sourceLLM: string,
  tags: string[],
  entities: object,
  citations: string[],
  confidence: number,
  createdAt: string,             // ISO 8601 timestamp
  caseId?: string
}
```

---

### 2.5 Integrity Test

**Tool Name:** `arkiver_integrity_test`

**Description:** Run AI integrity tests on insights (OpinionDriftTest, BiasDetector, etc.). This may also be a long-running operation, so consider using async job pattern for complex tests.

**Input Schema:**
```typescript
{
  type: "object",
  properties: {
    testType: {
      type: "string",
      enum: ["opinion_drift", "bias", "honesty", "ten_rules", "fact_check"],
      description: "Type of integrity test to run"
    },
    insightIds: {
      type: "array",
      items: { type: "string" },
      description: "Insight IDs to test (or empty array for all insights from a file)"
    },
    fileId?: {
      type: "string",
      description: "If provided, test all insights from this file"
    },
    llmSource: {
      type: "string",
      description: "Which LLM to use for testing (e.g., 'claude-3-5-sonnet')"
    },
    parameters: {
      type: "object",
      description: "Test-specific parameters",
      additionalProperties: true
    }
  },
  required: ["testType", "llmSource"]
}
```

**Output Schema:**
```typescript
{
  success: true,
  testId: string,                 // Test identifier (for async tests)
  status: "completed" | "queued", // If queued, use arkiver_job_status
  results?: {                     // Only if status is "completed"
    testType: string,
    insightsTested: number,
    passed: number,
    failed: number,
    warnings: number,
    details: Array<{
      insightId: string,
      status: "passed" | "failed" | "warning",
      score?: number,             // 0-1
      issues?: string[],          // List of detected issues
      recommendations?: string[]  // Suggested fixes
    }>
  }
}
```

**Note:** For complex tests that take >30 seconds, this tool may return `status: "queued"` with a `testId`. Use `arkiver_job_status` to poll for results.

---

## 3. Error Handling

### 3.1 Standard Error Response Format

All tools return errors in this format:

```typescript
{
  success: false,
  error: {
    code: string,                 // Machine-readable error code
    message: string,              // Human-readable message
    details?: any                 // Additional context
  }
}
```

### 3.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FILE_NOT_FOUND` | 404 | File ID does not exist |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `UNSUPPORTED_FILE_TYPE` | 400 | File type not supported |
| `JOB_NOT_FOUND` | 404 | Job ID does not exist |
| `JOB_ALREADY_COMPLETED` | 400 | Job has already finished |
| `PROCESSING_FAILED` | 500 | File processing failed |
| `INVALID_INPUT` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AUTHENTICATION_FAILED` | 401 | Authentication failed |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 3.3 Retry Logic

**Recommended Retry Strategy:**
- **Transient errors** (5xx, rate limits): Retry with exponential backoff
  - Initial delay: 1 second
  - Max delay: 30 seconds
  - Max retries: 3
- **Client errors** (4xx): Do not retry (except 429 rate limit)
- **Network errors**: Retry with exponential backoff (same as transient)

---

## 4. Authentication

### 4.1 Authentication Method

ArkiverMJ authenticates to Cyrano using the existing MCP `auth` tool.

**Flow:**
1. ArkiverMJ calls `auth` tool with credentials
2. Cyrano returns authentication token
3. ArkiverMJ includes token in all subsequent requests (HTTP header or MCP context)

**HTTP Header:**
```
Authorization: Bearer <token>
```

**MCP Context:**
```typescript
// Include in MCP request context
{
  auth: {
    token: string
  }
}
```

### 4.2 Token Expiration

- Tokens expire after 24 hours
- Refresh token available via `auth` tool
- ArkiverMJ should refresh token proactively (before expiration)

---

## 5. Implementation Timeline

### Phase 1: Interface Definition (Week 3)
- ✅ This contract document finalized
- ✅ Mock implementations created (for Copilot testing)
- ✅ Integration tests defined

### Phase 2: Cyrano Implementation (Week 4)
- ✅ File upload endpoint implemented
- ✅ MCP tools implemented
- ✅ Job queue system implemented
- ✅ Database schema defined

### Phase 3: ArkiverMJ Integration (Week 6-8)
- ✅ ArkiverMJ backend calls MCP tools
- ✅ ArkiverMJ frontend integrated
- ✅ End-to-end testing

### Phase 4: Beta Release (Week 10)
- ✅ Full integration complete
- ✅ Performance optimized
- ✅ Documentation complete

---

## 6. Testing Strategy

### 6.1 Mock MCP Server (for Copilot)

Copilot should use a mock MCP server that implements this contract for development/testing. The mock should:

- Accept all tool calls defined in this contract
- Return realistic responses (including async job patterns)
- Simulate various error conditions
- Support testing of polling logic

### 6.2 Integration Testing

Integration tests should verify:
- File upload → processing → insight storage → query flow
- Error handling (all error codes)
- Async job polling
- Rate limiting
- Authentication

### 6.3 Performance Testing

- Upload files of various sizes (1MB, 10MB, 50MB, 100MB)
- Measure processing times
- Test concurrent uploads
- Verify job queue handles load

---

## 7. Versioning

### 7.1 Contract Versioning

This contract is version 1.0. Future versions will:
- Maintain backward compatibility where possible
- Use versioned endpoints (`/api/v1/arkiver/...`)
- Document breaking changes clearly

### 7.2 MCP Protocol Version

Cyrano uses MCP SDK version: `@modelcontextprotocol/sdk@latest`

ArkiverMJ should use compatible MCP client library.

---

## 8. Open Questions / Decisions Needed

1. **Database Schema:** Need to define exact schema for insights table
2. **File Storage:** Where are uploaded files stored? (S3, local filesystem, database?)
3. **Job Queue:** Which job queue system? (BullMQ, custom, database-based?)
4. **WebSocket Support:** Should we add WebSocket for real-time progress updates? (Nice-to-have, not required for MVP)
5. **Batch Processing:** Should we support batch file uploads? (Defer to post-MVP)

---

## 9. Success Criteria

This contract is successful if:
- ✅ ArkiverMJ can upload files and process them end-to-end
- ✅ Insights are stored and queryable
- ✅ Integrity tests can be run
- ✅ Error handling works correctly
- ✅ Performance meets requirements (<5s for small files, <60s for large files)
- ✅ Integration tests pass

---

**Status:** DRAFT - Awaiting Approval  
**Next Steps:** Review and approve, then begin implementation  
**Contact:** Cursor (Cyrano) and Copilot (ArkiverMJ) for questions

