/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * OneDrive Connector
 * 
 * Integrates with Microsoft OneDrive via Microsoft Graph API to sync library items.
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { FileChange, ConnectorConfig, StorageConnector, withRetry, RateLimiter } from './base-connector.js';

/**
 * OneDrive Connector Implementation
 */
class OneDriveConnector implements StorageConnector {
  private rateLimiter: RateLimiter;

  constructor() {
    // Microsoft Graph API rate limits: 10,000 requests per 10 minutes per app
    this.rateLimiter = new RateLimiter(100, 60000); // Conservative: 100 requests per minute
  }

  private getClient(credentials?: Record<string, any>): Client {
    if (!credentials?.accessToken) {
      throw new Error('OneDrive access token is required. Please authenticate first.');
    }

    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => credentials.accessToken,
      } as any,
    });
  }

  private async listFilesRecursive(
    client: Client,
    folderPath: string,
    lastSyncAt?: Date
  ): Promise<FileChange[]> {
    await this.rateLimiter.check();

    const changes: FileChange[] = [];
    
    try {
      // Convert path to OneDrive item path format
      const drivePath = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
      const itemPath = drivePath === '/' ? '/drive/root' : `/drive/root:${drivePath}:`;

      // Get folder contents
      const response = await withRetry(async () => {
        return await client.api(`${itemPath}/children`).get();
      });

      const items = response.value || [];

      for (const item of items) {
        if (item.folder) {
          // Recursively scan subfolders
          const subPath = `${folderPath}/${item.name}`;
          const subChanges = await this.listFilesRecursive(client, subPath, lastSyncAt);
          changes.push(...subChanges);
        } else if (item.file) {
          // Check if file was modified since last sync
          const modifiedAt = item.lastModifiedDateTime 
            ? new Date(item.lastModifiedDateTime)
            : new Date(item.createdDateTime);

          if (!lastSyncAt || modifiedAt > lastSyncAt) {
            changes.push({
              type: lastSyncAt ? 'modified' : 'added',
              path: `${folderPath}/${item.name}`,
              filename: item.name,
              size: item.size,
              modifiedAt,
              mimeType: item.file?.mimeType,
              etag: item.eTag,
            });
          }
        }
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`OneDrive path not found: ${folderPath}`);
      }
      if (error.statusCode === 401) {
        throw new Error('OneDrive authentication failed. Please re-authenticate.');
      }
      throw error;
    }

    return changes;
  }

  async listChanges(config: ConnectorConfig): Promise<FileChange[]> {
    return withRetry(async () => {
      const { path, credentials, lastSyncAt } = config;

      if (!path) {
        throw new Error('Path is required for OneDrive connector');
      }

      const client = this.getClient(credentials);
      const normalizedPath = path.replace(/^\/+/, ''); // Remove leading slashes

      return await this.listFilesRecursive(client, normalizedPath, lastSyncAt);
    });
  }

  async downloadFile(filePath: string, config: ConnectorConfig): Promise<Buffer> {
    return withRetry(async () => {
      const { credentials } = config;
      const client = this.getClient(credentials);

      // Convert path to OneDrive item path
      const drivePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const itemPath = `/drive/root:${drivePath}:`;

      await this.rateLimiter.check();

      try {
        const stream = await client.api(`${itemPath}/content`).getStream();
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        
        return Buffer.concat(chunks);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new Error(`File not found: ${filePath}`);
        }
        throw error;
      }
    });
  }

  async uploadFile(filePath: string, fileData: Buffer, config: ConnectorConfig): Promise<void> {
    return withRetry(async () => {
      const { credentials } = config;
      const client = this.getClient(credentials);

      // Convert path to OneDrive item path
      const drivePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const itemPath = `/drive/root:${drivePath}:`;

      await this.rateLimiter.check();

      try {
        // Try to upload directly (will work if file exists or parent exists)
        await client.api(`${itemPath}/content`).put(fileData);
      } catch (error: any) {
        // If file doesn't exist, create it first
        if (error.statusCode === 404) {
          // Extract parent path and filename
          const pathParts = drivePath.split('/').filter(p => p);
          const filename = pathParts.pop() || filePath;
          const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
          const parentItemPath = parentPath === '/' ? '/drive/root' : `/drive/root:${parentPath}:`;

          // Create file item
          await this.rateLimiter.check();
          const createResponse = await client.api(`${parentItemPath}:/children`).post({
            name: filename,
            file: {},
            '@microsoft.graph.conflictBehavior': 'replace',
          });

          // Upload content to the newly created file
          const newItemId = createResponse.id;
          await this.rateLimiter.check();
          await client.api(`/me/drive/items/${newItemId}/content`).put(fileData);
        } else {
          throw error;
        }
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
      const client = this.getClient(credentials);

      const drivePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const itemPath = `/drive/root:${drivePath}:`;

      await this.rateLimiter.check();

      const item = await client.api(itemPath).get();

      if (!item || item.folder) {
        return null;
      }

      return {
        size: item.size || 0,
        modifiedAt: item.lastModifiedDateTime 
          ? new Date(item.lastModifiedDateTime)
          : new Date(item.createdDateTime),
        mimeType: item.file?.mimeType,
        etag: item.eTag,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async testConnection(config: ConnectorConfig): Promise<boolean> {
    try {
      const { credentials } = config;
      const client = this.getClient(credentials);

      await this.rateLimiter.check();

      // Test by getting root drive info
      await client.api('/me/drive').get();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const oneDriveConnector = new OneDriveConnector();

// Export functions for backward compatibility
export async function listChanges(
  path: string,
  credentials?: Record<string, any>,
  lastSyncAt?: Date
): Promise<FileChange[]> {
  return oneDriveConnector.listChanges({ path, credentials, lastSyncAt });

}
}
}
}
}
)
}
}