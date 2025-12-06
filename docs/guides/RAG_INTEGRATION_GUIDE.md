---
Document ID: RAG-INTEGRATION-GUIDE
Title: RAG Integration Guide - Architecture and Usage
Subject(s): RAG | Integration | Research | Vector Search | Architecture
Project: Cyrano
Version: v549
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-12-06 (2025-W49)
Last Format Update: 2025-12-06 (2025-W49)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Complete guide to RAG (Retrieval-Augmented Generation) architecture, implementation, and usage in LexFiat.
Status: Active
---

# RAG Integration Guide - Architecture and Usage

**Purpose:** Complete guide to understanding, implementing, and using RAG (Retrieval-Augmented Generation) in LexFiat  
**Last Updated:** 2025-12-06  
**Status:** Active - Core features implemented, multi-modal architecture ready

---

## Overview

**RAG (Retrieval-Augmented Generation)** is LexFiat's internal document search and context system. It allows the AI to search through your uploaded documents, case files, and legal materials to find relevant information before generating responses.

The RAG pipeline enhances AI responses by retrieving relevant context from a vector database before generating answers. This is critical for legal applications where accuracy and citation are essential.

Think of it as giving the AI a "library" of your documents that it can search through to provide more accurate, context-aware answers.

---

## Architecture Components

### 1. Document Ingestion
- **Input:** PDFs, DOCX, text files, emails, legal documents
- **Processing:** Extract text, chunk into semantic units, extract metadata
- **Output:** Chunked documents with metadata

### 2. Vector Storage
- **Database:** In-memory for MVP (can upgrade to Pinecone/Weaviate/Qdrant)
- **Embeddings:** OpenAI `text-embedding-3-small` (default), with fallbacks
- **Indexing:** Vector similarity search

### 3. Retrieval System
- **Query Processing:** Convert user query to embedding
- **Semantic Search:** Find top-k similar chunks
- **Relevance Ranking:** Score and rank results
- **Context Assembly:** Combine top results into context

### 4. Generation Integration
- **Context Injection:** Add retrieved context to AI prompts
- **Provider Support:** Works with all AI providers (OpenAI, Anthropic, Perplexity, etc.)
- **Citation Tracking:** Track which documents were used

---

## How RAG Works in LexFiat

### 1. Document Ingestion (Automatic)

When documents are processed through LexFiat:
1. **Document Processor** extracts text from PDFs, DOCX, emails, etc.
2. **RAG Chunker** breaks documents into semantic chunks (preserving sentence/paragraph boundaries)
3. **Embedding Service** converts chunks into vector embeddings (mathematical representations of meaning)
4. **Vector Store** stores embeddings for fast semantic search

**You don't need to do anything** - this happens automatically when documents are processed.

### 2. Query Processing

When you search or ask questions:
1. **Query Expansion** - Your query is expanded into multiple related queries
2. **Semantic Search** - RAG searches the vector store for semantically similar chunks
3. **Reranking** - Results are reranked by relevance
4. **Context Assembly** - Relevant chunks are assembled into context
5. **Citation Tracking** - Sources are tracked for each result

### 3. AI Enhancement

The AI uses RAG context to:
- Answer questions with citations to your documents
- Generate drafts based on your case files
- Analyze documents with full case context
- Provide recommendations based on your work history

---

## Implementation Status

### Phase 1: Core RAG Service (✅ Complete)
- ✅ Basic RAG service structure
- ✅ Document ingestion (text chunking)
- ✅ In-memory vector storage
- ✅ Embedding generation
- ✅ Semantic search
- ✅ Context retrieval

### Phase 2: Integration (✅ Complete)
- ✅ MCP tool for RAG queries
- ✅ Integration with document analyzer
- ✅ Integration with legal reviewer
- ✅ Citation tracking

### Phase 3: Enhancement (⏳ Future)
- ⏳ Persistent vector database
- ⏳ Advanced chunking strategies
- ⏳ Multi-document retrieval
- ⏳ Query expansion (✅ implemented)

---

## File Structure

```
src/
  services/
    rag-service.ts          # Core RAG service
    embedding-service.ts    # Embedding generation
  modules/
    rag/
      document-ingester.ts  # Document processing
      chunker.ts            # Text chunking
      vector-store.ts       # Vector storage (in-memory)
  tools/
    rag-query.ts            # MCP tool for RAG queries
```

---

## API Design

### RAG Service

```typescript
class RAGService {
  // Ingest document
  async ingestDocument(document: Document): Promise<string[]>
  
  // Query with RAG
  async query(query: string, options?: RAGOptions): Promise<RAGResult>
  
  // Get context for AI call
  async getContext(query: string, topK?: number): Promise<string>
}
```

### RAG Options

```typescript
interface RAGOptions {
  topK?: number;              // Number of chunks to retrieve
  minScore?: number;          // Minimum similarity score
  includeMetadata?: boolean;  // Include document metadata
  filterByType?: string[];    // Filter by document type
}
```

