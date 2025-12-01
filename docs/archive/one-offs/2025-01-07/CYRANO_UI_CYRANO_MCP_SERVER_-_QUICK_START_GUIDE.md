---
Document ID: MCP-QUICKSTART
Title: Cyrano MCP Server - Quick Start Guide
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

The Cyrano MCP Server provides 17 powerful tools for AI-powered legal document processing and data extraction. It can run in two modes:

1. **MCP Server Mode** (stdio): For integration with MCP-compatible clients like Claude Desktop
2. **HTTP Bridge Mode**: For web applications and REST API access

## Installation & Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Running the Server

### MCP Server (stdio mode)
```bash
# Run directly with tsx
npm run mcp

# Or use the built version
npm start
```

### HTTP Bridge Mode
```bash
# Start HTTP server on port 5002
npm run http

# With custom port
PORT=3000 npm run http
```

## Available Tools

### Legal AI Tools (10)
1. **document_analyzer** - Comprehensive legal document analysis
2. **contract_comparator** - Compare contracts/agreements (not all legal documents)
3. **fact_checker** - Verify claims and fact-check content
4. **legal_reviewer** - Review documents for compliance and accuracy
5. **compliance_checker** - Check regulatory compliance
6. **quality_assessor** - Assess document quality across dimensions
7. **workflow_manager** - Manage multi-agent legal workflows
8. **case_manager** - Manage legal cases and documentation
9. **document_processor** - Process and transform documents
10. **ai_orchestrator** - Coordinate AI providers for complex tasks

### Arkiver Data Processing Tools (7)
1. **extract_conversations** - Extract ChatGPT conversation data
2. **extract_text_content** - Extract content from text files
3. **categorize_with_keywords** - Categorize text using keywords
4. **process_with_regex** - Process text with regex patterns
5. **generate_categorized_files** - Generate organized output files
6. **run_extraction_pipeline** - Run complete extraction workflows
7. **create_arkiver_config** - Create Arkiver configuration files

## HTTP API Usage

### List Available Tools
```bash
curl http://localhost:5002/mcp/tools
```

### Execute a Tool
```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "document_analyzer",
    "input": {
      "document_text": "Your legal document content here",
      "analysis_type": "comprehensive"
    }
  }'
```

### Check Server Status
```bash
curl http://localhost:5002/mcp/status
```

## MCP Client Integration

For Claude Desktop or other MCP clients, configure the server:

```json
{
  "mcpServers": {
    "cyrano": {
      "command": "node",
      "args": ["path/to/Cyrano/dist/mcp-server.js"]
    }
  }
}
```

## Development Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run with hot reload using tsx
- `npm run mcp` - Run MCP server directly
- `npm run http` - Run HTTP bridge
- `npm start` - Run built version (index.js)

## Architecture

The server is built with:
- **TypeScript** for type safety
- **@modelcontextprotocol/sdk** for MCP compliance
- **Express.js** for HTTP API
- **Zod** for input validation
- Modular tool architecture with `BaseTool` class

Each tool implements:
- `getToolDefinition()` - Returns tool schema
- `execute(args)` - Executes the tool with validated input

## Error Handling

All tools include comprehensive error handling:
- Input validation with Zod schemas
- Graceful error responses
- Detailed error messages
- HTTP status codes for REST API

## Next Steps

1. Integrate with LexFiat client application
2. Add authentication/authorization
3. Implement tool result caching
4. Add logging and monitoring
5. Deploy to production environment