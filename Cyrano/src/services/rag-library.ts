/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * RAG Library Service
 * 
 * Handles ingestion of library items into the RAG system with specialized metadata
 * for legal documents (jurisdiction, court, judge, issue tags, etc.)
 */

import { RAGService, Document } from './rag-service.js';
import { LibraryItem } from '../modules/library/library-model.js';

/**
 * Ingest a library item into the RAG system
 * @param libraryItem - The library item to ingest
 * @param documentText - The extracted document text (if not provided, will use placeholder)
 * @returns Array of vector IDs created in the vector store
 */
export async function ingestLibraryItem(
  libraryItem: LibraryItem,
  documentText?: string
): Promise<string[]> {
  const ragService = new RAGService();
  
  // Use provided text or generate placeholder
  const text = documentText || generatePlaceholderText(libraryItem);
  
  if (!text || text.trim().length === 0) {
    throw new Error(`No text content available for library item ${libraryItem.id}`);
  }
  
  // Create RAG document with library-specific metadata
  const document: Document = {
    id: libraryItem.id,
    text,
    type: libraryItem.sourceType,
    source: `library:${libraryItem.locationId}`,
    sourceType: 'user-upload',
    metadata: {
      documentType: libraryItem.sourceType,
      uploadedAt: libraryItem.createdAt,
      uploadedBy: libraryItem.userId,
      // Library-specific metadata
      libraryItemId: libraryItem.id,
      filename: libraryItem.filename,
      filepath: libraryItem.filepath,
      title: libraryItem.title,
      description: libraryItem.description,
      // Jurisdictional metadata
      jurisdiction: libraryItem.jurisdiction,
      county: libraryItem.county,
      court: libraryItem.court,
      judgeReferee: libraryItem.judgeReferee,
      // Content tags
      issueTags: libraryItem.issueTags,
      practiceAreas: libraryItem.practiceAreas,
      // Date metadata
      effectiveFrom: libraryItem.effectiveFrom,
      effectiveTo: libraryItem.effectiveTo,
      dateCreated: libraryItem.dateCreated,
      dateModified: libraryItem.dateModified,
      // Status
      pinned: libraryItem.pinned,
      superseded: libraryItem.superseded,
      supersededBy: libraryItem.supersededBy,
    },
  };
  
  try {
    const vectorIds = await ragService.ingestDocument(document);
    console.log(`[RAG Library] Ingested library item ${libraryItem.id}: ${vectorIds.length} vectors created`);
    return vectorIds;
  } catch (error) {
    console.error(`[RAG Library] Error ingesting library item ${libraryItem.id}:`, error);
    throw error;
  }
}

/**
 * Generate placeholder text for a library item (temporary until actual extraction is implemented)
 */
function generatePlaceholderText(item: LibraryItem): string {
  const parts = [
    `Title: ${item.title}`,
    item.description ? `Description: ${item.description}` : '',
    `Source Type: ${item.sourceType}`,
    item.jurisdiction ? `Jurisdiction: ${item.jurisdiction}` : '',
    item.county ? `County: ${item.county}` : '',
    item.court ? `Court: ${item.court}` : '',
    item.judgeReferee ? `Judge/Referee: ${item.judgeReferee}` : '',
    item.issueTags.length > 0 ? `Issue Tags: ${item.issueTags.join(', ')}` : '',
    item.practiceAreas.length > 0 ? `Practice Areas: ${item.practiceAreas.join(', ')}` : '',
    item.effectiveFrom ? `Effective From: ${item.effectiveFrom.toLocaleDateString()}` : '',
    item.effectiveTo ? `Effective To: ${item.effectiveTo.toLocaleDateString()}` : '',
  ];
  
  return parts.filter(Boolean).join('\n');
}
