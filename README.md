# Codebase - Cyrano Ecosystem Monorepo

**Repository:** [MightyPrytanis/codebase](https://github.com/MightyPrytanis/codebase)  
**Last Updated:** 2025-12-17  
**Status:** Active Development

## Overview

This monorepo consolidates all components of the Cyrano ecosystem, previously maintained as separate repositories:
- LexFiat - Legal workflow intelligence platform
- Cyrano - MCP server and AI orchestration engine
- Arkiver - Universal data extraction system
- Labs - Experimental projects (Potemkin, infinite-helix, etc.)

## Repository Structure

```
codebase/
├── Cyrano/              # MCP server, engines, modules, tools
├── LexFiat/            # Legal workflow platform (client + backend)
├── apps/
│   └── arkiver/        # Arkiver frontend application
├── docs/                # Active documentation
├── Labs/                # Experimental projects
└── Legacy/              # Archived projects (SwimMeet, Cosmos, etc.)
    └── Note: Legacy/ is excluded from main branch, preserved in archive/2024-10-10-snapshot
```

## Branches

- **main** - Current active development (clean, production-ready code)
- **archive/2024-10-10-snapshot** - Preserves October 10, 2024 state with all legacy items

## Excluded from Repository

The following are intentionally excluded from git (see `.gitignore`):
- `IP/` - Intellectual property documents (kept secret)
- `.env` files - Environment variables and API keys
- `Legacy/` - Archived legacy code (preserved in archive branch)
- `Document Archive/` - Historical documentation (preserved in archive branch)
- `node_modules/` - Dependencies
- Build artifacts (`dist/`, `build/`)

## Active Projects

### Cyrano
MCP-compliant AI orchestration server with modular architecture:
- **Engines:** GoodCounsel, MAE, Potemkin
- **Modules:** Arkiver, Chronometric, RAG
- **Tools:** 69 MCP tools for legal workflow automation

### LexFiat
Legal intelligence platform with adaptive workflow engine:
- Dashboard with glass-morphism UI
- Workflow pipeline (Intake → Analysis → Draft → Review)
- GoodCounsel ethics and wellness guidance
- Integration with Clio, Gmail, Calendar

### Arkiver
Universal data extraction system:
- Document extractors (PDF, DOCX, conversations)
- Processors (text, email, entity, timeline, insight)
- MCP integration for Cyrano ecosystem

## Documentation

Active documentation is in `docs/`:
- Architecture guides
- API documentation
- UI specifications
- Deployment checklists
- Security policies

See `docs/ACTIVE_DOCUMENTATION_INDEX.md` for complete index.

## Development

### Setup
```bash
# Install dependencies for each project
cd Cyrano && npm install
cd ../LexFiat && npm install
cd ../apps/arkiver/frontend && npm install
```

### Environment Variables
Copy `.env.example` files and configure:
- API keys for AI providers
- Database connections
- Integration credentials

See individual project READMEs for specific setup instructions.

## Archive Branch

The `archive/2024-10-10-snapshot` branch contains:
- October 10, 2024 snapshot of the codebase
- All Legacy/ projects (SwimMeet, Cosmos, Arkiver legacy versions)
- Document Archive/ historical documentation
- Miscellaneous tools and experimental code

This branch is preserved for historical reference and is not actively developed.

## Contributing

This is a private repository. For access or questions, contact the repository owner.

## License

Copyright © 2025 Cognisint LLC  
Licensed under Apache License, Version 2.0
