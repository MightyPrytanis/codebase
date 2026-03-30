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
 * 
 * Uses PostgreSQL database with Drizzle ORM for persistence.
 */

import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { 
  practiceProfiles as practiceProfilesTable,
  libraryLocations as libraryLocationsTable,
  libraryItems as libraryItemsTable,
  ingestQueue as ingestQueueTable,
} from '../schema-library.js';
import { eq, and, inArray, desc, asc, SQL } from 'drizzle-orm';
import { 
  PracticeProfile, 
  LibraryLocation, 
  LibraryItem, 
  IngestQueueItem,
  LibraryStats 
} from '../modules/library/library-model.js';
import { encryptSensitiveFields, decryptSensitiveFields } from './sensitive-data-encryption.js';

// In-memory fallback for practice profiles when the database is unavailable or the
// userId is non-numeric (e.g., tests or degraded environments).
const inMemoryPracticeProfiles = new Map<string, PracticeProfile>();

/**
 * In-memory fallback store for practice profiles.
 * Used when the database is unavailable or a query fails (e.g., missing DB, connection refused).
 * This keeps onboarding endpoints functional for test environments without Postgres.
 */
const inMemoryPracticeProfiles = new Map<string, PracticeProfile>();
let practiceProfileDbDisabled = false;

function mergeIntegrations(
  existing: PracticeProfile['integrations'] | undefined,
  incoming: PracticeProfile['integrations'] | undefined
): PracticeProfile['integrations'] {
  const merged = {
    ...(existing || {}),
    ...(incoming || {}),
    ...(existing?.onboarding && incoming?.onboarding
      ? { onboarding: { ...(existing.onboarding || {}), ...(incoming.onboarding || {}) } }
      : {}),
  } as PracticeProfile['integrations'];

  try {
    return encryptSensitiveFields(merged as any) as PracticeProfile['integrations'];
  } catch (error) {
    console.warn('[DB] Failed to encrypt practice profile integrations; storing unencrypted.', error instanceof Error ? error.message : error);
    return merged;
  }
}

