/**
 * Local Filesystem Storage Service for Arkiver
 * 
 * Handles file uploads, retrieval, and cleanup with 30-day retention policy.
 * Designed with abstraction layer for future S3 migration.
 * 
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import crypto from 'crypto';
import { safeJoin } from '../../../utils/secure-path.js';

/**
 * Storage configuration
 */
export interface StorageConfig {
  uploadDir: string; // Base upload directory
  maxFileSize?: number; // Max file size in bytes (default: 100MB)
  allowedMimeTypes?: string[]; // Allowed MIME types (default: all)
  cleanupAfterDays?: number; // Days to keep files after processing (default: 30)
  inactivityCleanupDays?: number; // Days to keep unprocessed files (default: 7)
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  filename: string;
  originalName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string; // SHA-256 hash for integrity verification
  uploadedAt: Date;
}

/**
 * Storage operation result
 */
export interface StorageResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  filesChecked: number;
  filesDeleted: number;
  bytesReclaimed: number;
  errors: string[];
}

/**
 * Abstract storage interface for future S3 migration
 */
export interface StorageProvider {
  upload(file: Buffer | NodeJS.ReadableStream, filename: string, mimeType: string): Promise<StorageResult>;
  download(storagePath: string): Promise<Buffer | null>;
  delete(storagePath: string): Promise<boolean>;
  exists(storagePath: string): Promise<boolean>;
  cleanup(olderThanDays: number): Promise<CleanupStats>;
}

/**
 * Local filesystem storage implementation
 */
export class LocalStorageProvider implements StorageProvider {
  private config: Required<StorageConfig>;

  constructor(config: StorageConfig) {
    this.config = {
      uploadDir: config.uploadDir,
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB default
      allowedMimeTypes: config.allowedMimeTypes || [], // Empty = allow all
      cleanupAfterDays: config.cleanupAfterDays || 30,
      inactivityCleanupDays: config.inactivityCleanupDays || 7,
    };
  }

  /**
   * Initialize storage (create directories if needed)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.uploadDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a file to local storage
   */
  async upload(
    file: Buffer | NodeJS.ReadableStream,
    originalName: string,
    mimeType: string
  ): Promise<StorageResult> {
    try {
      // Validate file size (if Buffer)
      if (Buffer.isBuffer(file) && file.length > this.config.maxFileSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed (${this.config.maxFileSize} bytes)`,
        };
      }

      // Validate MIME type
      if (this.config.allowedMimeTypes.length > 0 && !this.config.allowedMimeTypes.includes(mimeType)) {
        return {
          success: false,
          error: `MIME type '${mimeType}' not allowed`,
        };
      }

      // Generate unique filename with timestamp and random suffix
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(originalName);
      const basename = path.basename(originalName, ext);
      const safeBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${timestamp}_${randomSuffix}_${safeBasename}${ext}`;

      // Organize by date (YYYY/MM/DD) for easier management
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const subdir = path.join(year.toString(), month, day);
      const fullDir = safeJoin(this.config.uploadDir, subdir);

      // Create subdirectory
      await fs.mkdir(fullDir, { recursive: true });

      // Full storage path
      // Both subdir and filename are application-generated, not user-controlled - safe join
      const storagePath = path.join(subdir, filename); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const fullPath = safeJoin(this.config.uploadDir, storagePath);

      // Write file
      if (Buffer.isBuffer(file)) {
        await fs.writeFile(fullPath, file);
      } else {
        // Stream to file
        await this.streamToFile(file, fullPath);
      }

      // Calculate file size and checksum
      const stats = await fs.stat(fullPath);
      const checksum = await this.calculateChecksum(fullPath);

      return {
        success: true,
        file: {
          filename,
          originalName,
          storagePath,
          fileSize: stats.size,
          mimeType,
          checksum,
          uploadedAt: now,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during upload',
      };
    }
  }

  /**
   * Download a file from storage
   */
  async download(storagePath: string): Promise<Buffer | null> {
    try {
      const fullPath = safeJoin(this.config.uploadDir, storagePath);
      const exists = await this.exists(storagePath);
      
      if (!exists) {
        return null;
      }

      return await fs.readFile(fullPath);
    } catch (error) {
      // Logging storage path for debugging - paths are application-controlled
      console.error(`Failed to download file ${storagePath}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
      return null;
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(storagePath: string): Promise<boolean> {
    try {
      const fullPath = safeJoin(this.config.uploadDir, storagePath);
      await fs.unlink(fullPath);
      
      // Try to remove empty parent directories (optional cleanup)
      await this.removeEmptyParents(fullPath);
      
      return true;
    } catch (error) {
      // Logging storage path for debugging - paths are application-controlled
      console.error(`Failed to delete file ${storagePath}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
      return false;
    }
  }

  /**
   * Check if a file exists in storage
   */
  async exists(storagePath: string): Promise<boolean> {
    try {
      const fullPath = safeJoin(this.config.uploadDir, storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup old files based on retention policy
   * 
   * @param olderThanDays Delete files older than this many days
   * @returns Statistics about cleanup operation
   */
  async cleanup(olderThanDays: number = this.config.cleanupAfterDays): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesChecked: 0,
      filesDeleted: 0,
      bytesReclaimed: 0,
      errors: [],
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      await this.cleanupRecursive(this.config.uploadDir, cutoffDate, stats);
    } catch (error) {
      stats.errors.push(error instanceof Error ? error.message : 'Unknown cleanup error');
    }

    return stats;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    let oldestFile: Date | null = null;
    let newestFile: Date | null = null;

    const processDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
          const fullPath = path.join(dir, entry.name); // Safe - controlled directory scan

          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalFiles++;
            totalSize += stats.size;

            if (!oldestFile || stats.mtime < oldestFile) {
              oldestFile = stats.mtime;
            }
            if (!newestFile || stats.mtime > newestFile) {
              newestFile = stats.mtime;
            }
          }
        }
      } catch (error) {
        // Ignore directories that can't be read
      }
    };

    try {
      await processDirectory(this.config.uploadDir);
    } catch (error) {
      // Ignore errors
    }

    return { totalFiles, totalSize, oldestFile, newestFile };
  }

