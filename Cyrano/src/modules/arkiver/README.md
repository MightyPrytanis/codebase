---
Document ID: ARKIVER-PROCESSING-COMPONENTS-README
Title: Arkiver Processing Components
Subject(s): Arkiver | Processing | Module
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Documentation for the Arkiver processing components module in Cyrano MCP server. Note: Arkiver is an APP; this documents the processing MODULE used by the app.
Status: Active
Related Documents: ARKIVER-ARCHITECTURE-GUIDE, ARKIVER-UI-SPEC
---

# Arkiver Processing Components

**Note:** Arkiver is an **APP** (thin client application). This document describes the **processing components MODULE** (`Cyrano/src/modules/arkiver/`) that provides backend processing logic for the Arkiver app via MCP tools.

Comprehensive document processing and insight extraction system for Cyrano.

## Overview

Arkiver provides:
- **File Upload & Storage**: Local filesystem storage with cleanup policies
- **Document Extraction**: PDF, DOCX, text, markdown, email extraction
- **LLM Conversation Extraction**: ChatGPT, Claude, and other LLM conversation formats (JSON, MD, TXT)
- **Processing Pipeline**: Text, entity, insight, timeline, and email processing
- **Citation Management**: Citation validation and formatting (jurisdiction-specific)
- **Job Queue**: Database-based async job processing
- **Database Schema**: Complete schema for files, insights, jobs, integrity tests, dashboards

## Architecture

```
Arkiver/
├── schema.ts              # Database schema (Drizzle ORM)
├── storage/
│   └── local.ts          # Local filesystem storage
├── queue/
│   └── database-queue.ts # Database-based job queue
├── extractors/
│   ├── pdf-extractor.ts           # PDF extraction
│   ├── docx-extractor.ts          # DOCX extraction
│   ├── conversation-extractor.ts  # LLM conversation extraction (JSON, MD, TXT)
│   └── text-extractor.ts          # Plain text and markdown extraction
├── processors/
│   ├── text-processor.ts      # Text processing & metadata
│   ├── email-processor.ts     # Email parsing
│   ├── insight-processor.ts   # Pattern detection & insights
│   ├── entity-processor.ts    # Named entity recognition
│   └── timeline-processor.ts  # Temporal event extraction
└── processor-pipeline.ts # Orchestrates all processors
```

## Extractors

The extractors handle file format parsing and initial data extraction:

### PDF Extractor (`pdf-extractor.ts`)
- Extracts text from PDF files
- Supports OCR for scanned documents
- Extracts metadata (page count, author, creation date)
- Integrates with verification tools for citations and claims

### DOCX Extractor (`docx-extractor.ts`)
- Extracts text and HTML from Word documents
- Preserves document structure (headings, lists, formatting)
- Extracts metadata and document properties

### Conversation Extractor (`conversation-extractor.ts`)
- **LLM Chat Extraction**: Extracts structured conversation data from LLM chat exports
- **Supported Formats**: 
  - ChatGPT JSON format (with mapping structure)
  - Claude conversation format (Human/Assistant markers)
  - Plain text and markdown conversation formats
- **Features**:
  - Auto-detects conversation format
  - Extracts messages with role identification (user/assistant/system)
  - Extracts metadata (timestamps, source LLM, conversation titles)
  - Supports title filtering
  - Generates full conversation text

### Text/Markdown Extractor (`text-extractor.ts`)
- Extracts content from plain text files
- Extracts content and structure from markdown files
- Provides metadata (word count, line count, character count)
- Extracts markdown structure (headings, paragraphs)

## Processors

The processors analyze extracted text and generate insights:

### Text Processor
- Extracts plain text with metadata
- Calculates statistics (word count, sentence length, etc.)
- Analyzes document structure (headings, paragraphs, lists)

### Email Processor
- Parses email headers and body
- Extracts attachments
- Identifies threading information

### Insight Processor
- Detects patterns and anomalies
- Identifies trends and relationships
- Extracts claims and assertions

### Entity Processor
- Named entity recognition (people, organizations, locations)
- Extracts dates, money amounts, statutes, cases
- Finds relationships between entities

### Timeline Processor
- Extracts temporal events from text/data
- Identifies gaps in timelines
- Sorts events chronologically

## Citation Formatting

The citation formatter enforces jurisdiction-specific rules:

- **Michigan**: Michigan Appellate Opinions Manual (MANDATORY - no periods in abbreviations)
- **Federal**: Federal Court Rules, Bluebook
- **Auto-Detect**: Automatically detects jurisdiction from citation content

See [Citation Formatter Documentation](../docs/citation-formatter.md) for details.

