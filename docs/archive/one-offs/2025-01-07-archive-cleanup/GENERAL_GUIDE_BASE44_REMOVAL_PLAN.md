---
Document ID: BASE44-REMOVAL-PLAN
Title: Base44 Removal Plan
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

1. **@/api/base44Client** - Replace with Cyrano MCP client
2. **base44.entities.*** - Replace with direct database calls or MCP tools
3. **base44.auth.*** - Replace with custom auth or Cyrano auth
4. **base44.integrations.Core.*** - Replace with Cyrano MCP tools
5. **Automatic Routing** - Replace with react-router-dom
6. **File Storage** - Replace with local storage or Cyrano file handling

## Migration Strategy

1. Create MCP client wrapper for Cyrano
2. Replace all base44.entities calls with MCP tool calls
3. Replace base44.auth with custom auth system
4. Replace base44.integrations with Cyrano AI service
5. Implement standard React routing
6. Replace file upload with HTTP endpoint

## Status

- ⏳ Frontend code copied to `apps/arkiver/frontend/`
- ⏳ Base44 removal in progress
- ⏳ MCP client integration needed


