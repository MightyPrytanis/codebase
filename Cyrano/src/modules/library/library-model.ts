/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Model - Types and interfaces for legal library management
 * 
 * Defines data structures for practice profiles, library items, and storage locations
 * used in the Library + RAG Onboarding system.
 */

export interface PracticeProfile {
  id: string;
  userId: string;
  
  // Jurisdictions
  primaryJurisdiction: string;
  additionalJurisdictions: string[];
  
  // Practice areas
  practiceAreas: string[];
  
  // Courts and counties
  counties: string[];
  courts: string[];
  
  // Issue areas/tags
  issueTags: string[];
  
  // Storage and cache preferences
  storagePreferences: {
    localPath?: string;
    oneDriveEnabled?: boolean;
    gDriveEnabled?: boolean;
    s3Enabled?: boolean;
    s3Bucket?: string;
    cacheSize?: number;
  };
  
  // Research provider preferences
  researchProvider?: 'westlaw' | 'courtlistener' | 'other';
  
  // Integration credentials (encrypted)
  integrations?: {
    clio?: {
      enabled: boolean;
      clientId?: string;
    };
    // MiFile removed - use micourt_query tool for user-initiated docket queries
    // miFile?: {
    //   enabled: boolean;
    //   enrolled?: boolean;
    // };
    outlook?: {
      enabled: boolean;
      authenticated?: boolean;
    };
    gmail?: {
      enabled: boolean;
      authenticated?: boolean;
    };
    chronometric?: {
      baseline?: {
        minimumHoursPerWeek?: number;
        minimumHoursPerDay?: number;
        useBaselineUntilEnoughData?: boolean;
        typicalSchedule?: Record<string, any>;
        offDays?: string[];
        configuredAt?: string;
      };
    };
    onboarding?: {
      completed?: boolean;
      currentStep?: number;
      completedSteps?: number[];
      appId?: string;
      formData?: Record<string, any>;
      lastSaved?: string;
    };
    arkiver?: {
      config?: Record<string, any>;
      configuredAt?: string;
    };
    email?: {
      enabled?: boolean;
      authenticated?: boolean;
    };
    calendar?: {
      enabled?: boolean;
      authenticated?: boolean;
    };
  };
  
  // MAE/LLM provider selection
  llmProvider?: 'openai' | 'anthropic' | 'perplexity';
  llmProviderTested?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryLocation {
  id: string;
  userId: string;
  type: 'local' | 'onedrive' | 'gdrive' | 's3';
  name: string;
  path: string;
  credentials?: Record<string, any>; // Encrypted storage credentials
  enabled: boolean;
  lastSyncAt?: Date;
  syncStatus?: 'idle' | 'syncing' | 'error';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryItem {
  id: string;
  userId: string;
  locationId: string;
  
  // File information
  filename: string;
  filepath: string;
  fileType: string;
  fileSize: number;
  
  // Document metadata
  title: string;
  description?: string;
  sourceType: 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other';
  
  // Jurisdictional metadata
  jurisdiction?: string;
  county?: string;
  court?: string;
  judgeReferee?: string;
  
  // Content tags
  issueTags: string[];
  practiceAreas: string[];
  
  // Date metadata
  effectiveFrom?: Date;
  effectiveTo?: Date;
  dateCreated?: Date;
  dateModified?: Date;
  
  // RAG integration
  ingested: boolean;
  ingestedAt?: Date;
  vectorIds?: string[]; // IDs in vector store
  
  // Status
  pinned: boolean;
  superseded: boolean;
  supersededBy?: string; // ID of newer version
  
  // System metadata
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface IngestQueueItem {
  id: string;
  libraryItemId: string;
  userId: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface LibraryStats {
  totalItems: number;
  ingestedItems: number;
  pendingIngestion: number;
  lastSyncAt?: Date;
  lastError?: string;
  queueDepth: number;
}
