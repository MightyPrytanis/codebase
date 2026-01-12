/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Google Drive Connector
 * 
 * Integrates with Google Drive API to sync library items.
 * 
 * Note: Requires googleapis package. Install with: npm install googleapis
 */

import { FileChange, ConnectorConfig, StorageConnector, withRetry, RateLimiter } from './base-connector.js';

/**
 * Google Drive Connector Implementation
 */
class GoogleDriveConnector implements StorageConnector {
  private rateLimiter: RateLimiter;
  private driveClient: any; // googleapis.drive.v3.Drive

  constructor() {
    // Google Drive API rate limits: 1,000 requests per 100 seconds per user
    this.rateLimiter = new RateLimiter(100, 100000); // Conservative: 100 requests per 100 seconds
  }

  private async getDriveClient(credentials?: Record<string, any>): Promise<any> {
    try {
      // Dynamic import to avoid requiring googleapis if not installed
      const { google } = await import('googleapis');
      
      if (!credentials?.accessToken && !credentials?.refreshToken) {
        throw new Error('Google Drive access token or refresh token is required. Please authenticate first.');
      }

      const auth = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        credentials.redirectUri
      );

      if (credentials.accessToken) {
        auth.setCredentials({
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken,
        });
      } else if (credentials.refreshToken) {
        auth.setCredentials({
          refresh_token: credentials.refreshToken,
        });
      }

      return google.drive({ version: 'v3', auth });
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('googleapis package is required. Install with: npm install googleapis');
      }
      throw error;
    }
  }

  private async findFolderByName(
    drive: any,
    folderName: string,
    parentId: string = 'root'
  ): Promise<string | null> {
    await this.rateLimiter.check();

    try {
      const response = await drive.files.list({
        q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      return response.data.files?.[0]?.id || null;
    } catch (error) {
      console.error('[Google Drive Connector] Error finding folder:', error);
      return null;
    }
  }

  private async listFilesRecursive(
    drive: any,
    folderId: string,
    folderPath: string,
    lastSyncAt?: Date
  ): Promise<FileChange[]> {
    await this.rateLimiter.check();

    const changes: FileChange[] = [];

    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, createdTime, md5Checksum)',
        spaces: 'drive',
        pageSize: 1000,
      });

      const items = response.data.files || [];

      for (const item of items) {
        const itemPath = `${folderPath}/${item.name}`;

        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Recursively scan subfolders
          const subChanges = await this.listFilesRecursive(drive, item.id, itemPath, lastSyncAt);
          changes.push(...subChanges);
        } else {
          // Regular file
          const modifiedAt = item.modifiedTime 
            ? new Date(item.modifiedTime)
            : new Date(item.createdTime);

          if (!lastSyncAt || modifiedAt > lastSyncAt) {
            changes.push({
              type: lastSyncAt ? 'modified' : 'added',
              path: itemPath,
              filename: item.name,
              size: item.size ? parseInt(item.size) : undefined,
              modifiedAt,
              mimeType: item.mimeType,
              etag: item.md5Checksum,
            });
          }
        }
      }
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Google Drive folder not found: ${folderPath}`);
      }
      if (error.code === 401) {
        throw new Error('Google Drive authentication failed. Please re-authenticate.');
      }
      throw error;
    }

    return changes;
  }

  async listChanges(config: ConnectorConfig): Promise<FileChange[]> {
    return withRetry(async () => {
      const { path, credentials, lastSyncAt } = config;

      if (!path) {
        throw new Error('Path is required for Google Drive connector');
      }

      const drive = await this.getDriveClient(credentials);

      // Path can be a folder ID or a folder path
      let folderId: string;
      let folderPath: string;

      if (path.startsWith('id:')) {
        // Direct folder ID
        folderId = path.substring(3);
        folderPath = path;
      } else {
        // Folder path - need to resolve to ID
        const pathParts = path.split('/').filter(p => p);
        folderId = 'root';
        folderPath = '';

        for (const part of pathParts) {
          const foundId = await this.findFolderByName(drive, part, folderId);
          if (!foundId) {
            throw new Error(`Google Drive folder not found: ${path}`);
          }
          folderId = foundId;
          folderPath = folderPath ? `${folderPath}/${part}` : part;
        }
      }

      return await this.listFilesRecursive(drive, folderId, folderPath, lastSyncAt);
    });
  }

  async downloadFile(filePath: string, config: ConnectorConfig): Promise<Buffer> {
    return withRetry(async () => {
      const { credentials } = config;
      const drive = await this.getDriveClient(credentials);

      // Extract file ID from path (assuming format: id:FILE_ID or path/to/file)
      let fileId: string;
      if (filePath.startsWith('id:')) {
        fileId = filePath.substring(3);
      } else {
        // Would need to resolve path to ID - simplified for now
        throw new Error('File ID required for download. Use format: id:FILE_ID');
      }

      await this.rateLimiter.check();

      try {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data);
      } catch (error: any) {
        if (error.code === 404) {
          throw new Error(`File not found: ${filePath}`);
        }
        throw error;
      }
    });
  }

  async uploadFile(filePath: string, fileData: Buffer, config: ConnectorConfig): Promise<void> {
    return withRetry(async () => {
      const { credentials, path: basePath } = config;
      const drive = await this.getDriveClient(credentials);

      // Resolve parent folder ID
      let parentId: string = 'root';
      if (basePath && !basePath.startsWith('id:')) {
        const pathParts = basePath.split('/').filter(p => p);
        for (const part of pathParts) {
          const foundId = await this.findFolderByName(drive, part, parentId);
          if (!foundId) {
            throw new Error(`Google Drive folder not found: ${basePath}`);
          }
          parentId = foundId;
        }
      } else if (basePath?.startsWith('id:')) {
        parentId = basePath.substring(3);
      }

      // Extract filename from filePath
      const filename = filePath.split('/').pop() || filePath;

      await this.rateLimiter.check();

      // Check if file exists
      const existingFiles = await drive.files.list({
        q: `'${parentId}' in parents and name='${filename}' and trashed=false`,
        fields: 'files(id)',
      });

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        // Update existing file
        const fileId = existingFiles.data.files[0].id!;
        await this.rateLimiter.check();
        await drive.files.update({
          fileId,
          media: {
            mimeType: 'application/octet-stream',
            body: fileData,
          },
        });
      } else {
        // Create new file
        await this.rateLimiter.check();
        await drive.files.create({
          requestBody: {
            name: filename,
            parents: [parentId],
          },
          media: {
            mimeType: 'application/octet-stream',
            body: fileData,
          },
        });
      }
    });
  }

  async getFileMetadata(filePath: string, config: ConnectorConfig): Promise<{
    size: number;
    modifiedAt: Date;
    mimeType?: string;
    etag?: string;
  } | null> {
    try {
      const { credentials } = config;
      const drive = await this.getDriveClient(credentials);

      let fileId: string;
      if (filePath.startsWith('id:')) {
        fileId = filePath.substring(3);
      } else {
        return null; // Would need path resolution
      }

      await this.rateLimiter.check();

      const file = await drive.files.get({
        fileId,
        fields: 'id, name, size, modifiedTime, createdTime, mimeType, md5Checksum',
      });

      if (!file.data || file.data.mimeType === 'application/vnd.google-apps.folder') {
        return null;
      }

      return {
        size: file.data.size ? parseInt(file.data.size) : 0,
        modifiedAt: file.data.modifiedTime 
          ? new Date(file.data.modifiedTime)
          : new Date(file.data.createdTime),
        mimeType: file.data.mimeType,
        etag: file.data.md5Checksum,
      };
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async testConnection(config: ConnectorConfig): Promise<boolean> {
    try {
      const { credentials } = config;
      const drive = await this.getDriveClient(credentials);

      await this.rateLimiter.check();

      // Test by getting about info
      await drive.about.get({ fields: 'user' });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const googleDriveConnector = new GoogleDriveConnector();

// Export functions for backward compatibility
export async function listChanges(
  path: string,
  credentials?: Record<string, any>,
  lastSyncAt?: Date
): Promise<FileChange[]> {
  return googleDriveConnector.listChanges({ path, credentials, lastSyncAt });

}
}
}
)
}