function buildProfileData(
  userId: string,
  profile: Partial<PracticeProfile>,
  existing?: PracticeProfile
): PracticeProfile {
  return {
    id: existing?.id ?? randomUUID(),
    userId,
    primaryJurisdiction: profile.primaryJurisdiction ?? existing?.primaryJurisdiction ?? '',
    additionalJurisdictions: profile.additionalJurisdictions ?? existing?.additionalJurisdictions ?? [],
    practiceAreas: profile.practiceAreas ?? existing?.practiceAreas ?? [],
    counties: profile.counties ?? existing?.counties ?? [],
    courts: profile.courts ?? existing?.courts ?? [],
    issueTags: profile.issueTags ?? existing?.issueTags ?? [],
    storagePreferences: {
      ...(existing?.storagePreferences || {}),
      ...(profile.storagePreferences || {}),
    },
    researchProvider: profile.researchProvider ?? existing?.researchProvider,
    integrations: mergeIntegrations(existing?.integrations, profile.integrations),
    llmProvider: profile.llmProvider ?? existing?.llmProvider,
    llmProviderTested: profile.llmProviderTested ?? existing?.llmProviderTested ?? false,
    createdAt: existing?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
}

function upsertInMemoryPracticeProfile(
  userId: string,
  profile: Partial<PracticeProfile>
): PracticeProfile {
  const existing = inMemoryPracticeProfiles.get(userId);
  const profileData = buildProfileData(userId, profile, existing);
  inMemoryPracticeProfiles.set(userId, profileData);
  return profileData;
}

/**
 * Helper function to convert database row to PracticeProfile
 */
function dbRowToPracticeProfile(row: any): PracticeProfile {
  // Decrypt sensitive fields in integrations
  const integrations = row.integrations ? decryptSensitiveFields(row.integrations) : {};
  
  return {
    id: row.id,
    userId: row.userId.toString(),
    primaryJurisdiction: row.primaryJurisdiction,
    additionalJurisdictions: row.additionalJurisdictions || [],
    practiceAreas: row.practiceAreas || [],
    counties: row.counties || [],
    courts: row.courts || [],
    issueTags: row.issueTags || [],
    storagePreferences: row.storagePreferences || {},
    researchProvider: row.researchProvider as 'westlaw' | 'courtlistener' | 'other' | undefined,
    integrations: integrations as any,
    llmProvider: row.llmProvider as 'openai' | 'anthropic' | 'perplexity' | undefined,
    llmProviderTested: row.llmProviderTested || false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Merge practice profile data (used for both DB and in-memory fallback)
 */
function mergePracticeProfile(
  userId: string,
  existing: PracticeProfile | null,
  updates: Partial<PracticeProfile>,
): PracticeProfile {
  const baseProfile: PracticeProfile = existing ?? {
    id: `memory-${userId}`,
    userId,
    primaryJurisdiction: '',
    additionalJurisdictions: [],
    practiceAreas: [],
    counties: [],
    courts: [],
    issueTags: [],
    storagePreferences: {},
    researchProvider: undefined,
    integrations: {},
    llmProvider: undefined,
    llmProviderTested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    ...baseProfile,
    primaryJurisdiction: updates.primaryJurisdiction ?? baseProfile.primaryJurisdiction,
    additionalJurisdictions: updates.additionalJurisdictions ?? baseProfile.additionalJurisdictions,
    practiceAreas: updates.practiceAreas ?? baseProfile.practiceAreas,
    counties: updates.counties ?? baseProfile.counties,
    courts: updates.courts ?? baseProfile.courts,
    issueTags: updates.issueTags ?? baseProfile.issueTags,
    storagePreferences: {
      ...(baseProfile.storagePreferences || {}),
      ...(updates.storagePreferences || {}),
    },
    researchProvider: updates.researchProvider ?? baseProfile.researchProvider,
    integrations: {
      ...(baseProfile.integrations || {}),
      ...(updates.integrations || {}),
      ...(baseProfile.integrations?.onboarding && updates.integrations?.onboarding
        ? { onboarding: { ...baseProfile.integrations.onboarding, ...updates.integrations.onboarding } }
        : {}),
    },
    llmProvider: updates.llmProvider ?? baseProfile.llmProvider,
    llmProviderTested: updates.llmProviderTested ?? baseProfile.llmProviderTested,
    updatedAt: new Date(),
  };
}

/**
 * Upsert a practice profile for a user
 */
export async function upsertPracticeProfile(
  userId: string,
  profile: Partial<PracticeProfile>
): Promise<PracticeProfile> {
  const userIdStr = userId?.toString?.() ?? '';
  const userIdInt = parseInt(userIdStr, 10);
  const fallback = () => upsertInMemoryPracticeProfile(userIdStr, profile);

  if (practiceProfileDbDisabled) {
    return fallback();
  }

  if (Number.isNaN(userIdInt)) {
    console.warn('[DB] Invalid userId provided; using in-memory practice profile store.');
    return fallback();
  }

  if (!db) {
    console.warn('[DB] Database client not initialized; using in-memory practice profile store.');
    practiceProfileDbDisabled = true;
    return fallback();
  }

  try {
    // Check if profile exists
    const existing = await db
      .select()
      .from(practiceProfilesTable)
      .where(eq(practiceProfilesTable.userId, userIdInt))
      .limit(1);

  const fallback = () => {
    const merged = mergePracticeProfile(userId, inMemoryPracticeProfiles.get(userId) ?? null, profile);
    inMemoryPracticeProfiles.set(userId, merged);
    return merged;
  };

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt) || !db) {
    // Non-numeric IDs or missing DB connection fall back to in-memory storage
    return fallback();
  }

  try {
    // Check if profile exists
    const existing = await db
      .select()
      .from(practiceProfilesTable)
      .where(eq(practiceProfilesTable.userId, userIdInt))
      .limit(1);

    const profileData = {
      userId: userIdInt,
      primaryJurisdiction: profile.primaryJurisdiction || existing[0]?.primaryJurisdiction || '',
      additionalJurisdictions: profile.additionalJurisdictions || existing[0]?.additionalJurisdictions || [],
      practiceAreas: profile.practiceAreas || existing[0]?.practiceAreas || [],
      counties: profile.counties || existing[0]?.counties || [],
      courts: profile.courts || existing[0]?.courts || [],
      issueTags: profile.issueTags || existing[0]?.issueTags || [],
      storagePreferences: {
        ...(existing[0]?.storagePreferences || {}),
        ...(profile.storagePreferences || {}),
      },
      researchProvider: profile.researchProvider || existing[0]?.researchProvider,
      integrations: mergeIntegrations(existing[0]?.integrations as any, profile.integrations),
      integrations: encryptSensitiveFields({
        ...(existing[0]?.integrations || {}),
        ...(profile.integrations || {}),
        // Deep merge onboarding if both exist
        ...(existing[0]?.integrations?.onboarding && profile.integrations?.onboarding ? {
          onboarding: {
            ...(existing[0]?.integrations.onboarding || {}),
            ...(profile.integrations.onboarding || {}),
          },
        } : {}),
      }) as any,
      llmProvider: profile.llmProvider || existing[0]?.llmProvider,
      llmProviderTested: profile.llmProviderTested ?? existing[0]?.llmProviderTested ?? false,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(practiceProfilesTable)
        .set(profileData)
        .where(eq(practiceProfilesTable.id, existing[0].id))
        .returning();

      const result = dbRowToPracticeProfile(updated);
      inMemoryPracticeProfiles.set(userIdStr, result);
      return result;
    } else {
      // Insert new
      
      return dbRowToPracticeProfile(updated);
    } else {
      const [inserted] = await db
        .insert(practiceProfilesTable)
        .values({
          ...profileData,
          createdAt: new Date(),
        })
        .returning();

      const result = dbRowToPracticeProfile(inserted);
      inMemoryPracticeProfiles.set(userIdStr, result);
      return result;
    }
  } catch (error) {
    practiceProfileDbDisabled = true;
    console.warn('[DB] Failed to upsert practice profile; falling back to in-memory store.', error instanceof Error ? error.message : error);
      
      return dbRowToPracticeProfile(inserted);
    }
  } catch (error) {
    console.warn('[Library Service] Falling back to in-memory practice profile store:', error);
    return fallback();
  }
}

/**
 * Get practice profile for a user
 */
export async function getPracticeProfile(userId: string): Promise<PracticeProfile | null> {
  const userIdStr = userId?.toString?.() ?? '';
  const userIdInt = parseInt(userIdStr, 10);
  const fromMemory = () => inMemoryPracticeProfiles.get(userIdStr) ?? null;

  if (practiceProfileDbDisabled) {
    return fromMemory();
  }

  if (Number.isNaN(userIdInt)) {
    console.warn('[DB] Invalid userId provided to getPracticeProfile; using in-memory store.');
    return fromMemory();
  }

  if (!db) {
    console.warn('[DB] Database client not initialized; using in-memory practice profile store.');
    practiceProfileDbDisabled = true;
    return fromMemory();
  }

  const fallbackProfile = inMemoryPracticeProfiles.get(userId);

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt) || !db) {
    return fallbackProfile ?? null;
  }

  try {
    const [profile] = await db
      .select()
      .from(practiceProfilesTable)
      .where(eq(practiceProfilesTable.userId, userIdInt))
      .limit(1);

    const result = profile ? dbRowToPracticeProfile(profile) : null;
    if (result) {
      inMemoryPracticeProfiles.set(userIdStr, result);
    }
    return result;
  } catch (error) {
    practiceProfileDbDisabled = true;
    console.warn('[DB] Failed to load practice profile; using in-memory store.', error instanceof Error ? error.message : error);
    return fromMemory();
    return profile ? dbRowToPracticeProfile(profile) : fallbackProfile ?? null;
  } catch (error) {
    console.warn('[Library Service] Falling back to in-memory practice profile store:', error);
    return fallbackProfile ?? null;
  }
}

