/**
 * Simple Cyrano HTTP Bridge - Development/Test Version
 * 
 * ⚠️ WARNING: This is a simplified HTTP bridge for development/testing only.
 * For production, use the full http-bridge.ts implementation.
 * 
 * This bridge uses mock responses and should NOT be used in production.
 * It is provided for quick testing and development purposes only.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5002;

// Warn if used in production
if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: simple-http-bridge.ts is for development/testing only. Use http-bridge.ts for production.');
}

// Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use(express.json());

// Simple tools list
const tools = [
  {
    name: 'document_analyzer',
    description: 'Analyze legal documents (MOCK - development only)',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        documentType: { type: 'string' }
      },
      required: ['content']
    }
  },
  {
    name: 'contract_comparator',
    description: 'Compare contracts/agreements (MOCK - development only)',
    inputSchema: {
      type: 'object',
      properties: {
        documents: { type: 'array', items: { type: 'string' } },
        comparisonType: { type: 'string' }
      },
      required: ['documents']
    }
  },
  {
    name: 'extract_conversations',
    description: 'Extract ChatGPT conversations (MOCK - development only)',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        title_filter: { type: 'string' }
      },
      required: ['file_path']
    }
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'cyrano-simple-bridge' });
});

app.get('/mcp/tools', (req, res) => {
  res.json({ tools, _warning: 'This is a development/test bridge with mock responses. Use http-bridge.ts for production.' });
});

app.post('/mcp/execute', (req, res) => {
  const { tool, input } = req.body;
  
  // Validate input is an object
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return res.status(400).json({
      content: [{
        type: 'text',
        text: 'Invalid input: must be an object'
      }],
      isError: true
    });
  }
  
  // Return error indicating this is a mock/test bridge
  // In production, this should use real tool implementations
  return res.status(501).json({
    content: [{
      type: 'text',
      text: `Tool execution not available in simple-http-bridge (development/test only). Use http-bridge.ts for production. Tool requested: ${tool}`
    }],
    isError: true,
    _warning: 'This is a development/test bridge. Use http-bridge.ts for production tool execution.'
  });
});

app.get('/mcp/status', (req, res) => {
  res.json({ status: 'running', server: 'cyrano-simple-bridge' });
});

// Start server
app.listen(port, () => {
  console.log(`Cyrano Simple HTTP Bridge running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /mcp/tools - List available tools`);
  console.log(`  POST /mcp/execute - Execute a tool`);
  console.log(`  GET  /mcp/status - Server status`);
});
