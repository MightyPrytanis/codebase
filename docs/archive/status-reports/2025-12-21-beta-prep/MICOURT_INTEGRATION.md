# MiCourt Integration Guide

**Date:** 2025-12-21  
**Status:** ✅ Structure Ready  
**Type:** Light footprint, user-initiated queries only

---

## Overview

MiCourt integration provides **user-initiated docket queries** from within LexFiat. This is a **light footprint integration** with **NO automated scraping or routine wide-net updates**.

**Important:** This replaces the previous MiFile integration plan, which is no longer feasible.

---

## Architecture

### Service: `Cyrano/src/services/micourt-service.ts`
- Light-weight service for on-demand case lookups
- All queries are explicit user actions
- No background automation or scheduled updates

### Tool: `Cyrano/src/tools/micourt-query.ts`
- MCP-compliant tool for LexFiat integration
- Registered in both HTTP bridge and MCP server
- Provides `query_case` and `search_cases` actions

---

## Usage

### From LexFiat UI

Users can initiate docket queries through:
1. Case lookup interface
2. Matter management tools
3. Research workflows

### Tool Actions

#### 1. Query Case by Number
```typescript
{
  action: 'query_case',
  caseNumber: '2024-CV-12345'
}
```

#### 2. Search Cases
```typescript
{
  action: 'search_cases',
  partyName: 'Smith',
  court: 'Wayne County Circuit Court',
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
}
```

---

## Implementation Status

### ✅ Completed
- Service structure created (`micourt-service.ts`)
- Tool created (`micourt-query.ts`)
- Registered in HTTP bridge
- Registered in MCP server
- Removed MiFile references from sync manager

### ⏳ Pending
- Actual MiCourt API/interface integration
  - Depends on Michigan Court system interface
  - May require:
    - Public API (if available)
    - Web scraping (with proper rate limiting and user consent)
    - Official integration (if Michigan provides one)

---

## Differences from MiFile

| Feature | MiFile (Removed) | MiCourt (New) |
|---------|------------------|---------------|
| **Type** | Automated e-filing system | Public docket lookup |
| **Automation** | Automated scraping/sync | User-initiated only |
| **Footprint** | Heavy (full integration) | Light (query only) |
| **Updates** | Routine wide-net updates | On-demand queries |
| **Use Case** | Electronic filing | Case information lookup |

---

## Removed MiFile References

The following have been updated to remove MiFile:
- ✅ `sync-manager.ts` - Removed from sync services
- ✅ `library.ts` routes - Commented out MiFile schema
- ✅ `schema-library.ts` - Commented out MiFile fields
- ✅ `library-model.ts` - Commented out MiFile fields
- ✅ Old `mifile-service.ts` - Can be archived (speculative implementation)

---

## Next Steps

1. **Research MiCourt Interface:**
   - Determine if public API exists
   - Identify web interface structure
   - Check for official integration options

2. **Implement Query Logic:**
   - Based on actual MiCourt interface
   - Ensure proper rate limiting
   - Add user consent for any scraping

3. **Test Integration:**
   - Test case number queries
   - Test party name searches
   - Verify error handling

---

## Environment Variables

Currently no environment variables needed (public system). If authentication becomes required:

```bash
MICOURT_API_KEY=...  # If API key required
MICOURT_BASE_URL=... # If different from default
```

---

## Notes

- **No Automation:** This integration explicitly does NOT support automated scraping or routine updates
- **User-Initiated Only:** All queries must be explicit user actions
- **Light Footprint:** Minimal code, minimal dependencies, minimal maintenance
- **Public System:** MiCourt is a public lookup system, not a private API

---

**Last Updated:** 2025-12-21
