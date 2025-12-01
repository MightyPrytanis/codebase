---
Document ID: README
Title: Potemkin Standalone App
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

Standalone React application for the Potemkin Verification and Integrity Engine.

## Overview

This is a scaffold for a future standalone deployment of the Potemkin engine. It provides a UI shell that allows users to:

- Upload documents for verification
- Enter URLs to verify web content
- Paste content directly for verification
- View verification results
- Monitor integrity metrics via dashboard
- Configure settings

## Architecture

The app is designed to communicate with the Potemkin engine via the Cyrano MCP server's HTTP bridge. It can be deployed independently while leveraging the engine's capabilities.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Integration

The app communicates with the Potemkin engine through:

1. **MCP HTTP Bridge**: Connects to Cyrano MCP server at `http://localhost:5002` (configurable)
2. **Potemkin Engine Tool**: Uses the `potemkin_engine` MCP tool for all operations

## Features

### Document Upload
- Upload PDF, DOC, DOCX, TXT, or MD files
- Enter URLs to verify web content
- Paste content directly

### Verification Results
- Display verification status
- Show confidence scores
- List detected issues
- Provide recommendations

### Integrity Dashboard
- Overall integrity metrics
- Documents verified count
- Issues detected
- Recent alerts

### Settings
- Configure MCP server URL
- Set auto-verify preferences
- Configure alert thresholds

## Future Development

This is a scaffold. Future development should include:

- Full MCP client implementation
- Real-time verification progress
- Advanced visualization of results
- Export capabilities
- User authentication
- History and saved verifications
- Batch processing
- API integration for programmatic access

## Notes

- This app is designed to work alongside the Potemkin engine in the Cyrano ecosystem
- It can also be integrated into LexFiat, Arkiver, and other Cyrano apps
- The standalone deployment allows Potemkin to be used independently for assessing documents, webpages, published papers, etc.

