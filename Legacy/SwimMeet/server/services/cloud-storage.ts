// Cloud Storage Service - User-owned storage for maximum platform independence
// Aligns with philosophy: truth, user sovereignty, cost minimization, portability

import { 
  CloudProvider, 
  CloudConnection, 
  CloudFile, 
  CloudStorageService as ICloudStorageService,
  CLOUD_PROVIDERS 
} from '../../shared/cloud-storage-types';
import { db } from '../db';
import { cloudConnections, cloudFiles, userCloudSettings } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// Provider-specific implementations
interface ProviderAPI {
  authenticate(userId: string): Promise<string>;
  handleCallback(code: string, state: string): Promise<any>;
  uploadFile(file: Buffer, filename: string, accessToken: string): Promise<any>;
  downloadFile(fileId: string, accessToken: string): Promise<Buffer>;
  deleteFile(fileId: string, accessToken: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<any>;
  getQuota(accessToken: string): Promise<{ used: number; total: number }>;
}

// Google Drive API implementation
class GoogleDriveAPI implements ProviderAPI {
  private clientId = process.env.GOOGLE_CLIENT_ID || '';
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  private redirectUri = process.env.GOOGLE_REDIRECT_URI || '';

  async authenticate(userId: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    const scopes = 'https://www.googleapis.com/auth/drive.file';
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: `${userId}:${state}`
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google OAuth error: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile(file: Buffer, filename: string, accessToken: string): Promise<any> {
    // Google Drive API upload implementation
    const metadata = {
      name: filename,
      parents: ['swim-meet-files'] // Create folder if needed
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([file]));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload error: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(fileId: string, accessToken: string): Promise<Buffer> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive download error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(fileId: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive delete error: ${response.statusText}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google token refresh error: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuota(accessToken: string): Promise<{ used: number; total: number }> {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive quota error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      used: parseInt(data.storageQuota.usage || '0'),
      total: parseInt(data.storageQuota.limit || '0')
    };
  }
}

// Local filesystem fallback (always available)
class LocalFileSystemAPI implements ProviderAPI {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
    fs.mkdir(this.uploadDir, { recursive: true }).catch(console.error);
  }

  async authenticate(userId: string): Promise<string> {
    return '/api/cloud/local/connected'; // No OAuth needed
  }

  async handleCallback(code: string, state: string): Promise<any> {
    return { access_token: 'local_access', userId: state };
  }

  async uploadFile(file: Buffer, filename: string, accessToken: string): Promise<any> {
    const fileId = crypto.randomUUID();
    const filePath = path.join(this.uploadDir, fileId);
    
    await fs.writeFile(filePath, file);
    
    return {
      id: fileId,
      name: filename,
      size: file.length
    };
  }

  async downloadFile(fileId: string, accessToken: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, fileId);
    return fs.readFile(filePath);
  }

  async deleteFile(fileId: string, accessToken: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileId);
    await fs.unlink(filePath);
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return { access_token: 'local_access' };
  }

  async getQuota(accessToken: string): Promise<{ used: number; total: number }> {
    // Calculate local disk usage
    const stats = await fs.stat(this.uploadDir).catch(() => null);
    return {
      used: stats?.size || 0,
      total: 100 * 1024 * 1024 * 1024 // 100GB theoretical limit
    };
  }
}

// Main Cloud Storage Service
export class CloudStorageService implements ICloudStorageService {
  private providers: Map<string, ProviderAPI> = new Map();

  constructor() {
    // Initialize all providers
    this.providers.set('google_drive', new GoogleDriveAPI());
    this.providers.set('local_filesystem', new LocalFileSystemAPI());
    // TODO: Add Dropbox, OneDrive, iCloud implementations
  }

  // Get available providers
  getProviders(): CloudProvider[] {
    return CLOUD_PROVIDERS;
  }

