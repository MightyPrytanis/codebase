# Projects Workspace Overview

This directory (`/Users/davidtowne/Projects`) serves as the top-level workspace for several interrelated projects focused on automation, legal workflows, and archival tools. The key projects are Cyrano (MCP server), LexFiat (legal workflow app), and Arkiver (archival application). These are designed to integrate and support each other, with Cyrano providing the core backend functionality. Other subdirectories, such as Cosmos (an unrelated MCP experiment) and newcodex (a side project for CYBERTRONIA Transformers fanfiction), can be ignored for now.

## Project Descriptions

- **Cyrano**: This is the MCP (Model Context Protocol) server, acting as a central interface for executing automation commands, scripts, and workflows across systems. It enables control, data retrieval, and integration with external tools and APIs, serving as the backend engine for connected applications.

- **LexFiat**: A legal workflow automation app designed for small legal practices. It supports tasks like scheduling, document drafting, research, citation checking, calendaring, and a unified UI with multi-model AI orchestration. The app is in an advanced alpha or pre-beta phase, featuring extensive frontend components, dashboard implementations, and partial backend elements (some of which may be unnecessary and subject to removal, as LexFiat is primarily a client for Cyrano MCP).

- **Arkiver**: An application planned for archival, record management, and data workflows. It is intended to leverage MCP tools for automation and integration, though it remains in a conceptual or early stage.

## Relationships Between Projects

- **Cyrano as Backend**: Cyrano's MCP server provides the foundational automation and scripting capabilities upon which both LexFiat and Arkiver rely. It exposes endpoints and modules for tasks like document generation, external app communication, and system control.

- **LexFiat Integration**: LexFiat acts as a client to Cyrano, using its modules for backend operations, including workflow processing, ethical reminders (GoodCounsel), and API integrations. This client-server model allows LexFiat to automate legal processes efficiently without duplicating backend logic.

- **Arkiver Integration**: Arkiver is designed to interface with Cyrano's MCP tools for data archiving and management workflows, building on the same automation framework as LexFiat.

## Directory Structure

- `/Cyrano`: MCP server code and automation modules.
- `/LexFiat`: Legal app frontend, backend, and workflow components (note: server elements may be redundant and subject to removal).
- `/Arkiver`: Archival app (future development focus).
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



