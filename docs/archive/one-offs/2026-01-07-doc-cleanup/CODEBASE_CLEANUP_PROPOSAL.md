# Codebase Cleanup Proposal

**Date:** 2025-01-07  
**Purpose:** Identify and propose archival locations for non-relevant files and directories  
**Status:** PROPOSAL - Awaiting Approval

## Executive Summary

This proposal identifies files and directories that are not relevant to:
1. Operative code or dependencies required to run the Cyrano MCP server or any apps, engines, modules, tools, layers, or wrappers needed for beta or general release
2. Development, testing, deployment, and official launch
3. User-facing documentation, onboarding, help, or other important user information

**Goal:** Create a lean, clean codebase with only useful files and directories.

---

## Proposed Archive Locations

### Primary Archive Location
- **`Legacy/archive/`** - For archived code, scripts, and non-production files
- **`docs/archive/one-offs/`** - For archived documentation and summaries (already exists)

---

## Category 1: Root-Level Temporary/Old Files

### Files to Archive → `Legacy/archive/scripts-and-tools/`

| File | Reason | Action |
|------|--------|--------|
| `.archive_one_offs.sh` | Archive script (already executed, no longer needed) | Move to `Legacy/archive/scripts-and-tools/` |
| `.batch_doc_processor.py` | Temporary doc processor script | Move to `Legacy/archive/scripts-and-tools/` |
| `.temp_doc_processor.py` | Temporary doc processor script | Move to `Legacy/archive/scripts-and-tools/` |
| `.temp_version_helper.py` | Temporary version helper script | Move to `Legacy/archive/scripts-and-tools/` |
| `test-api.js` | Test script (not needed for production) | Move to `Legacy/archive/scripts-and-tools/` |

### Files to Archive → `docs/archive/one-offs/`

| File | Reason | Action |
|------|--------|--------|
| `DEMO_SETUP_SUMMARY.md` | Temporary demo setup documentation | Move to `docs/archive/one-offs/2025-01-07-cleanup/` |
| `WORKFLOW_CHANGES_SUMMARY.md` | Historical workflow changes summary | Move to `docs/archive/one-offs/2025-01-07-cleanup/` |

### Files to Delete (Not Needed)

| File | Reason | Action |
|------|--------|--------|
| `pmd.xml` | PMD config for Java (this is a TypeScript/React project) | Delete (PMD is disabled in `.codacy.yml`) |
| `Projects.code-workspace` | VS Code workspace file (developer tool, not needed for production) | Delete (personal IDE configuration) |

---

## Category 2: Directories to Archive

### `Miscellaneous/` → `Legacy/archive/miscellaneous/`

**Reason:** Contains duplicate UI components that are not used in production apps. Confirmed in README.md as "should be archived."

**Contents:**
- Duplicate UI components (accordion, alert-dialog, button, card, etc.)
- Duplicate client/ directory
- Duplicate components/ directory
- Duplicate dashboard/ directory
- Duplicate src/ directory structure

**Action:** Move entire `Miscellaneous/` directory to `Legacy/archive/miscellaneous/`

**Note:** If any components from `Miscellaneous/` are actually used, they should be moved to the appropriate app directory (`apps/lexfiat/` or `apps/arkiver/`) before archiving.

---

## Category 3: Build Artifacts and Old Test Files

### Files to Delete

| File | Reason | Action |
|------|--------|--------|
| `apps/arkiver/frontend/vite.config.ts.timestamp-1767035654940-4854c91e6dbd98.mjs` | Timestamped build artifact (Vite cache) | Delete |
| `Cyrano/tests/tools/arkiver-integrity-test.test.ts.old` | Old test file (backup) | Delete |

### Already Archived (No Action Needed)

| Location | Status |
|----------|--------|
| `Cyrano/archive/` | Already properly archived broken tools |
| `Legacy/` | Already exists and excluded from git |

---

## Category 4: Experimental Code (Keep but Document)

### `Labs/` Directory

**Status:** KEEP (but review contents)

**Reason:** According to README.md, `Labs/` is the correct location for experimental features. However, contents should be reviewed to ensure they're truly experimental and not needed for beta.

**Current Contents:**
- `Labs/Potemkin/` - Potemkin experimental code
- `Labs/infinite-helix/` - Experimental project
- `Labs/muskification-meter/` - Experimental project (not found in current scan)

**Action:** Review each project in `Labs/` to confirm it's experimental and not needed for beta release. If any are needed for beta, move to appropriate location.

---

## Category 5: Documentation Already Archived

### `docs/archive/` Directory

**Status:** Already properly archived

**Contents:**
- `docs/archive/one-offs/` - 304+ archived documents
- `docs/archive/status-reports/` - Historical status reports
- `docs/archive/priorities-1-7-completion/` - Priority completion reports

**Action:** No action needed - already properly organized.

---

## Summary of Proposed Actions

### Files to Move to `Legacy/archive/scripts-and-tools/` (5 files)
1. `.archive_one_offs.sh`
2. `.batch_doc_processor.py`
3. `.temp_doc_processor.py`
4. `.temp_version_helper.py`
5. `test-api.js`

