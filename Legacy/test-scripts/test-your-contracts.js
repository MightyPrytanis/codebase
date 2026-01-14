#!/usr/bin/env node

/**
 * Enhanced Legal Comparator Test Script
 * Now uses the standardized MCP client for consistent results
 * Usage:
 *   ./test-your-contracts.js contract1.pdf contract2.pdf
 *   ./test-your-contracts.js contract1.txt contract2.pdf
 *   ./test-your-contracts.js --paste  (then paste contracts when prompted)
 */

import { ContractComparatorClient } from './legal-comparator-client.mjs';
import fs from 'fs';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📋 Legal Comparator Test - Use Your Own Contracts (PDF & Text Supported)

Usage:
  ./test-your-contracts.js contract1.pdf contract2.pdf
  ./test-your-contracts.js contract1.txt contract2.pdf
  ./test-your-contracts.js --paste

Examples:
  ./test-your-contracts.js NDA1.pdf NDA2.pdf
  ./test-your-contracts.js employment-agreement.pdf consulting-contract.txt
  ./test-your-contracts.js --paste

Supports:
  • PDF files (text must be extractable, not scanned images)
  • Text files (.txt, .md, etc.)
  • Interactive paste mode for direct text input

The tool will compare any text-based legal documents.
`);
  process.exit(0);
}

async function main() {
  const client = new ContractComparatorClient();

  try {
    if (args[0] === '--paste') {
      // Interactive paste mode
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('📝 Paste Mode: Enter your first contract (press Ctrl+D when done):');
      let doc1 = '';
      process.stdin.on('data', (chunk) => {
        doc1 += chunk;
      });

      await new Promise((resolve) => {
        process.stdin.on('end', resolve);
      });

      console.log('\n📝 Now enter your second contract (press Ctrl+D when done):');
      let doc2 = '';
      process.stdin.on('data', (chunk) => {
        doc2 += chunk;
      });

      await new Promise((resolve) => {
        process.stdin.on('end', resolve);
      });

      rl.close();

      // For paste mode, we'll need to modify the client to accept text directly
      console.log('❌ Paste mode not yet implemented with new client. Use file mode instead.');
      process.exit(1);

    } else {
      // File mode
      const [doc1Path, doc2Path] = args;

      if (!fs.existsSync(doc1Path)) {
        console.error(`❌ Document 1 not found: ${doc1Path}`);
        process.exit(1);
      }

      if (!fs.existsSync(doc2Path)) {
        console.error(`❌ Document 2 not found: ${doc2Path}`);
        process.exit(1);
      }

      await client.compareDocuments(doc1Path, doc2Path, 'comprehensive');
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await client.cleanup();
  }
}

main().catch(console.error);

}
}
}
}