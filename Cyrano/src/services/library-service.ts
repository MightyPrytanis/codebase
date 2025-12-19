/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Service - Manages legal library items, locations, and practice profiles
 * 
 * Provides functions for managing library items, storage locations, ingest queue,
 * and user practice profiles for the Library + RAG Onboarding system.
 */

import { 
  PracticeProfile, 
  LibraryLocation, 
  LibraryItem, 
  IngestQueueItem,
  LibraryStats 
} from '../modules/library/library-model.js';

// In-memory storage for prototype (TODO: Replace with database persistence)
const practiceProfiles = new Map<string, PracticeProfile>();
const libraryLocations = new Map<string, LibraryLocation>();
const libraryItems = new Map<string, LibraryItem>();
const ingestQueue = new Map<string, IngestQueueItem>();

/**
 * Upsert a practice profile for a user
 */
export async function upsertPracticeProfile(
  userId: string,
  profile: Partial<PracticeProfile>
): Promise<PracticeProfile> {
  const existingProfile = practiceProfiles.get(userId);
  
  const updatedProfile: PracticeProfile = {
    id: existingProfile?.id || `profile-${Date.now()}`,
    userId,
    primaryJurisdiction: profile.primaryJurisdiction || existingProfile?.primaryJurisdiction || '',
    additionalJurisdictions: profile.additionalJurisdictions || existingProfile?.additionalJurisdictions || [],
    practiceAreas: profile.practiceAreas || existingProfile?.practiceAreas || [],
    counties: profile.counties || existingProfile?.counties || [],
    courts: profile.courts || existingProfile?.courts || [],
    issueTags: profile.issueTags || existingProfile?.issueTags || [],
    storagePreferences: {
      ...existingProfile?.storagePreferences,
      ...profile.storagePreferences,
    },
    researchProvider: profile.researchProvider || existingProfile?.researchProvider,
    integrations: {
      ...existingProfile?.integrations,
      ...profile.integrations,
    },
    llmProvider: profile.llmProvider || existingProfile?.llmProvider,
    llmProviderTested: profile.llmProviderTested ?? existingProfile?.llmProviderTested ?? false,
    createdAt: existingProfile?.createdAt || new Date(),
    updatedAt: new Date(),
  };
  
  practiceProfiles.set(userId, updatedProfile);
  return updatedProfile;
}

/**
 * Get practice profile for a user
 */
export async function getPracticeProfile(userId: string): Promise<PracticeProfile | null> {
  return practiceProfiles.get(userId) || null;
}

/**
 * List all library items for a user with optional filters
 */
export async function listLibraryItems(
  userId: string,
  filters?: {
    sourceType?: string[];
    county?: string;
    court?: string;
    judgeReferee?: string;
    issueTags?: string[];
    ingested?: boolean;
    pinned?: boolean;
    superseded?: boolean;
  }
): Promise<LibraryItem[]> {
  let items = Array.from(libraryItems.values()).filter(item => item.userId === userId);
  
  if (filters) {
    if (filters.sourceType && filters.sourceType.length > 0) {
      items = items.filter(item => filters.sourceType!.includes(item.sourceType));
    }
    if (filters.county) {
      items = items.filter(item => item.county === filters.county);
    }
    if (filters.court) {
      items = items.filter(item => item.court === filters.court);
    }
    if (filters.judgeReferee) {
      items = items.filter(item => item.judgeReferee === filters.judgeReferee);
    }
    if (filters.issueTags && filters.issueTags.length > 0) {
      items = items.filter(item => 
        filters.issueTags!.some(tag => item.issueTags.includes(tag))
      );
    }
    if (filters.ingested !== undefined) {
      items = items.filter(item => item.ingested === filters.ingested);
    }
    if (filters.pinned !== undefined) {
      items = items.filter(item => item.pinned === filters.pinned);
    }
    if (filters.superseded !== undefined) {
      items = items.filter(item => item.superseded === filters.superseded);
    }
  }
  
  return items;
}

/**
 * Get a single library item by ID
 */
export async function getLibraryItem(itemId: string): Promise<LibraryItem | null> {
  return libraryItems.get(itemId) || null;
}

/**
 * Upsert a library location
 */
export async function upsertLibraryLocation(
  userId: string,
  location: Partial<LibraryLocation> & { type: 'local' | 'onedrive' | 'gdrive' | 's3'; name: string; path: string }
): Promise<LibraryLocation> {
  const id = location.id || `location-${Date.now()}`;
  const existing = libraryLocations.get(id);
  
  const updatedLocation: LibraryLocation = {
    id,
    userId,
    type: location.type,
    name: location.name,
    path: location.path,
    credentials: location.credentials || existing?.credentials,
    enabled: location.enabled ?? existing?.enabled ?? true,
    lastSyncAt: location.lastSyncAt || existing?.lastSyncAt,
    syncStatus: location.syncStatus || existing?.syncStatus || 'idle',
    syncError: location.syncError || existing?.syncError,
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  };
  
  libraryLocations.set(id, updatedLocation);
  return updatedLocation;
}