### Files to Move to `docs/archive/one-offs/2025-01-07-cleanup/` (2 files)
1. `DEMO_SETUP_SUMMARY.md`
2. `WORKFLOW_CHANGES_SUMMARY.md`

### Files to Delete (2 files)
1. `pmd.xml`
2. `Projects.code-workspace`

### Directories to Move to `Legacy/archive/` (1 directory)
1. `Miscellaneous/` → `Legacy/archive/miscellaneous/`

### Build Artifacts to Delete (2 files)
1. `apps/arkiver/frontend/vite.config.ts.timestamp-1767035654940-4854c91e6dbd98.mjs`
2. `Cyrano/tests/tools/arkiver-integrity-test.test.ts.old`

### Directories to Review (1 directory)
1. `Labs/` - Review contents to confirm all are experimental

---

## Impact Analysis

### No Impact (Safe to Archive/Delete)
- ✅ Temporary scripts (`.temp_*.py`, `.archive_one_offs.sh`)
- ✅ Test scripts (`test-api.js`)
- ✅ Build artifacts (`.timestamp-*.mjs`, `.old` files)
- ✅ Developer tools (`Projects.code-workspace`, `pmd.xml`)
- ✅ Historical documentation (`DEMO_SETUP_SUMMARY.md`, `WORKFLOW_CHANGES_SUMMARY.md`)

### Low Impact (Verify Before Archiving)
- ⚠️ `Miscellaneous/` - Verify no components are actually used before archiving
- ⚠️ `Labs/` - Review to ensure nothing needed for beta

### Already Excluded from Git
- ✅ `Legacy/` - Already excluded (see `.gitignore`)
- ✅ `IP/` - Already excluded (see `.gitignore`)
- ✅ `Document Archive/` - Already excluded (see `.gitignore`)

---

## Execution Plan

### Phase 1: Verification (Before Archiving)
1. **Verify `Miscellaneous/` is not used:**
   - Search codebase for imports from `Miscellaneous/`
   - Check if any components are referenced in active apps
   - If used, move needed components to appropriate app directories first

2. **Review `Labs/` contents:**
   - Review each project in `Labs/`
   - Confirm all are experimental and not needed for beta
   - Document any that might be needed later

### Phase 2: Archive Temporary Files
1. Create `Legacy/archive/scripts-and-tools/` directory
2. Move temporary scripts to archive location
3. Create `docs/archive/one-offs/2025-01-07-cleanup/` directory
4. Move historical documentation to archive location

### Phase 3: Archive Miscellaneous Directory
1. Verify no components are used (from Phase 1)
2. Move `Miscellaneous/` to `Legacy/archive/miscellaneous/`
3. Update any references in documentation

### Phase 4: Delete Unnecessary Files
1. Delete `pmd.xml`
2. Delete `Projects.code-workspace`
3. Delete build artifacts (`.timestamp-*.mjs`, `.old` files)

### Phase 5: Update Documentation
1. Update `README.md` to reflect cleanup
2. Update `.cursorignore` if needed to exclude archived directories
3. Document cleanup in `PROJECT_CHANGE_LOG.md`

---

## Files to Keep (Not Affected)

### Active Code
- ✅ `Cyrano/` - MCP server (keep)
- ✅ `apps/lexfiat/` - LexFiat application (keep)
- ✅ `apps/arkiver/` - Arkiver application (keep)
- ✅ `apps/forecaster/` - Forecaster application (keep)

### Active Documentation
- ✅ `docs/guides/` - User guides (keep)
- ✅ `docs/reference/` - API reference (keep)
- ✅ `docs/security/` - Security documentation (keep)
- ✅ `docs/architecture/` - Architecture documentation (keep)
- ✅ `docs/install/` - Installation/onboarding (keep)

### Configuration Files
- ✅ `.gitignore` - Git configuration (keep)
- ✅ `.cursorignore` - Cursor configuration (keep)
- ✅ `.github/` - GitHub workflows (keep)
- ✅ `.codacy.yml` - Codacy configuration (keep)
- ✅ `.snyk` - Snyk configuration (keep)
- ✅ `package.json` files - Dependencies (keep)

### Scripts Needed for Development/Deployment
- ✅ `setup-database.sh` - Database setup (keep)
- ✅ `start-demo.sh` - Demo startup (keep)
- ✅ `scripts/git-clean-lock.sh` - Git helper (keep)

---

## Risk Assessment

### Low Risk
- ✅ Temporary scripts - No dependencies
- ✅ Test scripts - Not used in production
- ✅ Build artifacts - Generated files
- ✅ Historical documentation - Already superseded

### Medium Risk (Requires Verification)
- ⚠️ `Miscellaneous/` - May contain components used elsewhere (verify first)
- ⚠️ `Labs/` - May contain code needed for beta (review first)

### No Risk
- ✅ Already archived files - No impact
- ✅ Files excluded from git - Already not in repository

---

## Approval Required

**Before executing this cleanup plan, please:**
1. ✅ Review the proposed actions
2. ✅ Verify `Miscellaneous/` is not used (Phase 1)
3. ✅ Review `Labs/` contents (Phase 1)
4. ✅ Approve or modify the proposal
5. ✅ Execute phases in order

---

**Proposed by:** Codebase Housekeeper Agent  
**Date:** 2025-01-07  
**Status:** Awaiting Approval
