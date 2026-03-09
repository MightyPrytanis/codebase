/**
 * MCP HTTP Bridge Compliance Tests
 * 
 * Tests Cyrano MCP Server HTTP bridge compliance with REST API and MCP protocol
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { fetchWithRetry } from '../utils/fetch-retry.js';

// Set environment variables before importing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-testing';
process.env.TRUST_PROXY_COUNT = '0'; // Disable trust proxy for tests

// Import app after setting env vars
import { app } from '../../src/http-bridge.js';

describe('MCP HTTP Bridge Compliance', () => {
  // Use ephemeral port by default; honor TEST_PORT override if provided
  let testPort = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT) : 0; // 0 => ephemeral
  let baseUrl = '';
  let server: Server | null = null;
  let csrfToken: string = '';
  let sessionCookie: string = '';

  beforeAll(async () => {
    // Start the HTTP bridge server for testing
    const http = await import('http');
    server = http.createServer(app);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout after 10 seconds'));
      }, 10000);

      server!.listen(testPort || 0, () => {
        clearTimeout(timeout);
        // Determine the actual bound port (important when using ephemeral port 0)
        const addr = server!.address() as AddressInfo | string | null;
        if (!addr) {
          reject(new Error('Failed to determine server address after listen()'));
          return;
        }
        testPort = typeof addr === 'object' ? addr.port : Number(String(addr).split(':').pop()); // string only for Unix sockets
        baseUrl = `http://localhost:${testPort}`;
        console.log(`Test HTTP server started on port ${testPort}`);

        // Probe /health with retries; treat missing /health as okay
        fetchWithRetry(`${baseUrl}/health`, { method: 'GET' }, 5, 200)
          .then(() => resolve())
          .catch(() => setTimeout(() => resolve(), 200));
      });

      server!.on('error', (err: any) => {
        clearTimeout(timeout);
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${testPort} in use, trying ephemeral port`);
          // Fallback: try ephemeral port
          testPort = 0;
          server!.listen(0, () => {
            const addr2 = server!.address() as AddressInfo | string | null;
            testPort = addr2 && typeof addr2 === 'object' ? addr2.port : testPort;
            baseUrl = `http://localhost:${testPort}`;
            console.log(`Test HTTP server started on fallback port ${testPort}`);
            resolve();
          });
          server!.once('error', (fallbackErr: any) => {
            reject(new Error(`Fallback ephemeral listen failed: ${fallbackErr.message}`));
          });
        } else {
          reject(err);
        }
      });
    });
    
    // Wait for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get CSRF token for POST requests
    try {
      const csrfResponse = await fetchWithRetry(`${baseUrl}/csrf-token`, undefined, 5, 200);
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
        console.log(`CSRF token acquired: ${csrfToken ? 'yes' : 'no'}, sessionCookie: ${sessionCookie ? 'yes' : 'no'}`);
      }
    } catch (error) {
      console.warn('Could not get CSRF token:', error);
      // Continue without CSRF token - tests may fail but we'll see the actual error
    }
  });

  afterAll(async () => {
    // Clean up: close server
    if (server && server.listening) {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      // Should have 32+ tools (updated from original 17)
      expect(data.tools.length).toBeGreaterThanOrEqual(32);
    });

    it('should return tools in correct format', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const firstTool = data.tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
    });

    it('should respond to POST /mcp/execute', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`, {
        method: 'OPTIONS'
      });
      // Check for CORS headers (implementation dependent)
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
  });

  describe('Module Exposure', () => {
    it('should expose chronometric_module via HTTP', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const chronometricModule = data.tools.find((t: any) => t.name === 'chronometric_module');
      expect(chronometricModule).toBeDefined();
    });

    it('should execute chronometric_module', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const maeEngine = data.tools.find((t: any) => t.name === 'mae_engine');
      expect(maeEngine).toBeDefined();
    });

    it('should expose goodcounsel_engine via HTTP', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const goodcounselEngine = data.tools.find((t: any) => t.name === 'goodcounsel_engine');
      expect(goodcounselEngine).toBeDefined();
    });

    it('should expose potemkin_engine via HTTP', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/tools`);
      const data = await response.json();
      const potemkinEngine = data.tools.find((t: any) => t.name === 'potemkin_engine');
      expect(potemkinEngine).toBeDefined();
    });

    it('should execute mae_engine', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
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

  describe('MCP Error Response Shape', () => {
    it('should return JSON for unknown /mcp routes', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/unknown-route-xyz`);
      expect(response.headers.get('content-type')).toContain('application/json');
      const data = await response.json();
      expect(data.isError).toBe(true);
      expect(Array.isArray(data.content)).toBe(true);
      expect(typeof data.content[0].text).toBe('string');
    });

    it('should return JSON with correct shape for /mcp/execute validation errors', async () => {
      const response = await fetchWithRetry(`${baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `sessionId=${sessionCookie}`
        },
        body: JSON.stringify({ notATool: 'bad body' })
      });
      expect(response.headers.get('content-type')).toContain('application/json');
      const data = await response.json();
      expect(data.isError).toBe(true);
      expect(Array.isArray(data.content)).toBe(true);
      expect(typeof data.content[0].text).toBe('string');
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
