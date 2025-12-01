#!/usr/bin/env node

/**
 * Enhanced Contract Comparator MCP Client
 * Provides consistent access to the contract-comparator tool with full analysis
 * Note: This tool is designed for contracts/agreements, not all legal documents
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class ContractComparatorClient {
  constructor() {
    this.mcpServer = null;
    this.serverProcess = null;
  }

  async startMCPServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting Cyrano MCP Server...');

      this.serverProcess = spawn('node', ['dist/index.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      let serverReady = false;

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;

        if (output.includes('MCP server running') && !serverReady) {
          serverReady = true;
          console.log('✅ MCP Server ready');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('close', (code) => {
        if (!serverReady) {
          reject(new Error(`MCP Server exited with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('MCP Server startup timeout'));
        }
      }, 30000);
    });
  }

  async readDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      // Use pdf-parse for PDF files
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      console.log(`📄 Read PDF: ${filePath} (${data.numpages} pages, ${data.text.length} chars)`);
      return data.text;
    } else {
      // Read text files
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`📄 Read text file: ${filePath} (${content.length} chars)`);
      return content;
    }
  }

  async compareDocuments(doc1Path, doc2Path, analysisType = 'comprehensive') {
    try {
      console.log(`\n📋 Legal Comparator - Enhanced Analysis`);
      console.log(`=======================================`);

      // Read documents
      const doc1Text = await this.readDocument(doc1Path);
      const doc2Text = await this.readDocument(doc2Path);

      // Start MCP server if not running
      if (!this.serverProcess) {
        await this.startMCPServer();
      }

      // Prepare MCP request
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'contract_comparator',
          arguments: {
            document1_text: doc1Text,
            document2_text: doc2Text,
            comparison_type: analysisType
          }
        }
      };

      return new Promise((resolve, reject) => {
        let responseData = '';

        const handleResponse = (data) => {
          responseData += data.toString();

          try {
            const response = JSON.parse(responseData);
            if (response.id === 1) {
              if (response.result) {
                console.log(response.result.content[0].text);
                console.log('\n✨ Enhanced legal analysis completed successfully!');
                resolve(response.result);
              } else if (response.error) {
                console.error('❌ MCP Error:', response.error);
                reject(new Error(response.error.message));
              }
            }
          } catch (e) {
            // Response not complete yet, continue accumulating
          }
        };

        this.serverProcess.stdout.on('data', handleResponse);

        // Send request
        this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      });

    } catch (error) {
      console.error('❌ Comparison failed:', error.message);
      throw error;
    }
  }

  async cleanup() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping MCP Server...');
      this.serverProcess.kill();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Enhanced Legal Comparator MCP Client
=====================================

Usage:
  node contract-comparator-client.js <doc1> <doc2> [analysis_type]

Arguments:
  doc1          Path to first document (PDF or text)
  doc2          Path to second document (PDF or text)
  analysis_type Type of analysis (default: comprehensive)
                Options: comprehensive, risk_analysis, obligations,
                        choice_of_law, financial, rights_remedies, term_termination

Examples:
  node legal-comparator-client.js contract1.pdf contract2.pdf
  node legal-comparator-client.js NDA1.pdf NDA2.pdf comprehensive
  node legal-comparator-client.js agreement.txt contract.txt risk_analysis

Supported formats:
  • PDF files (text must be extractable)
  • Text files (.txt, .md, etc.)
`);
    process.exit(1);
  }

  const [doc1Path, doc2Path, analysisType = 'comprehensive'] = args;

  // Validate files exist
  if (!fs.existsSync(doc1Path)) {
    console.error(`❌ Document 1 not found: ${doc1Path}`);
    process.exit(1);
  }

  if (!fs.existsSync(doc2Path)) {
    console.error(`❌ Document 2 not found: ${doc2Path}`);
    process.exit(1);
  }

  const client = new ContractComparatorClient();

  try {
    await client.compareDocuments(doc1Path, doc2Path, analysisType);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await client.cleanup();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ContractComparatorClient };