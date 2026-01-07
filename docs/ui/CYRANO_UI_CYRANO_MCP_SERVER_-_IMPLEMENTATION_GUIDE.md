---
Document ID: README-2
Title: Cyrano MCP Server - Implementation Guide
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

- **November 29, 2025**: Added help chat system integration, enhanced error reporting, improved API documentation
- **November 28, 2025**: Implemented installer package support, added comprehensive tool definitions
- **November 27, 2025**: Created MCP server architecture, implemented tool framework, added AI provider support
- **November 26, 2025**: Initial implementation with mock tools and basic MCP protocol support

## ⚠️ IMPORTANT DISCLAIMER

**This repository currently contains MOCK/PROTOTYPE implementations that simulate AI functionality without actually connecting to real AI services.** 

The tools return computed responses based on basic text processing, not real AI analysis. **Do not use in production where real AI capabilities are expected.**

## Current Status

### ✅ What Works
- **MCP Protocol Implementation**: Fully compliant JSON-RPC over stdio
- **HTTP Bridge**: REST API wrapper for web integration with hybrid dynamic loading (2025-12-29)
  - Server starts immediately, tools load asynchronously on-demand
  - Race condition protection, timeout protection (30s), and circuit breaker safeguards
  - Tool health monitoring and hot reload capabilities
- **TypeScript Build System**: Clean compilation and type safety
- **Input Validation**: Zod schema validation for all tools
- **Tool Architecture**: Extensible base tool system

### ❌ What's Missing (AI Integration)
- Real API calls to OpenAI, Anthropic, Google, etc.
- Actual document analysis beyond regex patterns
- Real fact-checking with external data sources
- Authentication and API key validation
- Error handling for API failures

## Quickstart (Common Commands)

- Install dependencies
  - npm ci
- Build TypeScript
  - npm run build
- Run MCP server (stdio)
  - npm run mcp
- Run HTTP bridge (REST API on port 5002 by default)
  - npm run http
  - Or: CYRANO_MODE=http npm run dev
- Start compiled build
  - npm start
- Clean and rebuild
  - npm run rebuild
- Integration tests (shell script)
  - npm test
  - Prereqs: curl and jq available on PATH

Single-run examples (HTTP bridge running)
- List tools
  - curl -s http://localhost:5002/mcp/tools | jq
- Execute a tool (document_analyzer)
  - curl -s -X POST http://localhost:5002/mcp/execute \
    -H "Content-Type: application/json" \
    -d '{"tool": "document_analyzer", "input": {"document_text": "Test document", "analysis_type": "summary"}}' | jq
- Health/status
  - curl -s http://localhost:5002/health | jq
  - curl -s http://localhost:5002/mcp/status | jq

Optional: Auth server
- From auth-server/: npm install; npm run dev (or npm start)
- Environment: see auth-server/.env.example

Default ports
- HTTP bridge default: 5002 (override via PORT)

## Verification

Run the reality check to see the current limitations:

```bash
./reality-check.sh
```

This will demonstrate that:
1. AI orchestrator accepts fake providers
2. No real API integration exists
3. Tools use basic text processing only
4. Environment variables are ignored

## How to Implement Real AI Integration

### 1. Install AI SDK Dependencies

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. Update Document Analyzer Example

Replace the mock implementation in `src/tools/document-analyzer.ts`:

```typescript
import OpenAI from 'openai';
import { apiValidator } from '../utils/api-validator.js';

async execute(args: any) {
  try {
    const { document_text, analysis_type } = DocumentAnalyzerSchema.parse(args);
    
    // Validate API key
    const validation = apiValidator.validateProvider('openai');
    if (!validation.valid) {
      return this.createErrorResult(validation.error!);
    }

    // Real OpenAI integration
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `Analyze this legal document: ${document_text}`
      }]
    });

    const analysis = response.choices[0].message.content;
    return this.createSuccessResult(analysis || "Analysis failed");
    
  } catch (error) {
    return this.createErrorResult(`Analysis failed: ${error.message}`);
  }
}
```

### 3. Environment Configuration

Create `.env` file with real API keys:

```bash
# Required for AI functionality
OPENAI_API_KEY=sk-your-actual-openai-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
GEMINI_API_KEY=your-actual-gemini-key
```

### 4. Update AI Orchestrator

Replace mock orchestration with real API calls:

```typescript
async execute(args: any) {
  const { task_description, ai_providers } = AIOrchestratorSchema.parse(args);
  
  // Validate all requested providers
  const validation = apiValidator.validateAllProviders(ai_providers);
  if (!validation.valid) {
    return this.createErrorResult(validation.errors.join(', '));
  }

  // Make real API calls to each provider
  const results = await Promise.all(
    ai_providers.map(provider => this.callRealAI(provider, task_description))
  );

  return this.createSuccessResult(JSON.stringify({ results }, null, 2));
}

private async callRealAI(provider: string, task: string) {
  switch (provider) {
    case 'openai':
      return await this.callOpenAI(task);
    case 'anthropic':
      return await this.callAnthropic(task);
    // ... implement each provider
  }
}
```

### 5. Error Handling

Add proper error handling for:
- Network failures
- API rate limits  
- Invalid API keys
- Service outages

### 6. Testing Real Integration

Update `test-integration.sh` to verify real API calls:

```bash
# Test with real API key validation
test_real_ai_integration() {
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ OPENAI_API_KEY not set"
        return 1
    fi
    
    # Test actual API call
    result=$(curl -s -X POST http://localhost:5002/mcp/execute \
        -H "Content-Type: application/json" \
        -d '{"tool": "document_analyzer", "input": {"document_text": "Test contract"}}')
    
    # Verify real AI response (should be longer than mock)
    if [ ${#result} -gt 500 ]; then
        echo "✅ Real AI integration working"
        return 0
    else
        echo "❌ Still returning mock responses"
        return 1
    fi
}
```

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables or secure secret management
- Implement key rotation policies

### Rate Limiting
- Add rate limiting to prevent API quota exhaustion
- Implement request queuing for high-volume usage
- Monitor API usage and costs

### Input Validation
- Sanitize all user inputs
- Implement content filtering for sensitive data
- Add request size limits

## Production Deployment

### Required Environment Variables
```bash
# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Security
SESSION_SECRET=long-random-string
JWT_SECRET=another-random-string

# Optional
SENTRY_DSN=https://...  # Error tracking
```

### Docker Deployment
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Don't run as root
USER node

CMD ["npm", "start"]
```

## MCP Client Integration

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cyrano": {
      "command": "node",
      "args": ["/path/to/cyrano/dist/mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

### HTTP Client Integration
```javascript
// Example web app integration
const response = await fetch('http://localhost:5002/mcp/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'document_analyzer',
    input: {
      document_text: userDocument,
      analysis_type: 'comprehensive'
    }
  })
});

const result = await response.json();
if (result.isError) {
  console.error('Analysis failed:', result.content[0].text);
} else {
  console.log('Analysis result:', result.content[0].text);
}
```

## Contributing

To contribute real AI functionality:

1. Fork this repository
2. Implement actual API integrations (don't just mock them!)
3. Add comprehensive tests with real API calls
4. Update documentation with examples
5. Submit pull request with proof of real functionality

## License

This project is licensed under the Apache License 2.0 – see the LICENSE file for details.

---

**Remember**: This is currently a mock system. Implement real AI integrations before using in production!