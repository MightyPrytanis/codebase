#!/usr/bin/env tsx

/**
 * Engine Generator Script
 * Automatically generates boilerplate for new engines
 * 
 * Usage: tsx scripts/generate-engine.ts <engine-name> [description]
 * Example: tsx scripts/generate-engine.ts mae "Multi-Agent Engine"
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const engineName = process.argv[2];
const description = process.argv[3] || `${engineName} engine`;

if (!engineName) {
  console.error('❌ Error: Engine name required');
  console.log('Usage: tsx scripts/generate-engine.ts <engine-name> [description]');
  process.exit(1);
}

// Convert engine name to various formats
const camelCase = engineName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
const snake_case = engineName.replace(/-/g, '_');
const UPPER_SNAKE = snake_case.toUpperCase();

const projectRoot = path.resolve(__dirname, '..');
const enginesDir = path.join(projectRoot, 'src', 'engines');
const engineDir = path.join(enginesDir, engineName);

// Check if engine already exists
if (fs.existsSync(engineDir)) {
  console.error(`❌ Error: Engine ${engineName} already exists at ${engineDir}`);
  process.exit(1);
}

// Create engine directory structure
fs.mkdirSync(engineDir, { recursive: true });
fs.mkdirSync(path.join(engineDir, 'tools'), { recursive: true });
fs.mkdirSync(path.join(engineDir, 'workflows'), { recursive: true });

// Generate base engine class
const engineCode = `import { BaseEngine } from '../base-engine.js';
import { z } from 'zod';

/**
 * ${PascalCase} Engine
 * ${description}
 */
export class ${PascalCase}Engine extends BaseEngine {
  constructor() {
    super({
      name: '${snake_case}',
      description: '${description}',
      version: '1.0.0',
    });
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // TODO: Initialize engine
    // - Load modules
    // - Set up orchestration
    // - Configure AI providers
  }

  /**
   * Execute engine workflow
   */
  async execute(input: any): Promise<any> {
    // TODO: Implement engine logic
    // - Orchestrate modules
    // - Coordinate AI providers
    // - Manage workflow state
    return { result: 'Engine executed' };
  }

  /**
   * Get available workflows
   */
  async getWorkflows(): Promise<any[]> {
    // TODO: Return available workflows
    return [];
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(workflowId: string, input: any): Promise<any> {
    // TODO: Execute workflow
    return { result: 'Workflow executed' };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // TODO: Cleanup resources
  }
}

// Export singleton instance
export const ${camelCase}Engine = new ${PascalCase}Engine();
`;

// Write engine file
const engineFile = path.join(engineDir, `${engineName}-engine.ts`);
fs.writeFileSync(engineFile, engineCode);
console.log(`✅ Created engine file: ${engineFile}`);

// Generate engine index
const indexCode = `export * from './${engineName}-engine.js';
`;

const indexFile = path.join(engineDir, 'index.ts');
fs.writeFileSync(indexFile, indexCode);
console.log(`✅ Created index file: ${indexFile}`);

// Generate README
const readmeCode = `# ${PascalCase} Engine

${description}

## Overview

TODO: Add engine overview

## Modules

This engine orchestrates the following modules:
- TODO: List modules

## Workflows

TODO: List available workflows

## Usage

\`\`\`typescript
import { ${camelCase}Engine } from './${engineName}-engine.js';

const result = await ${camelCase}Engine.execute({
  // TODO: Add input schema
});
\`\`\`

## Configuration

TODO: Add configuration options
`;

const readmeFile = path.join(engineDir, 'README.md');
fs.writeFileSync(readmeFile, readmeCode);
console.log(`✅ Created README: ${readmeFile}`);

// Update engine registry if it exists
const registryFile = path.join(projectRoot, 'src', 'engines', 'registry.ts');
if (fs.existsSync(registryFile)) {
  let registryContent = fs.readFileSync(registryFile, 'utf-8');
  
  // Add import
  const importLine = `import { ${camelCase}Engine } from './${engineName}/${engineName}-engine.js';`;
  if (!registryContent.includes(importLine)) {
    const importMatch = registryContent.match(/(import.*from.*;\n)+/);
    if (importMatch) {
      const lastImportIndex = importMatch[0].lastIndexOf(';');
      registryContent = 
        registryContent.slice(0, importMatch.index + lastImportIndex + 1) +
        '\n' + importLine +
        registryContent.slice(importMatch.index + lastImportIndex + 1);
    }
  }
  
  // Add to registry
  if (!registryContent.includes(`${camelCase}Engine`)) {
    const registryMatch = registryContent.match(/export const engines = \{([\s\S]*?)\}/);
    if (registryMatch) {
      const newEntry = `  '${snake_case}': ${camelCase}Engine,\n`;
      const insertIndex = registryMatch.index + registryMatch[0].indexOf('}');
      registryContent = 
        registryContent.slice(0, insertIndex) +
        newEntry +
        registryContent.slice(insertIndex);
    }
  }
  
  fs.writeFileSync(registryFile, registryContent);
  console.log(`✅ Updated engine registry`);
}

console.log(`\n✅ Engine ${engineName} generated successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. Implement engine logic in ${engineFile}`);
console.log(`  2. Add module orchestration`);
console.log(`  3. Configure workflows`);
console.log(`  4. Set up AI provider coordination`);
console.log(`  5. Write tests`);
console.log(`  6. Update documentation`);
