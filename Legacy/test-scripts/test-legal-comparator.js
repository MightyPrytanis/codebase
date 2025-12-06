/**
 * Test script for contract-comparator tool (formerly legal-comparator)
 * Demonstrates the tool functionality with sample legal documents
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

// Sample legal documents for testing
const contract1 = `
SERVICE AGREEMENT

This Service Agreement (the "Agreement") is entered into on January 1, 2024, by and between:

Party A: TechCorp Inc., a Delaware corporation with principal place of business at 123 Main St, Anytown, USA

Party B: ClientCorp LLC, a California limited liability company with principal place of business at 456 Oak Ave, Somewhere, USA

1. SERVICES
TechCorp shall provide software development services to ClientCorp for a period of 12 months.

2. COMPENSATION
ClientCorp shall pay TechCorp $100,000 for the services rendered.

3. LIABILITY
TechCorp's total liability shall not exceed the amount paid under this Agreement.

4. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

5. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.
`;

const contract2 = `
CONSULTING AGREEMENT

This Consulting Agreement (the "Agreement") is made effective as of February 1, 2024, between:

Consultant: DevSolutions Ltd., a New York corporation located at 789 Pine St, Elsewhere, USA

Client: BusinessInc Corp., a Texas corporation located at 321 Elm St, Nowhere, USA

1. CONSULTING SERVICES
DevSolutions agrees to provide consulting services for a term of 6 months.

2. FEES
Client agrees to pay Consultant $75,000 for the consulting services.

3. LIMITATION OF LIABILITY
Consultant's liability is limited to the fees paid under this contract.

4. TERMINATION CLAUSE
This agreement may be terminated by either party upon 15 days written notice.

5. APPLICABLE LAW
This contract is governed by Texas state law.
`;

// Wait for server to start, then test contract-comparator tool
setTimeout(() => {
  console.log('Testing contract-comparator tool...');

  // Test the legal comparator with sample contracts
  sendMessage('tools/call', {
    name: 'contract_comparator',
    arguments: {
      document1_text: contract1,
      document2_text: contract2,
      comparison_type: 'comprehensive',
      focus_areas: ['contracts', 'liability']
    }
  });

}, 2000);

// Exit after 15 seconds
setTimeout(() => {
  mcpProcess.kill();
  process.exit(0);
}, 15000);