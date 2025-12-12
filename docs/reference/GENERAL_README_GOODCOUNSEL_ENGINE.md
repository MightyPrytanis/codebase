---
Document ID: README
Title: GoodCounsel Engine
Subject(s): General
Project: Cyrano
Version: v549
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-12-12 (2025-W50)
Last Format Update: 2025-12-12 (2025-W50)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

Ethics and Wellness Engine

## Overview

**GoodCounsel** is an indispensable core component of LexFiat, dedicated to promoting attorney health, wellness, ethical decision-making, and holistic professional and personal growth. It is built on the foundational elements of Cognisint (formerly prototyped as "Annunciator"), a wellness-promoting module contained within the Cyrano MCP ecosystem.

GoodCounsel concerns itself with the "things that matter" while the rest of LexFiat handles the "things that must be done." This functionality differentiates LexFiat from virtually any other legal-focused app on the market today.

## Key Features

- **Wellness Support:** Automated, context-aware reminders and prompts addressing physical, mental, and social health
- **Ethics & Professional Growth:** Tools for tracking ethical obligations, personal development, and reflective practice
- **Workflow Awareness:** Integration with other LexFiat components to balance workflow and wellness
- **Crisis Support:** Pathways to help and advocacy with strict privacy controls

## Architecture

This engine uses the following components:

- **Tools:**
  - `client-recommendations` - Client relationship analysis and recommendations
  - `ethics-reviewer` - Ethics rules compliance checking and guidance
  - `wellness-journal` - Wellness journaling with HIPAA-compliant encryption (text and voice)

- **Services:**
  - `client-analyzer` - Analyzes client relationships and identifies opportunities
  - `ethics-rules-module` - Rule-based ethics compliance evaluation
  - `wellness-service` - Wellness journal management, feedback generation, burnout detection
  - `hume-service` - Voice emotion analysis via Hume Expression Measurement API
  - `burnout-detector` - Burnout risk analysis and recommendations
  - `wellness-recommendations` - Personalized wellness recommendations
  - `encryption-service` - AES-256-GCM encryption for sensitive wellness data
  - `hipaa-compliance` - Access logging, audit trails, data retention, secure deletion
  - `wellness-audio-storage` - Secure encrypted audio file storage

- **Workflows:** Multi-step orchestration for:
  - Wellness assessment and recommendations
  - Wellness journaling (text and voice with emotion analysis)
  - Burnout detection and alerts
  - Ethics review and compliance checking
  - Client relationship management
  - Crisis support pathways

## Workflows

### 1. Wellness Check (`wellness_check`)
Performs a comprehensive wellness assessment for an attorney, including:
- Workload and stress assessment
- Wellness metrics evaluation
- Personalized wellness recommendations

### 2. Wellness Journaling (`wellness_journal`)
HIPAA-compliant wellness journaling system with enterprise-grade encryption:
- **Text Journaling:** Create, read, update, and delete journal entries
- **Voice Journaling:** Record voice entries with Hume AI emotion analysis
- **AI Feedback:** Generate insights, patterns, and suggestions from journal entries
- **Trends Analysis:** Track wellness trends over time (weekly/monthly)
- **Burnout Detection:** Assess burnout risk based on patterns and workload
- **Wellness Recommendations:** Get personalized recommendations for physical, mental, social, and professional wellness
- **Security:** All data encrypted at rest (AES-256-GCM), access logging, audit trails, HIPAA-compliant retention

### 3. Ethics Review (`ethics_review`)
Reviews ethical obligations and compliance status:
- Ethics rules compliance checking
- Compliance assessment
- Ethics guidance generation

### 4. Client Relationship Recommendations (`client_recommendations`)
Generates recommendations for client relationship management:
- Client relationship analysis
- Follow-up opportunity identification
- Actionable recommendations

### 5. Crisis Support (`crisis_support`)
Provides pathways to help and advocacy in crisis situations:
- Situation assessment
- Resource identification
- Stepwise support pathway generation

## Usage

### Via MCP Tool

```typescript
// List available workflows
{
  "action": "list_workflows"
}

// Execute wellness check
{
  "action": "wellness_check",
  "userId": "user123",
  "input": {}
}

// Execute specific workflow
{
  "action": "execute_workflow",
  "workflow_id": "wellness_check",
  "input": {
    "userId": "user123"
  }
}
```

### Direct Engine Usage

```typescript
import { goodcounselEngine } from './goodcounsel-engine.js';

// Initialize engine
await goodcounselEngine.initialize();

// Execute wellness check
const result = await goodcounselEngine.execute({
  action: 'wellness_check',
  userId: 'user123',
  input: {}
});

// Get available workflows
const workflows = await goodcounselEngine.getWorkflows();
```

## Configuration

### AI Providers
- OpenAI (for general recommendations)
- Anthropic (for ethics and wellness guidance)

### Privacy & Confidentiality
- All user disclosures are strictly private by default
- No sharing with employers, supervisors, or licensing authorities
- Mandatory disclosures only when required to prevent harm

## Integration

- **Backend:** Leverages Cyrano MCP's automation, notification, and scheduling tools
- **Frontend/UI:** Integrated with LexFiat UI, includes adaptable widget for dashboard

## Ethical Principles

GoodCounsel is governed by the principles in LexFiat's `ETHICS.md`, prioritizing:
- User privacy
- Autonomy
- Transparency
- Sustainable professional development