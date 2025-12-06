/**
 * Simple MCP client test script
 * Tests the auth tool directly via stdio
 */

import { spawn } from 'child_process';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

const mcpProcess = spawn('npx', ['tsx', 'src/mcp-server.ts'], {
  cwd: '/Users/davidtowne/Projects/Cyrano',
  stdio: ['pipe', 'pipe', 'pipe']
});

let messageId = 1;

function sendMessage(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };

  console.log('Sending:', JSON.stringify(message, null, 2));
  mcpProcess.stdin.write(JSON.stringify(message) + '\n');
}

function handleResponse(data) {
  const response = data.toString().trim();
  if (response) {
    try {
      const parsed = JSON.parse(response);
      console.log('Received:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', response);
    }
  }
}

mcpProcess.stdout.on('data', handleResponse);
mcpProcess.stderr.on('data', (data) => {
  console.error('MCP stderr:', data.toString());
});

// Wait for server to start, then test auth tool
setTimeout(() => {
  console.log('Testing auth tool registration...');

  // First list tools
  sendMessage('tools/list', {});

  // Wait a bit, then test auth register
  setTimeout(() => {
    sendMessage('tools/call', {
      name: 'auth',
      arguments: {
        action: 'register',
        username: 'testuser',
        password: 'testpass123',
        email: 'test@example.com'
      }
    });
  }, 1000);

}, 2000);

// Exit after 10 seconds
setTimeout(() => {
  mcpProcess.kill();
  process.exit(0);
}, 10000);