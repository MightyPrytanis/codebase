/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDocument } from '../version-control.js';
import { runWorkflow, WORKFLOW_PRESETS, type WorkflowType } from '../workflow-engine.js';

export const workflowRouter = Router();

const ModelSpec = z.object({
  provider: z.string(),
  model: z.string(),
  label: z.string().optional(),
});

const WorkflowRunSchema = z.object({
  documentId: z.string(),
  prompt: z.string().min(1),
  context: z.string().optional(),
  models: z.array(ModelSpec).min(1),
  synthesizer: ModelSpec.optional(),
  workflowType: z.enum(['parallel', 'relay', 'committee', 'critique', 'ebom', 'panel']),
  anonymize: z.boolean().optional(),
  expertPersonas: z.array(z.string()).optional(),
  taskType: z.string().optional(),
});

workflowRouter.get('/presets', (_req: Request, res: Response) => {
  res.json(WORKFLOW_PRESETS);
});

workflowRouter.post('/run', async (req: Request, res: Response) => {
  const parsed = WorkflowRunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const {
    documentId,
    prompt,
    context,
    models,
    synthesizer,
    workflowType,
    anonymize,
    expertPersonas,
    taskType,
  } = parsed.data;

  const doc = getDocument(documentId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const preset = WORKFLOW_PRESETS[workflowType as WorkflowType];
  if (preset.requiresSynthesizer && !synthesizer) {
    res.status(400).json({
      error: `Workflow type '${workflowType}' requires a synthesizer model.`,
    });
    return;
  }

  if (models.length < preset.minModels) {
    res.status(400).json({
      error: `Workflow type '${workflowType}' requires at least ${preset.minModels} models.`,
    });
    return;
  }

  try {
    const stages = await runWorkflow({
      documentId,
      prompt,
      context,
      models,
      synthesizer,
      workflowType: workflowType as WorkflowType,
      anonymize,
      expertPersonas,
      taskType,
    });
    res.json({ stages });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
