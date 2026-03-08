import express from 'express';
import cors from 'cors';

const app = express();
const port = 5002;

app.use(cors());
app.use(express.json());
// Simple Clio integration stub
app.post('/api/tools/clio_integration', (req, res) => {
  const { action } = req.body || {};
  const hasKey = !!process.env.CLIO_API_KEY;
  if (action === 'status') {
    return res.json({ connected: hasKey, message: hasKey ? 'Connected (stub)' : 'API key required' });
  }
  if (action === 'list_matters') {
    if (!hasKey) return res.status(401).json({ connected: false, message: 'API key required' });
    return res.json({ connected: true, matters: [{ id: 'CL-001', name: 'Johnson v Johnson' }] });
  }
  return res.json({ connected: hasKey, message: 'Unknown action' });
});

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
  }
];

app.get('/mcp/tools', (req, res) => {
  console.log('GET /mcp/tools called');
  res.json({ tools });
});

app.post('/mcp/execute', (req, res) => {
  console.log('POST /mcp/execute called', req.body);
  const { tool, input } = req.body;
  
  const response = {
    content: [{
      type: 'text',
      text: `Executed ${tool} successfully`
    }]
  };
  
  res.json(response);
});

app.get('/mcp/status', (req, res) => {
  res.json({ status: 'running' });
});

app.listen(port, () => {
  console.log(`Cyrano MCP Bridge running on port ${port}`);
});
