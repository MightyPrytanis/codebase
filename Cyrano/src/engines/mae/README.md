---
Document ID: README
Title: Readme
Subject(s): Cyrano | Reference
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Mae Engine

Multi-Agent Engine

## Overview

The MAE (Multi-Agent Engine) is the chief orchestrator and operator for all multi-AI service applications. It coordinates workflows involving multiple AI providers, modules, and complex multi-step processes.

## Architecture Hierarchy

```
MAE (Multi-Agent Engine)
├── Chief orchestrator and operator
├── Tools (MAE-specific tools):
│   └── AI Orchestrator (AIO) - Tool (extends BaseTool) for generic multi-provider orchestration
├── Services (utility classes under MAE's authority):
│   └── Multi-Model Service (MMS) - Utility class for role-based multi-model orchestration
├── Modules (MAE-orchestrated modules):
│   └── Chronometric - Time reconstruction and billable time management
└── Workflows (MAE workflow definitions)
```

**Key Distinctions:**
- **Tools** (like AI Orchestrator) = MCP-callable, extend `BaseTool`, can be registered in MAE's tool registry
- **Services** (like Multi-Model Service) = Utility classes, provide functionality but don't compose tools or extend `BaseModule`
- **Modules** (like Chronometric) = Domain-specific components that compose tools, resources, and prompts (extend `BaseModule`)

## Tools

### AI Orchestrator

**Location:** `engines/mae/tools/ai-orchestrator.ts`

Generic multi-provider orchestration tool supporting:
- Sequential execution
- Parallel execution
- Collaborative execution (analysis → verification → synthesis)

**Usage in Workflows:**
```typescript
{
  type: 'tool',
  target: 'ai_orchestrator',
  input: {
    task_description: 'Analyze legal document',
    ai_providers: ['perplexity', 'openai'],
    orchestration_mode: 'collaborative'
  }
}
```

## Services

### Multi-Model Service

**Location:** `engines/mae/services/multi-model-service.ts`

Role-based parallel multi-model verification with weighted confidence scoring. Supports:
- Fact-checking
- Trust chain analysis
- Socratic reasoning
- Verification modes: simple, standard, comprehensive, custom

**Access:**
```typescript
import { maeEngine } from './mae-engine.js';

const multiModelService = maeEngine.getMultiModelService();
const result = await multiModelService.executeVerification({
  mode: 'comprehensive',
  providerStrategy: 'mixed',
  claim: 'Claim to verify',
  // ... other config
});
```

## Modules

This engine orchestrates the following modules:
- **Chronometric**: Time reconstruction and billable time management

## Workflows

MAE provides numerous pre-configured workflows including:
- `time_reconstruction` - Complete workflow for reconstructing billable time
- `motion_response` - End-to-end orchestration for responding to served motions
- `document_comparison` - Compare documents with multi-model verification
- `contract_analysis` - Deep contract analysis with risk assessment
- `legal_research` - Comprehensive legal research with multi-model fact verification
- And many more...

## Usage

### Execute Workflow

```typescript
import { maeEngine } from './mae-engine.js';

const result = await maeEngine.execute({
  action: 'execute_workflow',
  workflow_id: 'motion_response',
  input: {
    case_id: 'case-123',
    motion_content: '...'
  }
});
```

### List Workflows

```typescript
const result = await maeEngine.execute({
  action: 'list_workflows'
});
```

### Access Services

```typescript
// Get Multi-Model Service
const multiModelService = maeEngine.getMultiModelService();

// Use in custom logic
const verificationResult = await multiModelService.executeVerification({
  mode: 'comprehensive',
  providerStrategy: 'single',
  claim: 'Claim to verify'
});
```

## Configuration

MAE is configured with:
- **Modules:** Chronometric
- **Tools:** AI Orchestrator
- **AI Providers:** OpenAI, Anthropic, Google, Perplexity, xAI, DeepSeek
