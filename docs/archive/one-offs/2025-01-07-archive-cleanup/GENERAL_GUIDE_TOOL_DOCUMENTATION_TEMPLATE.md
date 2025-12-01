---
Document ID: TEMPLATE-TOOL-DOC
Title: Tool Documentation Template
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Purpose:** Standard format for documenting Cyrano MCP tools

---

## Tool Name: `[tool_name]`

**Category:** [e.g., Document Processing, Verification, Case Management, Integration]  
**Status:** [✅ Production | ⚠️ Beta | 🚧 In Development | ❌ Deprecated]  
**Version:** [e.g., 1.0.0]  
**Last Updated:** [YYYY-MM-DD]

---

## Overview

### Purpose
[1-2 sentence description of what this tool does and why it exists]

### Use Cases
- [Primary use case 1]
- [Primary use case 2]
- [Primary use case 3]

### Key Features
- [Feature 1: Brief description]
- [Feature 2: Brief description]
- [Feature 3: Brief description]

---

## Input Parameters

### Schema Definition
```typescript
export const ToolNameSchema = z.object({
  // Required parameters
  param1: z.string().describe('Description of param1'),
  param2: z.number().min(1).max(100).describe('Description of param2'),
  
  // Optional parameters
  param3: z.array(z.string()).optional().describe('Description of param3'),
  param4: z.boolean().optional().default(false).describe('Description of param4'),
  
  // Complex parameters
  param5: z.object({
    subparam1: z.string(),
    subparam2: z.number(),
  }).optional().describe('Description of param5'),
});

export type ToolNameInput = z.infer<typeof ToolNameSchema>;
```

### Parameter Details
| Parameter | Type | Required | Default | Description | Validation |
|-----------|------|----------|---------|-------------|------------|
| `param1` | string | ✅ | - | [Detailed description] | [e.g., Must be non-empty, max 500 chars] |
| `param2` | number | ✅ | - | [Detailed description] | [e.g., Range 1-100] |
| `param3` | string[] | ❌ | `[]` | [Detailed description] | [e.g., Max 10 items] |
| `param4` | boolean | ❌ | `false` | [Detailed description] | [e.g., None] |
| `param5` | object | ❌ | `null` | [Detailed description] | [e.g., Valid subparams] |

### Parameter Examples
```typescript
// Minimal valid input
{
  param1: "example value",
  param2: 50
}

// Full input with optional parameters
{
  param1: "example value",
  param2: 75,
  param3: ["item1", "item2", "item3"],
  param4: true,
  param5: {
    subparam1: "sub value",
    subparam2: 100
  }
}
```

---

## Output Format

### Success Response
```typescript
{
  content: [{
    type: 'text',
    text: string  // JSON.stringify(result) or plain text
  }],
  isError: false
}
```

### Output Schema
```typescript
export interface ToolNameOutput {
  // Core output fields
  result: {
    field1: string;
    field2: number;
    field3: boolean;
  };
  
  // Metadata
  metadata: {
    processingTime: number;      // milliseconds
    sourceDocument?: string;
    confidence?: number;         // 0-1 score
  };
  
  // Optional fields
  warnings?: string[];
  suggestions?: string[];
}
```

### Output Examples
```json
// Example 1: Simple success
{
  "result": {
    "field1": "value",
    "field2": 42,
    "field3": true
  },
  "metadata": {
    "processingTime": 1234
  }
}

// Example 2: Success with warnings
{
  "result": {
    "field1": "value",
    "field2": 42,
    "field3": true
  },
  "metadata": {
    "processingTime": 1234,
    "confidence": 0.85
  },
  "warnings": [
    "Low confidence in field2 extraction",
    "Missing optional data for field3"
  ]
}

// Example 3: Complex output
{
  "result": {
    "field1": "value",
    "field2": 42,
    "field3": true
  },
  "metadata": {
    "processingTime": 2345,
    "sourceDocument": "doc_12345.pdf",
    "confidence": 0.92
  },
  "suggestions": [
    "Consider reviewing section 3 manually",
    "Additional context available in related_doc.pdf"
  ]
}
```

---

## Error Handling

### Error Response Format
```typescript
{
  content: [{
    type: 'text',
    text: string  // Error message
  }],
  isError: true
}
```

### Error Scenarios
| Error Type | Cause | Error Message | HTTP Status | Retry? |
|------------|-------|---------------|-------------|--------|
| ValidationError | Invalid input parameters | "Validation error: [details]" | 400 | ❌ |
| AuthenticationError | Missing/invalid credentials | "Authentication failed: [details]" | 401 | ❌ |
| AuthorizationError | Insufficient permissions | "Unauthorized: [details]" | 403 | ❌ |
| NotFoundError | Resource not found | "Resource not found: [details]" | 404 | ❌ |
| RateLimitError | Too many requests | "Rate limit exceeded. Retry after: [seconds]" | 429 | ✅ |
| ProcessingError | Internal processing failure | "Processing failed: [details]" | 500 | ✅ |
| TimeoutError | Operation took too long | "Operation timed out after [seconds]" | 504 | ✅ |

