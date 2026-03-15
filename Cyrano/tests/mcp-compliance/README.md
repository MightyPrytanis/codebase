---
Document ID: README
Title: Readme
Subject(s): Cyrano | Reference | Testing
Project: Cyrano
Version: v611
Created: Unknown
Last Substantive Revision: 2026-03-15 (2026-W11)
Last Format Update: 2026-03-15 (2026-W11)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# MCP Compliance Test Suite

## Overview

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

## HTTP Bridge for Tests

The HTTP bridge integration tests (`http-bridge.test.ts`) start their own test
server on an ephemeral port — **no external server or mock needs to be started
before running the test suite**.

The test server:
- Binds to `127.0.0.1` (IPv4 loopback) to avoid IPv6/IPv4 mismatches on systems
  where `localhost` resolves to `::1`.
- Uses port `0` (OS-assigned ephemeral port) by default to prevent port conflicts.
  Set the `TEST_PORT` env var to override.
- Polls `/health` with retry logic before running tests to ensure the server is
  fully ready.
- Cleans up by closing the server in `afterAll`.

```bash
# Run all MCP compliance tests (no external server needed)
npm run test:mcp

# Override port if needed (e.g., for debugging)
TEST_PORT=5003 npm run test:mcp
```

### Mock HTTP Bridge Server (manual / legacy use only)

A lightweight mock server is still provided at:

```
Cyrano/tests/mcp-compliance/mock-http-bridge-server.js
```

This is **not required for running the automated tests** (they manage their own
server). It is useful for manual exploration or pointing external tools at a
running bridge endpoint:

```bash
node Cyrano/tests/mcp-compliance/mock-http-bridge-server.js
```

The server exposes:
- `GET /health` — returns `{ "status": "ok" }`
- `GET /` — same as `/health`
- `POST /v1/bridge*` — echoes the request payload
- All other routes — 404

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

