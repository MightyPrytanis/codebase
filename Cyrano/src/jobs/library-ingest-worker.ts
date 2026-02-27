/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Ingest Worker
 * 
 * Processes the library ingest queue:
 * 1. Extract document content from storage
 * 2. Classify document type (rule, template, etc.)
 * 3. Auto-tag with metadata (jurisdiction, county, court, etc.)
 * 4. Ingest into RAG system with proper metadata
 */

import { 
  getIngestQueue, 
  updateIngestQueueItem, 
  getLibraryItem,
  upsertLibraryItem,
  getLibraryLocations 
} from '../services/library-service.js';
import { ingestLibraryItem } from '../services/rag-library.js';
import { IngestQueueItem, LibraryItem, LibraryLocation } from '../modules/library/library-model.js';
import { getConnector } from '../modules/library/connectors/index.js';
import { PDFExtractor } from '../modules/arkiver/extractors/pdf-extractor.js';
import { DOCXExtractor } from '../modules/arkiver/extractors/docx-extractor.js';
import { TextExtractor } from '../modules/arkiver/extractors/text-extractor.js';
import { AIService } from '../services/ai-service.js';

/**
 * Extract document content from file
 */
async function extractDocumentContent(
  libraryItem: LibraryItem,
  location: LibraryLocation
): Promise<{ text: string; metadata: Record<string, any> }> {
  const connector = getConnector(location.type);
  const fileBuffer = await connector.downloadFile(libraryItem.filepath, {
    path: location.path,
    credentials: location.credentials,
  });

  const ext = libraryItem.filename.toLowerCase().substring(libraryItem.filename.lastIndexOf('.'));
  
  if (ext === '.pdf') {
    const extractor = new PDFExtractor();
    const result = await extractor.extract(fileBuffer, libraryItem.filename, {
      extractionMode: 'standard',
      enableOCR: false, // Can be enabled for scanned documents
      extractEntities: true,
      extractCitations: true,
    });
    return {
      text: result.text,
      metadata: {
        ...result.metadata,
        pages: result.pages?.length || 0,
        claims: result.claims,
        citations: result.citations,
      },
    };
  } else if (ext === '.docx' || ext === '.doc') {
    const extractor = new DOCXExtractor();
    const result = await extractor.extract(fileBuffer, libraryItem.filename, {
      extractionMode: 'standard',
      extractEntities: true,
      extractCitations: true,
    });
    return {
      text: result.text,
      metadata: {
        ...result.metadata,
        structure: result.structure,
        claims: result.claims,
        citations: result.citations,
      },
    };
  } else {
    // Plain text, markdown, or other text formats
    const extractor = new TextExtractor();
    const result = await extractor.extract(fileBuffer.toString('utf-8'));
    return {
      text: result.text,
      metadata: result.metadata,
    };
  }
}

/**
 * Classify document type using AI if not already set
 */
async function classifyDocumentType(
  text: string,
  filename: string,
  currentSourceType: string
): Promise<'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other'> {
  // If already classified and not 'other', use existing
  if (currentSourceType && currentSourceType !== 'other') {
    return currentSourceType as any;
  }

  // Use AI to classify
  const aiService = new AIService();
  const prompt = `Classify this legal document into one of these categories:
- rule: Court rules or procedural rules
- standing-order: Standing orders from courts
- template: Document templates or forms
- playbook: Practice guides or playbooks
- case-law: Case law or judicial opinions
- statute: Statutes or legislation
- other: Other legal documents

Document filename: ${filename}
Document preview (first 500 chars): ${text.substring(0, 500)}

Respond with ONLY the category name (e.g., "rule", "template", etc.).`;

  try {
    const response = await aiService.call('openai', prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });

    const classification = response.trim().toLowerCase();
    const validTypes = ['rule', 'standing-order', 'template', 'playbook', 'case-law', 'statute', 'other'];
    
    if (validTypes.includes(classification)) {
      return classification as any;
    }
  } catch (error) {
    console.warn('[Library Ingest Worker] AI classification failed, using filename heuristics:', error);
  }

  // Fallback: Use filename heuristics
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('rule') || lowerFilename.includes('mcr')) return 'rule';
  if (lowerFilename.includes('standing') || lowerFilename.includes('order')) return 'standing-order';
  if (lowerFilename.includes('template') || lowerFilename.includes('form')) return 'template';
  if (lowerFilename.includes('playbook') || lowerFilename.includes('guide')) return 'playbook';
  if (lowerFilename.includes('case') || lowerFilename.includes('opinion')) return 'case-law';
  if (lowerFilename.includes('statute') || lowerFilename.includes('law')) return 'statute';
  
  return 'other';
}

