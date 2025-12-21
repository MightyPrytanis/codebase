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
  upsertLibraryLocation,
  getLibraryLocations,
  enqueueIngest,
  togglePin,
  getLibraryStats,
} from '../services/library-service.js';

const router = Router();

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
  researchProvider: z.string().optional(),
  integrations: z.object({
    clio: z.object({
      enabled: z.boolean().optional(),
      apiKey: z.string().optional(),
    }).optional(),
    miFile: z.object({
      enabled: z.boolean().optional(),
      enrolled: z.boolean().optional(),
    }).optional(),
    outlook: z.object({
      enabled: z.boolean().optional(),
      accessToken: z.string().optional(),
    }).optional(),
    gmail: z.object({
      enabled: z.boolean().optional(),
      accessToken: z.string().optional(),
    }).optional(),
  }).optional(),
  llmProvider: z.string().optional(),
  llmProviderTested: z.boolean().optional(),
});

const LibraryLocationSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, 'Location name is required'),
  type: z.enum(['local', 'onedrive', 'gdrive', 's3']),
  config: z.record(z.any()),
  enabled: z.boolean().optional(),
});

const IngestRequestSchema = z.object({
  userId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const BaselineConfigSchema = z.object({
  userId: z.string().optional(),
  minimumHoursPerWeek: z.number().min(0).max(168),
  minimumHoursPerDay: z.number().min(0).max(24).optional(),
  typicalSchedule: z.record(z.number()).optional(),
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
router.post('/onboarding/practice-profile', async (req: Request, res: Response) => {
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
        details: validationResult.error.errors
      });
    }

    const profileData = validationResult.data;
    
    // TODO: Get userId from authenticated session
    const userId = profileData.userId || 'default-user';
    
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
router.post('/onboarding/baseline-config', async (req: Request, res: Response) => {
  try {
    const validationResult = BaselineConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid baseline config data',
        details: validationResult.error.errors
      });
    }

    const configData = validationResult.data;
    const userId = configData.userId || 'default-user';
    
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
router.get('/onboarding/practice-profile', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default-user';
    
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
router.post('/library/locations', async (req: Request, res: Response) => {
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
        details: validationResult.error.errors
      });
    }

    const locationData = validationResult.data;
    
    // TODO: Get userId from authenticated session
    const userId = locationData.userId || 'default-user';
    
    const location = await upsertLibraryLocation(userId, locationData);
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
 * GET /api/library/locations
 * Get all library locations for a user
 */
router.get('/library/locations', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default-user';
    
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
router.get('/library/items', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default-user';
    
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
        details: validationResult.error.errors
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
router.get('/library/items/:id', async (req: Request, res: Response) => {
  try {
    // Validate item ID
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const item = await getLibraryItem(req.params.id);
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
router.post('/library/items/:id/pin', async (req: Request, res: Response) => {
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
 * POST /api/library/items/:id/ingest
 * Enqueue a library item for RAG ingestion
 */
router.post('/library/items/:id/ingest', async (req: Request, res: Response) => {
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
        details: validationResult.error.errors
      });
    }

    const ingestData = validationResult.data;
    
    // TODO: Get userId from authenticated session
    const userId = ingestData.userId || 'default-user';
    const priority = ingestData.priority || 'normal';
    
    // Validate item ID
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    const queueItem = await enqueueIngest(req.params.id, userId, priority);
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
 * GET /api/health/library
 * Get library system health and stats
 */
router.get('/health/library', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default-user';
    
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
