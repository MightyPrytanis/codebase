// Cloud Storage Integration Types
// Supports user-owned cloud storage for maximum platform independence

export interface CloudProvider {
  id: 'google_drive' | 'dropbox' | 'onedrive' | 'icloud' | 'local_filesystem';
  name: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  maxFileSize: number; // bytes
  supportedTypes: string[];
  costModel: 'user_owned' | 'platform_paid' | 'free';
}

export interface CloudConnection {
  id: string;
  userId: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  connectedAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  displayName: string; // User's account name
}

export interface CloudFile {
  id: string;
  providerId: string;
  cloudFileId: string; // Provider's file ID
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  isPublic: boolean;
  downloadUrl?: string; // Temporary download URL
  metadata?: Record<string, any>;
}

export interface CloudStorageConfig {
  preferredProvider: string;
  fallbackToLocal: boolean;
  maxFileAge: number; // days
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// OAuth Configuration for each provider
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// Unified cloud storage operations interface
export interface CloudStorageService {
  // Connection management
  authenticate(providerId: string): Promise<string>; // Returns auth URL
  handleCallback(code: string, state: string): Promise<CloudConnection>;
  refreshConnection(connectionId: string): Promise<CloudConnection>;
  
  // File operations
  upload(file: Buffer, filename: string, connectionId: string): Promise<CloudFile>;
  download(fileId: string): Promise<Buffer>;
  delete(fileId: string): Promise<void>;
  list(connectionId: string, folder?: string): Promise<CloudFile[]>;
  
  // Metadata
  getQuota(connectionId: string): Promise<{ used: number; total: number }>;
  getFileInfo(fileId: string): Promise<CloudFile>;
}

// Provider capabilities
export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Use your Google Drive storage (15GB+ free)',
    icon: 'google-drive',
    requiresAuth: true,
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportedTypes: ['*/*'],
    costModel: 'user_owned'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Use your Dropbox storage (2GB+ free)',
    icon: 'dropbox',
    requiresAuth: true,
    maxFileSize: 350 * 1024 * 1024, // 350MB per file
    supportedTypes: ['*/*'],
    costModel: 'user_owned'
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Use your Microsoft OneDrive (5GB+ free)',
    icon: 'microsoft',
    requiresAuth: true,
    maxFileSize: 250 * 1024 * 1024 * 1024, // 250GB
    supportedTypes: ['*/*'],
    costModel: 'user_owned'
  },
  {
    id: 'icloud',
    name: 'iCloud Drive',
    description: 'Use your iCloud storage (5GB+ free)',
    icon: 'cloud',
    requiresAuth: true,
    maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
    supportedTypes: ['*/*'],
    costModel: 'user_owned'
  },
  {
    id: 'local_filesystem',
    name: 'Local Storage',
    description: 'Store files on server (fallback option)',
    icon: 'hard-drive',
    requiresAuth: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedTypes: ['*/*'],
    costModel: 'free'
  }
];