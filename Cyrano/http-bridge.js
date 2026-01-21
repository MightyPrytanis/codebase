import express from 'express';
import cors from 'cors';

const app = express();
const port = 5002;

// Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

app.use(cors());
app.use(express.json());

const tools = [
  {
    name: 'document_analyzer',
    description: 'Analyze legal documents with AI',
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
    description: 'Compare legal documents',
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

app.get('/mcp/tools', (req, res) => {
  res.json({ tools });
});

app.post('/mcp/execute', (req, res) => {
  const { tool, input } = req.body;
  
  const response = {
    content: [{
      type: 'text',
      text: `Executed ${tool} with input: ${JSON.stringify(input)}`
    }]
  };
  
  res.json(response);
});

app.get('/mcp/status', (req, res) => {
  res.json({ status: 'running', server: 'cyrano-mcp-bridge' });
});

app.listen(port, () => {
  console.log(`Cyrano MCP Bridge running on port ${port}`);
});