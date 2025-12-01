---
Document ID: RAG-ARCHITECTURE
Title: RAG Pipeline Architecture
Subject(s): Architecture
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Date:** 2025-11-26  
**Status:** Design Complete, Implementation In Progress

---

## Overview

The RAG (Retrieval-Augmented Generation) pipeline enhances AI responses by retrieving relevant context from a vector database before generating answers. This is critical for legal applications where accuracy and citation are essential.

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

## Implementation Plan

### Phase 1: Core RAG Service (Current)
- ✅ Basic RAG service structure
- ✅ Document ingestion (text chunking)
- ✅ In-memory vector storage
- ✅ Embedding generation
- ✅ Semantic search
- ✅ Context retrieval

### Phase 2: Integration (Next)
- ⏳ MCP tool for RAG queries
- ⏳ Integration with document analyzer
- ⏳ Integration with legal reviewer
- ⏳ Citation tracking

### Phase 3: Enhancement (Future)
- ⏳ Persistent vector database
- ⏳ Advanced chunking strategies
- ⏳ Multi-document retrieval
- ⏳ Query expansion

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
  citations: Citation[];      // Document citations
}
```

---

## Embedding Strategy

**Default:** OpenAI `text-embedding-3-small`
- **Dimensions:** 1536
- **Cost:** Low
- **Quality:** Good for legal text

**Fallbacks:**
- OpenAI `text-embedding-ada-002` (if 3-small unavailable)
- Local embeddings (if no OpenAI key)

---

## Chunking Strategy

**Method:** Semantic chunking with overlap
- **Size:** 500-1000 tokens per chunk
- **Overlap:** 100 tokens between chunks
- **Boundaries:** Respect sentence/paragraph boundaries

**Legal Document Considerations:**
- Preserve section structure
- Maintain citation context
- Keep related clauses together

---

## Vector Search

**Algorithm:** Cosine similarity
**Top-K:** Default 5 chunks, configurable
**Scoring:** Normalized similarity score (0-1)

---

## Integration Points

1. **Document Analyzer:** Use RAG for document analysis context
2. **Legal Reviewer:** Retrieve relevant case law and statutes
3. **Fact Checker:** Verify claims against stored documents
4. **Compliance Checker:** Check against regulatory documents

---

## Performance Targets

- **Ingestion:** < 1 second per document
- **Query:** < 500ms for retrieval
- **Embedding:** < 200ms per chunk
- **Total RAG Query:** < 1 second end-to-end

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

## Future Enhancements

1. **Persistent Storage:** Migrate to Pinecone/Weaviate/Qdrant
2. **Full Multi-Modal:** Complete image/diagram processing pipeline
3. **Advanced Reranking:** Use dedicated cross-encoder models
4. **Hybrid Search:** Combine vector and keyword search
5. **Source Quality Scoring:** Rate sources by reliability

---

**Status:** Core features implemented, multi-modal architecture ready


