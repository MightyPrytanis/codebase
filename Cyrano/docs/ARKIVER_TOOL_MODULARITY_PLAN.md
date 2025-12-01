# Arkiver Tool Modularity Plan
**Created:** 2025-01-27  
**Purpose:** Identify Arkiver tools usable across LexFiat and other applications  
**Status:** Assessment Complete

---

## Executive Summary

Arkiver tools are designed to be modular and reusable across the Cyrano ecosystem. This document identifies which tools can be used independently in LexFiat and other applications.

---

## Tool Categories

### 1. Core Extraction Tools

#### PDF Extractor
**Location:** `Cyrano/src/modules/arkiver/extractors/pdf-extractor.ts`

**Reusability:** ✅ High

**Use Cases:**
- LexFiat: Document upload and processing
- Standalone: PDF text extraction service
- Other apps: Any PDF processing need

**Dependencies:**
- `pdf-parse` library
- File storage system

**Integration:**
```typescript
import { PDFExtractor } from '@cyrano/modules/arkiver/extractors/pdf-extractor.js';

const extractor = new PDFExtractor();
const result = await extractor.extract(buffer, {
  extractionMode: 'standard',
});
```

#### DOCX Extractor
**Location:** `Cyrano/src/modules/arkiver/extractors/docx-extractor.ts`

**Reusability:** ✅ High

**Use Cases:**
- LexFiat: Word document processing
- Standalone: DOCX text extraction
- Other apps: Document conversion

**Dependencies:**
- `mammoth` library
- File storage system

**Integration:**
```typescript
import { DOCXExtractor } from '@cyrano/modules/arkiver/extractors/docx-extractor.js';

const extractor = new DOCXExtractor();
const result = await extractor.extract(buffer, {
  extractionMode: 'standard',
});
```

---

### 2. Processing Tools

#### Text Processor
**Location:** `Cyrano/src/modules/arkiver/processors/text-processor.ts`

**Reusability:** ✅ High

**Use Cases:**
- LexFiat: Document analysis
- Standalone: Text statistics and metadata
- Other apps: Content analysis

**Features:**
- Word count
- Sentence analysis
- Document structure
- Language detection

**Integration:**
```typescript
import { TextProcessor } from '@cyrano/modules/arkiver/processors/text-processor.js';

const processor = new TextProcessor();
const result = await processor.process(text, {
  extractMetadata: true,
  analyzeStructure: true,
});
```

#### Entity Processor
**Location:** `Cyrano/src/modules/arkiver/processors/entity-processor.ts`

**Reusability:** ✅ High

**Use Cases:**
- LexFiat: Party identification in documents
- Standalone: Named entity recognition
- Other apps: Information extraction

**Features:**
- People extraction
- Organization extraction
- Location extraction
- Date extraction
- Legal citation extraction

**Integration:**
```typescript
import { EntityProcessor } from '@cyrano/modules/arkiver/processors/entity-processor.js';

const processor = new EntityProcessor();
const result = await processor.process(text, {
  extractPeople: true,
  extractOrganizations: true,
  extractCitations: true,
});
```

#### Citation Formatter
**Location:** `Cyrano/src/tools/verification/citation-formatter.ts`

**Reusability:** ✅ Very High

**Use Cases:**
- LexFiat: Legal document formatting
- Standalone: Citation validation service
- Other apps: Legal document processing

**Features:**
- Jurisdiction-specific formatting
- Auto-detection
- Validation
- Correction

**Integration:**
```typescript
import { citationFormatter, Jurisdiction } from '@cyrano/tools/verification/citation-formatter.js';

const result = await citationFormatter.formatCitations({
  text: documentText,
  jurisdiction: Jurisdiction.MICHIGAN,
  correct: true,
});
```

---

### 3. MCP Tools

#### arkiver_process_file
**Location:** `Cyrano/src/tools/arkiver-mcp-tools.ts`

**Reusability:** ✅ High (via MCP)

**Use Cases:**
- LexFiat: File processing workflow
- External apps: Via MCP protocol
- CLI tools: Via MCP stdio bridge

**Access:**
- Via MCP server
- Via HTTP bridge (`POST /api/arkiver/files/:fileId/process`)
- Via direct tool call

#### arkiver_job_status
**Location:** `Cyrano/src/tools/arkiver-mcp-tools.ts`

**Reusability:** ✅ High (via MCP)

**Use Cases:**
- LexFiat: Progress tracking
- External apps: Job monitoring
- CLI tools: Status checking

**Access:**
- Via MCP server
- Via HTTP bridge (`GET /api/arkiver/jobs/:jobId`)
- Via direct tool call

---

## Integration Patterns

### Pattern 1: Direct Import (TypeScript/Node.js)

**Best For:** Same codebase, TypeScript applications

```typescript
// In LexFiat or other TypeScript app
import { PDFExtractor } from '@cyrano/modules/arkiver/extractors/pdf-extractor.js';
import { EntityProcessor } from '@cyrano/modules/arkiver/processors/entity-processor.js';

// Use directly
const extractor = new PDFExtractor();
const processor = new EntityProcessor();
```

**Pros:**
- Type safety
- Direct access
- No network overhead

**Cons:**
- Requires shared codebase or package
- Tight coupling

---

### Pattern 2: MCP Protocol (External Apps)

**Best For:** External applications, different languages

