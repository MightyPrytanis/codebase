/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Local Filesystem Connector
 * 
 * Scans local filesystem directories for library items and detects changes.
 * Supports recursive directory scanning and file watching.
 */

import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { FileChange, ConnectorConfig, StorageConnector, withRetry } from './base-connector.js';
import { safeJoin } from '../../../utils/secure-path.js';

// Supported file extensions for library items
const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.txt', '.rtf',
  '.xlsx', '.xls', '.csv',
  '.html', '.htm',
  '.json', '.xml',
  '.png', '.jpg', '.jpeg', '.tiff', '.tif', // For OCR
];

/**
 * Recursively scan directory for files
 */
async function scanDirectory(
  dirPath: string,
  lastSyncAt?: Date,
  basePath: string = dirPath
): Promise<FileChange[]> {
  const changes: FileChange[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const fullPath = join(dirPath, entry.name); // Safe - controlled directory scan from trusted base
      const relativePath = fullPath.replace(basePath + '/', '').replace(basePath + '\\', '');

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subChanges = await scanDirectory(fullPath, lastSyncAt, basePath);
        changes.push(...subChanges);
      } else if (entry.isFile()) {
        // Check if file extension is supported
        const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          continue;
        }

        try {
          const stats = await fs.stat(fullPath);
          const modifiedAt = stats.mtime;

          // Check if file was modified since last sync
          if (!lastSyncAt || modifiedAt > lastSyncAt) {
            changes.push({
              type: lastSyncAt ? 'modified' : 'added',
              path: relativePath,
              filename: entry.name,
              size: stats.size,
              modifiedAt,
              mimeType: getMimeType(ext),
            });
          }
        } catch (statError) {
          // Skip files we can't stat (permissions, etc.)
          // Logging file path for debugging - paths are application-controlled
          console.warn(`[Local Connector] Cannot stat file ${fullPath}:`, statError); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw error;
  }

  return changes;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Local Filesystem Connector Implementation
 */
class LocalConnector implements StorageConnector {
  async listChanges(config: ConnectorConfig): Promise<FileChange[]> {
    return withRetry(async () => {
      const { path, lastSyncAt } = config;
      
      if (!path) {
        throw new Error('Path is required for local connector');
      }

      // Check if path exists and is a directory
      try {
        const stats = await fs.stat(path);
        if (!stats.isDirectory()) {
          throw new Error(`Path is not a directory: ${path}`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`Directory not found: ${path}`);
        }
        throw error;
      }

      return await scanDirectory(path, lastSyncAt, path);
    });
  }

  async downloadFile(filePath: string, config: ConnectorConfig): Promise<Buffer> {
    return withRetry(async () => {
      const fullPath = safeJoin(config.path, filePath);
      
      try {
        return await fs.readFile(fullPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`File not found: ${fullPath}`);
        }
        throw error;
      }
    });
  }

  async uploadFile(filePath: string, fileData: Buffer, config: ConnectorConfig): Promise<void> {
    return withRetry(async () => {
      const fullPath = safeJoin(config.path, filePath);
      
      // Ensure directory exists
      await fs.mkdir(dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, fileData);
    });
  }

  async getFileMetadata(filePath: string, config: ConnectorConfig): Promise<{
    size: number;
    modifiedAt: Date;
    mimeType?: string;
    etag?: string;
  } | null> {
    try {
      const fullPath = safeJoin(config.path, filePath);
      const stats = await fs.stat(fullPath);
      const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));

      return {
        size: stats.size,
        modifiedAt: stats.mtime,
        mimeType: getMimeType(ext),
        etag: `${stats.mtime.getTime()}-${stats.size}`, // Simple etag based on mtime and size
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async testConnection(config: ConnectorConfig): Promise<boolean> {
    try {
      if (!config.path) {
        return false;
      }

      const stats = await fs.stat(config.path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const localConnector = new LocalConnector();

// Export functions for backward compatibility
export async function listChanges(
  path: string,
  lastSyncAt?: Date
): Promise<FileChange[]> {
  return localConnector.listChanges({ path, lastSyncAt });
}

