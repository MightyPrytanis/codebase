---
Document ID: README
Title: Readme
Subject(s): Cyrano | Reference | Testing
Project: Cyrano
Version: v611
Created: Unknown
Last Substantive Revision: 2026-03-10 (2026-W11)
Last Format Update: 2026-03-10 (2026-W11)
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

Tests that exercise the HTTP bridge expect a local HTTP endpoint during test
runs. If no server is listening on the expected address (default
`http://127.0.0.1:5003`), tests will fail with `ECONNREFUSED` (see logs showing
attempts to `::1:5003` and `127.0.0.1:5003`).

A lightweight mock server is provided at:

```
Cyrano/tests/mcp-compliance/mock-http-bridge-server.js
```

**Start locally:**

```bash
node Cyrano/tests/mcp-compliance/mock-http-bridge-server.js
```

The server exposes:
- `GET /health` — returns `{ "status": "ok" }`, used by CI health waiters
- `GET /` — same as `/health`
- `POST /v1/bridge*` — echoes the request payload (mock bridge endpoint)
- All other routes — 404

**`HTTP_BRIDGE_URL` env var:** Tests should read `HTTP_BRIDGE_URL` when
available and fall back to `http://127.0.0.1:5003`. This makes it easy to point
tests at the real Cyrano server or the mock without code changes:

```bash
HTTP_BRIDGE_URL=http://127.0.0.1:5003 npm run test:mcp
```

**Note on IPv6:** Node resolves `"localhost"` to `::1` on some systems (macOS,
some Linux distros), causing an extra connection attempt to `[::1]:5003` before
falling back to `127.0.0.1`. To avoid `AggregateError` / spurious `ECONNREFUSED`
failures, the mock server binds to `127.0.0.1` explicitly, and tests should use
`127.0.0.1` in their base URL (or the `HTTP_BRIDGE_URL` env var).

**CI — starting the mock bridge:**

The mock server can be started as a background process before the test step and
health-checked with `npx wait-on`:

```yaml
- name: Start mock HTTP bridge
  # binds to 127.0.0.1:5003 by default; set PORT env var to override
  run: node Cyrano/tests/mcp-compliance/mock-http-bridge-server.js &
  working-directory: ${{ github.workspace }}

- name: Wait for mock bridge to be ready
  # use npx wait-on to avoid adding a hard dependency to package.json
  run: npx wait-on http://127.0.0.1:5003/health --timeout 10000

- name: Run MCP compliance tests
  run: npm run test:mcp
  env:
    HTTP_BRIDGE_URL: http://127.0.0.1:5003
```

**Alternatives:**
- Use request-mocking libraries (`nock` or `msw`) inside the test harness to stub
  HTTP calls — no port binding required.
- Start a Docker container that serves the required endpoints on port 5003.

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

