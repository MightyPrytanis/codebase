/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { EmbeddingService } from './embedding-service.js';
import { VectorStore, VectorDocument, SearchResult } from '../modules/rag/vector-store.js';
import { Chunker, Chunk } from '../modules/rag/chunker.js';

export interface Document {
  id: string;
  text: string;
  type?: string;
  source?: string; // Data source identifier
  sourceType?: 'user-upload' | 'email' | 'clio' | 'courtlistener' | 'westlaw' | 'manual';
  metadata?: {
    documentType?: string;
    section?: string;
    page?: number;
    uploadedAt?: Date;
    uploadedBy?: string;
    // Library-specific metadata
    libraryItemId?: string;
    filename?: string;
    filepath?: string;
    title?: string;
    description?: string;
    jurisdiction?: string;
    county?: string;
    court?: string;
    judgeReferee?: string;
    issueTags?: string[];
    practiceAreas?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
    dateCreated?: Date;
    dateModified?: Date;
    pinned?: boolean;
    superseded?: boolean;
    supersededBy?: string;
    [key: string]: any; // Allow additional metadata fields
  };
}

export interface RAGOptions {
  topK?: number;              // Number of chunks to retrieve
  minScore?: number;          // Minimum similarity score
  includeMetadata?: boolean; // Include document metadata
  filterByType?: string[];   // Filter by document type
  expandQuery?: boolean;     // Enable query expansion
  rerank?: boolean;           // Enable reranking
  includeSourceInfo?: boolean; // Include data source information
  // Library-specific filters
  filterBySourceType?: string[];  // Filter by source type (rule, template, etc.)
  filterByCounty?: string;        // Filter by county
  filterByCourt?: string;         // Filter by court
  filterByJudgeReferee?: string;  // Filter by judge/referee
  filterByIssueTags?: string[];   // Filter by issue tags
  filterByEffectiveDate?: {       // Filter by effective date range
    from?: Date;
    to?: Date;
  };
}

export interface ChunkResult {
  id: string;
  text: string;
  score: number;
  metadata?: {
    documentId?: string;
    documentType?: string;
    section?: string;
    page?: number;
    source?: string;
    sourceType?: string;
    // Library-specific metadata
    county?: string;
    court?: string;
    judgeReferee?: string;
    issueTags?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
    [key: string]: any; // Allow additional metadata fields
  };
}

export interface Citation {
  documentId: string;
  chunkId: string;
  text: string;
  score: number;
  source?: string;
  sourceType?: string;
  metadata?: {
    documentType?: string;
    section?: string;
    page?: number;
  };
}

export interface RAGResult {
  query: string;
  context: string;            // Combined context from chunks
  chunks: ChunkResult[];     // Individual chunks with scores
  citations: Citation[];      // Document citations
  dataSources?: string[];     // List of data sources used
  sourceNotice?: string;      // Notice about data sources
}

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQueries: string[];
  expandedTerms: string[];
}

