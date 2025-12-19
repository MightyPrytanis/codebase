/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Local Filesystem Connector
 * 
 * Scans local filesystem directories for library items and detects changes.
 */

export interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  filename: string;
  size?: number;
  modifiedAt?: Date;
}

/**
 * List changes in a local directory since last sync
 * @param path - Local filesystem path to scan
 * @param lastSyncAt - Last sync timestamp (optional)
 * @returns Array of file changes detected
 */
export async function listChanges(
  path: string,
  lastSyncAt?: Date
): Promise<FileChange[]> {
  // TODO: Implement actual filesystem scanning
  // For now, return empty array (stub implementation)
  
  console.log(`[Local Connector] Scanning path: ${path}`);
  if (lastSyncAt) {
    console.log(`[Local Connector] Last sync: ${lastSyncAt.toISOString()}`);
  }
  
  // Stub: Return empty changes array
  return [];
}
