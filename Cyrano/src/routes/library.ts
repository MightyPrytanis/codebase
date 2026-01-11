/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library API Routes
 * 
 * REST API endpoints for library management:
 * - Practice profile management
 * - Library locations (storage connectors)
 * - Library items (documents, rules, templates)
 * - Pinning and ingestion operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  upsertPracticeProfile,
  getPracticeProfile,
  listLibraryItems,
  getLibraryItem,
  upsertLibraryItem,
  upsertLibraryLocation,
  getLibraryLocations,
  enqueueIngest,
  togglePin,
  getLibraryStats,
  getIngestQueue,
} from '../services/library-service.js';
import multer from 'multer';
import { getConnector } from '../modules/library/connectors/index.js';
import { authenticateJWT } from '../middleware/security.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Validation schemas for input data
const PracticeProfileSchema = z.object({
  userId: z.string().optional(),
  primaryJurisdiction: z.string().optional(),
  additionalJurisdictions: z.array(z.string()).optional(),
  practiceAreas: z.array(z.string()).optional(),
  counties: z.array(z.string()).optional(),
  courts: z.array(z.string()).optional(),
  issueTags: z.array(z.string()).optional(),
  storagePreferences: z.object({
    localPath: z.string().optional(),
    useOneDrive: z.boolean().optional(),
    useGoogleDrive: z.boolean().optional(),
    useS3: z.boolean().optional(),
    s3Bucket: z.string().optional(),
    cacheSize: z.number().optional(),
  }).optional(),
  researchProvider: z.enum(['westlaw', 'courtlistener', 'other']).optional(),
  integrations: z.object({
    clio: z.object({
      enabled: z.boolean(),
      clientId: z.string().optional(),
    }).optional(),
    // MiFile removed - use micourt_query tool for user-initiated docket queries
    // miFile: z.object({
    //   enabled: z.boolean().optional(),
    //   enrolled: z.boolean().optional(),
    // }).optional(),
    outlook: z.object({
      enabled: z.boolean(),
      authenticated: z.boolean().optional(),
    }).optional(),
    gmail: z.object({
      enabled: z.boolean(),
      authenticated: z.boolean().optional(),
    }).optional(),
  }).optional(),
  llmProvider: z.enum(['openai', 'anthropic', 'perplexity']).optional(),
  llmProviderTested: z.boolean().optional(),
});

const LibraryLocationSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, 'Location name is required'),
  type: z.enum(['local', 'onedrive', 'gdrive', 's3']),
  path: z.string().min(1, 'Path is required'),
  credentials: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().optional(),
});

