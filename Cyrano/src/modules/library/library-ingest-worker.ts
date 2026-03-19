/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Ingest Worker
 *
 * Processes the ingest queue, extracting document text from storage connectors
 * and ingesting it into the RAG vector store with appropriate metadata.
 *
 * Responsibilities:
 * - Poll the ingest queue for pending items
 * - Download the document from the appropriate storage connector
 * - Extract text from the document (PDF, DOCX, TXT, etc.)
 * - Auto-classify document type from content when not already set
 * - Ingest text + metadata into the RAG service
 * - Update queue item and library item state
 * - Emit progress events for UI notification
 * - Retry failed items up to maxAttempts
 */

import { EventEmitter } from 'events';
import { getIngestQueue, updateIngestQueueItem, getLibraryItem, upsertLibraryItem, getLibraryLocations } from '../../services/library-service.js';
import { getConnector } from './connectors/index.js';
import { RAGService, Document } from '../../services/rag-service.js';
import { IngestQueueItem, LibraryItem } from './library-model.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Polling interval when the queue is idle (ms). */
const IDLE_POLL_MS = 30_000;

/** Polling interval while actively processing (ms). */
const ACTIVE_POLL_MS = 2_000;

/** Maximum text length sent to the RAG service in one Document. */
const MAX_TEXT_LENGTH = 500_000;

// ---------------------------------------------------------------------------
// Text extraction helpers
// ---------------------------------------------------------------------------

function isModuleNotFoundError(error: unknown, moduleName: string): boolean {
  const err = error as { code?: string; message?: unknown } | null | undefined;
  if (!err) return false;

  const code = err.code;
  if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
    const msg = typeof err.message === 'string' ? err.message : '';
    // Be conservative: ensure the message references the moduleName when available
    return msg ? msg.includes(moduleName) : true;
  }

  return false;
}

/**
 * Extract text from a file buffer based on MIME type / filename extension.
 *
 * Returns the best-effort plain text.  Errors are surfaced to the caller so
 * the ingest worker can mark the queue item as failed with a meaningful message.
 */
async function extractText(filename: string, buffer: Buffer, mimeType?: string): Promise<string> {
  const dotIndex = filename.lastIndexOf('.');
  const ext = dotIndex >= 0 ? filename.toLowerCase().substring(dotIndex) : '';
  const type = mimeType?.toLowerCase() || '';

  // PDF
  if (ext === '.pdf' || type.includes('pdf')) {
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const pdfParse = require('pdf-parse');
      const parsed = await (typeof pdfParse === 'function' ? pdfParse(buffer) : pdfParse.default(buffer));
      return (parsed.text || '').trim();
    } catch (error: unknown) {
      if (isModuleNotFoundError(error, 'pdf-parse')) {
        throw new Error('pdf-parse is required for PDF extraction. Install with: npm install pdf-parse', { cause: error as Error });
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract text from PDF: ${message}`, { cause: error as Error });
    }
  }

  // DOCX
  if (ext === '.docx' || type.includes('wordprocessingml') || type.includes('msword')) {
    try {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    } catch (error: unknown) {
      if (isModuleNotFoundError(error, 'mammoth')) {
        throw new Error('mammoth is required for DOCX extraction. Install with: npm install mammoth', { cause: error as Error });
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract text from DOCX: ${message}`, { cause: error as Error });
    }
  }

  // Plain text / CSV / HTML / JSON / XML
  if (
    ext === '.txt' || ext === '.csv' || ext === '.rtf' ||
    ext === '.html' || ext === '.htm' ||
    ext === '.json' || ext === '.xml' ||
    type.startsWith('text/')
  ) {
    return buffer.toString('utf-8').trim();
  }

  throw new Error(`Unsupported file type: ${ext} (${mimeType ?? 'unknown MIME type'})`);
}

/**
 * Attempt to infer the document sourceType from its text content when the
 * library item has sourceType === 'other'.  Returns the best guess, or keeps
 * 'other' if nothing matches.
 */
function classifyDocumentType(
  text: string,
  filename: string,
  current: LibraryItem['sourceType']
): LibraryItem['sourceType'] {
  if (current !== 'other') {
    return current;
  }

  const lower = (text.substring(0, 4000) + ' ' + filename).toLowerCase();

  if (/standing order|administrative order/.test(lower)) return 'standing-order';
  if (/local rule|court rule|l\.r\.|lcr\b/.test(lower)) return 'rule';
  if (/\bstatute\b|mcl\b|msa\b|usc\b|u\.s\.c\./.test(lower)) return 'statute';
  if (/\btemplate\b|fill in the blank|[_]{5,}/.test(lower)) return 'template';
  if (/\bplaybook\b|best practice/.test(lower)) return 'playbook';
  if (/opinion|plaintiff|defendant|appellant|appellee/.test(lower)) return 'case-law';

  return 'other';
}

// ---------------------------------------------------------------------------
// Worker class
// ---------------------------------------------------------------------------

/**
 * Events emitted by LibraryIngestWorker:
 * - `started`  — worker polling loop began
 * - `stopped`  — worker polling loop ended
 * - `processing` (queueItemId, libraryItemId) — started processing an item
 * - `completed` (queueItemId, libraryItemId, vectorIds) — item ingested
 * - `failed`   (queueItemId, libraryItemId, error) — item permanently failed
 * - `error`    (error) — unexpected worker-level error
 */
