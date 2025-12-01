---
Document ID: CHRONOMETRIC
Title: Forensic Time Capture Module Refactoring
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

Refactor the Forensic Time Capture module for LexFiat, the legal workflow app, that was developed by Cursor and is resident in this PR. This module must strictly adhere to the modular architecture defined below.  Your revisions should address or obviate all the issues identified by Copilot and CodeRabbit in the original prototype developed by Cursor.  The codename for this module while in development is "Chronometric." This name may or may not persist into beta testing and production launch.

## Purpose
The module assists attorneys in retrospectively reconstructing lost or unentered billable time, helping them refresh their recollections and substantiate these with accessible digital evidence. It does not create new facts or make unsupported inferences—its role is to surface and organize documentary artifacts (direct and circumstantial) to support human judgment.

## Functional Requirements

### Modular Composition:

Build the module using small, API-driven tools (e.g., email fetch, document edit detection, calendar scraping).

House in Cyrano MCP; accessible to LexFiat and, via API, to engines like MAE or other apps (e.g., Arkiver).

### AI Model Interaction:

The module is driven by a single AI model or agent, responsible for orchestrating its constituent tools and producing time reconstruction recommendations.

### Workflow:

**Gap Identification:** Locate days or periods with missing or under-recorded time in conjunction with Clio or other time/billing software.

**Artifact Collection:** Gather direct evidence (sent documents, filed motions, emails) and circumstantial evidence (calendar, call logs, draft saves) via API tools. Some tools or processes developed for Arkiver, another app in the Cyrano ecosystem, may be relevant to this task, and vice-versa. Reuse and recombination of components already present in the Cyrano repository, including its various subdirectories is encouraged. 

**Recollection Support:** Organize this evidence in an interface that prompts the attorney’s memory, allowing them to confirm, interpolate, or adjust reconstructed entries—always under their control.

**Pre-fill:** Based on assembled evidence, user work patterns/workflow archaeology, past time allocation and billing, and professional norms, the module may, at the user's request, pre-populate gaps with entries to be reviewed, adjusted, and ultimately approved or rejected by the attorney.

**DupeCheck:** Smart review and alert to possible duplicate entries so clients aren't overbilled, recognizing that certain tasks (e.g. phone calls, research, etc.) may naturally be repeated or extended over more than one day.

**Transparency & Provenance:** Each recommended entry shows the underlying supporting evidence and clearly distinguishes between direct and circumstantial sources.

**User Review:** No entry is finalized without explicit user approval, override, or annotation.

### Security, Privacy, and Audit:

Respect user data privacy and provide full audit trails for all module actions.

Support permissions and data residency controls, especially when leveraging cloud-based agents or tools.

### Integration & Extensibility:

Ensure tools and outputs are fully reusable by higher-level engines or other modules in the MCP suite.  It must be future-proofed and adaptable to a variety of email, calendar, research, billing and practice management solutions, but Outlook, Westlaw, and Clio are the initial portfolio of partner apps/services.

### Design Documentation
Provide diagrams showing the flow:

Tools → Module (Chronometric) → Engine (e.g. MAE/GoodCounsel) or App (LexFiat) → Suite

Annotate which pieces are cloud-based API interactions and how user sovereignty, privacy, and ROI is maintained at each decision point.

***

# Cyrano Modular Architecture Overview

## Core Concept

This system is designed around a strict, layered modularity, maximizing composability, clear responsibilities, and auditability. Components follow an ascending hierarchy of scope and function:

### Hierarchy & Component Definitions

- **Tool:**  
  The most granular, atomic unit.  
  - Single-purpose, API-driven function (e.g., email log parser, calendar extractor, document metadata scanner).  
  - Stateless and reusable across modules.

- **Module:**  
  The main workhorse for most functions.  
  - Composed of one or more tools.  
  - Handles a discrete, domain-specific function or a closely related set of tasks.  
  - Typically operated by a single AI model or agent.  
  - Runs with minimal need for coordination with other modules.

- **Engine (Super-module):**  
  A higher-level orchestrator of workflow.  
  - Coordinates several modules and possibly multiple AI models or agents.  
  - Delivers mission-critical, core app logic (e.g., compliance, legal strategy, multi-stage automation).  
  - May enable sophisticated user direction or complex inter-module scenarios.
  - Examples in the Cyrano ecosystem include the MAE, GoodCounsel, and Potemkin.

- **App:**  
  User-facing application, presenting modules and engines with a cohesive interface (e.g., LexFiat).  
  - Connects modules/engines to user workflows and external integrations.

- **Suite:**  
  A group of related apps serving an operational domain.  
  - Shares underlying modules, engines, and tools for efficiency and consistency.
  - To address related or analagous functions, apps may use components (engines, modules or tools) that are similar to components found in other apps, but recombined or customized to suit a particular use case. 

### Design Principles

- **User sovereignty:** The user can direct which agents, models, or tools run their processes—or delegate to the platform’s engine for optimal routing.
- **Cloud/local hybrid orchestration:** Agents and modules can be hosted locally or accessed as cloud APIs.
- **Auditability and compliance:** Each component produces traceable, explainable, and evidentiary-backed results.  
- **Modularity and reusability:** All tools, modules, and engines are API-driven and designed for maximum recombination across apps and workflows.






***
