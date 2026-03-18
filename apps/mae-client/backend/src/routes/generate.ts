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
});

async function callCyranoMAE(
  prompt: string,
  provider: string,
  model: string,
  context?: string,
): Promise<string> {
  const response = await fetch(`${CYRANO_URL}/mcp/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'mae_engine',
      input: {
        action: 'execute_workflow',
        prompt,
        provider,
        model,
        context: context ?? '',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cyrano HTTP bridge error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }>; result?: string };
  // Support both MCP content array format and plain result string
  if (data.content && Array.isArray(data.content) && data.content.length > 0) {
    return data.content[0]?.text ?? '';
  }
  if (typeof data.result === 'string') {
    return data.result;
  }
  return JSON.stringify(data);
}

generateRouter.post('/', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { documentId, prompt, models, context } = parsed.data;

  const doc = getDocument(documentId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const versions: DocumentVersion[] = [];
  const errors: { provider: string; model: string; error: string }[] = [];

  await Promise.allSettled(
    models.map(async ({ provider, model }) => {
      try {
        const content = await callCyranoMAE(prompt, provider, model, context);
        const version = addVersion(documentId, {
          id: uuidv4(),
          documentId,
          content,
          model,
          provider,
          prompt,
          timestamp: new Date().toISOString(),
          metadata: {},
        });
        if (version) versions.push(version);
      } catch (err) {
        errors.push({
          provider,
          model,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  res.json({ versions, errors: errors.length > 0 ? errors : undefined });
});

generateRouter.post('/stream', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { documentId, prompt, models, context } = parsed.data;

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

  for (const { provider, model } of models) {
    sendEvent('start', { provider, model });
    try {
      const content = await callCyranoMAE(prompt, provider, model, context);
      const version = addVersion(documentId, {
        id: uuidv4(),
        documentId,
        content,
        model,
        provider,
        prompt,
        timestamp: new Date().toISOString(),
        metadata: {},
      });
      if (version) sendEvent('version', version);
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
