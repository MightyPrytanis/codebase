#!/usr/bin/env tsx

/**
 * Test Generator Script
 * Automatically generates test suites for tools, modules, and engines
 * 
 * Usage: tsx scripts/generate-tests.ts <component-type> <component-name>
 * Example: tsx scripts/generate-tests.ts tool document-analyzer
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentType = process.argv[2]; // 'tool', 'module', or 'engine'
const componentName = process.argv[3];

if (!componentType || !componentName) {
  console.error('❌ Error: Component type and name required');
  console.log('Usage: tsx scripts/generate-tests.ts <tool|module|engine> <component-name>');
  process.exit(1);
}

const camelCase = componentName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

const projectRoot = path.resolve(__dirname, '..');
const testDir = path.join(projectRoot, 'tests', componentType + 's');
const testFile = path.join(testDir, `${componentName}.test.ts`);

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Check if test already exists
if (fs.existsSync(testFile)) {
  console.error(`❌ Error: Test file ${testFile} already exists`);
  process.exit(1);
}

// Generate test code based on component type
let testCode = '';

if (componentType === 'tool') {
  testCode = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${camelCase} } from '../../src/tools/${componentName}.js';

describe('${PascalCase} Tool', () => {
  let tool: typeof ${camelCase};

  beforeEach(() => {
    tool = ${camelCase};
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.name).toBe('${componentName.replace(/-/g, '_')}');
      expect(definition.description).toBeDefined();
      expect(definition.inputSchema).toBeDefined();
    });

    it('should have required input schema properties', () => {
      const definition = tool.getToolDefinition();
      const schema = definition.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(Array.isArray(schema.required)).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid input', async () => {
      const result = await tool.execute({
        // TODO: Add valid test input
      });
      
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should handle invalid input gracefully', async () => {
      const result = await tool.execute({
        invalid: 'input'
      });
      
      expect(result.isError).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // TODO: Add test for error scenarios
      const result = await tool.execute({
        // Input that causes error
      });
      
      expect(result.isError).toBe(true);
    });
  });

  describe('MCP Compliance', () => {
    it('should return CallToolResult format', async () => {
      const result = await tool.execute({});
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });
});
`;
} else if (componentType === 'module') {
  testCode = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${camelCase}Module } from '../../src/modules/${componentName}/${componentName}.js';

describe('${PascalCase} Module', () => {
  let module: typeof ${camelCase}Module;

  beforeEach(() => {
    module = ${camelCase}Module;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(module.initialize()).resolves.not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid input', async () => {
      const result = await module.execute({
        // TODO: Add valid test input
      });
      
      expect(result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // TODO: Add error test cases
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await expect(module.cleanup()).resolves.not.toThrow();
    });
  });
});
`;
} else if (componentType === 'engine') {
  testCode = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${camelCase}Engine } from '../../src/engines/${componentName}/${componentName}-engine.js';

describe('${PascalCase} Engine', () => {
  let engine: typeof ${camelCase}Engine;

  beforeEach(() => {
    engine = ${camelCase}Engine;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid input', async () => {
      const result = await engine.execute({
        // TODO: Add valid test input
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('workflows', () => {
    it('should return available workflows', async () => {
      const workflows = await engine.getWorkflows();
      
      expect(Array.isArray(workflows)).toBe(true);
    });

    it('should execute workflow successfully', async () => {
      const workflows = await engine.getWorkflows();
      if (workflows.length > 0) {
        const result = await engine.executeWorkflow(workflows[0].id, {
          // TODO: Add test input
        });
        
        expect(result).toBeDefined();
      }
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await expect(engine.cleanup()).resolves.not.toThrow();
    });
  });
});
`;
} else {
  console.error(`❌ Error: Unknown component type: ${componentType}`);
  console.log('Supported types: tool, module, engine');
  process.exit(1);
}

fs.writeFileSync(testFile, testCode);
console.log(`✅ Created test file: ${testFile}`);

// Update package.json to include test script if needed
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  if (!packageJson.scripts.test) {
    packageJson.scripts.test = 'vitest';
    packageJson.scripts['test:watch'] = 'vitest --watch';
    packageJson.scripts['test:coverage'] = 'vitest --coverage';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Updated package.json with test scripts`);
  }
}

console.log(`\n✅ Test suite for ${componentType} '${componentName}' generated!`);
console.log(`\nNext steps:`);
console.log(`  1. Install vitest if not already installed: npm install -D vitest`);
console.log(`  2. Implement test cases`);
console.log(`  3. Run tests: npm test`);

)
}
}
}
}
)
)