## Usage

### Basic File Extraction

```typescript
import { PDFExtractor } from './modules/arkiver/extractors/pdf-extractor.js';

const extractor = new PDFExtractor();
const result = await extractor.extract(buffer, filename, {
  extractionMode: 'standard',
  extractEntities: true,
  extractCitations: true,
});
```

### LLM Conversation Extraction

```typescript
import { ConversationExtractor } from './modules/arkiver/extractors/conversation-extractor.js';

const extractor = new ConversationExtractor();
const conversations = await extractor.extract('path/to/conversations.json', {
  format: 'chatgpt', // or 'claude', 'auto-detect'
  extractFullText: true,
  extractMetadata: true,
  filterByTitle: 'optional-filter', // Optional: filter by title
});

// Access extracted data
for (const conv of conversations) {
  console.log(`Title: ${conv.title}`);
  console.log(`Messages: ${conv.messages.length}`);
  console.log(`Source LLM: ${conv.sourceLLM}`);
  console.log(`Full Text: ${conv.fullText}`);
}
```

### Text/Markdown Extraction

```typescript
import { TextExtractor } from './modules/arkiver/extractors/text-extractor.js';

const extractor = new TextExtractor();
const result = await extractor.extract('path/to/document.md');

console.log(`Text: ${result.text}`);
console.log(`Word Count: ${result.metadata.wordCount}`);
console.log(`Headings: ${result.structure?.headings?.length || 0}`);
```

### Processor Pipeline

```typescript
import { processorPipeline } from './modules/arkiver/processor-pipeline.js';

const result = await processorPipeline.process({
  text: documentText,
  source: 'document.pdf',
  extractionSettings: {
    extractionMode: 'deep',
    extractEntities: true,
    extractTimeline: true,
    extractCitations: true,
    jurisdiction: Jurisdiction.MICHIGAN,
  },
});
```

### Citation Formatting

```typescript
import { citationFormatter, Jurisdiction } from '../../tools/verification/citation-formatter.js';

// Single citation
const result = await citationFormatter.formatCitations({
  text: 'People v Smith, 500 N.W.2d 100 (2020)',
  jurisdiction: Jurisdiction.MICHIGAN,
  correct: true,
});

// Document mode
const docResult = await citationFormatter.formatCitations({
  text: fullDocumentText,
  jurisdiction: Jurisdiction.MICHIGAN,
  documentMode: true,
  correct: true,
});
```

## Database Schema

See `schema.ts` for complete database schema including:
- `arkiver_files`: Uploaded files and processing status
- `arkiver_insights`: Extracted insights
- `arkiver_jobs`: Async job queue
- `arkiver_integrity_tests`: AI integrity monitoring results
- `arkiver_dashboards`: User-customizable dashboards

## Integration

Arkiver integrates with:
- **Potemkin Engine**: Uses shared verification tools (claim extractor, citation checker)
- **MCP Server**: All tools registered and accessible via MCP
- **HTTP Bridge**: REST API endpoints for file upload and processing

## MCP Tools

The following MCP tools are available for Arkiver functionality:

### File Processing Tools (`arkiver-mcp-tools.ts`)
- `arkiver_process_file` - Initiates file processing (supports PDF, DOCX, TXT, MD, JSON conversations)
- `arkiver_job_status` - Check processing job status

### Data Extraction Tools (`arkiver-tools.ts`)
- `extract_conversations` - Extract and parse LLM conversation data from JSON files
- `extract_text_content` - Extract content from plain text files
- `categorize_with_keywords` - Categorize text using keyword matching
- `process_with_regex` - Process text with regex patterns
- `generate_categorized_files` - Generate categorized output files
- `run_extraction_pipeline` - Run complete extraction pipeline
- `create_arkiver_config` - Create configuration files

## Testing

Run tests:
```bash
# Citation formatter
npx tsx test-citation-formatter.ts

# Michigan citations
npx tsx test-michigan.ts
```

## Status

✅ **Complete**:
- Database schema
- File storage (local filesystem)
- Job queue (database-based)
- PDF/DOCX extractors
- All 5 processors
- Citation formatter
- MCP integration

🟡 **In Progress**:
- Frontend integration
- End-to-end testing
- Performance optimization

## Notes

- **Michigan Citation Rules**: The Michigan Appellate Opinions Manual controls in Michigan state courts. No periods in abbreviations is a MANDATORY RULE.
- **Processors**: All processors are stateless and can be used independently or through the pipeline.
- **Job Queue**: Uses database-based queue for MVP (can be upgraded to BullMQ for production if needed).