const LibraryItemSchema = z.object({
  userId: z.string().optional(),
  locationId: z.string().min(1, 'Location ID is required'),
  filename: z.string().min(1, 'Filename is required'),
  filepath: z.string().min(1, 'Filepath is required'),
  fileType: z.string().min(1, 'File type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sourceType: z.enum(['rule', 'standing-order', 'template', 'playbook', 'case-law', 'statute', 'other']).optional(),
  jurisdiction: z.string().optional(),
  county: z.string().optional(),
  court: z.string().optional(),
  judgeReferee: z.string().optional(),
  issueTags: z.array(z.string()).optional(),
  practiceAreas: z.array(z.string()).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  dateCreated: z.string().optional(),
  dateModified: z.string().optional(),
  fileSize: z.number().optional(),
});

const IngestRequestSchema = z.object({
  userId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const BaselineConfigSchema = z.object({
  userId: z.string().optional(),
  minimumHoursPerWeek: z.number().min(0).max(168),
  minimumHoursPerDay: z.number().min(0).max(24).optional(),
  typicalSchedule: z.record(z.string(), z.number()).optional(),
  offDays: z.array(z.string()).optional(),
  useBaselineUntilDataAvailable: z.boolean().optional(),
});

const LibraryFiltersSchema = z.object({
  sourceType: z.array(z.string()).optional(),
  county: z.string().optional(),
  court: z.string().optional(),
  judgeReferee: z.string().optional(),
  issueTags: z.array(z.string()).optional(),
  ingested: z.boolean().optional(),
  pinned: z.boolean().optional(),
  superseded: z.boolean().optional(),
});

/**
 * POST /api/onboarding/practice-profile
 * Create or update user's practice profile
 */
router.post('/onboarding/practice-profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate request body type
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate and sanitize input using Zod schema
    const validationResult = PracticeProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid practice profile data',
        details: validationResult.error.issues
      });
    }

    const profileData = validationResult.data;
    
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || profileData.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const profile = await upsertPracticeProfile(userId, profileData);
    res.json(profile);
  } catch (error) {
    console.error('Error upserting practice profile:', error);
    res.status(500).json({ 
      error: 'Failed to save practice profile',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/onboarding/baseline-config
 * Save Chronometric baseline configuration
 * Note: Once Chronometric Engine is created, this will call the pattern_learning module
 */
router.post('/onboarding/baseline-config', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const validationResult = BaselineConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid baseline config data',
        details: validationResult.error.issues
      });
    }

    const configData = validationResult.data;
    const user = (req as any).user;
    const userId = user?.userId?.toString() || configData.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    // Import baseline config service directly
    // TODO: Once Chronometric Engine is created, use pattern_learning module via MCP
    const { saveBaselineConfig } = await import('../engines/chronometric/services/baseline-config.js');
    
    const config = await saveBaselineConfig({
      userId,
      minimumHoursPerWeek: configData.minimumHoursPerWeek,
      minimumHoursPerDay: configData.minimumHoursPerDay,
      typicalSchedule: configData.typicalSchedule,
      offDays: configData.offDays,
      useBaselineUntilDataAvailable: configData.useBaselineUntilDataAvailable ?? true,
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error saving baseline config:', error);
    res.status(500).json({ 
      error: 'Failed to save baseline config',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/onboarding/practice-profile
 * Get user's practice profile
 */
router.get('/onboarding/practice-profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const profile = await getPracticeProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Practice profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error getting practice profile:', error);
    res.status(500).json({ 
      error: 'Failed to get practice profile',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/locations
 * Add or update a library location (storage connector)
 */
router.post('/library/locations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate request body type
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate and sanitize input using Zod schema
    const validationResult = LibraryLocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid library location data',
        details: validationResult.error.issues
      });
    }

    const locationData = validationResult.data;
    
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || locationData.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const location = await upsertLibraryLocation(userId, {
      type: locationData.type,
      name: locationData.name,
      path: locationData.path,
      credentials: locationData.credentials,
      enabled: locationData.enabled,
    });
    res.json(location);
  } catch (error) {
    console.error('Error upserting library location:', error);
    res.status(500).json({ 
      error: 'Failed to save library location',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/locations/:id/sync
 * Trigger sync for a library location
 */
router.post('/library/locations/:id/sync', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate location ID parameter
    const LocationIdSchema = z.object({
      id: z.string().uuid('Location ID must be a valid UUID'),
    });
    
    const idValidation = LocationIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Invalid location ID format',
        details: idValidation.error.issues,
      });
    }

    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    // Get location (credentials will be decrypted by getLibraryLocations)
    const locations = await getLibraryLocations(userId);
    const location = locations.find(loc => loc.id === idValidation.data.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Library location not found' });
    }

    // Get connector and trigger sync (credentials already decrypted by getLibraryLocations)
    const connector = getConnector(location.type);
    const changes = await connector.listChanges({
      path: location.path,
      credentials: location.credentials, // Already decrypted
      lastSyncAt: location.lastSyncAt,
    });

    // Process changes: create/update library items
    const processedItems: any[] = [];
    const errors: any[] = [];

    for (const change of changes) {
      try {
        if (change.type === 'deleted') {
          // Find and mark library item as superseded
          const existingItems = await listLibraryItems(userId, {});
          const itemToDelete = existingItems.find(
            item => item.locationId === location.id && item.filepath.includes(change.filename)
          );
          
          if (itemToDelete) {
            await upsertLibraryItem({
              ...itemToDelete,
              superseded: true,
            });
            processedItems.push({ action: 'deleted', itemId: itemToDelete.id, filename: change.filename });
          }
        } else if (change.type === 'added' || change.type === 'modified') {
          // Get file metadata
          const metadata = await connector.getFileMetadata(change.path, {
            path: location.path,
            credentials: location.credentials,
          });

          if (!metadata) {
            errors.push({ filename: change.filename, error: 'Could not get file metadata' });
            continue;
          }

          // Check if item already exists
          const existingItems = await listLibraryItems(userId, {});
          const existingItem = existingItems.find(
            item => item.locationId === location.id && item.filepath.includes(change.filename)
          );

          // Determine file type from extension
          const ext = change.filename.toLowerCase().substring(change.filename.lastIndexOf('.'));
          const mimeType = metadata.mimeType || 'application/octet-stream';

          // Create or update library item
          const libraryItem = await upsertLibraryItem({
            ...(existingItem || {}),
            userId,
            locationId: location.id,
            filename: change.filename,
            filepath: `${location.path}/${change.path}`,
            fileType: mimeType,
            fileSize: metadata.size || 0,
            title: change.filename.replace(/\.[^/.]+$/, ''), // Remove extension for title
            sourceType: existingItem?.sourceType || 'other',
            dateModified: metadata.modifiedAt,
            ingested: existingItem?.ingested || false,
          });

          processedItems.push({ 
            action: existingItem ? 'updated' : 'created', 
            itemId: libraryItem.id, 
            filename: change.filename 
          });
        }
      } catch (error) {
        errors.push({ 
          filename: change.filename, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Update lastSyncAt and sync status
    await upsertLibraryLocation(userId, {
      ...location,
      lastSyncAt: new Date(),
      syncStatus: errors.length > 0 ? 'error' : 'idle',
      syncError: errors.length > 0 ? `${errors.length} errors during sync` : undefined,
    });

    res.json({
      success: true,
      changesFound: changes.length,
      processed: processedItems.length,
      processedItems,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error syncing library location:', error);
    res.status(500).json({ 
      error: 'Failed to sync library location',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/library/locations
 * Get all library locations for a user
 */
router.get('/library/locations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const locations = await getLibraryLocations(userId);
    res.json(locations);
  } catch (error) {
    console.error('Error getting library locations:', error);
    res.status(500).json({ 
      error: 'Failed to get library locations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/library/items
 * List library items with optional filters
 */
router.get('/library/items', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    // Parse and validate filters from query params
    const rawFilters: Record<string, any> = {};
    
    if (req.query.sourceType && typeof req.query.sourceType === 'string') {
      rawFilters.sourceType = req.query.sourceType.split(',').filter(s => typeof s === 'string');
    }
    if (req.query.county && typeof req.query.county === 'string') {
      rawFilters.county = req.query.county;
    }
    if (req.query.court && typeof req.query.court === 'string') {
      rawFilters.court = req.query.court;
    }
    if (req.query.judgeReferee && typeof req.query.judgeReferee === 'string') {
      rawFilters.judgeReferee = req.query.judgeReferee;
    }
    if (req.query.issueTags && typeof req.query.issueTags === 'string') {
      rawFilters.issueTags = req.query.issueTags.split(',').filter(s => typeof s === 'string');
    }
    if (req.query.ingested !== undefined) {
      rawFilters.ingested = req.query.ingested === 'true';
    }
    if (req.query.pinned !== undefined) {
      rawFilters.pinned = req.query.pinned === 'true';
    }
    if (req.query.superseded !== undefined) {
      rawFilters.superseded = req.query.superseded === 'true';
    }

    // Validate filters with Zod schema
    const validationResult = LibraryFiltersSchema.safeParse(rawFilters);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid filter parameters',
        details: validationResult.error.issues
      });
    }

    const filters = validationResult.data;
    
    const items = await listLibraryItems(userId, filters);
    res.json(items);
  } catch (error) {
    console.error('Error listing library items:', error);
    res.status(500).json({ 
      error: 'Failed to list library items',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/library/items/:id
 * Get a single library item
 */
router.get('/library/items/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate item ID with Zod
    const ItemIdSchema = z.object({
      id: z.string().uuid('Item ID must be a valid UUID'),
    });
    
    const validationResult = ItemIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid item ID format',
        details: validationResult.error.issues,
      });
    }

    const item = await getLibraryItem(validationResult.data.id);
    if (!item) {
      return res.status(404).json({ error: 'Library item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error getting library item:', error);
    res.status(500).json({ 
      error: 'Failed to get library item',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/items/:id/pin
 * Toggle pin status of a library item
 */
router.post('/library/items/:id/pin', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate item ID
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const item = await togglePin(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Library item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ 
      error: 'Failed to toggle pin',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/items
 * Create or update a library item
 */
router.post('/library/items', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate request body type
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate and sanitize input using Zod schema
    const validationResult = LibraryItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid library item data',
        details: validationResult.error.issues
      });
    }

    const itemData = validationResult.data;
    
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || itemData.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const item = await upsertLibraryItem({
      ...itemData,
      userId,
      sourceType: itemData.sourceType || 'other',
      effectiveFrom: itemData.effectiveFrom ? new Date(itemData.effectiveFrom) : undefined,
      effectiveTo: itemData.effectiveTo ? new Date(itemData.effectiveTo) : undefined,
      dateCreated: itemData.dateCreated ? new Date(itemData.dateCreated) : undefined,
      dateModified: itemData.dateModified ? new Date(itemData.dateModified) : undefined,
    });
    
    res.json(item);
  } catch (error) {
    console.error('Error upserting library item:', error);
    res.status(500).json({ 
      error: 'Failed to save library item',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/library/items/:id
 * Delete a library item (soft delete by default, hard delete with ?hard=true)
 */
router.delete('/library/items/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate item ID with Zod
    const ItemIdSchema = z.object({
      id: z.string().uuid('Item ID must be a valid UUID'),
    });
    
    const validationResult = ItemIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid item ID format',
        details: validationResult.error.issues,
      });
    }

    const item = await getLibraryItem(validationResult.data.id);
    if (!item) {
      return res.status(404).json({ error: 'Library item not found' });
    }

    // Check if hard delete is requested
    const hardDelete = req.query.hard === 'true';
    
    if (hardDelete) {
      // Hard delete: Remove from database
      const { db } = await import('../db.js');
      const { libraryItems } = await import('../schema-library.js');
      const { eq } = await import('drizzle-orm');
      
      await db.delete(libraryItems).where(eq(libraryItems.id, validationResult.data.id));
      
      res.json({ success: true, message: 'Library item permanently deleted' });
    } else {
      // Soft delete: Mark as superseded
      await upsertLibraryItem({
        ...item,
        superseded: true,
      });

      res.json({ success: true, message: 'Library item marked as superseded' });
    }
  } catch (error) {
    console.error('Error deleting library item:', error);
    res.status(500).json({ 
      error: 'Failed to delete library item',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/items/upload
 * Upload a document to the library
 */
router.post('/library/items/upload', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate request body with Zod
    const UploadItemSchema = z.object({
      locationId: z.string().uuid('Location ID must be a valid UUID'),
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      sourceType: z.enum(['rule', 'standing-order', 'template', 'playbook', 'case-law', 'statute', 'other']).optional().default('other'),
    });
    
    const validationResult = UploadItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid upload request data',
        details: validationResult.error.issues,
      });
    }

    // Get userId from authenticated session
    const user = (req as any).user;
    const finalUserId = user?.userId?.toString();
    
    if (!finalUserId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { locationId, title, description, sourceType } = validationResult.data;

    // Get location to determine where to save
    const locations = await getLibraryLocations(finalUserId);
    const location = locations.find(loc => loc.id === locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Library location not found' });
    }

    // Save file to location using connector
    const connector = getConnector(location.type);
    const filepath = req.file.originalname; // Relative path from location root
    
    // Upload file using connector (works for all storage types)
    await connector.uploadFile(filepath, req.file.buffer, {
      path: location.path,
      credentials: location.credentials,
    });
    
    // Full path for database record
    const fullFilepath = location.type === 'local' 
      ? `${location.path}/${filepath}`
      : `${location.path}/${filepath}`;

    // Create library item record
    const item = await upsertLibraryItem({
      userId: finalUserId,
      locationId,
      filename: req.file.originalname,
      filepath: fullFilepath,
      fileType: req.file.mimetype || 'application/octet-stream',
      fileSize: req.file.size,
      title,
      description,
      sourceType: sourceType as any,
    });

    res.json(item);
  } catch (error) {
    console.error('Error uploading library item:', error);
    res.status(500).json({ 
      error: 'Failed to upload library item',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/library/items/:id/ingest
 * Enqueue a library item for RAG ingestion
 */
router.post('/library/items/:id/ingest', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate request body type
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate and sanitize input using Zod schema
    const validationResult = IngestRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid ingest request data',
        details: validationResult.error.issues
      });
    }

    const ingestData = validationResult.data;
    
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || ingestData.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const priority = ingestData.priority || 'normal';
    
    // Validate item ID with Zod
    const ItemIdSchema = z.object({
      id: z.string().uuid('Item ID must be a valid UUID'),
    });
    
    const idValidation = ItemIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Invalid item ID format',
        details: idValidation.error.issues,
      });
    }
    
    const queueItem = await enqueueIngest(idValidation.data.id, userId, priority);
    res.json(queueItem);
  } catch (error) {
    console.error('Error enqueueing ingest:', error);
    res.status(500).json({ 
      error: 'Failed to enqueue item for ingestion',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/library/ingest/queue
 * Get ingest queue status
 */
router.get('/library/ingest/queue', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated session (optional - can view all if admin)
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : undefined);
    const status = typeof req.query.status === 'string' 
      ? req.query.status as 'pending' | 'processing' | 'completed' | 'failed'
      : undefined;
    
    const queue = await getIngestQueue(userId, status);
    res.json(queue);
  } catch (error) {
    console.error('Error getting ingest queue:', error);
    res.status(500).json({ 
      error: 'Failed to get ingest queue',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/health/library
 * Get library system health and stats
 */
router.get('/health/library', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated session
    const user = (req as any).user;
    const userId = user?.userId?.toString() || (typeof req.query.userId === 'string' ? req.query.userId : null);
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    const stats = await getLibraryStats(userId);
    res.json({
      status: stats.lastError ? 'degraded' : 'healthy',
      ...stats,
    });
  } catch (error) {
    console.error('Error getting library health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to get library health',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

)
)
}