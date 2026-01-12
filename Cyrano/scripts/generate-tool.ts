#!/usr/bin/env tsx

/**
 * Tool Generator Script
 * Automatically generates boilerplate for new tools
 * 
 * Usage: tsx scripts/generate-tool.ts <tool-name> [category]
 * Example: tsx scripts/generate-tool.ts email-parser "Data Extraction"
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toolName = process.argv[2];
const category = process.argv[3] || 'System';

if (!toolName) {
  console.error('❌ Error: Tool name required');
  console.log('Usage: tsx scripts/generate-tool.ts <tool-name> [category]');
  process.exit(1);
}

// Convert tool name to various formats
const camelCase = toolName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
const snake_case = toolName.replace(/-/g, '_');
const UPPER_SNAKE = snake_case.toUpperCase();

const projectRoot = path.resolve(__dirname, '..');
const toolsDir = path.join(projectRoot, 'src', 'tools');
const toolFile = path.join(toolsDir, `${toolName}.ts`);

// Check if tool already exists
if (fs.existsSync(toolFile)) {
  console.error(`❌ Error: Tool ${toolName} already exists at ${toolFile}`);
  process.exit(1);
}

// Generate tool code
const toolCode = `import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const ${PascalCase}Schema = z.object({
  // TODO: Define input schema
  input: z.string().describe('Tool input description'),
});

export const ${camelCase} = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: '${snake_case}',
      description: '${PascalCase} tool - TODO: Add description',
      inputSchema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Tool input description',
          },
        },
        required: ['input'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { input } = ${PascalCase}Schema.parse(args);
      
      // TODO: Implement tool logic
      const result = \`Processed: \${input}\`;
      
      return this.createSuccessResult(result);
    } catch (error) {
      return this.createErrorResult(
        \`Error in ${snake_case}: \${error instanceof Error ? error.message : String(error)}\`
      );
    }
  }
});
`;

// Write tool file
fs.writeFileSync(toolFile, toolCode);
console.log(`✅ Created tool file: ${toolFile}`);

// Update mcp-server.ts to register the tool
const mcpServerFile = path.join(projectRoot, 'src', 'mcp-server.ts');
if (fs.existsSync(mcpServerFile)) {
  let mcpServerContent = fs.readFileSync(mcpServerFile, 'utf-8');
  
  // Add import
  const importLine = `import { ${camelCase} } from './tools/${toolName}.js';`;
  if (!mcpServerContent.includes(importLine)) {
    // Find the last import before the class definition
    const importMatch = mcpServerContent.match(/(import.*from.*;\n)+/);
    if (importMatch) {
      const lastImportIndex = importMatch[0].lastIndexOf(';');
      mcpServerContent = 
        mcpServerContent.slice(0, importMatch.index + lastImportIndex + 1) +
        '\n' + importLine +
        mcpServerContent.slice(importMatch.index + lastImportIndex + 1);
    }
  }
  
  // Add to tools list
  if (!mcpServerContent.includes(`${camelCase}.getToolDefinition()`)) {
    // Find the tools array
    const toolsArrayMatch = mcpServerContent.match(/tools:\s*\[([\s\S]*?)\]/);
    if (toolsArrayMatch) {
      const toolsArray = toolsArrayMatch[1];
      const newToolEntry = `          ${camelCase}.getToolDefinition(),\n`;
      const insertIndex = toolsArrayMatch.index + toolsArrayMatch[0].indexOf(']');
      mcpServerContent = 
        mcpServerContent.slice(0, insertIndex) +
        newToolEntry +
        mcpServerContent.slice(insertIndex);
    }
  }
  
  // Add to switch statement
  if (!mcpServerContent.includes(`case '${snake_case}':`)) {
    const switchMatch = mcpServerContent.match(/switch\s*\(name\)\s*\{([\s\S]*?)\s*default:/);
    if (switchMatch) {
      const switchBody = switchMatch[1];
      const newCase = `          case '${snake_case}':\n            result = await ${camelCase}.execute(args);\n            break;\n`;
      const insertIndex = switchMatch.index + switchMatch[0].indexOf('default:');
      mcpServerContent = 
        mcpServerContent.slice(0, insertIndex) +
        newCase +
        mcpServerContent.slice(insertIndex);
    }
  }
  
  fs.writeFileSync(mcpServerFile, mcpServerContent);
  console.log(`✅ Updated mcp-server.ts to register ${toolName}`);
}

// Create test stub
const testFile = path.join(projectRoot, 'tests', 'tools', `${toolName}.test.ts`);
const testDir = path.dirname(testFile);
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const testCode = `import { describe, it, expect } from 'vitest';
import { ${camelCase} } from '../../src/tools/${toolName}.js';

describe('${PascalCase}', () => {
  it('should have correct tool definition', () => {
    const definition = ${camelCase}.getToolDefinition();
    expect(definition.name).toBe('${snake_case}');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await ${camelCase}.execute({ input: 'test' });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await ${camelCase}.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
`;

fs.writeFileSync(testFile, testCode);
console.log(`✅ Created test file: ${testFile}`);

console.log(`\n✅ Tool ${toolName} generated successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. Implement the tool logic in ${toolFile}`);
console.log(`  2. Update the Zod schema with proper validation`);
console.log(`  3. Write tests in ${testFile}`);
console.log(`  4. Update documentation`);

)
)
)
)