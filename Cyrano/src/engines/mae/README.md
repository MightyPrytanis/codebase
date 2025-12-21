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
│   ├── Chronometric - Time reconstruction and billable time management
│   ├── ArkExtractor - Arkiver extraction tools and pipelines
│   ├── ArkProcessor - Arkiver text and email processing
│   ├── ArkAnalyst - Arkiver analysis and verification
│   ├── RagModule - RAG query and vector storage
│   ├── VerificationModule - Shared verification tools
│   └── LegalAnalysisModule - Legal document analysis tools
└── Workflows (MAE workflow definitions)
```

**Key Distinctions:**
- **Tools** (like AI Orchestrator) = MCP-callable, extend `BaseTool`, can be registered in MAE's tool registry
- **Services** (like Multi-Model Service) = Utility classes, provide functionality but don't compose tools or extend `BaseModule`
- **Modules** (like Chronometric) = Domain-specific components that compose tools, resources, and prompts (extend `BaseModule`)

## Tools

### AI Orchestrator

**Location:** `engines/mae/services/ai-orchestrator.ts` (moved from tools/ to services/)

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

### Common Tools

MAE engine also provides access to commonly used tools for workflows:
- `document_analyzer` - Document analysis and extraction
- `fact_checker` - Multi-model fact verification
- `workflow_manager` - Workflow creation and management
- `case_manager` - Case management operations
- `document_processor` - Document processing operations
- `document_drafter` - Legal document drafting
- `clio_integration` - Clio API integration
- `sync_manager` - Synchronization management

These tools are registered in MAE's tool registry and can be used directly in workflow steps.

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
- **ArkExtractor**: Arkiver extraction tools and pipelines (extractConversations, extractTextContent, categorizeWithKeywords, etc.)
- **ArkProcessor**: Arkiver text and email processing (arkiverTextProcessor, arkiverEmailProcessor)
- **ArkAnalyst**: Arkiver analysis and verification (arkiverEntityProcessor, arkiverInsightProcessor, arkiverTimelineProcessor, verification tools)
- **RagModule**: RAG query and vector storage (ragQuery tool, chunker and vector_store resources)
- **VerificationModule**: Shared verification tools (claimExtractor, citationChecker, sourceVerifier, consistencyChecker)
- **LegalAnalysisModule**: Legal document analysis tools (documentAnalyzer, contractComparator, legalReviewer, complianceChecker, qualityAssessor, redFlagFinder)

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

## Workflow Step Types

MAE workflows support the following step types:
- `module` - Execute a module action
- `tool` - Execute a tool (MAE tools or common tools)
- `ai` - Execute an AI provider call (with auto-select support)
- `condition` - Conditional branching
- `engine` - Call another engine (Potemkin, GoodCounsel, etc.)

**Example: Calling Another Engine**
```typescript
{
  id: 'potemkin_verification',
  type: 'engine',
  target: 'potemkin',
  input: {
    action: 'verify_document',
    content: '{{document_content}}'
  }
}
```

## Configuration

MAE is configured with:
- **Modules:** Chronometric, ArkExtractor, ArkProcessor, ArkAnalyst, RagModule, VerificationModule, LegalAnalysisModule
- **Tools:** AI Orchestrator, documentAnalyzer, factChecker, workflowManager, caseManager, documentProcessor, documentDrafter, clioIntegration, syncManager
- **AI Providers:** OpenAI, Anthropic, Google, Perplexity, xAI, DeepSeek (user-selectable via UI)