/**
 * Get all library locations for a user
 */
export async function getLibraryLocations(userId: string): Promise<LibraryLocation[]> {
  return Array.from(libraryLocations.values()).filter(loc => loc.userId === userId);
}

/**
 * Enqueue a library item for RAG ingestion
 */
export async function enqueueIngest(
  libraryItemId: string,
  userId: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<IngestQueueItem> {
  const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const queueItem: IngestQueueItem = {
    id,
    libraryItemId,
    userId,
    priority,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  ingestQueue.set(id, queueItem);
  return queueItem;
}

/**
 * Get pending items from the ingest queue
 */
export async function getIngestQueue(
  userId?: string,
  status?: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<IngestQueueItem[]> {
  let items = Array.from(ingestQueue.values());
  
  if (userId) {
    items = items.filter(item => item.userId === userId);
  }
  
  if (status) {
    items = items.filter(item => item.status === status);
  }
  
  return items.sort((a, b) => {
    // Sort by priority (high > normal > low) then by creation date
    const priorityMap = { high: 3, normal: 2, low: 1 };
    const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Update an ingest queue item
 */
export async function updateIngestQueueItem(
  id: string,
  updates: Partial<IngestQueueItem>
): Promise<IngestQueueItem | null> {
  const item = ingestQueue.get(id);
  if (!item) return null;
  
  const updated = {
    ...item,
    ...updates,
    updatedAt: new Date(),
  };
  
  ingestQueue.set(id, updated);
  return updated;
}

/**
 * Mark a library item as superseded by a newer version
 */
export async function markSuperseded(
  oldItemId: string,
  newItemId: string
): Promise<boolean> {
  const oldItem = libraryItems.get(oldItemId);
  if (!oldItem) return false;
  
  oldItem.superseded = true;
  oldItem.supersededBy = newItemId;
  oldItem.updatedAt = new Date();
  
  libraryItems.set(oldItemId, oldItem);
  return true;
}

/**
 * Pin/unpin a library item
 */
export async function togglePin(itemId: string): Promise<LibraryItem | null> {
  const item = libraryItems.get(itemId);
  if (!item) return null;
  
  item.pinned = !item.pinned;
  item.updatedAt = new Date();
  
  libraryItems.set(itemId, item);
  return item;
}

/**
 * Create or update a library item
 */
export async function upsertLibraryItem(item: Partial<LibraryItem> & {
  userId: string;
  locationId: string;
  filename: string;
  filepath: string;
  fileType: string;
  title: string;
  sourceType: 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other';
}): Promise<LibraryItem> {
  const id = item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const existing = libraryItems.get(id);
  
  const libraryItem: LibraryItem = {
    id,
    userId: item.userId,
    locationId: item.locationId,
    filename: item.filename,
    filepath: item.filepath,
    fileType: item.fileType,
    fileSize: item.fileSize || existing?.fileSize || 0,
    title: item.title,
    description: item.description || existing?.description,
    sourceType: item.sourceType,
    jurisdiction: item.jurisdiction || existing?.jurisdiction,
    county: item.county || existing?.county,
    court: item.court || existing?.court,
    judgeReferee: item.judgeReferee || existing?.judgeReferee,
    issueTags: item.issueTags || existing?.issueTags || [],
    practiceAreas: item.practiceAreas || existing?.practiceAreas || [],
    effectiveFrom: item.effectiveFrom || existing?.effectiveFrom,
    effectiveTo: item.effectiveTo || existing?.effectiveTo,
    dateCreated: item.dateCreated || existing?.dateCreated,
    dateModified: item.dateModified || existing?.dateModified || new Date(),
    ingested: item.ingested ?? existing?.ingested ?? false,
    ingestedAt: item.ingestedAt || existing?.ingestedAt,
    vectorIds: item.vectorIds || existing?.vectorIds,
    pinned: item.pinned ?? existing?.pinned ?? false,
    superseded: item.superseded ?? existing?.superseded ?? false,
    supersededBy: item.supersededBy || existing?.supersededBy,
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
    lastAccessedAt: item.lastAccessedAt || existing?.lastAccessedAt,
  };
  
  libraryItems.set(id, libraryItem);
  return libraryItem;
}

/**
 * Get library statistics
 */
export async function getLibraryStats(userId: string): Promise<LibraryStats> {
  const items = await listLibraryItems(userId);
  const queue = await getIngestQueue(userId, 'pending');
  const locations = await getLibraryLocations(userId);
  
  const lastSync = locations
    .filter(loc => loc.lastSyncAt)
    .sort((a, b) => (b.lastSyncAt?.getTime() || 0) - (a.lastSyncAt?.getTime() || 0))[0]?.lastSyncAt;
  
  const lastError = locations.find(loc => loc.syncError)?.syncError;
  
  return {
    totalItems: items.length,
    ingestedItems: items.filter(item => item.ingested).length,
    pendingIngestion: queue.length,
    lastSyncAt: lastSync,
    lastError,
    queueDepth: queue.length,
  };
}
