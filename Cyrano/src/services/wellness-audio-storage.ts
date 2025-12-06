/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { promises as fs } from 'fs';
import path from 'path';
import { encryption } from './encryption-service.js';

/**
 * Secure Audio Storage Service
 * 
 * Handles encrypted storage and retrieval of voice journal audio files.
 * Files are stored encrypted on the filesystem with secure, non-predictable paths.
 */

interface StorageConfig {
  basePath: string;
}

class WellnessAudioStorageService {
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      basePath: config?.basePath || process.env.WELLNESS_AUDIO_STORAGE_PATH || './wellness-audio',
    };
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.basePath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize audio storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Store encrypted audio file
   * Returns the encrypted storage path
   */
  async storeAudio(userId: number, entryId: string, audioBuffer: Buffer): Promise<string> {
    try {
      // Encrypt the audio buffer
      const encrypted = encryption.encryptAudioFile(audioBuffer);

      // Create secure directory structure: {basePath}/{userId}/{year}/{month}/
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const userDir = path.join(this.config.basePath, userId.toString());
      const yearDir = path.join(userDir, year.toString());
      const monthDir = path.join(yearDir, month);

      // Create directories
      await fs.mkdir(monthDir, { recursive: true });

      // Generate secure filename: {entryId}_{timestamp}.encrypted
      const timestamp = Date.now();
      const filename = `${entryId}_${timestamp}.encrypted`;
      const filePath = path.join(monthDir, filename);

      // Write encrypted buffer to file
      await fs.writeFile(filePath, encrypted.encrypted);

      // Return relative path from basePath
      return path.relative(this.config.basePath, filePath);
    } catch (error) {
      throw new Error(`Failed to store audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve and decrypt audio file
   */
  async retrieveAudio(userId: number, entryId: string, storagePath: string): Promise<Buffer> {
    try {
      // Construct full path
      const fullPath = path.join(this.config.basePath, storagePath);

      // Verify path is within basePath (security check)
      const resolvedBase = path.resolve(this.config.basePath);
      const resolvedFile = path.resolve(fullPath);
      if (!resolvedFile.startsWith(resolvedBase)) {
        throw new Error('Invalid storage path: path traversal detected');
      }

      // Verify path contains userId (access control)
      if (!resolvedFile.includes(path.sep + userId + path.sep)) {
        throw new Error('Access denied: user ID mismatch');
      }

      // Read encrypted file
      const encryptedBuffer = await fs.readFile(fullPath);

      // Decrypt
      const decrypted = encryption.decryptAudioFile({
        encrypted: encryptedBuffer,
        algorithm: 'aes-256-gcm',
        keyDerivation: 'none',
      });

      return decrypted;
    } catch (error) {
      throw new Error(`Failed to retrieve audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete audio file
   */
  async deleteAudio(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.config.basePath, storagePath);

      // Verify path is within basePath
      const resolvedBase = path.resolve(this.config.basePath);
      const resolvedFile = path.resolve(fullPath);
      if (!resolvedFile.startsWith(resolvedBase)) {
        throw new Error('Invalid storage path: path traversal detected');
      }

      // Delete file
      await fs.unlink(fullPath);
    } catch (error) {
      // Don't throw if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to delete audio: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Cleanup orphaned files (files not referenced in database)
   * This should be run periodically via a scheduled job
   */
  async cleanupOrphanedFiles(referencedPaths: string[]): Promise<number> {
    try {
      let deletedCount = 0;
      const referencedSet = new Set(referencedPaths.map(p => path.resolve(this.config.basePath, p)));

      // Recursively scan basePath
      const scanDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.encrypted')) {
            const resolvedPath = path.resolve(fullPath);
            if (!referencedSet.has(resolvedPath)) {
              await fs.unlink(fullPath);
              deletedCount++;
            }
          }
        }
      };

      await scanDir(this.config.basePath);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned files:', error);
      return 0;
    }
  }
}

// Export singleton instance
let audioStorageService: WellnessAudioStorageService | null = null;

export function getWellnessAudioStorageService(): WellnessAudioStorageService {
  if (!audioStorageService) {
    audioStorageService = new WellnessAudioStorageService();
  }
  return audioStorageService;
}

// Export for direct use
export const wellnessAudioStorage = {
  initialize: async () => {
    const service = getWellnessAudioStorageService();
    return service.initialize();
  },
  storeAudio: async (userId: number, entryId: string, audioBuffer: Buffer) => {
    const service = getWellnessAudioStorageService();
    return service.storeAudio(userId, entryId, audioBuffer);
  },
  retrieveAudio: async (userId: number, entryId: string, storagePath: string) => {
    const service = getWellnessAudioStorageService();
    return service.retrieveAudio(userId, entryId, storagePath);
  },
  deleteAudio: async (storagePath: string) => {
    const service = getWellnessAudioStorageService();
    return service.deleteAudio(storagePath);
  },
  cleanupOrphanedFiles: async (referencedPaths: string[]) => {
    const service = getWellnessAudioStorageService();
    return service.cleanupOrphanedFiles(referencedPaths);
  },
};


