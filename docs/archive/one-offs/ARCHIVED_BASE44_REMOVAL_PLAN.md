---
Document ID: ARCHIVED-BASE44_REMOVAL_PLAN
Title: Base44 Removal Plan
Subject(s): Archived | Limited Utility | Experimental | Old Version
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current utility (experimental/Labs code, old version, duplicate, etc.)
Status: Archived
---

**ARCHIVED:** This document relates to experimental/Labs code, old versions, or duplicates and has limited current utility. Archived 2025-11-28.

---

# Base44 Removal Plan
**Date:** 2025-11-26

## Base44 Dependencies to Remove

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


