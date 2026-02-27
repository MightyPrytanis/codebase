/**
 * Library API Client
 * 
 * Client functions for interacting with the Library backend API
 */

import { safeParseUrlParams, sanitizeUrlParam } from './dom-xss-security';

const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';

export interface PracticeProfile {
  id: string;
  userId: string;
  primaryJurisdiction: string;
  additionalJurisdictions: string[];
  practiceAreas: string[];
  counties: string[];
  courts: string[];
  issueTags: string[];
  storagePreferences: {
    localPath?: string;
    oneDriveEnabled?: boolean;
    gDriveEnabled?: boolean;
    s3Enabled?: boolean;
    s3Bucket?: string;
    cacheSize?: number;
  };
  researchProvider?: 'westlaw' | 'courtlistener' | 'other';
  integrations?: Record<string, any>;
  llmProvider?: 'openai' | 'anthropic' | 'perplexity';
  llmProviderTested?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryItem {
  id: string;
  userId: string;
  locationId: string;
  filename: string;
  filepath: string;
  fileType: string;
  fileSize: number;
  title: string;
  description?: string;
  sourceType: 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other';
  jurisdiction?: string;
  county?: string;
  court?: string;
  judgeReferee?: string;
  issueTags: string[];
  practiceAreas: string[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
  dateCreated?: Date;
  dateModified?: Date;
  ingested: boolean;
  ingestedAt?: Date;
  vectorIds?: string[];
  pinned: boolean;
  superseded: boolean;
  supersededBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface LibraryLocation {
  id: string;
  userId: string;
  type: 'local' | 'onedrive' | 'gdrive' | 's3';
  name: string;
  path: string;
  credentials?: Record<string, any>;
  enabled: boolean;
  lastSyncAt?: Date;
  syncStatus?: 'idle' | 'syncing' | 'error';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryStats {
  status: string;
  totalItems: number;
  ingestedItems: number;
  pendingIngestion: number;
  lastSyncAt?: Date;
  lastError?: string;
  queueDepth: number;
}

/**
 * Fetch library items with optional filters
 */
export async function fetchLibraryItems(
  filters?: {
    sourceType?: string[];
    county?: string;
    court?: string;
    judgeReferee?: string;
    issueTags?: string[];
    ingested?: boolean;
    pinned?: boolean;
    superseded?: boolean;
  },
  userId?: string
): Promise<LibraryItem[]> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', sanitizeUrlParam(userId));
  if (filters?.sourceType) {
    const sanitized = filters.sourceType.map(s => sanitizeUrlParam(s)).join(',');
    params.append('sourceType', sanitized);
  }
  if (filters?.county) params.append('county', sanitizeUrlParam(filters.county));
  if (filters?.court) params.append('court', sanitizeUrlParam(filters.court));
  if (filters?.judgeReferee) params.append('judgeReferee', sanitizeUrlParam(filters.judgeReferee));
  if (filters?.issueTags) {
    const sanitized = filters.issueTags.map(t => sanitizeUrlParam(t)).join(',');
    params.append('issueTags', sanitized);
  }
  if (filters?.ingested !== undefined) params.append('ingested', String(filters.ingested));
  if (filters?.pinned !== undefined) params.append('pinned', String(filters.pinned));
  if (filters?.superseded !== undefined) params.append('superseded', String(filters.superseded));

  const response = await fetch(`${API_URL}/api/library/items?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch library items: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get a single library item by ID
 */
export async function getLibraryItem(itemId: string): Promise<LibraryItem> {
  const response = await fetch(`${API_URL}/api/library/items/${itemId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch library item: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Toggle pin status of a library item
 */
export async function pinLibraryItem(itemId: string): Promise<LibraryItem> {
  const response = await fetch(`${API_URL}/api/library/items/${itemId}/pin`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to pin library item: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Enqueue a library item for RAG ingestion
 */
export async function ingestLibraryItem(
  itemId: string,
  priority: 'low' | 'normal' | 'high' = 'normal',
  userId?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/library/items/${itemId}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, priority }),
  });
  if (!response.ok) {
    throw new Error(`Failed to ingest library item: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Save or update practice profile
 */
export async function savePracticeProfile(
  profile: Partial<PracticeProfile>,
  userId?: string
): Promise<PracticeProfile> {
  const response = await fetch(`${API_URL}/api/onboarding/practice-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...profile, userId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save practice profile: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get practice profile
 */
export async function getPracticeProfile(userId?: string): Promise<PracticeProfile | null> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', sanitizeUrlParam(userId));
  
  const response = await fetch(`${API_URL}/api/onboarding/practice-profile?${params}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to get practice profile: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get library health status
 */
export async function getLibraryHealth(userId?: string): Promise<LibraryStats> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', sanitizeUrlParam(userId));
  
  const response = await fetch(`${API_URL}/api/health/library?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get library health: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get library locations
 */
export async function getLibraryLocations(userId?: string): Promise<LibraryLocation[]> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', sanitizeUrlParam(userId));
  
  const response = await fetch(`${API_URL}/api/library/locations?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get library locations: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create a new library location
 */
export async function createLibraryLocation(
  location: Partial<LibraryLocation> & { type: 'local' | 'onedrive' | 'gdrive' | 's3'; name: string; path: string },
  userId?: string
): Promise<LibraryLocation> {
  const response = await fetch(`${API_URL}/api/library/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...location, userId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create library location: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Upload a document to the library
 */
export async function uploadLibraryDocument(
  data: {
    locationId: string;
    file: File;
    title: string;
    description?: string;
    sourceType?: 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other';
  },
  userId?: string
): Promise<LibraryItem> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('locationId', data.locationId);
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.sourceType) formData.append('sourceType', data.sourceType);
  if (userId) formData.append('userId', userId);

  const response = await fetch(`${API_URL}/api/library/items/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to upload document: ${response.statusText}`);
  }
  return response.json();

}
