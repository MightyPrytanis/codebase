/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  createDocument,
  getDocument,
  listDocuments,
  addVersion,
  getVersions,
  deleteDocument,
} from '../version-control.js';

export const documentsRouter = Router();

documentsRouter.get('/', (_req, res) => {
  res.json(listDocuments());
});

const CreateDocumentSchema = z.object({ title: z.string().min(1) });

documentsRouter.post('/', (req, res) => {
  const parsed = CreateDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const doc = createDocument(uuidv4(), parsed.data.title);
  res.status(201).json(doc);
});

documentsRouter.get('/:id', (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(doc);
});

documentsRouter.delete('/:id', (req, res) => {
  const deleted = deleteDocument(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.status(204).send();
});

documentsRouter.get('/:id/versions', (req, res) => {
  const versions = getVersions(req.params.id);
  if (versions === null) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(versions);
});

const AddVersionSchema = z.object({
  content: z.string(),
  model: z.string(),
  provider: z.string(),
  prompt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

documentsRouter.post('/:id/versions', (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const parsed = AddVersionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const version = addVersion(req.params.id, {
    id: uuidv4(),
    documentId: req.params.id,
    content: parsed.data.content,
    model: parsed.data.model,
    provider: parsed.data.provider,
    prompt: parsed.data.prompt,
    timestamp: new Date().toISOString(),
    metadata: parsed.data.metadata ?? {},
  });
  res.status(201).json(version);
});
