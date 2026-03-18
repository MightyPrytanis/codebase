/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import express from 'express';
import cors from 'cors';
import { documentsRouter } from './routes/documents.js';
import { generateRouter } from './routes/generate.js';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRouter);
app.use('/api/generate', generateRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mae-client-backend' });
});

const port = parseInt(process.env.MAE_CLIENT_PORT ?? '5003', 10);
app.listen(port, () => {
  console.log(`MAE client backend listening on port ${port}`);
});
