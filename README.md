# Codebase - Cyrano Ecosystem Monorepo

**Repository:** [MightyPrytanis/codebase](https://github.com/MightyPrytanis/codebase)  
**Last Updated:** 2025-12-29  
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
├── apps/                # User-facing applications
│   ├── lexfiat/        # Legal workflow platform (client + backend)
│   ├── arkiver/        # Arkiver frontend application (active)
│   └── forecaster/     # Forecaster frontend application
├── Cyrano/              # MCP Server
│   ├── src/
│   │   ├── engines/     # Engines (GoodCounsel, MAE, Potemkin, Forecast, Chronometric, Custodian - 6 engines)
│   │   ├── modules/    # Modules (11 modules: tax_forecast, child_support_forecast, qdro_forecast, time_reconstruction, cost_estimation, pattern_learning, ethical_ai, billing_reconciliation, ark_extractor, ark_processor, ark_analyst)
│   │   ├── tools/       # MCP Tools (60 tool files, 82 tools registered)
│   │   ├── services/   # Services (RAG, legal research, AI, etc.)
│   │   └── routes/      # API Routes
│   └── docs/            # Cyrano-specific docs
├── docs/                # Project-wide documentation
│   ├── guides/         # User guides
│   ├── reference/      # API reference, architecture
│   ├── security/       # Security docs
│   └── install/        # Installation/onboarding docs
├── Labs/                # Experimental/in-development features
│   ├── Potemkin/       # Potemkin experimental code
│   └── [other-experimental]/
└── Legacy/              # Archived, non-active code
    ├── old-codebase-artifacts/
    │   ├── arkivermj/  # Original Base44 Arkiver
    │   └── [other-archived]/
    └── [other-legacy]/
```

### Directory Structure Guide

**Where does X go?**

- **New App?** → `apps/[app-name]/`
- **New Engine?** → `Cyrano/src/engines/[engine-name]/`
- **New Module?** → `Cyrano/src/modules/[module-name]/`
- **New Tool?** → `Cyrano/src/tools/[tool-name].ts`
- **New Service?** → `Cyrano/src/services/[service-name].ts`
- **New Documentation?** → `docs/[category]/[doc-name].md` (update existing docs when possible)
- **Experimental Feature?** → `Labs/[feature-name]/`
- **Archived Code?** → `Legacy/[project-name]/`

## Directory Structure Audit (2025-12-17)

### Current Status

**Active Applications:**
- ✅ `apps/arkiver/` - Active Arkiver frontend (correct location)
- ✅ `apps/lexfiat/` - Legal workflow platform (correct location)
- ✅ `apps/forecaster/` - Forecaster frontend (correct location)

**MCP Server:**
- ✅ `Cyrano/` - MCP server (correct location)
- ✅ `Cyrano/src/engines/` - Engines (GoodCounsel, MAE, Potemkin, Forecast, Chronometric, Custodian - 6 engines)
- ✅ `Cyrano/src/modules/` - Modules (11 modules: tax_forecast, child_support_forecast, qdro_forecast, time_reconstruction, cost_estimation, pattern_learning, ethical_ai, billing_reconciliation, ark_extractor, ark_processor, ark_analyst)
- ✅ `Cyrano/src/tools/` - MCP Tools (60 tool files, 82 tools registered)

**Archived Code:**
- ✅ `Legacy/old-codebase-artifacts/arkivermj/` - Original Base44 Arkiver (archived)
- ✅ `Legacy/Arkiver/` - Python version Arkiver (archived)
- ✅ `Legacy/SwimMeet/` - SwimMeet project (archived)
- ✅ `Legacy/Cosmos/` - Cosmos project (archived)
- ✅ `Legacy/sparetools/` - Spare tools (archived)

**Experimental:**
- ✅ `Labs/Potemkin/` - Potemkin experimental code (correct)
- ✅ `Labs/infinite-helix/` - Experimental project (correct)
- ✅ `Labs/muskification-meter/` - Experimental project (correct)

**Other Directories:**
- ⚠️ `Miscellaneous/` - Contains duplicate UI components (should be archived)
- ⚠️ `Cosmos/` - At root level (should be in Legacy/ if not needed)
- ⚠️ `NewCodex/` - At root level (should be archived or removed)
- ✅ `IP/` - Intellectual property (excluded from git, correct)
- ✅ `Document Archive/` - Historical docs (excluded from git, correct)

### Issues Identified

1. ✅ **LexFiat Location:** Located at `apps/lexfiat/` for consistency with `apps/arkiver/`
2. **Miscellaneous Directory:** Contains duplicate UI components that should be archived
3. **Root-Level Directories:** `Cosmos/` and `NewCodex/` at root level need review/archival
4. **Legacy/ Exclusion:** Legacy/ should be excluded from code search tools to prevent confusion

### Recommendations

1. ✅ LexFiat located at `apps/lexfiat/` (COMPLETE - root directory removed)
2. Archive `Miscellaneous/` to `Legacy/` if not needed
3. Review and archive `Cosmos/` and `NewCodex/` if not needed
4. Update `.gitignore` and create `.cursorignore` to exclude `Legacy/` from searches
5. ✅ All references updated to `apps/lexfiat/` (COMPLETE)

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
- **Engines:** GoodCounsel, MAE, Potemkin, Forecast, Chronometric, Custodian (6 engines)
- **Modules:** 11 modules (tax_forecast, child_support_forecast, qdro_forecast, time_reconstruction, cost_estimation, pattern_learning, ethical_ai, billing_reconciliation, ark_extractor, ark_processor, ark_analyst)
- **Tools:** 60 tool files, 82 tools registered in HTTP bridge and MCP server

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
cd ../apps/lexfiat && npm install
cd ../apps/arkiver/frontend && npm install
```

### Environment Variables

**Important:** API keys are stored locally in `.env` files and **NOT** committed to the repository.

To configure:
1. Copy the example file: `cp Cyrano/.env.example Cyrano/.env`
2. Edit `Cyrano/.env` and add your API keys for:
   - **Perplexity** (default AI provider) - Get key at https://www.perplexity.ai/settings/api
   - **Anthropic Claude** - Get key at https://console.anthropic.com/
   - **OpenAI** - Get key at https://platform.openai.com/api-keys

Optional providers (Google, xAI, DeepSeek) can be added for extended functionality.

See individual project READMEs for complete setup instructions.

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
