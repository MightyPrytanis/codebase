---
Document ID: OLD-README-ARCHIVED-2025-11-26
Title: Projects Workspace Overview
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-29 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

This directory (`/Users/davidtowne/Projects`) serves as the top-level workspace for several interrelated projects focused on automation, legal workflows, and archival tools. The key projects are Cyrano (MCP server), LexFiat (legal workflow app), and Arkiver (archival application). These are designed to integrate and support each other, with Cyrano providing the core backend functionality. Other subdirectories, such as Cosmos (an unrelated MCP experiment) and newcodex (a side project for CYBERTRONIA Transformers fanfiction), can be ignored for now.

## Project Descriptions

- **Cyrano**: This is the MCP (Model Context Protocol) server, acting as a central interface for executing automation commands, scripts, and workflows across systems. It enables control, data retrieval, and integration with external tools and APIs, serving as the backend engine for connected applications.

- **LexFiat**: A legal workflow automation app designed for small legal practices. It supports tasks like scheduling, document drafting, research, citation checking, calendaring, and a unified UI with multi-model AI orchestration. The app is in an advanced alpha or pre-beta phase. **LexFiat is a thin client** - it has no backend server and uses Cyrano MCP server for all backend operations.

- **Arkiver**: A comprehensive document processing and AI integrity monitoring application. It provides file upload, extraction, processing, and AI integrity testing capabilities through an MCP-compliant interface. **Arkiver is a thin client** - it has no backend server and uses Cyrano MCP server for all backend operations. The application is in an advanced development phase with a fully functional UI (95% complete as of 2025-11-29) and comprehensive backend processing modules. Key features include multi-format file extraction (PDF, DOCX, text, email), intelligent processing pipelines (text, entities, insights, timeline, citations), AI integrity testing and monitoring, and customizable dashboards.

## Relationships Between Projects

- **Cyrano as Backend**: Cyrano's MCP server provides the foundational automation and scripting capabilities upon which both LexFiat and Arkiver rely. It exposes endpoints and modules for tasks like document generation, external app communication, and system control.

- **LexFiat Integration**: LexFiat acts as a client to Cyrano, using its modules for backend operations, including workflow processing, ethical reminders (GoodCounsel), and API integrations. This client-server model allows LexFiat to automate legal processes efficiently without duplicating backend logic.

- **Arkiver Integration**: Arkiver acts as a client to Cyrano, using its modules for backend operations, including document extraction, processing pipelines, AI integrity monitoring, and insight generation. This client-server model allows Arkiver to process and analyze documents efficiently without duplicating backend logic, following the same thin-client architecture pattern as LexFiat.

## Directory Structure

- `/Cyrano`: MCP server code and automation modules.
- `/LexFiat`: Legal app frontend (thin client, no backend - uses Cyrano MCP server).
- `/apps/arkiver/frontend`: Arkiver frontend application (thin client, no backend - uses Cyrano MCP server). Backend processing modules are in `/Cyrano/src/modules/arkiver/`.
- `/Cosmos`: Ignore; standalone MCP experiment.
- `/newcodex`: Ignore; fanfiction side project.

## Cyrano Laboratory (Experimental Section)

Cyrano Laboratory is the "research wing" or sandbox within the Cyrano ecosystem. It groups experimental and conceptual modules and tools that are under active development or testing. This section provides a space dedicated to innovation alongside the stable, core projects.

### Cyrano Laboratory: Potemkin Module

Potemkin is a specialized verification module within the Cyrano MCP server designed to aggressively fact-check AI-generated code claims against actual code behavior. Its primary purpose is to debunk delusions, hallucinations, and exaggerated hype about AI and software capabilities by parsing claims, running sandboxed execution and symbolic analysis, and generating evidence-based reports.

#### Integration

- Potemkin resides in the `/potemkin` directory of the Cyrano MCP server repository.
- It exposes APIs (e.g., `/potemkin/verify`) for clients like LexFiat to submit code and claims for verification.
- Potemkin leverages Cyrano's existing tools for API orchestration, GitHub integrations, multi-model evaluation, and secure sandboxed testing.
- Designed to operate server-side, Potemkin ensures secure and scalable verification workflows.

Potemkin aims to enhance reliability and trust in AI-assisted development by providing transparent, verifiable debunking of software claims.  This module is an outgrowth of the Cyrano ecosystem's core value of developing technology that prioritizes truth and factual accuracy, user sovereignty and privacy, transparency, portability, value, and sustainability. 

## Setup and Usage Notes

- Ensure Cyrano MCP is running to enable features in LexFiat and Arkiver.
- Each project is tracked in its own GitHub repo for version control.
- For detailed instructions, refer to individual README files in each subdirectory.



