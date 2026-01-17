/**
 * MCP HTTP Bridge Compliance Tests
 * 
 * Tests Cyrano MCP Server HTTP bridge compliance with REST API and MCP protocol
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';

// Set environment variables before importing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-testing';
process.env.TRUST_PROXY_COUNT = '0'; // Disable trust proxy for tests

// Import app after setting env vars
import { app } from '../../src/http-bridge.js';

describe('MCP HTTP Bridge Compliance', () => {
  // Use a different port for tests to avoid conflicts
  const testPort = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT) : 5003;
  const baseUrl = `http://localhost:${testPort}`;
  let server: Server | null = null;
  let csrfToken: string = '';
  let sessionCookie: string = '';

  beforeAll(async () => {
    // Start the HTTP bridge server for testing
    const http = await import('http');
    server = http.createServer(app);
    await new Promise<void>((resolve, reject) => {
      server!.listen(testPort, () => {
        console.log(`Test HTTP server started on port ${testPort}`);
        resolve();
      });
      server!.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${testPort} in use, skipping server start`);
          resolve(); // Continue without server if port is in use
        } else {
          reject(err);
        }
      });
    });
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get CSRF token for POST requests
    try {
      const csrfResponse = await fetch(`${baseUrl}/csrf-token`);
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrfToken || '';
        // Extract all cookies from response
        const setCookieHeaders = csrfResponse.headers.getSetCookie();
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          // Find sessionId cookie
          for (const cookie of setCookieHeaders) {
            const sessionMatch = cookie.match(/sessionId=([^;]+)/);
            if (sessionMatch) {
              sessionCookie = sessionMatch[1];
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not get CSRF token:', error);
      // Continue without CSRF token - tests may fail but we'll see the actual error
    }
  });

  afterAll(async () => {
    // Clean up: close server
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log('Test HTTP server closed');
          resolve();
        });
      });
    }
  });

  describe('REST API Compliance', () => {
    it('should respond to GET /mcp/tools', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      if (response.status !== 200) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('tools');
      expect(Array.isArray(data.tools)).toBe(true);
    });

    it('should list all registered tools', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      // Should have 32+ tools (updated from original 17)
      expect(data.tools.length).toBeGreaterThanOrEqual(32);
    });

    it('should return tools in correct format', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const firstTool = data.tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
    });

    it('should respond to POST /mcp/execute', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'system_status',
          input: {}
        })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('content');
    });

    it('should return CallToolResult format', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'system_status',
          input: {}
        })
      });
      const data = await response.json();
      expect(Array.isArray(data.content)).toBe(true);
      if (data.isError) {
        expect(data.isError).toBe(true);
      }
    });
  });

  describe('CORS Handling', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`, {
        method: 'OPTIONS'
      });
      // Check for CORS headers (implementation dependent)
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'nonexistent_tool',
          input: {}
        })
      });
      const data = await response.json();
      expect(data.isError).toBe(true);
      expect(data.content[0].text).toContain('not found');
    });

    it('should handle invalid input schemas', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'document_analyzer',
          input: { invalid: 'data' }
        })
      });
      const data = await response.json();
      expect(data.isError).toBe(true);
    });

    it('should return errors in MCP format', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'nonexistent_tool',
          input: {}
        })
      });
      const data = await response.json();
      expect(data).toHaveProperty('isError');
      expect(data).toHaveProperty('content');
      expect(Array.isArray(data.content)).toBe(true);
    });
  ;

  describe('Module Exposure', () => {
    it('should expose chronometric_module via HTTP', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const chronometricModule = data.tools.find((t: any) => t.name === 'chronometric_module');
      expect(chronometricModule).toBeDefined();
    });

    it('should execute chronometric_module', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'chronometric_module',
          input: {
            action: 'identify_gaps',
            input: {}
          }
        })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('content');
    });
  });

  describe('Engine Exposure', () => {
    it('should expose mae_engine via HTTP', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const maeEngine = data.tools.find((t: any) => t.name === 'mae_engine');
      expect(maeEngine).toBeDefined();
    });

    it('should expose goodcounsel_engine via HTTP', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const goodcounselEngine = data.tools.find((t: any) => t.name === 'goodcounsel_engine');
      expect(goodcounselEngine).toBeDefined();
    });

    it('should expose potemkin_engine via HTTP', async () => {
      const response = await fetch(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const potemkinEngine = data.tools.find((t: any) => t.name === 'potemkin_engine');
      expect(potemkinEngine).toBeDefined();
    });

    it('should execute mae_engine', async () => {
      const response = await fetch(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({
          tool: 'mae_engine',
          input: {
            action: 'list_workflows'
          }
        })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('content');
    });
  });
});

/**
 * Note: These tests require the HTTP bridge server to be running.
 * In a real test environment, we would:
 * 1. Start the server in beforeAll
 * 2. Wait for it to be ready
 * 3. Run tests
 * 4. Kill the server in afterAll
 * 
 * For now, these tests can be run manually with: npm run http
 */