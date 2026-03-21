/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDocument, addVersion, type DocumentVersion } from '../version-control.js';

export const generateRouter = Router();

const CYRANO_URL = process.env.CYRANO_URL ?? 'http://localhost:5002';

const ModelSpec = z.object({
  provider: z.string(),
  model: z.string(),
});

const GenerateSchema = z.object({
  documentId: z.string(),
  prompt: z.string().min(1),
  models: z.array(ModelSpec).min(1),
  context: z.string().optional(),
  anonymize: z.boolean().optional().describe('Anonymize prompt before sending to AI provider'),
});

interface CyranoVersion {
  provider: string;
  model: string;
  content: string;
  isError: boolean;
  error?: string;
  timestamp: string;
}

async function callCyranoMulti(
  prompt: string,
  models: Array<{ provider: string; model: string }>,
  context?: string,
  anonymize?: boolean,
): Promise<CyranoVersion[]> {
  const response = await fetch(`${CYRANO_URL}/api/mae/write/multi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      models,
      context,
      anonymize: anonymize ?? false,
      taskType: 'writing',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cyrano HTTP bridge error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { versions?: CyranoVersion[] };
  if (!data.versions || !Array.isArray(data.versions)) {
    throw new Error('Unexpected response shape from Cyrano');
  }
  return data.versions;
}

generateRouter.post('/', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { documentId, prompt, models, context, anonymize } = parsed.data;

  const doc = getDocument(documentId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  let cyranoVersions: CyranoVersion[];
  try {
    cyranoVersions = await callCyranoMulti(prompt, models, context, anonymize);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    return;
  }

  const versions: DocumentVersion[] = [];
  const errors: { provider: string; model: string; error: string }[] = [];

  for (const cv of cyranoVersions) {
    if (cv.isError || !cv.content) {
      errors.push({ provider: cv.provider, model: cv.model, error: cv.error ?? 'No content returned' });
    } else {
      const version = addVersion(documentId, {
        id: uuidv4(),
        documentId,
        content: cv.content,
        model: cv.model,
        provider: cv.provider,
        prompt,
        timestamp: cv.timestamp ?? new Date().toISOString(),
        metadata: { anonymized: anonymize ?? false },
      });
      if (version) versions.push(version);
    }
  }

  res.json({ versions, errors: errors.length > 0 ? errors : undefined });
});

generateRouter.post('/stream', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { documentId, prompt, models, context, anonymize } = parsed.data;

  const doc = getDocument(documentId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Stream: fan out one model at a time (sequential SSE)
  for (const { provider, model } of models) {
    sendEvent('start', { provider, model });
    try {
      const cyranoVersions = await callCyranoMulti(prompt, [{ provider, model }], context, anonymize);
      const cv = cyranoVersions[0];
      if (cv && !cv.isError && cv.content) {
        const version = addVersion(documentId, {
          id: uuidv4(),
          documentId,
          content: cv.content,
          model,
          provider,
          prompt,
          timestamp: cv.timestamp ?? new Date().toISOString(),
          metadata: { anonymized: anonymize ?? false },
        });
        if (version) sendEvent('version', version);
      } else {
        sendEvent('error', { provider, model, error: cv?.error ?? 'No content returned' });
      }
    } catch (err) {
      sendEvent('error', {
        provider,
        model,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  sendEvent('done', {});
  res.end();
});

