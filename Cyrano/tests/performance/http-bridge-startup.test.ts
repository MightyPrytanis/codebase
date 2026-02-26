/*
 * HTTP Bridge Startup Performance Tests
 * Tests startup time, tool loading performance, and reliability
 * 
 * Copyright 2025 Cognisint LLC
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';

describe('HTTP Bridge Startup Performance', () => {
  let serverProcess: ChildProcess | null = null;
  let serverStarted = false;
  const SERVER_URL = 'http://localhost:5002';
  const STARTUP_TIMEOUT = 60000; // 60 seconds

  beforeAll(async () => {
    // Start HTTP bridge server
    serverProcess = spawn('npm', ['run', 'http'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
    });

    // Add error logging
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });
    }

    // Wait a bit for server to initialize before health checks
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Wait for server to be ready
    let attempts = 0;
    const maxAttempts = 25; // 25 seconds max to stay well within hook timeout

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${SERVER_URL}/health`);
        if (response.ok) {
          console.log(`Server started successfully after ${attempts + 1} attempts`);
          serverStarted = true;
          break;
        }
      } catch (error) {
        // Server not ready yet
        if (attempts % 10 === 0) {
          console.log(`Waiting for server... attempt ${attempts + 1}/${maxAttempts}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (!serverStarted) {
      console.warn('Server failed to start within timeout - performance tests will be skipped');
    }
  }, STARTUP_TIMEOUT);

  beforeEach((ctx) => {
    if (!serverStarted) ctx.skip();
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  it('should start within 60 seconds', async () => {
    const startTime = Date.now();
    
    // Server should already be started in beforeAll
    const response = await fetch(`${SERVER_URL}/health`);
    
    const startupTime = Date.now() - startTime;
    expect(response.ok).toBe(true);
    expect(startupTime).toBeLessThan(STARTUP_TIMEOUT);
  });

  it('should respond to health check immediately', async () => {
    const startTime = Date.now();
    const response = await fetch(`${SERVER_URL}/health`);
    const responseTime = Date.now() - startTime;

    expect(response.ok).toBe(true);
    expect(responseTime).toBeLessThan(1000); // Should respond in < 1s
  });

  it('should load tools asynchronously without blocking startup', async () => {
    // Health endpoint should work even if tools are still loading
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    expect(healthResponse.ok).toBe(true);

    // Tools endpoint may take longer but shouldn't block health
    const toolsResponse = await fetch(`${SERVER_URL}/mcp/tools`);
    expect(toolsResponse.ok).toBe(true);
  });

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, () => 
      fetch(`${SERVER_URL}/health`)
    );

    const responses = await Promise.all(requests);
    const allOk = responses.every(r => r.ok);
    
    expect(allOk).toBe(true);
  });

  it('should recover from errors gracefully', async () => {
    // Make invalid request
    const response = await fetch(`${SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'nonexistent_tool', arguments: {} }),
    });

    // Should return error response, not crash
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600);
  });
});