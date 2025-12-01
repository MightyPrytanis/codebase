#!/usr/bin/env tsx

/**
 * Module Generator Script
 * Automatically generates boilerplate for new modules
 * 
 * Usage: tsx scripts/generate-module.ts <module-name> [description]
 * Example: tsx scripts/generate-module.ts chronometric "Timekeeping module"
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleName = process.argv[2];
const description = process.argv[3] || `${moduleName} module`;

if (!moduleName) {
  console.error('❌ Error: Module name required');
  console.log('Usage: tsx scripts/generate-module.ts <module-name> [description]');
  process.exit(1);
}

// Convert module name to various formats
const camelCase = moduleName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
const snake_case = moduleName.replace(/-/g, '_');

const projectRoot = path.resolve(__dirname, '..');
const modulesDir = path.join(projectRoot, 'src', 'modules');
const moduleDir = path.join(modulesDir, moduleName);

// Check if module already exists
if (fs.existsSync(moduleDir)) {
  console.error(`❌ Error: Module ${moduleName} already exists at ${moduleDir}`);
  process.exit(1);
}

// Create module directory
fs.mkdirSync(moduleDir, { recursive: true });

// Generate base module class
const moduleCode = `import { BaseModule } from '../base-module.js';
import { z } from 'zod';

/**
 * ${PascalCase} Module
 * ${description}
 */
export class ${PascalCase}Module extends BaseModule {
  constructor() {
    super({
      name: '${snake_case}',
      description: '${description}',
      version: '1.0.0',
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // TODO: Initialize module resources
    // - Load tools
    // - Set up resources
    // - Configure prompts
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<any> {
    // TODO: Implement module logic
    // - Orchestrate tools
    // - Process input
    // - Return result
    return { result: 'Module executed' };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // TODO: Cleanup resources
  }
}

// Export singleton instance
export const ${camelCase}Module = new ${PascalCase}Module();
`;

// Write module file
const moduleFile = path.join(moduleDir, `${moduleName}.ts`);
fs.writeFileSync(moduleFile, moduleCode);
console.log(`✅ Created module file: ${moduleFile}`);

// Generate module index
const indexCode = `export * from './${moduleName}.js';
`;

const indexFile = path.join(moduleDir, 'index.ts');
fs.writeFileSync(indexFile, indexCode);
console.log(`✅ Created index file: ${indexFile}`);

// Generate README
const readmeCode = `# ${PascalCase} Module

${description}

## Overview

TODO: Add module overview

## Tools

This module uses the following tools:
- TODO: List tools

## Usage

\`\`\`typescript
import { ${camelCase}Module } from './${moduleName}.js';

const result = await ${camelCase}Module.execute({
  // TODO: Add input schema
});
\`\`\`

## Configuration

TODO: Add configuration options
`;

const readmeFile = path.join(moduleDir, 'README.md');
fs.writeFileSync(readmeFile, readmeCode);
console.log(`✅ Created README: ${readmeFile}`);

// Update module registry if it exists
const registryFile = path.join(projectRoot, 'src', 'modules', 'registry.ts');
if (fs.existsSync(registryFile)) {
  let registryContent = fs.readFileSync(registryFile, 'utf-8');
  
  // Add import
  const importLine = `import { ${camelCase}Module } from './${moduleName}/${moduleName}.js';`;
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
  if (!registryContent.includes(`${camelCase}Module`)) {
    const registryMatch = registryContent.match(/export const modules = \{([\s\S]*?)\}/);
    if (registryMatch) {
      const newEntry = `  '${snake_case}': ${camelCase}Module,\n`;
      const insertIndex = registryMatch.index + registryMatch[0].indexOf('}');
      registryContent = 
        registryContent.slice(0, insertIndex) +
        newEntry +
        registryContent.slice(insertIndex);
    }
  }
  
  fs.writeFileSync(registryFile, registryContent);
  console.log(`✅ Updated module registry`);
}

console.log(`\n✅ Module ${moduleName} generated successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. Implement module logic in ${moduleFile}`);
console.log(`  2. Add required tools`);
console.log(`  3. Configure resources and prompts`);
console.log(`  4. Write tests`);
console.log(`  5. Update documentation`);

