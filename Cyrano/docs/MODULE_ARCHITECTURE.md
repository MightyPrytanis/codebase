# Module Architecture

**Created:** 2025-11-22  
**Purpose:** Define the module abstraction layer for Cyrano

## Overview

Modules are conceptual organizations of tools, resources, and prompts that work together to handle a discrete, domain-specific function. Unlike tools (atomic units), modules compose multiple tools and may include resources and prompt templates for AI-driven orchestration.

## Key Concepts

### Module Composition

A module consists of:
1. **Tools** - One or more BaseTool instances
2. **Resources** - Files, data, API connections, templates
3. **Prompts** - Template prompts for AI-driven orchestration
4. **Logic** - Module-specific orchestration logic

### Module Characteristics

- **Domain-Specific** - Handles a discrete function or closely related set of tasks
- **Self-Contained** - Runs with minimal need for coordination with other modules
- **AI-Driven** - Typically operated by a single AI model or agent
- **Composable** - Can be used by engines or applications

## BaseModule Class

All modules extend from `BaseModule`:

```typescript
import { BaseModule } from '../modules/base-module.js';

export class MyModule extends BaseModule {
  constructor() {
    super({
      name: 'my_module',
      description: 'Module description',
      version: '1.0.0',
      tools: [/* tool instances */],
      resources: [/* resource definitions */],
      prompts: [/* prompt templates */],
    });
  }

  async initialize(): Promise<void> {
    // Load resources, set up connections
  }

  async execute(input: any): Promise<CallToolResult> {
    // Module logic
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

## Module Registry

Modules are registered in the module registry:

```typescript
import { moduleRegistry } from '../modules/registry.js';

const myModule = new MyModule();
moduleRegistry.register(myModule);
```

## Module Lifecycle

1. **Construction** - Module is created with configuration
2. **Initialization** - `initialize()` is called to set up resources
3. **Execution** - `execute()` is called to perform module operations
4. **Cleanup** - `cleanup()` is called to release resources

## Example: Chronometric Module

The Chronometric module (timekeeping) would:

1. **Compose Tools:**
   - Gap identification tool
   - Email artifact collector
   - Calendar artifact collector
   - Document artifact collector
   - Recollection support tool
   - Pre-fill logic tool
   - DupeCheck tool
   - Provenance tracker

2. **Use Resources:**
   - Clio API configuration
   - Email service configuration
   - Calendar service configuration

3. **Use Prompts:**
   - Time reconstruction prompts
   - Evidence organization prompts

4. **Orchestrate:**
   - Coordinate tools to reconstruct billable time
   - Organize evidence for attorney review
   - Generate time entries for approval

## Integration with Engines

Modules are orchestrated by engines:

```typescript
// Engine uses module
const module = moduleRegistry.get('chronometric');
const result = await module.execute(input);
```

## Best Practices

1. **Single Responsibility** - Each module should handle one domain
2. **Tool Composition** - Compose existing tools rather than creating new ones
3. **Resource Management** - Properly initialize and cleanup resources
4. **Error Handling** - Return proper CallToolResult with error information
5. **Documentation** - Document module purpose, tools, and usage

## Module vs Tool

| Aspect | Tool | Module |
|--------|------|--------|
| Scope | Atomic, single-purpose | Domain-specific, multi-tool |
| Composition | None | Composes tools, resources, prompts |
| AI Usage | May use AI | Typically AI-driven orchestration |
| Coordination | Stateless | Minimal coordination needed |
| Reusability | High | Medium (domain-specific) |

## Next Steps

1. Implement Chronometric module as first example
2. Create additional modules as needed
3. Document module patterns and best practices
4. Integrate modules with engines

