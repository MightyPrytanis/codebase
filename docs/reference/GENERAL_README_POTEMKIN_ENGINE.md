---
Document ID: README
Title: Potemkin Engine
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

Verification and Integrity Engine

## Overview

**Potemkin** is the "truth and logic stickler" - a verification and integrity engine designed to help identify and correct AI-induced delusions, hallucinations, and logical inconsistencies. It was conceived as a way to help rescue users from AI-induced delusions and psychosis.

Potemkin provides comprehensive verification capabilities for AI-generated content, ensuring accuracy, truthfulness, and logical consistency.

## Key Features

- **Document Verification:** Verify facts, citations, and claims in documents
- **Bias Detection:** Identify bias in AI-generated content
- **Integrity Monitoring:** Continuous monitoring of AI output quality over time
- **Opinion Drift Testing:** Detect when AI opinions change over time
- **Honesty Assessment:** Evaluate truthfulness and accuracy of content

## Modules

This engine orchestrates the following modules:
- Currently uses direct tools and AI providers
- Future modules may include: claim extractor, citation checker, bias detector, integrity monitor

## Workflows

### 1. Document Verification (`verify_document`)
Verifies facts, citations, and claims in a document:
- Extract claims and assertions
- Verify factual claims against known sources
- Check citation accuracy
- Generate verification report with confidence scores

### 2. Bias Detection (`detect_bias`)
Detects bias in AI-generated content:
- Analyze content for potential bias indicators
- Check for bias patterns
- Generate bias detection report with recommendations

### 3. Integrity Monitoring (`monitor_integrity`)
Monitors AI output quality and integrity over time:
- Collect integrity metrics
- Analyze trends and identify anomalies
- Generate alerts for integrity issues

### 4. Opinion Drift Testing (`test_opinion_drift`)
Tests whether AI opinions have drifted over time:
- Retrieve historical opinions
- Compare current opinions with historical opinions
- Calculate drift metrics
- Generate opinion drift report

### 5. Honesty Assessment (`assess_honesty`)
Assesses truthfulness and accuracy of AI-generated content:
- Analyze content for truthfulness indicators
- Check consistency across claims
- Verify sources
- Generate honesty score and detailed assessment

## Usage

### Via MCP Tool

```typescript
// List available workflows
{
  "action": "list_workflows"
}

// Verify a document
{
  "action": "verify_document",
  "documentId": "doc123",
  "content": "Document content to verify"
}

// Detect bias
{
  "action": "detect_bias",
  "content": "Content to analyze for bias"
}

// Test opinion drift
{
  "action": "test_opinion_drift",
  "input": {}
}
```

### Direct Engine Usage

```typescript
import { potemkinEngine } from './potemkin-engine.js';

// Initialize engine
await potemkinEngine.initialize();

// Verify document
const result = await potemkinEngine.execute({
  action: 'verify_document',
  documentId: 'doc123',
  content: 'Document content...'
});

// Get available workflows
const workflows = await potemkinEngine.getWorkflows();
```

## Configuration

### AI Providers
- OpenAI (for general verification)
- Anthropic (for detailed analysis and assessment)

## Integration

- **Backend:** Integrated with Cyrano MCP server
- **Frontend/UI:** Can be used in LexFiat, Arkiver, and other apps
- **Standalone App:** Scaffold available in `Labs/Potemkin/app/` for future deployment

## Standalone App

A standalone app scaffold is available in `Labs/Potemkin/app/` that provides:
- Document upload interface
- Verification results display
- Integrity monitoring dashboard
- Settings/configuration UI

This allows Potemkin to be deployed as a standalone application for assessing uploaded documents, webpages, published papers, etc., in addition to being integrated into other Cyrano ecosystem apps.
