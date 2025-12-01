
# Cyrano MCP Modular Architecture Overview

This document is intended as a canonical project standard and development guide for future modules and engines in the Cyrano platform family. All future work should conform to these definitions and design conventions.

## Core Concept

Cyrano operates as a sever using the Model Context Protocol (MCP).  This system is designed around a strict, layered modularity, maximizing composability, clear responsibilities, and auditability. Components follow an ascending hierarchy of scope and function:

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


