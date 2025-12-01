---
Document ID: README
Title: MCP Compliance Test Suite
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

This test suite verifies that the Cyrano MCP Server complies with the Model Context Protocol specification.

## Test Categories

### 1. Tool Definition Compliance
- Verifies all tools have required fields (name, description, inputSchema)
- Validates JSON Schema format
- Checks for duplicate tool names

### 2. Tool Execution Compliance
- Verifies CallToolResult format
- Tests error handling
- Validates input schema validation

### 3. Module Exposure Compliance
- Verifies modules are accessible via MCP
- Tests module execution
- Validates module tool format

### 4. Engine Exposure Compliance
- Verifies engines are accessible via MCP
- Tests engine execution
- Validates engine tool format

### 5. Error Handling Compliance
- Verifies error response format
- Tests error flag presence
- Validates error messages

## Running Tests

```bash
# Run all MCP compliance tests
npm test -- tests/mcp-compliance

# Run specific test file
npm test -- tests/mcp-compliance/mcp-compliance.test.ts
```

## Test Implementation Status

**Current Status:** Scaffold created, needs full implementation

**Next Steps:**
1. Set up mock MCP transport for testing
2. Implement actual test cases
3. Add integration tests for stdio bridge
4. Add integration tests for HTTP bridge

## Notes

- Tests currently use placeholder assertions
- Full implementation requires MCP SDK testing utilities
- Integration tests will require running server instance

