/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Storage Connectors Index
 * 
 * Exports all storage connectors and provides a factory function to get the appropriate connector.
 */

import { StorageConnector, ConnectorConfig } from './base-connector.js';
import { localConnector } from './local.js';
import { oneDriveConnector } from './onedrive.js';
import { googleDriveConnector } from './gdrive.js';
import { s3Connector } from './s3.js';

export * from './base-connector.js';
export { localConnector, listChanges as listChangesLocal } from './local.js';
export { oneDriveConnector, listChanges as listChangesOneDrive } from './onedrive.js';
export { googleDriveConnector, listChanges as listChangesGDrive } from './gdrive.js';
export { s3Connector, listChanges as listChangesS3 } from './s3.js';

/**
 * Get the appropriate storage connector based on location type
 */
export function getConnector(type: 'local' | 'onedrive' | 'gdrive' | 's3'): StorageConnector {
  switch (type) {
    case 'local':
      return localConnector;
    case 'onedrive':
      return oneDriveConnector;
    case 'gdrive':
      return googleDriveConnector;
    case 's3':
      return s3Connector;
    default:
      throw new Error(`Unknown connector type: ${type}`);
