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

## Change Log
- **29 November 2025**: Added help chat system integration, enhanced error reporting, expanded API documentation
- **28 November 2025**: Implemented installer package support and comprehensive tool definitions
- **27 November 2025**: Completed MCP server architecture, tool framework, and multi-provider AI support
- **26 November 2025**: Initial implementation bootstrapped with mock tools; all MCP tools now call live providers as of 29 November 2025

## ⚠️ IMPORTANT DISCLAIMER

**This repository now uses live integrations with OpenAI, Anthropic, Perplexity, and other providers. Configure valid API keys before running the tools, and expect real API usage and costs.**  
Demo mode (`CYRANO_MODE=demo`) is still available for offline testing, but production runs will contact external services and must follow security/compliance requirements.

## Current Status

### ✅ What Works
- **MCP Protocol Implementation**: Fully compliant JSON-RPC over stdio
- **HTTP Bridge**: REST API wrapper for web integration  
- **TypeScript Build System**: Clean compilation and type safety
- **Input Validation**: Zod schema validation for all tools
- **Tool Architecture**: Extensible base tool system

### ⚠️ Still in Progress
- Expand provider-selection coverage for remaining tools (`legal-email-drafter`, `compliance-checker`, `goodcounsel`, `arkiver-mcp-tools`, legacy helpers)
- Harden rate limiting, retry, and error-reporting paths for sustained multi-provider usage
- Build MAE workflow UI to expose provider overrides and execution history inside LexFiat
- Finish wiring demo-mode indicators (`_demoWarning`) through every component that can surface mock data

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

Run the reality check script (or the integration test suite) to confirm live providers are wired correctly:

```bash
./reality-check.sh
```

The script now verifies that:
1. The AI orchestrator can execute tasks via configured providers (Perplexity/OpenAI/Anthropic)
2. Provider selection respects both auto-mode and explicit overrides
3. Tools emit provider metadata and telemetry alongside their results
4. Missing environment variables are detected immediately so keys can be supplied before execution

## Extending Real AI Integration

### 1. Install AI SDK Dependencies

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. Document Analyzer Pattern

Use the `document_analyzer` tool as the reference implementation for wiring additional providers:

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

### 4. Augment the AI Orchestrator

Follow this orchestration pattern when adding new providers or task profiles:

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
    
    # Verify real AI response (should include provider metadata / non-empty content)
    if [ ${#result} -gt 500 ]; then
        echo "✅ Real AI integration working"
        return 0
    else
        echo "❌ Still returning fallback/demo responses"
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
2. Implement additional API integrations or enhancements as needed
3. Add comprehensive tests with real API calls
4. Update documentation with examples
5. Submit pull request with proof of real functionality

## License

This project is licensed under the Apache License 2.0 – see the LICENSE file for details.

---

**Remember**: This system invokes live AI providers. Configure API keys securely, monitor usage/costs, and run in demo mode when you need offline testing.