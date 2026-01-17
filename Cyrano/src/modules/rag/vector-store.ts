/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface VectorDocument {
  id: string;
  embedding: number[];
  text: string;
  metadata?: {
    documentId?: string;
    documentType?: string;
    section?: string;
    page?: number;
    createdAt?: Date;
    source?: string;
    sourceType?: string;
    hierarchyLevel?: number;
    chunkType?: string;
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

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private index: VectorDocument[] = [];

  /**
   * Add document to vector store
   */
  add(document: VectorDocument): void {
    this.documents.set(document.id, document);
    this.index.push(document);
  }

  /**
   * Add multiple documents
   */
  addMany(documents: VectorDocument[]): void {
    for (const doc of documents) {
      this.add(doc);
    }
  }

  /**
   * Remove document by ID
   */
  remove(id: string): boolean {
    const doc = this.documents.get(id);
    if (doc) {
      this.documents.delete(id);
      const index = this.index.findIndex(d => d.id === id);
      if (index >= 0) {
        this.index.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  /**
   * Get document by ID
   */
  get(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Search for similar documents using cosine similarity
   */
  search(queryEmbedding: number[], topK: number = 5, minScore: number = 0.0): SearchResult[] {
    const results: SearchResult[] = [];

    for (const doc of this.index) {
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (score >= minScore) {
        results.push({
          document: doc,
          score,
        });
      }
    }

    // Sort by score (descending) and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Get total document count
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
    this.index = [];
  }

  /**
   * Get all documents (for debugging/export)
   */
  getAll(): VectorDocument[] {
    return Array.from(this.documents.values());
}
}
