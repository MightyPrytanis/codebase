/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import express from 'express';
import cors from 'cors';
import { documentsRouter } from './routes/documents.js';
import { generateRouter } from './routes/generate.js';
import { workflowRouter } from './routes/workflow.js';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/workflow', workflowRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'swimMeet' });
});

const port = parseInt(process.env.SWIM_MEET_PORT ?? process.env.MAE_CLIENT_PORT ?? '5003', 10);
app.listen(port, () => {
  console.log(`SwimMeet backend listening on port ${port}`);
});
