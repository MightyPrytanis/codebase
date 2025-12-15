/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Ingest Worker
 * 
 * Processes the library ingest queue:
 * 1. Extract document content
 * 2. Classify document type
 * 3. Tag with metadata
 * 4. Ingest into RAG system
 */

import { 
  getIngestQueue, 
  updateIngestQueueItem, 
  getLibraryItem,
  upsertLibraryItem 
} from '../services/library-service.js';
import { ingestLibraryItem } from '../services/rag-library.js';
import { IngestQueueItem } from '../modules/library/library-model.js';

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
    
    // Step 1: Extract document content
    // TODO: Use document processor to extract text
    console.log(`[Library Ingest Worker] Extracting content from ${libraryItem.filepath}`);
    
    // Step 2: Classify document type (if not already classified)
    // TODO: Use AI to classify document type
    console.log(`[Library Ingest Worker] Classifying document type: ${libraryItem.sourceType}`);
    
    // Step 3: Tag with metadata
    // TODO: Extract and tag metadata (jurisdiction, court, etc.)
    console.log(`[Library Ingest Worker] Tagging metadata`);
    
    // Step 4: Ingest into RAG system
    console.log(`[Library Ingest Worker] Ingesting into RAG system`);
    const vectorIds = await ingestLibraryItem(libraryItem);
    
    // Update library item with ingestion status
    await upsertLibraryItem({
      ...libraryItem,
      ingested: true,
      ingestedAt: new Date(),
      vectorIds,
    });
    
    // Mark as completed
    await updateIngestQueueItem(queueItem.id, {
      status: 'completed',
      processedAt: new Date(),
    });
    
    console.log(`[Library Ingest Worker] Successfully processed: ${libraryItem.filename}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Library Ingest Worker] Error processing queue item ${queueItem.id}:`, errorMessage);
    
    // Check if we should retry
    const shouldRetry = queueItem.attempts < queueItem.maxAttempts;
    
    await updateIngestQueueItem(queueItem.id, {
      status: shouldRetry ? 'pending' : 'failed',
      error: errorMessage,
    });
  }
}

/**
 * Process the ingest queue
 */
export async function processIngestQueue(): Promise<void> {
  console.log('[Library Ingest Worker] Starting queue processing');
  
  try {
    // Get pending items
    const pendingItems = await getIngestQueue(undefined, 'pending');
    
    if (pendingItems.length === 0) {
      console.log('[Library Ingest Worker] No pending items in queue');
      return;
    }
    
    console.log(`[Library Ingest Worker] Processing ${pendingItems.length} items`);
    
    // Process items sequentially (TODO: Consider parallel processing)
    for (const item of pendingItems) {
      await processQueueItem(item);
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