/**
 * Extract metadata from document text (jurisdiction, court, etc.)
 */
async function extractMetadata(
  text: string,
  filename: string,
  existingMetadata: Partial<LibraryItem>
): Promise<Partial<LibraryItem>> {
  const metadata: Partial<LibraryItem> = {};

  // Extract jurisdiction patterns (e.g., "Michigan", "State of Michigan", "MI")
  const jurisdictionPatterns = [
    /(?:State of |Commonwealth of )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g,
    /\b([A-Z]{2})\b/g, // Two-letter state codes
  ];

  if (!existingMetadata.jurisdiction) {
    for (const pattern of jurisdictionPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Common state names
        const states = ['Michigan', 'California', 'New York', 'Texas', 'Florida', 'Illinois'];
        const found = matches.find(m => states.some(s => m.includes(s)));
        if (found) {
          metadata.jurisdiction = found.replace(/State of |Commonwealth of /g, '').trim();
          break;
        }
      }
    }
  }

  // Extract court names
  if (!existingMetadata.court) {
    const courtPatterns = [
      /([A-Z][a-z]+ (?:Circuit|District|Superior|Supreme|Appellate) Court)/g,
      /([A-Z][a-z]+ County (?:Circuit|District) Court)/g,
    ];
    
    for (const pattern of courtPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.court = match[0];
        break;
      }
    }
  }

  // Extract county names
  if (!existingMetadata.county) {
    const countyPattern = /([A-Z][a-z]+ County)/g;
    const match = text.match(countyPattern);
    if (match) {
      metadata.county = match[0];
    }
  }

  // Extract judge/referee names
  if (!existingMetadata.judgeReferee) {
    const judgePatterns = [
      /(?:Judge|Hon\.|Honorable)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
      /(?:Referee|Magistrate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
    ];
    
    for (const pattern of judgePatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.judgeReferee = match[1];
        break;
      }
    }
  }

  return metadata;
}

/**
 * Process a single queue item
 */