/**
 * Helper function to convert database row to LibraryItem
 */
function dbRowToLibraryItem(row: any): LibraryItem {
  return {
    id: row.id,
    userId: row.userId.toString(),
    locationId: row.locationId,
    filename: row.filename,
    filepath: row.filepath,
    fileType: row.fileType,
    fileSize: Number(row.fileSize),
    title: row.title,
    description: row.description || undefined,
    sourceType: row.sourceType as 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other',
    jurisdiction: row.jurisdiction || undefined,
    county: row.county || undefined,
    court: row.court || undefined,
    judgeReferee: row.judgeReferee || undefined,
    issueTags: row.issueTags || [],
    practiceAreas: row.practiceAreas || [],
    effectiveFrom: row.effectiveFrom || undefined,
    effectiveTo: row.effectiveTo || undefined,
    dateCreated: row.dateCreated || undefined,
    dateModified: row.dateModified || undefined,
    ingested: row.ingested,
    ingestedAt: row.ingestedAt || undefined,
    vectorIds: row.vectorIds || [],
    pinned: row.pinned,
    superseded: row.superseded,
    supersededBy: row.supersededBy || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastAccessedAt: row.lastAccessedAt || undefined,
  };
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
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return [];
  }

  const conditions = [eq(libraryItemsTable.userId, userIdInt)];

  if (filters) {
    if (filters.sourceType && filters.sourceType.length > 0) {
      conditions.push(inArray(libraryItemsTable.sourceType, filters.sourceType));
    }
    if (filters.county) {
      conditions.push(eq(libraryItemsTable.county, filters.county));
    }
    if (filters.court) {
      conditions.push(eq(libraryItemsTable.court, filters.court));
    }
    if (filters.judgeReferee) {
      conditions.push(eq(libraryItemsTable.judgeReferee, filters.judgeReferee));
    }
    if (filters.ingested !== undefined) {
      conditions.push(eq(libraryItemsTable.ingested, filters.ingested));
    }
    if (filters.pinned !== undefined) {
      conditions.push(eq(libraryItemsTable.pinned, filters.pinned));
    }
    if (filters.superseded !== undefined) {
      conditions.push(eq(libraryItemsTable.superseded, filters.superseded));
    }
    // Note: issueTags filtering would require JSONB array contains check
    // This is more complex and can be done in application layer if needed
  }

  const rows = await db
    .select()
    .from(libraryItemsTable)
    .where(and(...conditions))
    .orderBy(desc(libraryItemsTable.createdAt));

  let items = rows.map(dbRowToLibraryItem);

  // Apply issueTags filter in application layer (JSONB array contains)
  if (filters?.issueTags && filters.issueTags.length > 0) {
    items = items.filter(item => 
      filters.issueTags!.some(tag => item.issueTags.includes(tag))
    );
  }

  return items;
}

