/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Base Connector Interface
 * 
 * Defines the common interface for all storage connectors (local, OneDrive, Google Drive, S3)
 */

export interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  filename: string;
  size?: number;
  modifiedAt?: Date;
  mimeType?: string;
  etag?: string; // For change detection
}

export interface ConnectorConfig {
  path: string;
  credentials?: Record<string, any>;
  lastSyncAt?: Date;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface StorageConnector {
  /**
   * List file changes since last sync
   */
  listChanges(config: ConnectorConfig): Promise<FileChange[]>;

  /**
   * Download a file from storage
   */
  downloadFile(filePath: string, config: ConnectorConfig): Promise<Buffer>;

  /**
   * Upload a file to storage
   */
  uploadFile(filePath: string, fileData: Buffer, config: ConnectorConfig): Promise<void>;

  /**
   * Get file metadata
   */
  getFileMetadata(filePath: string, config: ConnectorConfig): Promise<{
    size: number;
    modifiedAt: Date;
    mimeType?: string;
    etag?: string;
  } | null>;

  /**
   * Test connection/authentication
   */
  testConnection(config: ConnectorConfig): Promise<boolean>;
}

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async check(): Promise<void> {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Clean up again after waiting
        this.requests = this.requests.filter(time => Date.now() - time < this.windowMs);
      }
    }

    this.requests.push(Date.now());
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