### Error Examples
```json
// Validation error
{
  "content": [{
    "type": "text",
    "text": "Validation error: param1 must be a non-empty string"
  }],
  "isError": true
}

// Processing error
{
  "content": [{
    "type": "text",
    "text": "Processing failed: Unable to parse document format"
  }],
  "isError": true
}

// Rate limit error
{
  "content": [{
    "type": "text",
    "text": "Rate limit exceeded. Retry after: 60 seconds"
  }],
  "isError": true
}
```

### Error Handling Best Practices
1. **Always validate input**: Use Zod schema validation before processing
2. **Provide context**: Include relevant details in error messages (without exposing sensitive data)
3. **Log errors**: Log full error details for debugging (sanitize sensitive info)
4. **Return user-friendly messages**: Transform technical errors into actionable messages
5. **Indicate retry-ability**: Specify whether the operation can be retried

---

## Usage Examples

### Example 1: Basic Usage
```typescript
// MCP client usage
const result = await mcpClient.callTool('tool_name', {
  param1: 'example value',
  param2: 50
});

console.log(result);
// Output: { result: { ... }, metadata: { ... } }
```

### Example 2: With Optional Parameters
```typescript
const result = await mcpClient.callTool('tool_name', {
  param1: 'example value',
  param2: 75,
  param3: ['item1', 'item2'],
  param4: true
});

console.log(result.warnings);
// Output: ["Warning message 1", "Warning message 2"]
```

### Example 3: Error Handling
```typescript
try {
  const result = await mcpClient.callTool('tool_name', {
    param1: '',  // Invalid: empty string
    param2: 50
  });
} catch (error) {
  if (error.isError) {
    console.error('Tool error:', error.content[0].text);
    // Output: "Validation error: param1 must be a non-empty string"
  }
}
```

### Example 4: HTTP Bridge Usage
```bash
# POST request to HTTP bridge
curl -X POST http://localhost:3000/mcp/tool_name \
  -H "Content-Type: application/json" \
  -d '{
    "param1": "example value",
    "param2": 50
  }'

# Response
{
  "result": {
    "field1": "value",
    "field2": 42,
    "field3": true
  },
  "metadata": {
    "processingTime": 1234
  }
}
```

---

## Dependencies

### Internal Dependencies
- `src/tools/base-tool.ts` - Base class for all tools
- `src/utils/validation.ts` - Validation utilities
- `src/utils/error-handling.ts` - Error handling utilities
- [Other internal dependencies]

### External Dependencies
- `zod` (^3.22.0) - Schema validation
- [Other npm packages with versions]

### API Dependencies
- [External API 1] - [Description and purpose]
- [External API 2] - [Description and purpose]

### Database Dependencies
- [Database 1] - [Tables/collections used]
- [Database 2] - [Tables/collections used]

### Environment Variables
```bash
# Required
ENV_VAR_1=value  # Description
ENV_VAR_2=value  # Description

# Optional
ENV_VAR_3=value  # Description (default: [value])
ENV_VAR_4=value  # Description (default: [value])
```

---

## Integration Points

### MCP Protocol
```typescript
// Tool registration
export class ToolName extends BaseTool {
  name = 'tool_name';
  
  getToolDefinition() {
    return {
      name: this.name,
      description: 'Tool description',
      inputSchema: zodToJsonSchema(ToolNameSchema),
    };
  }
  
  async execute(args: unknown) {
    const validated = ToolNameSchema.parse(args);
    // ... implementation
  }
}
```

### HTTP Bridge
```typescript
// HTTP endpoint configuration
{
  path: '/tool_name',
  method: 'POST',
  handler: async (req, res) => {
    const result = await toolName.execute(req.body);
    res.json(result);
  }
}
```

### Other Tools
- **[Tool 1]**: [How this tool integrates with Tool 1]
- **[Tool 2]**: [How this tool integrates with Tool 2]
- **[Tool 3]**: [How this tool integrates with Tool 3]

### Workflow Integration
```typescript
// Example workflow using this tool
const workflow = new Workflow([
  { tool: 'tool_name', input: { ... } },
  { tool: 'other_tool', input: (prevResult) => ({ ... }) },
]);

await workflow.execute();
```

---

## Performance

### Benchmarks
| Operation | Input Size | Avg Time | P95 | P99 |
|-----------|-----------|----------|-----|-----|
| Small input | < 1KB | 100ms | 150ms | 200ms |
| Medium input | 1KB - 10KB | 500ms | 750ms | 1000ms |
| Large input | 10KB - 100KB | 2s | 3s | 5s |
| Very large input | > 100KB | 10s | 15s | 20s |

### Resource Usage
- **Memory**: [e.g., ~50MB for small inputs, ~200MB for large inputs]
- **CPU**: [e.g., Low utilization, mostly I/O bound]
- **Network**: [e.g., 1-2 API calls per execution]

### Optimization Tips
1. [Optimization tip 1]
2. [Optimization tip 2]
3. [Optimization tip 3]

### Rate Limits
- **Internal**: [e.g., 100 requests per minute per user]
- **External API 1**: [e.g., 60 requests per minute]
- **External API 2**: [e.g., 1000 requests per hour]

---

## Testing