/**
 * Get a single library item by ID
 */
export async function getLibraryItem(itemId: string): Promise<LibraryItem | null> {
  const [item] = await db
    .select()
    .from(libraryItemsTable)
    .where(eq(libraryItemsTable.id, itemId))
    .limit(1);

  return item ? dbRowToLibraryItem(item) : null;
}

/**
 * Helper function to convert database row to LibraryLocation
 */
function dbRowToLibraryLocation(row: any): LibraryLocation {
  // Decrypt credentials when retrieving
  const decryptedCredentials = row.credentials 
    ? decryptSensitiveFields(row.credentials)
    : undefined;
  
  return {
    id: row.id,
    userId: row.userId.toString(),
    type: row.type as 'local' | 'onedrive' | 'gdrive' | 's3',
    name: row.name,
    path: row.path,
    credentials: decryptedCredentials,
    enabled: row.enabled,
    lastSyncAt: row.lastSyncAt || undefined,
    syncStatus: (row.syncStatus as 'idle' | 'syncing' | 'error') || 'idle',
    syncError: row.syncError || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Upsert a library location
 */
export async function upsertLibraryLocation(
  userId: string,
  location: Partial<LibraryLocation> & { type: 'local' | 'onedrive' | 'gdrive' | 's3'; name: string; path: string }
): Promise<LibraryLocation> {
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    throw new Error(`Invalid userId: ${userId}`);
  }

  // Encrypt credentials before storing
  const encryptedCredentials = location.credentials 
    ? encryptSensitiveFields(location.credentials as Record<string, any>)
    : undefined;

  const locationData = {
    userId: userIdInt,
    type: location.type,
    name: location.name,
    path: location.path,
    credentials: encryptedCredentials,
    enabled: location.enabled ?? true,
    lastSyncAt: location.lastSyncAt,
    syncStatus: location.syncStatus || 'idle',
    syncError: location.syncError,
    updatedAt: new Date(),
  };

  if (location.id) {
    // Update existing
    const [updated] = await db
      .update(libraryLocationsTable)
      .set(locationData)
      .where(eq(libraryLocationsTable.id, location.id))
      .returning();
    
    return dbRowToLibraryLocation(updated);
  } else {
    // Insert new
    const [inserted] = await db
      .insert(libraryLocationsTable)
      .values({
        ...locationData,
        createdAt: new Date(),
      })
      .returning();
    
    return dbRowToLibraryLocation(inserted);
  }
}

/**
 * Get all library locations for a user
 */
export async function getLibraryLocations(userId: string): Promise<LibraryLocation[]> {
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return [];
  }

  const rows = await db
    .select()
    .from(libraryLocationsTable)
    .where(eq(libraryLocationsTable.userId, userIdInt))
    .orderBy(asc(libraryLocationsTable.name));

  return rows.map(dbRowToLibraryLocation);
}

/**
 * Helper function to convert database row to IngestQueueItem
 */
function dbRowToIngestQueueItem(row: any): IngestQueueItem {
  return {
    id: row.id,
    libraryItemId: row.libraryItemId,
    userId: row.userId.toString(),
    priority: row.priority as 'low' | 'normal' | 'high',
    status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    error: row.error || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    processedAt: row.processedAt || undefined,
  };
}

