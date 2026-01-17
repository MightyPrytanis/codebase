/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Nightly Library Refresh Job
 * 
 * Scheduled job that runs nightly to:
 * 1. Pull library items from top counties/jurisdictions based on practice profile
 * 2. Enqueue new or updated items for ingestion
 * 3. Evict stale items that are no longer relevant
 */

import {
  getPracticeProfile,
  getLibraryLocations,
  listLibraryItems,
  enqueueIngest,
  markSuperseded,
} from '../services/library-service.js';
import * as localConnector from '../modules/library/connectors/local.js';
import * as onedriveConnector from '../modules/library/connectors/onedrive.js';
import * as gdriveConnector from '../modules/library/connectors/gdrive.js';
import * as s3Connector from '../modules/library/connectors/s3.js';

/**
 * Process a single location for changes
 */
async function processLocation(
  location: any,
  userId: string
): Promise<void> {
  console.log(`[Nightly Refresh] Processing location: ${location.name} (${location.type})`);
  
  try {
    let changes: any[] = [];
    
    // Call appropriate connector based on location type
    switch (location.type) {
      case 'local':
        changes = await localConnector.listChanges(location.path, location.lastSyncAt);
        break;
      case 'onedrive':
        changes = await onedriveConnector.listChanges(
          location.path,
          location.credentials,
          location.lastSyncAt
        );
        break;
      case 'gdrive':
        changes = await gdriveConnector.listChanges(
          location.path,
          location.credentials,
          location.lastSyncAt
        );
        break;
      case 's3':
        changes = await s3Connector.listChanges(
          location.path,
          location.credentials,
          location.lastSyncAt
        );
        break;
      default:
        console.warn(`[Nightly Refresh] Unknown location type: ${location.type}`);
        return;
    }
    
    console.log(`[Nightly Refresh] Found ${changes.length} changes in ${location.name}`);
    
    // TODO: Process changes (add/update/delete library items)
    // For now, just log them
    for (const change of changes) {
      console.log(`  ${change.type}: ${change.filename}`);
    }
  } catch (error) {
    console.error(`[Nightly Refresh] Error processing location ${location.name}:`, error);
  }
}

/**
 * Pull library items from top counties/jurisdictions
 */
async function pullTopCounties(userId: string): Promise<void> {
  const profile = await getPracticeProfile(userId);
  if (!profile) {
    console.log(`[Nightly Refresh] No practice profile found for user ${userId}`);
    return;
  }
  
  console.log(`[Nightly Refresh] Pulling library items for jurisdictions: ${profile.primaryJurisdiction}`);
  console.log(`[Nightly Refresh] Counties: ${profile.counties.join(', ')}`);
  
  // TODO: Implement actual pulling from legal research providers
  // This would integrate with Westlaw, CourtListener, or other providers
  // to fetch relevant standing orders, local rules, etc.
  
  console.log(`[Nightly Refresh] Would pull items for ${profile.counties.length} counties`);
}

/**
 * Evict stale items that are superseded or expired
 */
async function evictStaleItems(userId: string): Promise<void> {
  const items = await listLibraryItems(userId);
  const now = new Date();
  
  let evictedCount = 0;
  
  for (const item of items) {
    // Check if item has expired (effectiveTo date has passed)
    if (item.effectiveTo && item.effectiveTo < now) {
      console.log(`[Nightly Refresh] Item expired: ${item.title}`);
      // TODO: Mark as superseded or archive
      evictedCount++;
    }
    
    // Check if item is superseded and the new version is already ingested
    if (item.superseded && item.supersededBy) {
      const newItem = await listLibraryItems(userId, { superseded: false });
      const replacement = newItem.find(i => i.id === item.supersededBy);
      if (replacement && replacement.ingested) {
        console.log(`[Nightly Refresh] Superseded item can be archived: ${item.title}`);
        // TODO: Archive or remove from active library
        evictedCount++;
      }
    }
  }
  
  console.log(`[Nightly Refresh] Evicted ${evictedCount} stale items`);
}

/**
 * Main nightly refresh function
 */
export async function runNightlyRefresh(userId?: string): Promise<void> {
  console.log('[Nightly Refresh] Starting nightly library refresh');
  const startTime = Date.now();
  
  try {
    // If no userId specified, run for all users (TODO: get from database)
    const userIds = userId ? [userId] : ['default-user'];
    
    for (const uid of userIds) {
      console.log(`[Nightly Refresh] Processing user: ${uid}`);
      
      // Step 1: Pull library items from top counties
      await pullTopCounties(uid);
      
      // Step 2: Sync all locations
      const locations = await getLibraryLocations(uid);
      for (const location of locations) {
        if (location.enabled) {
          await processLocation(location, uid);
        }
      }
      
      // Step 3: Evict stale items
      await evictStaleItems(uid);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Nightly Refresh] Completed in ${duration}ms`);
  } catch (error) {
    console.error('[Nightly Refresh] Error during nightly refresh:', error);
    throw error;
  }
}

// If run directly, execute the nightly refresh
if (import.meta.url === `file://${process.argv[1]}`) {
  runNightlyRefresh().catch(err => {
    console.error('[Nightly Refresh] Fatal error:', err);
    process.exit(1);
  });
