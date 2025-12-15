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

/**
 * POST /api/onboarding/practice-profile
 * Create or update user's practice profile
 */
router.post('/onboarding/practice-profile', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = req.body.userId || 'default-user';
    
    const profile = await upsertPracticeProfile(userId, req.body);
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
 * GET /api/onboarding/practice-profile
 * Get user's practice profile
 */
router.get('/onboarding/practice-profile', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = req.query.userId as string || 'default-user';
    
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
    // TODO: Get userId from authenticated session
    const userId = req.body.userId || 'default-user';
    
    const location = await upsertLibraryLocation(userId, req.body);
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
    const userId = req.query.userId as string || 'default-user';
    
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
    const userId = req.query.userId as string || 'default-user';
    
    // Parse filters from query params
    const filters: any = {};
    if (req.query.sourceType) {
      filters.sourceType = (req.query.sourceType as string).split(',');
    }
    if (req.query.county) {
      filters.county = req.query.county as string;
    }
    if (req.query.court) {
      filters.court = req.query.court as string;
    }
    if (req.query.judgeReferee) {
      filters.judgeReferee = req.query.judgeReferee as string;
    }
    if (req.query.issueTags) {
      filters.issueTags = (req.query.issueTags as string).split(',');
    }
    if (req.query.ingested !== undefined) {
      filters.ingested = req.query.ingested === 'true';
    }
    if (req.query.pinned !== undefined) {
      filters.pinned = req.query.pinned === 'true';
    }
    if (req.query.superseded !== undefined) {
      filters.superseded = req.query.superseded === 'true';
    }
    
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
    // TODO: Get userId from authenticated session
    const userId = req.body.userId || 'default-user';
    const priority = req.body.priority || 'normal';
    
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
    const userId = req.query.userId as string || 'default-user';
    
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
