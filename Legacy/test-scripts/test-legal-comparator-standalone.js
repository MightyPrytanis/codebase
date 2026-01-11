#!/usr/bin/env node

/**
 * Standalone test for contract-comparator tool (formerly legal-comparator)
 * Run with: node test-legal-comparator-standalone.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mcpProcess = spawn('npx', ['tsx', 'src/mcp-server.ts'], {
  cwd: path.resolve(__dirname),
  stdio: ['pipe', 'pipe', 'pipe']
});

let messageId = 1;
let receivedResponse = false;

function sendMessage(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };

  console.log('\n📤 Sending request:', method);
  mcpProcess.stdin.write(JSON.stringify(message) + '\n');
}

function handleResponse(data) {
  const response = data.toString().trim();
  if (response) {
    try {
      const parsed = JSON.parse(response);
      if (parsed.result && parsed.result.content) {
        receivedResponse = true;
        console.log('\n✅ Legal Comparator Results:');
        console.log('=' .repeat(50));

        // Parse and pretty-print the comparison results
        const content = parsed.result.content[0];
        if (content && content.text) {
          const results = JSON.parse(content.text);

          console.log(`📊 Similarity Score: ${(results.similarity_score * 100).toFixed(1)}%`);
          console.log(`📄 Document 1 Length: ${results.metadata.document1_length} chars`);
          console.log(`📄 Document 2 Length: ${results.metadata.document2_length} chars`);

          console.log('\n🔍 Key Findings:');
          results.key_differences.forEach(diff => console.log(`  • ${diff}`));

          console.log('\n📋 Recommendations:');
          results.recommendations.forEach(rec => console.log(`  • ${rec}`));

          if (results.focused_comparison) {
            console.log('\n🎯 Focused Analysis:');
            Object.entries(results.focused_comparison).forEach(([area, data]) => {
              console.log(`  ${area.toUpperCase()}:`, JSON.stringify(data, null, 2));
            });
          }
        }

        console.log('\n✨ Test completed successfully!');
        console.log('The contract-comparator tool is working correctly.');
      }
     catch (e) {
      console.log('Raw response:', response);
    }
mcpProcess.stdout.on('data', handleResponse);
mcpProcess.stderr.on('data', (data) => {
  console.error('❌ MCP Error:', data.toString());
});

// Sample contracts for testing
const CONTRACT_1 = `
EMPLOYMENT AGREEMENT

This Employment Agreement (the "Agreement") is entered into on January 15, 2024, by and between:

Employer: TechCorp Solutions Inc., a Delaware corporation with its principal place of business at 123 Silicon Valley Drive, San Francisco, CA 94105

Employee: John Smith, residing at 456 Oak Street, Berkeley, CA 94702

1. POSITION AND DUTIES
Employee shall serve as Senior Software Engineer. Employee shall perform duties as reasonably assigned by Employer.

2. COMPENSATION
Employee shall receive an annual salary of $150,000, payable in bi-weekly installments.

3. BENEFITS
Employee shall be eligible for health insurance, 401(k) plan, and 20 days paid time off per year.

4. CONFIDENTIALITY
Employee agrees to maintain confidentiality of all proprietary information.

5. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.
`;

const CONTRACT_2 = `
CONSULTING CONTRACT

This Consulting Contract (the "Contract") is made effective as of February 1, 2024, between:

Consultant: Jane Doe, an independent contractor residing at 789 Pine Avenue, Oakland, CA 94610

Client: StartupXYZ LLC, a California limited liability company located at 321 Innovation Way, Palo Alto, CA 94301

1. SERVICES
Consultant shall provide software development consulting services for a period of 6 months.

2. COMPENSATION
Client shall pay Consultant $125 per hour for services rendered, not to exceed $50,000 total.

3. INDEPENDENT CONTRACTOR STATUS
Consultant is an independent contractor, not an employee. Consultant is responsible for all taxes.

4. INTELLECTUAL PROPERTY
All work product shall be owned by Client upon payment.

5. TERMINATION
This Contract may be terminated by either party with 15 days written notice.

6. APPLICABLE LAW
This Contract is governed by California law.
`;

// Wait for server to start, then test
setTimeout(() => {
  console.log('🚀 Starting contract-comparator test...');
  console.log('Comparing Employment Agreement vs Consulting Contract');

  sendMessage('tools/call', {
    name: 'contract_comparator',
    arguments: {
      document1_text: CONTRACT_1,
      document2_text: CONTRACT_2,
      comparison_type: 'comprehensive',
      focus_areas: ['contracts', 'liability', 'compliance']
    }
  });

  // Timeout after 10 seconds if no response
  setTimeout(() => {
    if (!receivedResponse) {
      console.log('\n⏰ Test timed out - no response received');
      mcpProcess.kill();
      process.exit(1);
    }
  }, 10000);

}, 3000);

// Exit after test completes
setTimeout(() => {
  mcpProcess.kill();
  process.exit(0);
}, 12000);