### Unit Tests
```typescript
// src/tools/__tests__/tool-name.test.ts
describe('ToolName', () => {
  it('should validate input schema', () => {
    const validInput = { param1: 'value', param2: 50 };
    expect(() => ToolNameSchema.parse(validInput)).not.toThrow();
  });
  
  it('should reject invalid input', () => {
    const invalidInput = { param1: '', param2: 50 };
    expect(() => ToolNameSchema.parse(invalidInput)).toThrow();
  });
  
  it('should process valid input successfully', async () => {
    const tool = new ToolName();
    const result = await tool.execute({ param1: 'value', param2: 50 });
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBeTruthy();
  });
  
  it('should handle processing errors gracefully', async () => {
    const tool = new ToolName();
    // Mock error condition
    const result = await tool.execute({ param1: 'error', param2: 50 });
    expect(result.isError).toBe(true);
  });
});
```

### Integration Tests
```typescript
// src/tools/__tests__/tool-name.integration.test.ts
describe('ToolName Integration', () => {
  it('should integrate with MCP server', async () => {
    const mcpClient = new MCPClient();
    const result = await mcpClient.callTool('tool_name', {
      param1: 'value',
      param2: 50
    });
    expect(result).toBeTruthy();
  });
  
  it('should work via HTTP bridge', async () => {
    const response = await fetch('http://localhost:3000/mcp/tool_name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ param1: 'value', param2: 50 })
    });
    expect(response.ok).toBe(true);
  });
});
```

### Test Coverage
- **Target**: 80% overall, 100% for error paths
- **Current**: [e.g., 85%]
- **Gaps**: [e.g., Edge case X not covered, needs test for scenario Y]

---

## Security Considerations

### Authentication
- [How this tool authenticates users/requests]
- [What credentials are required]

### Authorization
- [What permissions are required to use this tool]
- [How authorization is enforced]

### Data Sanitization
- [What input sanitization is performed]
- [How output is sanitized to prevent injection attacks]

### Sensitive Data
- [What sensitive data this tool handles]
- [How sensitive data is protected (encryption, masking, etc.)]
- [What data is logged vs. redacted]

### Rate Limiting
- [How rate limiting is enforced]
- [What limits apply]

---

## Monitoring & Observability

### Logging
```typescript
// Log format
{
  timestamp: '2025-11-24T12:00:00Z',
  level: 'info',
  tool: 'tool_name',
  operation: 'execute',
  duration: 1234,
  success: true,
  userId: 'user_123',
  metadata: { ... }
}
```

### Metrics to Track
- **Request volume**: Total requests per time period
- **Success rate**: Percentage of successful executions
- **Latency**: P50, P95, P99 response times
- **Error rate**: Percentage of failed executions by error type
- **Resource usage**: Memory, CPU, network I/O

### Alerting
- **Error rate > 5%**: Alert on-call engineer
- **Latency P95 > 5s**: Alert performance team
- **Rate limit exceeded**: Alert ops team

---

## Maintenance

### Version History
| Version | Date | Changes | Breaking? |
|---------|------|---------|-----------|
| 1.0.0 | 2025-11-24 | Initial release | - |
| 0.9.0 | 2025-11-15 | Beta release | ❌ |
| 0.8.0 | 2025-11-01 | Alpha release | ❌ |

### Known Issues
1. **Issue 1**: [Description] - [Workaround or fix timeline]
2. **Issue 2**: [Description] - [Workaround or fix timeline]

### Roadmap
- [ ] **Q1 2026**: [Planned feature 1]
- [ ] **Q2 2026**: [Planned feature 2]
- [ ] **Q3 2026**: [Planned feature 3]

### Deprecation Plan
- **Deprecation date**: [Date when tool will be marked deprecated]
- **Removal date**: [Date when tool will be removed]
- **Migration path**: [How users should migrate to alternative]

---

## Support & Troubleshooting

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| [Issue 1] | [Cause] | [Solution] |
| [Issue 2] | [Cause] | [Solution] |
| [Issue 3] | [Cause] | [Solution] |

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG_TOOL_NAME = 'true';

// Debug output will include:
// - Input parameters
// - Intermediate processing steps
// - External API calls
// - Performance metrics
```

### FAQ
**Q: [Question 1]?**  
A: [Answer 1]

**Q: [Question 2]?**  
A: [Answer 2]

**Q: [Question 3]?**  
A: [Answer 3]

### Contact
- **Team**: [Team name]
- **Slack**: [Slack channel]
- **Email**: [Support email]
- **On-call**: [On-call rotation]

---

## References

### Internal Documentation
- [Link to related internal docs]
- [Link to architecture docs]
- [Link to API specs]

### External Documentation
- [Link to external API docs]
- [Link to library docs]
- [Link to relevant blog posts/articles]

### Related Tools
- **[Tool 1]**: [Link to docs] - [How it relates]
- **[Tool 2]**: [Link to docs] - [How it relates]
- **[Tool 3]**: [Link to docs] - [How it relates]

---

**Document Owner:** [Name/Team]  
**Last Reviewed:** [YYYY-MM-DD]  
**Next Review:** [YYYY-MM-DD]
