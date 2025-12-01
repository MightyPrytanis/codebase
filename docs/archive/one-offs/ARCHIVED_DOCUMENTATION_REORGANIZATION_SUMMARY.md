---
⚠️ ARCHIVED DOCUMENT - INACTIVE

This document has been archived as a one-off/historical record.
For current project status, see: docs/PROJECT_CHANGE_LOG.md
Archived: 2025-11-28
---

---
Document ID: DOC-REORG-SUMMARY
Title: Documentation Reorganization Summary
Subject(s): Documentation | Organization | Process
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Summary of documentation reorganization effort - all docs moved to docs/ library with standardized headers and versioning.
Status: Active
---

# Documentation Reorganization Summary

**Date:** 2025-11-28  
**Status:** ✅ Complete

## Overview

All documentation has been reorganized into a single `docs/` library with standardized headers, descriptive naming, and version numbering system.

## Results

- **Total Files Processed:** 171
- **Files Skipped (already processed):** 143
- **Errors:** 0
- **Files in docs/ library:** 153

## New Structure

```
docs/
├── architecture/    # Architecture documentation
├── api/             # API and integration docs
├── guides/          # How-to guides and instructions
├── reference/       # Reference materials and READMEs
├── status/          # Status reports and completion summaries
└── ui/              # UI specifications and design docs
```

## Standardized Header Format

All documents now include a YAML frontmatter header with:
- Document ID
- Title
- Subject(s)
- Project
- Version (YYW.SEMANTIC format)
- Created date with ISO week
- Last Substantive Revision date with ISO week
- Last Format Update date
- Owner/Copyright
- Status
- Related Documents (where applicable)

## Versioning System

**Format:** `vYYW` or `vYYW.MAJOR.MINOR`

- `YYW` = Year (last digit) + ISO Week (2 digits)
- Example: `v548` = 2025, Week 48
- Semantic versioning for revisions within same week:
  - `v548.1` = Major revision in same week
  - `v548.0.1` = Minor revision in same week
  - `v549` = Revision in new week

## Files Excluded from Processing

- Files in `Document Archive/` (pre-existing archives)
- Files in `node_modules/`
- Files in `.git/`
- Files already processed (with standardized headers)

## Next Steps

1. Review documents for accuracy
2. Update any incorrect information
3. Archive or retire outdated documents
4. Maintain version numbers on future revisions

---

**Process completed:** 2025-11-28