export class LibraryIngestWorker extends EventEmitter {
  private ragService: RAGService;
  private running = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.ragService = new RAGService();
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Start the background polling loop. Safe to call multiple times. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.emit('started');
    void this.poll();
  }

  /** Stop the background polling loop gracefully. */
  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.emit('stopped');
  }

  // -------------------------------------------------------------------------
  // Polling loop
  // -------------------------------------------------------------------------

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      const processed = await this.processBatch();
      const delay = processed > 0 ? ACTIVE_POLL_MS : IDLE_POLL_MS;
      this.pollTimer = setTimeout(() => void this.poll(), delay);
    } catch (err) {
      this.emit('error', err);
      this.pollTimer = setTimeout(() => void this.poll(), IDLE_POLL_MS);
    }
  }

  /**
   * Fetch and process a batch of pending queue items.
   *
   * @returns The number of items attempted.
   */
  async processBatch(): Promise<number> {
    // First, reset any items that were left in "processing" (e.g. after a crash)
    await this.resetStuckProcessingItems();

    const pendingItems = await getIngestQueue(undefined, 'pending');
    if (pendingItems.length === 0) return 0;

    // Process up to 5 items concurrently
    const batch = pendingItems.slice(0, 5);
    await Promise.all(batch.map(item => this.processItem(item)));
    return batch.length;
  }

  /**
   * Reset any queue items stuck in "processing" state back to "pending" so they
   * can be retried on subsequent polls.
   */
  private async resetStuckProcessingItems(): Promise<void> {
    const processingItems = await getIngestQueue(undefined, 'processing');
    if (!processingItems || processingItems.length === 0) {
      return;
    }

    await Promise.all(
      processingItems.map(item =>
        updateIngestQueueItem(item.id, {
          status: 'pending',
        }),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Single-item processing
  // -------------------------------------------------------------------------

  /** Process one ingest queue item end-to-end. */
  async processItem(queueItem: IngestQueueItem): Promise<void> {
    // Mark as processing
    await updateIngestQueueItem(queueItem.id, {
      status: 'processing',
      attempts: queueItem.attempts + 1,
    });

    this.emit('processing', queueItem.id, queueItem.libraryItemId);

    try {
      const vectorIds = await this.ingestLibraryItem(queueItem.libraryItemId, queueItem.userId);

      await updateIngestQueueItem(queueItem.id, {
        status: 'completed',
        processedAt: new Date(),
      });

      this.emit('completed', queueItem.id, queueItem.libraryItemId, vectorIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const newAttempts = queueItem.attempts + 1;
      const permanentFailure = newAttempts >= queueItem.maxAttempts;

      await updateIngestQueueItem(queueItem.id, {
        status: permanentFailure ? 'failed' : 'pending',
        error: errorMessage,
        attempts: newAttempts,
      });

      if (permanentFailure) {
        this.emit('failed', queueItem.id, queueItem.libraryItemId, errorMessage);
      }
      // If not permanent, will be retried on next poll
    }
  }

  /**
   * Perform the full ingest pipeline for a single library item:
   * 1. Look up the item and its storage location
   * 2. Download the file from the appropriate connector
   * 3. Extract text
   * 4. Auto-classify document type
   * 5. Ingest into RAG
   * 6. Mark the library item as ingested
   *
   * @returns The vector IDs created in the RAG store.
   */
  async ingestLibraryItem(libraryItemId: string, userId: string): Promise<string[]> {
    // 1. Look up the library item
    const item = await getLibraryItem(libraryItemId);
    if (!item) {
      throw new Error(`Library item not found: ${libraryItemId}`);
    }

    // 2. Find the storage location
    const locations = await getLibraryLocations(userId);
    const location = locations.find(loc => loc.id === item.locationId);
    if (!location) {
      throw new Error(`Storage location not found for library item: ${libraryItemId}`);
    }

    // 3. Download the file
    const connector = getConnector(location.type);
    const fileBuffer = await connector.downloadFile(item.filepath, {
      path: location.path,
      credentials: location.credentials,
    });

    // 4. Extract text
    const rawText = await extractText(item.filename, fileBuffer, item.fileType);
    const text = rawText.substring(0, MAX_TEXT_LENGTH);

    if (!text) {
      throw new Error(`No text could be extracted from ${item.filename}`);
    }

    // 5. Auto-classify document type if needed
    const inferredSourceType = classifyDocumentType(text, item.filename, item.sourceType);
    if (inferredSourceType !== item.sourceType) {
      await upsertLibraryItem({
        ...item,
        sourceType: inferredSourceType,
      });
    }

    // 6. Ingest into RAG
    const document: Document = {
      id: libraryItemId,
      text,
      type: inferredSourceType,
      source: `library:${item.locationId}`,
      sourceType: 'user-upload',
      metadata: {
        documentType: inferredSourceType,
        libraryItemId,
        filename: item.filename,
        filepath: item.filepath,
        title: item.title,
        description: item.description,
        jurisdiction: item.jurisdiction,
        county: item.county,
        court: item.court,
        judgeReferee: item.judgeReferee,
        issueTags: item.issueTags,
        practiceAreas: item.practiceAreas,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
        dateCreated: item.dateCreated,
        dateModified: item.dateModified,
        pinned: item.pinned,
        superseded: item.superseded,
        supersededBy: item.supersededBy,
      },
    };

    const vectorIds = await this.ragService.ingestDocument(document);

    // 7. Mark library item as ingested
    await upsertLibraryItem({
      ...item,
      sourceType: inferredSourceType,
      ingested: true,
      ingestedAt: new Date(),
      vectorIds,
    });

    return vectorIds;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Shared ingest worker instance. Call `.start()` to begin processing. */
export const libraryIngestWorker = new LibraryIngestWorker();