  // Private helper methods

  private async streamToFile(stream: NodeJS.ReadableStream, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filepath);
      stream.pipe(writeStream);
      
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filepath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async cleanupRecursive(dir: string, cutoffDate: Date, stats: CleanupStats): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const fullPath = path.join(dir, entry.name); // Safe - controlled directory scan

        if (entry.isDirectory()) {
          await this.cleanupRecursive(fullPath, cutoffDate, stats);
          
          // Try to remove empty directory
          try {
            const remaining = await fs.readdir(fullPath);
            if (remaining.length === 0) {
              await fs.rmdir(fullPath);
            }
          } catch {
            // Ignore errors
          }
        } else if (entry.isFile()) {
          stats.filesChecked++;

          try {
            const fileStat = await fs.stat(fullPath);
            
            if (fileStat.mtime < cutoffDate) {
              await fs.unlink(fullPath);
              stats.filesDeleted++;
              stats.bytesReclaimed += fileStat.size;
            }
          } catch (error) {
            stats.errors.push(`Failed to process ${fullPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      stats.errors.push(`Failed to read directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async removeEmptyParents(filepath: string): Promise<void> {
    let currentDir = path.dirname(filepath);
    const rootDir = this.config.uploadDir;

    while (currentDir !== rootDir && currentDir.startsWith(rootDir)) {
      try {
        const entries = await fs.readdir(currentDir);
        if (entries.length === 0) {
          await fs.rmdir(currentDir);
          currentDir = path.dirname(currentDir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

/**
 * Factory function to create storage provider
 * Future: Can return S3Provider or other implementations
 */
export function createStorageProvider(type: 'local' | 's3', config: StorageConfig): StorageProvider {
  switch (type) {
    case 'local':
      return new LocalStorageProvider(config);
    case 's3':
      throw new Error(
        'S3 storage requires AWS credentials and S3 bucket configuration. ' +
        'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables. ' +
        'S3 storage implementation pending - use local storage for now.'
      );
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}

/**
 * Default storage provider instance
 * Uses local filesystem with uploads in project root
 */
export const defaultStorage = new LocalStorageProvider({
  uploadDir: path.join(process.cwd(), 'uploads', 'arkiver'),
  maxFileSize: 100 * 1024 * 1024, // 100MB
  cleanupAfterDays: 30,
  inactivityCleanupDays: 7,
});

}
}
}
}
}
}
}
}
}