### RAG Result

```typescript
interface RAGResult {
  query: string;
  context: string;            // Combined context from chunks
  chunks: ChunkResult[];      // Individual chunks with scores
  citations: Citation[];        // Document citations
}
```

---

## Technical Details

### Vector Store

**Location:** `Cyrano/src/modules/rag/vector-store.ts`

**Current Implementation:**
- In-memory vector store (MVP)
- Cosine similarity search
- Document management (add, remove, search)

**Future:** Will migrate to persistent database (PostgreSQL with pgvector)

### Embedding Model

**Model:** `text-embedding-3-small` (OpenAI)
**Fallback:** `text-embedding-ada-002`

**Specifications:**
- **Dimensions:** 1536
- **Cost:** Low
- **Quality:** Good for legal text

**Why:** Fast, accurate, cost-effective for legal documents

### Chunking Strategy

**Method:** Semantic chunking with overlap

**Features:**
- Preserves sentence/paragraph boundaries
- Overlap prevents context loss at chunk boundaries
- Configurable chunk size and overlap

**Parameters:**
- **Size:** 500-1000 tokens per chunk
- **Overlap:** 100 tokens between chunks
- **Boundaries:** Respect sentence/paragraph boundaries

**Legal Document Considerations:**
- Preserve section structure
- Maintain citation context
- Keep related clauses together

**Location:** `Cyrano/src/modules/rag/chunker.ts`

### Vector Search

**Algorithm:** Cosine similarity
**Top-K:** Default 5 chunks, configurable
**Scoring:** Normalized similarity score (0-1)

---

## Advanced Features Implemented

### ✅ Advanced Chunking
- **Semantic Chunking:** Preserves meaning and context
- **Hierarchical Chunking:** Maintains document structure
- **Legal-Aware Chunking:** Preserves citations and legal structure
- **Boundary Respect:** Sentence and paragraph boundaries

### ✅ Query Expansion
- **Legal Term Expansion:** Synonyms for legal terminology
- **Multi-Query Search:** Expands queries with related terms
- **Result Deduplication:** Combines results from multiple query variations

### ✅ Reranking
- **Cross-Encoder Approach:** Combines semantic similarity with keyword matching
- **Weighted Scoring:** 70% semantic, 30% keyword boost
- **Improved Relevance:** Better ranking of search results

### ✅ Data Source Transparency
- **Source Tracking:** All documents tagged with source and sourceType
- **Source Attribution:** Citations include source information
- **User Notices:** Clear notices about data sources in UI and API
- **Source Filtering:** Can filter by source type

---

## Multi-Modal Capability

### Current Implementation Status

The RAG pipeline is designed to support multi-modal content, though full implementation is planned for future phases:

**Supported Modes:**
- ✅ **Text:** Fully implemented with semantic chunking
- ✅ **Structured Text:** Tables and lists preserved in chunking
- ⏳ **Images:** Architecture ready, requires OCR integration (Tesseract.js available)
- ⏳ **Diagrams:** Architecture ready, requires image-to-text conversion
- ⏳ **PDF Images:** Enhanced PDF extractor can detect images (hasImages method)

**Implementation Notes:**
- Text extraction from PDFs includes image detection
- OCR capabilities available via Tesseract.js integration
- Image metadata can be stored in chunk metadata
- Future: Image embeddings using vision models (OpenAI CLIP, etc.)

**Data Source Tracking:**
- All multi-modal content includes source attribution
- Image sources tracked separately from text sources
- Mixed-content documents preserve both text and image references

---

## User Access Points

### Primary Interface: Research Page

**Location:** `/research` in LexFiat

**How to Use:**
1. Navigate to Research page
2. Enter your query (e.g., "What are the key arguments in the Johnson case?")
3. Set options:
   - **Top K**: Number of results (default: 5)
   - **Expand Query**: Automatically expand query for better results (recommended)
   - **Rerank**: Improve result relevance (recommended)
4. Click "Search" or press Enter
5. Review results with source citations

**What You Get:**
- Relevant document excerpts
- Source citations (which document, page, section)
- Confidence scores
- Full context for each result

---

## Integration Points

### 1. Document Analyzer

**Location:** Document Analyzer panel

**How RAG Enhances It:**
- Before analyzing a document, RAG searches for similar cases/motions
- Analysis includes comparisons to your past work
- Red flags are checked against your document history

**Usage:** Automatic - RAG context is included when you run document analysis

### 2. AI Orchestrator

**Location:** Various AI-powered features

**How RAG Enhances It:**
- AI responses include relevant context from your documents
- Drafts reference your past work
- Recommendations are based on your case history

**Usage:** Automatic - RAG is used whenever AI needs document context

### 3. Research Page (Direct)

**Location:** `/research`

