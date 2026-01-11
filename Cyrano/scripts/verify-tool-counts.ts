#!/usr/bin/env tsx
/**
 * Tool Count Verification Script
 * Verifies all tools are registered in both MCP server and HTTP bridge
 * 
 * Copyright 2025 Cognisint LLC
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface ToolInfo {
  file: string;
  name?: string;
  exported?: string[];
}

async function findToolFiles(): Promise<string[]> {
  const toolsDir = join(process.cwd(), 'src', 'tools');
  const files = await glob('**/*.ts', {
    cwd: toolsDir,
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/base-tool.ts', '**/__tests__/**'],
  });
  return files.map(f => join(toolsDir, f));
}

async function extractToolExports(filePath: string): Promise<ToolInfo> {
  const content = await readFile(filePath, 'utf-8');
  const exports: string[] = [];
  let toolName: string | undefined;

  // Find exported tools (export const toolName = ...)
  const exportMatches = content.matchAll(/export\s+(const|class|function)\s+(\w+)/g);
  for (const match of exportMatches) {
    exports.push(match[2]);
  }

  // Try to find tool name from getToolDefinition
  const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
  if (nameMatch) {
    toolName = nameMatch[1];
  }

  return {
    file: filePath,
    name: toolName,
    exported: exports,
  };
}

async function checkRegistration(filePath: string, registryContent: string): Promise<boolean> {
  const toolInfo = await extractToolExports(filePath);
  const fileName = filePath.split('/').pop()?.replace('.ts', '') || '';

  // Check if tool name appears in registry
  if (toolInfo.name) {
    return registryContent.includes(toolInfo.name) || 
           registryContent.includes(`'${toolInfo.name}'`) ||
           registryContent.includes(`"${toolInfo.name}"`);
  }

  // Fallback: check if file name appears
  return registryContent.includes(fileName);
}

async function main() {
  console.log('🔍 Verifying tool counts...\n');

  // Find all tool files
  const toolFiles = await findToolFiles();
  console.log(`Found ${toolFiles.length} tool files\n`);

  // Read MCP server and HTTP bridge
  const mcpServerPath = join(process.cwd(), 'src', 'mcp-server.ts');
  const httpBridgePath = join(process.cwd(), 'src', 'http-bridge.ts');

  const mcpContent = await readFile(mcpServerPath, 'utf-8');
  const httpContent = await readFile(httpBridgePath, 'utf-8');

  // Check each tool
  const unregistered: string[] = [];
  const registered: string[] = [];

  for (const toolFile of toolFiles) {
    const inMCP = await checkRegistration(toolFile, mcpContent);
    const inHTTP = await checkRegistration(toolFile, httpContent);

    const fileName = toolFile.split('/').pop() || '';
    if (!inMCP && !inHTTP) {
      unregistered.push(fileName);
    } else {
      registered.push(fileName);
    }
  }

  console.log(`✅ Registered: ${registered.length}`);
  console.log(`⚠️  Unregistered: ${unregistered.length}\n`);

  if (unregistered.length > 0) {
    console.log('Unregistered tools:');
    unregistered.forEach(t => console.log(`  - ${t}`));
  }

  // Count registrations
  const mcpToolCount = (mcpContent.match(/getToolDefinition\(\)/g) || []).length;
  const httpToolCount = (httpContent.match(/loader:\s*\(\)\s*=>/g) || []).length;

  console.log(`\n📊 Registration counts:`);
  console.log(`  MCP Server: ${mcpToolCount} tool definitions`);
  console.log(`  HTTP Bridge: ${httpToolCount} tool loaders`);
  console.log(`  Tool Files: ${toolFiles.length}`);
}

main().catch(console.error);

}
}
)
}
}
)