  // Connection management
  async authenticate(providerId: string, userId: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not supported`);
    }
    
    return provider.authenticate(userId);
  }

  async handleCallback(code: string, state: string): Promise<CloudConnection> {
    const [userId, providerId] = state.split(':');
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not supported`);
    }

    const tokenData = await provider.handleCallback(code, state);
    
    // Store connection in database
    const [connection] = await db.insert(cloudConnections).values({
      userId,
      providerId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      displayName: tokenData.email || `${providerId} account`,
      isActive: true
    }).returning();

    return connection;
  }

  async refreshConnection(connectionId: string): Promise<CloudConnection> {
    const [connection] = await db.select().from(cloudConnections).where(eq(cloudConnections.id, connectionId));
    
    if (!connection || !connection.refreshToken) {
      throw new Error('Connection not found or no refresh token');
    }

    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not supported`);
    }

    const tokenData = await provider.refreshToken(connection.refreshToken);
    
    // Update connection
    const [updatedConnection] = await db.update(cloudConnections)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || connection.refreshToken,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(cloudConnections.id, connectionId))
      .returning();

    return updatedConnection;
  }

  // File operations
  async upload(file: Buffer, filename: string, connectionId: string, userId: string): Promise<CloudFile> {
    const [connection] = await db.select().from(cloudConnections).where(
      and(eq(cloudConnections.id, connectionId), eq(cloudConnections.userId, userId))
    );

    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not supported`);
    }

    // Check if token needs refresh
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      await this.refreshConnection(connectionId);
    }

    const cloudFileData = await provider.uploadFile(file, filename, connection.accessToken);
    
    // Store file metadata
    const [cloudFile] = await db.insert(cloudFiles).values({
      connectionId,
      cloudFileId: cloudFileData.id,
      originalName: filename,
      mimeType: 'application/octet-stream', // TODO: Detect MIME type
      size: file.length,
      uploadedBy: userId,
      isPublic: false,
      metadata: cloudFileData
    }).returning();

    return cloudFile;
  }

  async download(fileId: string): Promise<Buffer> {
    const [cloudFile] = await db.select().from(cloudFiles).where(eq(cloudFiles.id, fileId));
    
    if (!cloudFile) {
      throw new Error('File not found');
    }

    const [connection] = await db.select().from(cloudConnections).where(eq(cloudConnections.id, cloudFile.connectionId));
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not supported`);
    }

    return provider.downloadFile(cloudFile.cloudFileId, connection.accessToken);
  }

  async delete(fileId: string): Promise<void> {
    const [cloudFile] = await db.select().from(cloudFiles).where(eq(cloudFiles.id, fileId));
    
    if (!cloudFile) {
      throw new Error('File not found');
    }

    const [connection] = await db.select().from(cloudConnections).where(eq(cloudConnections.id, cloudFile.connectionId));
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not supported`);
    }

    await provider.deleteFile(cloudFile.cloudFileId, connection.accessToken);
    
    // Remove from database
    await db.delete(cloudFiles).where(eq(cloudFiles.id, fileId));
  }

  async list(connectionId: string, folder?: string): Promise<CloudFile[]> {
    return db.select().from(cloudFiles).where(eq(cloudFiles.connectionId, connectionId));
  }

  async getQuota(connectionId: string): Promise<{ used: number; total: number }> {
    const [connection] = await db.select().from(cloudConnections).where(eq(cloudConnections.id, connectionId));
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not supported`);
    }

    return provider.getQuota(connection.accessToken);
  }

  async getFileInfo(fileId: string): Promise<CloudFile> {
    const [cloudFile] = await db.select().from(cloudFiles).where(eq(cloudFiles.id, fileId));
    
    if (!cloudFile) {
      throw new Error('File not found');
    }

    return cloudFile;
  }

  // User settings
  async getUserSettings(userId: string) {
    const [settings] = await db.select().from(userCloudSettings).where(eq(userCloudSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: string, settings: Partial<typeof userCloudSettings.$inferInsert>) {
    await db.insert(userCloudSettings)
      .values({ userId, ...settings })
      .onConflictDoUpdate({
        target: userCloudSettings.userId,
        set: { ...settings, updatedAt: new Date() }
      });
  }

  // Get user's connections
  async getUserConnections(userId: string): Promise<CloudConnection[]> {
    return db.select().from(cloudConnections)
      .where(and(eq(cloudConnections.userId, userId), eq(cloudConnections.isActive, true)));
  }
}

export const cloudStorageService = new CloudStorageService();