```typescript
// Via MCP client
const result = await mcpClient.callTool('arkiver_process_file', {
  fileId: '...',
  processingSettings: { ... }
});
```

**Pros:**
- Language agnostic
- Loose coupling
- Standard protocol

**Cons:**
- Network overhead
- Requires MCP client

---

### Pattern 3: HTTP REST API

**Best For:** Web applications, mobile apps

```typescript
// Via HTTP
const response = await fetch('/api/arkiver/files/:fileId/process', {
  method: 'POST',
  body: JSON.stringify({ processingSettings: { ... } }),
});
```

**Pros:**
- Standard HTTP
- Easy integration
- Works from browser

**Cons:**
- Requires HTTP bridge
- Less type safety

---

## LexFiat Integration

### Recommended Tools for LexFiat

1. **PDF Extractor** ✅
   - Use for document uploads
   - Extract text from PDFs
   - Display document content

2. **DOCX Extractor** ✅
   - Use for Word document uploads
   - Extract text from DOCX
   - Display document content

3. **Entity Processor** ✅
   - Extract parties from documents
   - Identify attorneys, judges
   - Extract dates and deadlines

4. **Citation Formatter** ✅
   - Format citations in documents
   - Validate legal citations
   - Auto-correct citation format

5. **MCP Tools** ✅
   - Use `arkiver_process_file` for file processing
   - Use `arkiver_job_status` for progress tracking

### Integration Example

```typescript
// In LexFiat component
import { useMCPTool } from '@/hooks/useMCPTool';

function DocumentUpload() {
  const processFile = useMCPTool('arkiver_process_file');
  const checkStatus = useMCPTool('arkiver_job_status');
  
  const handleUpload = async (file: File) => {
    // Upload file first (separate endpoint)
    const { fileId } = await uploadFile(file);
    
    // Process file
    const { jobId } = await processFile({
      fileId,
      processingSettings: {
        extractionMode: 'standard',
        extractEntities: true,
        extractCitations: true,
      },
    });
    
    // Poll for status
    const status = await checkStatus({ jobId });
    // ...
  };
}
```

---

## Standalone Usage

### As a Service

Arkiver tools can be used as standalone services:

1. **File Processing Service**
   - Accept file uploads
   - Process files
   - Return results

2. **Citation Service**
   - Accept text with citations
   - Format citations
   - Return formatted text

3. **Entity Extraction Service**
   - Accept text
   - Extract entities
   - Return structured data

### Example: Standalone Citation Service

```typescript
// citation-service.ts
import { citationFormatter, Jurisdiction } from '@cyrano/tools/verification/citation-formatter.js';
import express from 'express';

const app = express();

app.post('/api/citations/format', async (req, res) => {
  const { text, jurisdiction } = req.body;
  
  const result = await citationFormatter.formatCitations({
    text,
    jurisdiction: jurisdiction || Jurisdiction.AUTO,
    correct: true,
  });
  
  res.json(result);
});

app.listen(3000);
```

---

## Package Structure

### Recommended Package Organization

```
@cyrano/arkiver
├── extractors/
│   ├── pdf-extractor.ts
│   └── docx-extractor.ts
├── processors/
│   ├── text-processor.ts
│   ├── entity-processor.ts
│   ├── insight-processor.ts
│   └── timeline-processor.ts
├── tools/
│   └── citation-formatter.ts
└── index.ts
```

### Package Export

```typescript
// index.ts
export { PDFExtractor } from './extractors/pdf-extractor.js';
export { DOCXExtractor } from './extractors/docx-extractor.js';
export { TextProcessor } from './processors/text-processor.js';
export { EntityProcessor } from './processors/entity-processor.js';
export { citationFormatter, Jurisdiction } from './tools/citation-formatter.js';
```

---

## Dependencies

### Core Dependencies

- `pdf-parse` - PDF extraction
- `mammoth` - DOCX extraction
- `zod` - Validation
- `drizzle-orm` - Database (if using database features)

### Optional Dependencies

- `tesseract.js` - OCR (if OCR enabled)
- AI service - For AI-powered extraction (if using AI features)

---

## Best Practices

### 1. Stateless Processors

All processors are stateless and can be used independently:

```typescript
// ✅ Good - Stateless
const processor = new EntityProcessor();
const result = await processor.process(text);

// ❌ Bad - Don't store state
processor.setDocument(document); // Don't do this
```

### 2. Error Handling

Always handle errors:

```typescript
try {
  const result = await extractor.extract(buffer);
} catch (error) {
  if (error instanceof ExtractionError) {
    // Handle extraction error
  } else {
    // Handle other errors
  }
}
```

### 3. Configuration

Use configuration objects:

```typescript
// ✅ Good - Explicit configuration
const result = await processor.process(text, {
  extractPeople: true,
  extractOrganizations: true,
});

// ❌ Bad - Magic values
const result = await processor.process(text, true, false);
```

---

## Status

✅ **Complete:**
- Tool modularity assessment
- Integration patterns documented
- LexFiat integration plan
- Standalone usage examples

⏳ **In Progress:**
- Package structure implementation
- NPM package creation (future)

📋 **Planned:**
- Package publishing
- Documentation site
- Example applications

---

**Last Updated:** 2025-01-27  
**Next Review:** After Step 7 (LexFiat UI/UX)




