---
Document ID: ENGINE-ARCHITECTURE
Title: Engine Architecture
Subject(s): Architecture
Project: Cyrano
Version: v547
Created: 2025-11-22 (2025-W47)
Last Substantive Revision: 2025-11-22 (2025-W47)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-11-22  
**Purpose:** Define the engine abstraction layer for Cyrano

## Overview

Engines are higher-level orchestrators that coordinate multiple modules and possibly multiple AI models or agents. They deliver mission-critical, core app logic (e.g., compliance, legal strategy, multi-stage automation).

Engines aggregate and/or orchestrate modules (and when appropriate, individual primitives) for the performance of core/mission-critical functions of an app.

## Key Concepts

### Engine Composition

An engine consists of:
1. **Modules** - One or more BaseModule instances
2. **Tools** - Direct tools (when needed)
3. **Workflows** - Multi-step orchestration patterns
4. **AI Providers** - Multiple AI models/agents
5. **State Management** - Engine-level state

### Engine Characteristics

- **Mission-Critical** - Delivers core app logic
- **Orchestration** - Coordinates multiple modules and AI providers
- **Workflow-Driven** - Manages complex multi-stage processes
- **Stateful** - Maintains state across operations
- **User-Sovereign** - Respects user direction and control

## BaseEngine Class

All engines extend from `BaseEngine`:

```typescript
import { BaseEngine } from '../engines/base-engine.js';

export class MyEngine extends BaseEngine {
  constructor() {
    super({
      name: 'my_engine',
      description: 'Engine description',
      version: '1.0.0',
      modules: ['module1', 'module2'],
      tools: [/* direct tools */],
      aiProviders: ['openai', 'anthropic'],
    });
  }

  async initialize(): Promise<void> {
    // Set up modules, workflows, AI providers
    await this.registerWorkflow({
      id: 'my_workflow',
      name: 'My Workflow',
      description: 'Workflow description',
      steps: [/* workflow steps */],
    });
  }

  async execute(input: any): Promise<CallToolResult> {
    // Engine logic
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

## Engine Registry

Engines are registered in the engine registry:

```typescript
import { engineRegistry } from '../engines/registry.js';

const myEngine = new MyEngine();
await myEngine.initialize();
engineRegistry.register(myEngine);
```

## Workflow System

Engines use workflows to orchestrate complex processes:

```typescript
const workflow: Workflow = {
  id: 'document_review',
  name: 'Document Review Workflow',
  description: 'Multi-stage document review process',
  steps: [
    {
      id: 'analyze',
      type: 'module',
      target: 'document_analysis',
      input: { document: '...' },
      onSuccess: 'check_compliance',
      onFailure: 'error_handler',
    },
    {
      id: 'check_compliance',
      type: 'module',
      target: 'compliance_checker',
      onSuccess: 'generate_report',
    },
    {
      id: 'generate_report',
      type: 'ai',
      target: 'openai',
      onSuccess: null, // End of workflow
    },
  ],
};
```

## Engine Lifecycle

1. **Construction** - Engine is created with configuration
2. **Initialization** - `initialize()` sets up modules, workflows, AI providers
3. **Execution** - `execute()` or `executeWorkflow()` performs operations
4. **State Management** - Engine maintains state across operations
5. **Cleanup** - `cleanup()` releases resources

## Example: MAE (Multi-Agent Engine)

The MAE engine would:

1. **Orchestrate Modules:**
   - Document analysis module
   - Legal review module
   - Compliance checking module

2. **Coordinate AI Providers:**
   - OpenAI for analysis
   - Anthropic for review
   - Perplexity for fact-checking

3. **Manage Workflows:**
   - Compare workflow (multi-agent comparison)
   - Critique workflow (multi-agent review)
   - Collaborate workflow (multi-agent collaboration)

4. **User Sovereignty:**
   - Allow user to select AI providers
   - Let user configure workflows
   - Respect user preferences

## Example: GoodCounsel Engine

The GoodCounsel engine would:

1. **Orchestrate Modules:**
   - Ethics monitoring module
   - Wellness tracking module
   - Client relationship module

2. **Coordinate Tools:**
   - Next action tool (from Cosmos)
   - Habit detection tool
   - Burnout detection tool

3. **Manage State:**
   - User wellness metrics
   - Ethics compliance status
   - Client relationship data

4. **Privacy Controls:**
   - HIPAA-compliant data handling
   - Encrypted state storage
   - Access controls

## Integration with Applications

Engines are used by applications:

```typescript
// Application uses engine
const engine = engineRegistry.get('mae');
const result = await engine.executeWorkflow('compare', input);
```

## Best Practices

1. **Clear Orchestration** - Define clear workflows
2. **Module Reuse** - Compose existing modules
3. **State Management** - Properly manage engine state
4. **Error Recovery** - Handle errors gracefully
5. **User Control** - Respect user sovereignty
6. **Documentation** - Document workflows and usage

## Engine vs Module

| Aspect | Module | Engine |
|--------|--------|--------|
| Scope | Domain-specific | Mission-critical, core logic |
| Composition | Composes tools | Composes modules and tools |
| AI Usage | Single AI model | Multiple AI models/agents |
| Coordination | Minimal | Extensive orchestration |
| State | Stateless or minimal | Stateful |
| Workflows | Simple | Complex multi-stage |

## Next Steps

1. Implement MAE engine
2. Implement GoodCounsel engine
3. Implement Potemkin engine
4. Create workflow visual editor
5. Integrate engines with LexFiat

