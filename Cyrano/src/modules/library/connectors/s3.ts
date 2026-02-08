/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * AWS S3 Connector
 * 
 * Integrates with AWS S3 to sync library items.
 * 
 * Note: Requires @aws-sdk/client-s3 package. Install with: npm install @aws-sdk/client-s3
 */

import { FileChange, ConnectorConfig, StorageConnector, withRetry, RateLimiter } from './base-connector.js';

/**
 * AWS S3 Connector Implementation
 */
class S3Connector implements StorageConnector {
  private rateLimiter: RateLimiter;

  constructor() {
    // AWS S3 rate limits: 5,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per prefix
    // Conservative: 100 requests per second
    this.rateLimiter = new RateLimiter(100, 1000);
  }

  private async getS3Client(credentials?: Record<string, any>): Promise<any> {
    try {
      // Dynamic import to avoid requiring @aws-sdk/client-s3 if not installed
      const { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');
      
      if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        throw new Error('AWS credentials (accessKeyId and secretAccessKey) are required.');
      }

      const region = credentials.region || 'us-east-1';

      return {
        client: new S3Client({
          region,
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          },
        }),
        ListObjectsV2Command,
        GetObjectCommand,
        HeadObjectCommand,
      };
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
        throw new Error('@aws-sdk/client-s3 package is required. Install with: npm install @aws-sdk/client-s3');
      }
      throw error;
    }
  }

  private parseS3Path(path: string): { bucket: string; prefix: string } {
    // Path format: bucket-name/path/to/folder or bucket-name
    const parts = path.split('/');
    const bucket = parts[0];
    const prefix = parts.slice(1).join('/');
    return { bucket, prefix: prefix ? `${prefix}/` : '' };
  }

  async listChanges(config: ConnectorConfig): Promise<FileChange[]> {
    return withRetry(async () => {
      const { path, credentials, lastSyncAt } = config;

      if (!path) {
        throw new Error('Path is required for S3 connector');
      }

      const { client, ListObjectsV2Command } = await this.getS3Client(credentials);
      const { bucket, prefix } = this.parseS3Path(path);

      const changes: FileChange[] = [];
      let continuationToken: string | undefined;

      do {
        await this.rateLimiter.check();

        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await client.send(command);

        if (response.Contents) {
          for (const object of response.Contents) {
            if (!object.Key) continue;

            // Skip if it's a "folder" (ends with /)
            if (object.Key.endsWith('/')) continue;

            const modifiedAt = object.LastModified || new Date();
            const relativePath = object.Key.replace(prefix, '');
            const filename = relativePath.split('/').pop() || relativePath;

            if (!lastSyncAt || modifiedAt > lastSyncAt) {
              changes.push({
                type: lastSyncAt ? 'modified' : 'added',
                path: relativePath,
                filename,
                size: object.Size,
                modifiedAt,
                etag: object.ETag?.replace(/"/g, ''), // Remove quotes from ETag
              });
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return changes;
    });
  }

  async downloadFile(filePath: string, config: ConnectorConfig): Promise<Buffer> {
    return withRetry(async () => {
      const { path, credentials } = config;
      const { client, GetObjectCommand } = await this.getS3Client(credentials);
      const { bucket, prefix } = this.parseS3Path(path);

      const fullKey = prefix ? `${prefix}${filePath}` : filePath;

      await this.rateLimiter.check();

      try {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: fullKey,
        });

        const response = await client.send(command);

        if (!response.Body) {
          throw new Error(`File not found or empty: ${filePath}`);
        }

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(Buffer.from(chunk));
        }

        return Buffer.concat(chunks);
      } catch (error: any) {
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
          throw new Error(`File not found: ${filePath}`);
        }
        throw error;
      }
    });
  }

  async uploadFile(filePath: string, fileData: Buffer, config: ConnectorConfig): Promise<void> {
    return withRetry(async () => {
      const { path, credentials } = config;
      const { client } = await this.getS3Client(credentials);
      const { bucket, prefix } = this.parseS3Path(path);

      const fullKey = prefix ? `${prefix}${filePath}` : filePath;

      await this.rateLimiter.check();

      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fullKey,
        Body: fileData,
      });

      await client.send(command);
    });
  }

  async getFileMetadata(filePath: string, config: ConnectorConfig): Promise<{
    size: number;
    modifiedAt: Date;
    mimeType?: string;
    etag?: string;
  } | null> {
    try {
      const { path, credentials } = config;
      const { client, HeadObjectCommand } = await this.getS3Client(credentials);
      const { bucket, prefix } = this.parseS3Path(path);

      const fullKey = prefix ? `${prefix}${filePath}` : filePath;

      await this.rateLimiter.check();

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: fullKey,
      });

      const response = await client.send(command);

      return {
        size: response.ContentLength || 0,
        modifiedAt: response.LastModified || new Date(),
        mimeType: response.ContentType,
        etag: response.ETag?.replace(/"/g, ''),
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.Code === 'NotFound' || error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async testConnection(config: ConnectorConfig): Promise<boolean> {
    try {
      const { path, credentials } = config;
      const { client, ListObjectsV2Command } = await this.getS3Client(credentials);
      const { bucket } = this.parseS3Path(path);

      await this.rateLimiter.check();

      // Test by listing objects (limit 1)
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
      });

      await client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const s3Connector = new S3Connector();

// Export functions for backward compatibility
export async function listChanges(
  path: string,
  credentials?: Record<string, any>,
  lastSyncAt?: Date
): Promise<FileChange[]> {
  return s3Connector.listChanges({ path, credentials, lastSyncAt });
}

}
}