export class RAGService {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;
  private chunker: Chunker;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new VectorStore();
    this.chunker = new Chunker();
  }

  /**
   * Ingest a document into the vector store
   * 
   * DATA SOURCE NOTICE: This function processes documents from various sources
   * including user uploads, email attachments, Clio integration, CourtListener,
   * Westlaw imports, and manually entered documents. All ingested documents
   * are stored in the vector database for semantic search and retrieval.
   */
  async ingestDocument(document: Document): Promise<string[]> {
    if (!this.embeddingService.isAvailable()) {
      throw new Error('Embedding service not available. OPENAI_API_KEY required.');
    }

    // Chunk the document using legal-aware strategy for legal documents
    const chunkingStrategy = document.type?.toLowerCase().includes('legal') || 
                            document.type?.toLowerCase().includes('case') ||
                            document.type?.toLowerCase().includes('brief')
      ? 'legal-aware'
      : 'semantic';

    const chunks = this.chunker.chunkText(document.text, {
      strategy: chunkingStrategy as any,
      metadata: {
        documentId: document.id,
        documentType: document.type,
        ...document.metadata,
      },
    });

    // Generate embeddings for all chunks
    const texts = chunks.map(chunk => chunk.text);
    const embeddings = await this.embeddingService.generateEmbeddings(texts);

    // Create vector documents and add to store
    const vectorDocs: VectorDocument[] = chunks.map((chunk, index) => ({
      id: `${document.id}_${chunk.id}`,
      embedding: embeddings[index].embedding,
      text: chunk.text,
      metadata: {
        documentId: document.id,
        documentType: document.type,
        source: document.source,
        sourceType: document.sourceType,
        ...chunk.metadata,
      },
    }));

    this.vectorStore.addMany(vectorDocs);

    return vectorDocs.map(doc => doc.id);
  }

  /**
   * Expand query with synonyms and related terms
   */
  private expandQuery(query: string): QueryExpansionResult {
    const expandedTerms: string[] = [];
    const expandedQueries: string[] = [query];

    // Legal term expansions
    const legalExpansions: Record<string, string[]> = {
      'contract': ['agreement', 'covenant', 'compact'],
      'lawsuit': ['litigation', 'case', 'action', 'proceeding'],
      'plaintiff': ['claimant', 'petitioner', 'complainant'],
      'defendant': ['respondent', 'accused'],
      'motion': ['request', 'application', 'petition'],
      'brief': ['memorandum', 'memoranda', 'memo'],
      'statute': ['law', 'regulation', 'act', 'code'],
      'precedent': ['case law', 'jurisprudence', 'authority'],
    };

    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (legalExpansions[word]) {
        expandedTerms.push(...legalExpansions[word]);
      }
    }

    // Create expanded queries
    if (expandedTerms.length > 0) {
      expandedQueries.push(...expandedTerms.map(term => query + ' ' + term));
    }

    return {
      originalQuery: query,
      expandedQueries,
      expandedTerms,
    };
  }

  /**
   * Rerank search results using cross-encoder approach
   * Uses a combination of semantic similarity and keyword matching
   */
  private rerankResults(query: string, results: SearchResult[]): SearchResult[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Calculate rerank score (semantic score + keyword boost)
    const reranked = results.map(result => {
      const textLower = result.document.text.toLowerCase();
      
      // Keyword matching boost
      let keywordScore = 0;
      for (const word of queryWords) {
        if (word.length > 3) { // Only count substantial words
          const matches = (textLower.match(new RegExp(word, 'g')) || []).length;
          keywordScore += matches * 0.1; // Boost for keyword matches
        }
      }

      // Combined score (weighted average)
      const rerankScore = (result.score * 0.7) + (Math.min(keywordScore, 0.3));
      
      return {
        ...result,
        score: rerankScore,
      };
    });

    // Sort by rerank score
    return reranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Query the RAG system and retrieve relevant context
   * 
   * DATA SOURCE NOTICE: This function retrieves information from documents
   * that have been ingested into the system. The sources may include:
   * - User-uploaded documents
   * - Email attachments processed by the system
   * - Documents from Clio practice management integration
   * - Public legal documents from CourtListener
   * - Legal research from Westlaw
   * - Manually entered documents
   * 
   * All retrieved information includes source attribution for transparency.
   */
  async query(query: string, options: RAGOptions = {}): Promise<RAGResult> {
    if (!this.embeddingService.isAvailable()) {
      throw new Error('Embedding service not available. OPENAI_API_KEY required.');
    }

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.0;
    const expandQuery = options.expandQuery !== false; // Default true
    const rerank = options.rerank !== false; // Default true
    const includeSourceInfo = options.includeSourceInfo !== false; // Default true

    // Query expansion
    let searchQueries = [query];
    let expansionResult: QueryExpansionResult | undefined;
    
    if (expandQuery) {
      expansionResult = this.expandQuery(query);
      searchQueries = expansionResult.expandedQueries.slice(0, 3); // Use top 3 expanded queries
    }

    // Generate embeddings for queries
    const queryEmbeddings = await Promise.all(
      searchQueries.map(q => this.embeddingService.generateEmbedding(q))
    );

    // Search with each query and combine results
    let allResults: SearchResult[] = [];
    for (const queryEmbedding of queryEmbeddings) {
      const results = this.vectorStore.search(queryEmbedding.embedding, topK * 2, minScore);
      allResults.push(...results);
    }

    // Deduplicate by document ID
    const seen = new Set<string>();
    const uniqueResults: SearchResult[] = [];
    for (const result of allResults) {
      const docId = result.document.metadata?.documentId || result.document.id;
      if (!seen.has(docId)) {
        seen.add(docId);
        uniqueResults.push(result);
      }
    }

    // Rerank if enabled
    let results = uniqueResults;
    if (rerank) {
      results = this.rerankResults(query, uniqueResults);
    }

    // Apply library-specific filters BEFORE taking top K
    // Filter by source type (rule, standing-order, template, etc.)
    if (options.filterBySourceType && options.filterBySourceType.length > 0) {
      results = results.filter(result => {
        const sourceType = result.document.metadata?.sourceType;
        return sourceType && options.filterBySourceType!.includes(sourceType);
      });
    }

    // Filter by county
    if (options.filterByCounty) {
      results = results.filter(result => 
        result.document.metadata?.county === options.filterByCounty
      );
    }

    // Filter by court
    if (options.filterByCourt) {
      results = results.filter(result => 
        result.document.metadata?.court === options.filterByCourt
      );
    }

    // Filter by judge/referee
    if (options.filterByJudgeReferee) {
      results = results.filter(result => 
        result.document.metadata?.judgeReferee === options.filterByJudgeReferee
      );
    }

    // Filter by issue tags (match any tag)
    if (options.filterByIssueTags && options.filterByIssueTags.length > 0) {
      results = results.filter(result => {
        const issueTags = result.document.metadata?.issueTags;
        if (!issueTags || !Array.isArray(issueTags)) return false;
        return options.filterByIssueTags!.some(tag => issueTags.includes(tag));
      });
    }

    // Filter by effective date range
    if (options.filterByEffectiveDate) {
      const { from, to } = options.filterByEffectiveDate;
      results = results.filter(result => {
        const effectiveFrom = result.document.metadata?.effectiveFrom;
        const effectiveTo = result.document.metadata?.effectiveTo;
        
        // Check if document is effective within the specified range
        if (from && effectiveTo && new Date(effectiveTo) < from) return false;
        if (to && effectiveFrom && new Date(effectiveFrom) > to) return false;
        
        return true;
      });
    }

    // Take top K
    results = results.slice(0, topK);

    // Filter by document type if specified (legacy support)
    if (options.filterByType && options.filterByType.length > 0) {
      results = results.filter(result => 
        result.document.metadata?.documentType && 
        options.filterByType!.includes(result.document.metadata.documentType)
      );
    }

    // Build context from top results
    const contextParts: string[] = [];
    const chunks: ChunkResult[] = [];
    const citations: Citation[] = [];
    const dataSources = new Set<string>();

    for (const result of results) {
      const doc = result.document;
      
      // Track data sources
      if (includeSourceInfo && doc.metadata?.source) {
        dataSources.add(doc.metadata.source);
      }
      if (includeSourceInfo && doc.metadata?.sourceType) {
        dataSources.add(doc.metadata.sourceType);
      }

      // Add to context with source attribution
      let contextText = doc.text;
      if (includeSourceInfo && doc.metadata?.source) {
        contextText = `[Source: ${doc.metadata.source}] ${contextText}`;
      }
      contextParts.push(contextText);

      // Add to chunks
      chunks.push({
        id: doc.id,
        text: doc.text,
        score: result.score,
        metadata: options.includeMetadata ? {
          ...doc.metadata,
          source: doc.metadata?.source,
          sourceType: doc.metadata?.sourceType,
        } : undefined,
      });

      // Add citation
      citations.push({
        documentId: doc.metadata?.documentId || doc.id,
        chunkId: doc.id,
        text: doc.text.substring(0, 200) + (doc.text.length > 200 ? '...' : ''),
        score: result.score,
        source: doc.metadata?.source,
        sourceType: doc.metadata?.sourceType,
        metadata: options.includeMetadata ? doc.metadata : undefined,
      });
    }

    const context = contextParts.join('\n\n---\n\n');

    // Generate source notice
    let sourceNotice = '';
    if (includeSourceInfo && dataSources.size > 0) {
      const sourcesList = Array.from(dataSources).join(', ');
      sourceNotice = `This response was generated using information from the following sources: ${sourcesList}. ` +
                     `All retrieved information includes source attribution for transparency and verification.`;
    }

    return {
      query,
      context,
      chunks,
      citations,
      dataSources: Array.from(dataSources),
      sourceNotice,
    };
  }

  /**
   * Get context string for AI prompts (simplified interface)
   */
  async getContext(query: string, topK: number = 5): Promise<string> {
    const result = await this.query(query, { topK, includeSourceInfo: true });
    return result.context;
  }

  /**
   * Check if RAG service is available
   */
  isAvailable(): boolean {
    return this.embeddingService.isAvailable() && this.vectorStore.size() > 0;
  }

  /**
   * Get statistics about the vector store
   */
  getStats(): {
    documentCount: number;
    embeddingServiceAvailable: boolean;
    dataSources: string[];
  } {
    const allDocs = this.vectorStore.getAll();
    const sources = new Set<string>();
    
    for (const doc of allDocs) {
      if (doc.metadata?.source) {
        sources.add(doc.metadata.source);
      }
      if (doc.metadata?.sourceType) {
        sources.add(doc.metadata.sourceType);
      }
    }

    return {
      documentCount: this.vectorStore.size(),
      embeddingServiceAvailable: this.embeddingService.isAvailable(),
      dataSources: Array.from(sources),
    };
  }

  /**
   * Clear all documents from the vector store
   */
  clear(): void {
    this.vectorStore.clear();
  }
}