async function processQueueItem(queueItem: IngestQueueItem): Promise<void> {
  try {
    // Mark as processing
    await updateIngestQueueItem(queueItem.id, {
      status: 'processing',
      attempts: queueItem.attempts + 1,
    });
    
    // Get the library item
    const libraryItem = await getLibraryItem(queueItem.libraryItemId);
    if (!libraryItem) {
      throw new Error(`Library item not found: ${queueItem.libraryItemId}`);
    }
    
    console.log(`[Library Ingest Worker] Processing: ${libraryItem.filename}`);
    
    // Get the storage location
    const locations = await getLibraryLocations(libraryItem.userId);
    const location = locations.find(loc => loc.id === libraryItem.locationId);
    if (!location) {
      throw new Error(`Storage location not found: ${libraryItem.locationId}`);
    }

    // Step 1: Extract document content
    console.log(`[Library Ingest Worker] Extracting content from ${libraryItem.filepath}`);
    const { text, metadata: extractionMetadata } = await extractDocumentContent(libraryItem, location);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    // Step 2: Classify document type (if not already classified)
    console.log(`[Library Ingest Worker] Classifying document type`);
    const sourceType = await classifyDocumentType(text, libraryItem.filename, libraryItem.sourceType);
    
    // Step 3: Extract and tag metadata
    console.log(`[Library Ingest Worker] Extracting metadata`);
    const extractedMetadata = await extractMetadata(text, libraryItem.filename, libraryItem);
    
    // Update library item with extracted metadata
    const updatedItem: LibraryItem = {
      ...libraryItem,
      sourceType,
      ...extractedMetadata,
      description: libraryItem.description || extractionMetadata.description || undefined,
    };
    
    await upsertLibraryItem(updatedItem);
    
    // Step 4: Ingest into RAG system with actual text
    console.log(`[Library Ingest Worker] Ingesting into RAG system`);
    const vectorIds = await ingestLibraryItem(updatedItem, text);
    
    // Update library item with ingestion status
    await upsertLibraryItem({
      ...updatedItem,
      ingested: true,
      ingestedAt: new Date(),
      vectorIds,
    });
    
    // Mark as completed
    await updateIngestQueueItem(queueItem.id, {
      status: 'completed',
      processedAt: new Date(),
    });
    
    console.log(`[Library Ingest Worker] Successfully processed: ${libraryItem.filename} (${vectorIds.length} vectors)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Logging queue item ID for debugging - IDs are non-sensitive identifiers
    console.error(`[Library Ingest Worker] Error processing queue item ${queueItem.id}:`, errorMessage); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
    
    // Check if we should retry
    const shouldRetry = queueItem.attempts < queueItem.maxAttempts;
    
    await updateIngestQueueItem(queueItem.id, {
      status: shouldRetry ? 'pending' : 'failed',
      error: errorMessage,
    });
    
    if (!shouldRetry) {
      console.error(`[Library Ingest Worker] Max attempts reached for ${queueItem.id}. Marking as failed.`);
    }
  }
}

/**
 * Process the ingest queue
 * @param maxConcurrent - Maximum number of items to process concurrently (default: 1)
 */
export async function processIngestQueue(maxConcurrent: number = 1): Promise<void> {
  console.log('[Library Ingest Worker] Starting queue processing');
  
  try {
    // Get pending items (sorted by priority)
    const pendingItems = await getIngestQueue(undefined, 'pending');
    
    if (pendingItems.length === 0) {
      console.log('[Library Ingest Worker] No pending items in queue');
      return;
    }
    
    console.log(`[Library Ingest Worker] Processing ${pendingItems.length} items (max concurrent: ${maxConcurrent})`);
    
    // Process items with concurrency control
    if (maxConcurrent === 1) {
      // Sequential processing
      for (const item of pendingItems) {
        await processQueueItem(item);
      }
    } else {
      // Parallel processing with concurrency limit
      const chunks: IngestQueueItem[][] = [];
      for (let i = 0; i < pendingItems.length; i += maxConcurrent) {
        chunks.push(pendingItems.slice(i, i + maxConcurrent));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(item => processQueueItem(item)));
      }
    }
    
    console.log('[Library Ingest Worker] Queue processing completed');
  } catch (error) {
    console.error('[Library Ingest Worker] Error processing queue:', error);
    throw error;
  }
}

/**
 * Main worker loop
 */
export async function startWorker(intervalMs: number = 60000): Promise<void> {
  console.log('[Library Ingest Worker] Starting worker');
  
  // Process immediately
  await processIngestQueue().catch(err => {
    console.error('[Library Ingest Worker] Initial processing failed:', err);
  });
  
  // Schedule periodic processing
  setInterval(async () => {
    await processIngestQueue().catch(err => {
      console.error('[Library Ingest Worker] Periodic processing failed:', err);
    });
  }, intervalMs);
}

// If run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker().catch(err => {
    console.error('[Library Ingest Worker] Fatal error:', err);
    process.exit(1);
  });
}

