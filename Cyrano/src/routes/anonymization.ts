/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Anonymization Management API Routes
 *
 * REST endpoints for user-controlled anonymization rules:
 *   Custom Sensitive Terms  – terms that are always anonymized
 *   Allowed Exceptions       – terms that are never anonymized
 *   Preview                  – test anonymization without persisting a session
 *
 * All endpoints operate on the singleton ClientAnonymizationService instance
 * so changes take effect immediately for subsequent anonymize() calls.
 *
 * When a PostgreSQL database is available the service additionally persists
 * the rules to the `sensitive_terms` / `exclusions` tables so they survive a
 * server restart.  If the database is unavailable the rules are held in memory
 * for the lifetime of the process only.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { clientAnonymizationService, type AnonymizableEntityType } from '../services/client-anonymization.js';
import { db } from '../db.js';
import { sensitiveTerms, exclusions } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const VALID_ENTITY_TYPES: AnonymizableEntityType[] = [
  'person', 'organization', 'location', 'date', 'money',
  'email', 'phone', 'ssn', 'account', 'statute', 'case',
];

const AddCustomTermSchema = z.object({
  term: z.string().trim().min(1, 'Term cannot be empty').max(500, 'Term too long'),
  entityType: z.enum(
    VALID_ENTITY_TYPES as [AnonymizableEntityType, ...AnonymizableEntityType[]]
  ),
});

const AddExceptionSchema = z.object({
  term: z.string().trim().min(1, 'Term cannot be empty').max(500, 'Term too long'),
});

const PreviewSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(50_000, 'Text exceeds 50 000 character limit'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Best-effort DB persistence – logs but does not throw on failure */
async function tryPersistTerm(term: string, entityType: AnonymizableEntityType, id: string): Promise<void> {
  try {
    if (!db) return;
    await db.insert(sensitiveTerms).values({ id, term, entityType }).onConflictDoNothing();
  } catch (err) {
    console.warn('[Anonymization] DB persist custom term failed (non-fatal):', (err as Error).message);
  }
}

async function tryDeletePersistedTerm(id: string): Promise<void> {
  try {
    if (!db) return;
    await db.delete(sensitiveTerms).where(eq(sensitiveTerms.id, id));
  } catch (err) {
    console.warn('[Anonymization] DB delete custom term failed (non-fatal):', (err as Error).message);
  }
}

async function tryPersistException(term: string, id: string): Promise<void> {
  try {
    if (!db) return;
    await db.insert(exclusions).values({ id, term }).onConflictDoNothing();
  } catch (err) {
    console.warn('[Anonymization] DB persist exception failed (non-fatal):', (err as Error).message);
  }
}

async function tryDeletePersistedException(id: string): Promise<void> {
  try {
    if (!db) return;
    await db.delete(exclusions).where(eq(exclusions.id, id));
  } catch (err) {
    console.warn('[Anonymization] DB delete exception failed (non-fatal):', (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Custom Sensitive Terms endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/anonymization/terms
 * Returns the list of all user-defined custom sensitive terms.
 */
router.get('/anonymization/terms', (_req: Request, res: Response) => {
  try {
    const terms = clientAnonymizationService.listCustomTerms();
    res.json({ success: true, data: terms });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list custom terms' });
  }
});

/**
 * POST /api/anonymization/terms
 * Add a new custom sensitive term.
 *
 * Body: { term: string, entityType: AnonymizableEntityType }
 */
router.post('/anonymization/terms', async (req: Request, res: Response) => {
  try {
    const parsed = AddCustomTermSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(e => e.message).join(', '),
      });
    }

    const entry = clientAnonymizationService.addCustomTerm(parsed.data.term, parsed.data.entityType);
    await tryPersistTerm(entry.term, entry.entityType, entry.id);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add custom term' });
  }
});

/**
 * DELETE /api/anonymization/terms/:id
 * Remove a custom sensitive term by its ID.
 */
router.delete('/anonymization/terms/:id', async (req: Request, res: Response) => {
  try {
    const idParam = req.params['id'];
    const id = (Array.isArray(idParam) ? idParam[0] : idParam) ?? '';
    const removed = clientAnonymizationService.removeCustomTerm(id);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Custom term not found' });
    }
    await tryDeletePersistedTerm(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove custom term' });
  }
});

// ---------------------------------------------------------------------------
// Allowed Exceptions endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/anonymization/exceptions
 * Returns the list of all user-defined allowed exceptions.
 */
router.get('/anonymization/exceptions', (_req: Request, res: Response) => {
  try {
    const exceptions = clientAnonymizationService.listExceptions();
    res.json({ success: true, data: exceptions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list exceptions' });
  }
});

/**
 * POST /api/anonymization/exceptions
 * Add a new allowed exception.
 *
 * Body: { term: string }
 */
router.post('/anonymization/exceptions', async (req: Request, res: Response) => {
  try {
    const parsed = AddExceptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(e => e.message).join(', '),
      });
    }

    const entry = clientAnonymizationService.addException(parsed.data.term);
    await tryPersistException(entry.term, entry.id);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add exception' });
  }
});

/**
 * DELETE /api/anonymization/exceptions/:id
 * Remove an allowed exception by its ID.
 */
router.delete('/anonymization/exceptions/:id', async (req: Request, res: Response) => {
  try {
    const idParam = req.params['id'];
    const id = (Array.isArray(idParam) ? idParam[0] : idParam) ?? '';
    const removed = clientAnonymizationService.removeException(id);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Exception not found' });
    }
    await tryDeletePersistedException(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove exception' });
  }
});

// ---------------------------------------------------------------------------
// Preview endpoint
// ---------------------------------------------------------------------------

/**
 * POST /api/anonymization/preview
 * Anonymize a text sample without persisting a session, using the current
 * custom terms and allowed exceptions rules.  Intended for the UI preview box.
 *
 * Body: { text: string }
 * Response: { anonymizedText, entitiesReplaced, riskCategory, summary }
 */
router.post('/anonymization/preview', (req: Request, res: Response) => {
  try {
    const parsed = PreviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(e => e.message).join(', '),
      });
    }

    const result = clientAnonymizationService.preview(parsed.data.text);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Preview failed' });
  }
});

export default router;
