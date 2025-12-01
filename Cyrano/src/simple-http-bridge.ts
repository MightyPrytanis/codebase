/**
 * Simple Cyrano HTTP Bridge - Working Version
 * 
 * This is a simplified HTTP bridge that actually works.
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

// Middleware
app.use(cors());
app.use(express.json());

// Simple tools list
const tools = [
  {
    name: 'document_analyzer',
    description: 'Analyze legal documents',
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
    description: 'Compare contracts/agreements (not all legal documents)',
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
    description: 'Extract ChatGPT conversations',
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
app.get('/mcp/tools', (req, res) => {
  res.json({ tools });
});

app.post('/mcp/execute', (req, res) => {
  const { tool, input } = req.body;
  
  // Simple mock responses
  const responses = {
    document_analyzer: {
      content: [{
        type: 'text',
        text: `Analyzed document: ${input.content?.substring(0, 100)}...`
      }]
    },
    contract_comparator: {
      content: [{
        type: 'text',
        text: `Compared ${input.documents?.length || 0} documents`
      }]
    },
    extract_conversations: {
      content: [{
        type: 'text',
        text: `Extracted conversations from ${input.file_path}`
      }]
    }
  };
  
  const response = (responses as any)[tool] || {
    content: [{
      type: 'text',
      text: `Executed tool: ${tool}`
    }]
  };
  
  res.json(response);
});

app.get('/mcp/status', (req, res) => {
  res.json({ status: 'running', server: 'cyrano-simple-bridge' });
});

// Start server
app.listen(port, () => {
  console.log(`Cyrano Simple HTTP Bridge running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /mcp/tools - List available tools`);
  console.log(`  POST /mcp/execute - Execute a tool`);
  console.log(`  GET  /mcp/status - Server status`);
});