/**
 * Enqueue a library item for RAG ingestion
 */
export async function enqueueIngest(
  libraryItemId: string,
  userId: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<IngestQueueItem> {
  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    throw new Error(`Invalid userId: ${userId}`);
  }

  const [inserted] = await db
    .insert(ingestQueueTable)
    .values({
      libraryItemId,
      userId: userIdInt,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return dbRowToIngestQueueItem(inserted);
}

/**
 * Get pending items from the ingest queue
 */
export async function getIngestQueue(
  userId?: string,
  status?: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<IngestQueueItem[]> {
  const conditions: SQL<unknown>[] = [];

  if (userId) {
    const userIdInt = parseInt(userId, 10);
    if (!isNaN(userIdInt)) {
      conditions.push(eq(ingestQueueTable.userId, userIdInt));
    }
  }

  if (status) {
    conditions.push(eq(ingestQueueTable.status, status));
  }

  const rows = await db
    .select()
    .from(ingestQueueTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(ingestQueueTable.createdAt));

  // Sort by priority (high > normal > low) then by creation date in application layer
  const priorityMap = { high: 3, normal: 2, low: 1 };
  return rows
    .map(dbRowToIngestQueueItem)
    .sort((a, b) => {
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
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
  if (updates.maxAttempts !== undefined) updateData.maxAttempts = updates.maxAttempts;
  if (updates.error !== undefined) updateData.error = updates.error;
  if (updates.processedAt !== undefined) updateData.processedAt = updates.processedAt;

  const [updated] = await db
    .update(ingestQueueTable)
    .set(updateData)
    .where(eq(ingestQueueTable.id, id))
    .returning();

  return updated ? dbRowToIngestQueueItem(updated) : null;
}

/**
 * Mark a library item as superseded by a newer version
 */
export async function markSuperseded(
  oldItemId: string,
  newItemId: string
): Promise<boolean> {
  const [updated] = await db
    .update(libraryItemsTable)
    .set({
      superseded: true,
      supersededBy: newItemId,
      updatedAt: new Date(),
    })
    .where(eq(libraryItemsTable.id, oldItemId))
    .returning();

  return updated !== undefined;
}

/**
 * Pin/unpin a library item
 */
export async function togglePin(itemId: string): Promise<LibraryItem | null> {
  // First get current state
  const [current] = await db
    .select()
    .from(libraryItemsTable)
    .where(eq(libraryItemsTable.id, itemId))
    .limit(1);

  if (!current) return null;

  const [updated] = await db
    .update(libraryItemsTable)
    .set({
      pinned: !current.pinned,
      updatedAt: new Date(),
    })
    .where(eq(libraryItemsTable.id, itemId))
    .returning();

  return updated ? dbRowToLibraryItem(updated) : null;
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
  const userIdInt = parseInt(item.userId, 10);
  if (isNaN(userIdInt)) {
    throw new Error(`Invalid userId: ${item.userId}`);
  }

  const itemData: any = {
    userId: userIdInt,
    locationId: item.locationId,
    filename: item.filename,
    filepath: item.filepath,
    fileType: item.fileType,
    fileSize: BigInt(item.fileSize || 0),
    title: item.title,
    description: item.description,
    sourceType: item.sourceType,
    jurisdiction: item.jurisdiction,
    county: item.county,
    court: item.court,
    judgeReferee: item.judgeReferee,
    issueTags: item.issueTags || [],
    practiceAreas: item.practiceAreas || [],
    effectiveFrom: item.effectiveFrom,
    effectiveTo: item.effectiveTo,
    dateCreated: item.dateCreated,
    dateModified: item.dateModified || new Date(),
    ingested: item.ingested ?? false,
    ingestedAt: item.ingestedAt,
    vectorIds: item.vectorIds || [],
    pinned: item.pinned ?? false,
    superseded: item.superseded ?? false,
    supersededBy: item.supersededBy,
    lastAccessedAt: item.lastAccessedAt,
    updatedAt: new Date(),
  };

  if (item.id) {
    // Update existing
    const [updated] = await db
      .update(libraryItemsTable)
      .set(itemData)
      .where(eq(libraryItemsTable.id, item.id))
      .returning();
    
    return dbRowToLibraryItem(updated);
  } else {
    // Insert new
    const [inserted] = await db
      .insert(libraryItemsTable)
      .values({
        ...itemData,
        createdAt: new Date(),
      })
      .returning();
    
    return dbRowToLibraryItem(inserted);
  }
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