**How to Use:**
- Direct semantic search of your document corpus
- Find relevant information across all your documents
- Get citations for research and drafting

**Usage:** Manual - Go to Research page and search

### 4. Legal Reviewer

**Integration:** Retrieve relevant case law and statutes

### 5. Fact Checker

**Integration:** Verify claims against stored documents

### 6. Compliance Checker

**Integration:** Check against regulatory documents

---

## How to Integrate RAG into New Features

### For Developers

**Step 1: Import RAG Tool**

```typescript
import { executeCyranoTool } from '@/lib/cyrano-api';

const ragResult = await executeCyranoTool('rag_query', {
  action: 'query',
  query: 'Your search query',
  topK: 5,
  expandQuery: true,
  rerank: true,
  includeSourceInfo: true,
});
```

**Step 2: Parse Results**

```typescript
if (ragResult.isError) {
  // Handle error
  return;
}

const results = typeof ragResult.content[0]?.text === 'string'
  ? JSON.parse(ragResult.content[0].text)
  : ragResult.content[0]?.text;

// results contains:
// - results: Array of { content, source, score, metadata }
// - query: Original query
// - expandedQueries: Array of expanded queries
// - totalResults: Number of results found
```

**Step 3: Use Context**

```typescript
// Use RAG context in AI prompts
const context = results.results
  .map(r => `[${r.source.documentId}:${r.source.chunkIndex}] ${r.content}`)
  .join('\n\n');

const aiPrompt = `Based on the following context from your documents:\n\n${context}\n\nAnswer: ${userQuestion}`;
```

---

## Performance Targets

- **Ingestion:** < 1 second per document
- **Query:** < 500ms for retrieval
- **Embedding:** < 200ms per chunk
- **Total RAG Query:** < 1 second end-to-end

---

## Best Practices

### 1. Query Formulation

**Good Queries:**
- "What are the key arguments in the Johnson v. Smith case?"
- "Find all motions related to summary judgment"
- "What did we argue about discovery deadlines?"

**Bad Queries:**
- "stuff" (too vague)
- Single words without context
- Questions unrelated to your documents

### 2. Document Organization

**Tips:**
- Use descriptive filenames
- Include case numbers in document metadata
- Tag documents with relevant keywords
- Keep documents organized by matter

### 3. When to Use RAG

**Use RAG When:**
- Searching for information across multiple documents
- Need citations for research
- Want context-aware AI responses
- Analyzing patterns across cases

**Don't Use RAG When:**
- Searching for specific file names (use file browser)
- Need exact text matches (use Ctrl+F)
- Querying external sources (use Research page with external APIs)

---

## Troubleshooting

### RAG Returns No Results

**Possible Causes:**
1. No documents have been ingested yet
2. Query doesn't match document content semantically
3. Documents haven't been processed yet

**Solutions:**
1. Upload and process documents first
2. Try rephrasing your query
3. Check that documents were successfully processed

### RAG Results Seem Irrelevant

**Possible Causes:**
1. Query is too vague
2. Documents don't contain relevant information
3. Chunking may have split important context

**Solutions:**
1. Be more specific in your query
2. Use query expansion (enabled by default)
3. Increase Top K to see more results

### RAG is Slow

**Possible Causes:**
1. Large document corpus
2. Complex query expansion
3. Reranking enabled

**Solutions:**
1. Reduce Top K value
2. Disable query expansion for faster results
3. Disable reranking (faster but less accurate)

---

## Future Enhancements

### Planned Features

1. **Persistent Vector Store**
   - PostgreSQL with pgvector
   - Persistent across restarts
   - Better performance for large corpora

2. **Full Multi-Modal**
   - Complete image/diagram processing pipeline
   - OCR integration for scanned documents

3. **Advanced Filtering**
   - Filter by document type, date, matter
   - Filter by metadata tags
   - Filter by document source

4. **RAG Analytics**
   - Track which documents are most referenced
   - Identify knowledge gaps
   - Suggest documents to review

5. **Advanced Reranking**
   - Use dedicated cross-encoder models
   - Hybrid search (combine vector and keyword search)
   - Source quality scoring (rate sources by reliability)

---

## Summary

**RAG is:**
- ✅ Automatic document indexing
- ✅ Semantic search across your documents
- ✅ Context enhancement for AI features
- ✅ Citation tracking and source attribution

**RAG is NOT:**
- ❌ A replacement for external research (Westlaw, etc.)
- ❌ A file browser (use file system for that)
- ❌ A database (use Clio/database tools for structured data)

**To Use RAG:**
1. Process documents (automatic)
2. Go to Research page (`/research`)
3. Enter query and search
4. Use results with citations

**RAG is already integrated into:**
- Document Analyzer (automatic)
- AI Orchestrator (automatic)
- Research Page (manual)

**Status:** Core features implemented, multi-modal architecture ready

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-12-06
