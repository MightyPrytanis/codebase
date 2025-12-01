---
⚠️ ARCHIVED DOCUMENT - INACTIVE

This document has been archived as a one-off/historical record.
For current project status, see: docs/PROJECT_CHANGE_LOG.md
Archived: 2025-11-28
---

---
Document ID: CYRANO-DIFF-REPORT
Title: Cyrano Reconciliation Diff Report
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: 2025-11-24 (2025-W48)
Last Substantive Revision: 2025-11-24 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-11-24  
**Purpose:** Compare local Cyrano codebase with GitHub repository to identify differences and merge candidates

---

## Instructions

This template should be filled out after running git comparison commands. Use this to track which files need reconciliation between local and remote versions.

### Commands to Run

```bash
# Navigate to Cyrano directory
cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano

# Ensure we have latest remote
git fetch origin

# Get list of files only in GitHub (remote) - not in local
git ls-tree -r --name-only origin/main | while read file; do
  [ ! -f "$file" ] && echo "$file"
done > /tmp/github_only.txt

# Get list of files only in local - not in GitHub
git ls-files --others --exclude-standard > /tmp/local_only.txt

# Get list of modified files (different between local and remote)
git diff --name-only origin/main > /tmp/modified_files.txt

# Get detailed diffs for modified files
git diff origin/main > /tmp/full_diff.patch
```

---

## 1. Files Only in GitHub (Not in Local)

**Count:** [FILL IN]

### Categories

#### Source Code
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| [example: src/tools/new-tool.ts] | [what it does] | High/Med/Low | Merge/Review/Skip |
| | | | |

#### Configuration
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Documentation
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Tests
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Other
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

---

## 2. Files Only in Local (Not in GitHub)

**Count:** [FILL IN]

### Categories

#### Source Code
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| [example: src/modules/arkiver/processors/text-processor.ts] | [new processor] | High | Push to GitHub |
| | | | |

#### Configuration
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Documentation
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Tests
| File Path | Description | Priority | Action |
|-----------|-------------|----------|--------|
| | | | |

#### Generated/Build Artifacts (Should be ignored)
| File Path | Reason | Action |
|-----------|--------|--------|
| dist/ | Build output | Add to .gitignore |
| node_modules/ | Dependencies | Already ignored |
| *.log | Log files | Add to .gitignore |
| .DS_Store | macOS metadata | Add to .gitignore |

---

## 3. Modified Files (Different Between Local and GitHub)

**Count:** [FILL IN]

### Significant Changes

| File Path | Type of Change | Lines Changed | Priority | Merge Strategy |
|-----------|----------------|---------------|----------|----------------|
| [example: src/tools/citation-checker.ts] | Enhanced Michigan validator | +250/-50 | High | Review & merge |
| | | | | |

#### Details Template
For each significantly modified file:

**File:** `[path]`  
**Status:** Local changes / GitHub changes / Both changed (conflict)  
**Summary:** [Brief description of changes]  
**Recommendation:** [Merge local → GitHub / Pull GitHub → local / Manual merge needed]  
**Notes:** [Any concerns or dependencies]

---

## 4. Conflicts to Resolve

Files that have been modified in both local and GitHub versions (merge conflicts).

| File Path | Local Changes | GitHub Changes | Resolution Strategy |
|-----------|---------------|----------------|---------------------|
| [example: schema.ts] | Added Insight fields | Different field names | Combine both, rename for clarity |
| | | | |

---

## 5. Paths to Exclude from Diff

Files/directories that should be ignored during reconciliation:

### Build/Generated
- `dist/`
- `build/`
- `.next/`
- `out/`

### Dependencies
- `node_modules/`
- `package-lock.json` (conflicts resolved by reinstall)
- `yarn.lock`
- `pnpm-lock.yaml`

### IDE/System
- `.vscode/` (except settings to share)
- `.idea/`
- `.DS_Store`
- `Thumbs.db`

### Logs/Cache
- `*.log`
- `.cache/`
- `.temp/`
- `tmp/`

### Agent/Tool Outputs
- `.agent-*`
- `.copilot-*`

### Test Outputs
- `coverage/`
- `.nyc_output/`
- `test-results/`

### Environment
- `.env.local`
- `.env.*.local`

---

## 6. Merge Recommendations

### High Priority Merges

#### From GitHub → Local
1. **File:** `[path]`  
   **Reason:** [why this should be pulled]  
   **Impact:** [what it affects]  
   **Command:** `git checkout origin/main -- [path]`

#### From Local → GitHub
1. **File:** `[path]`  
   **Reason:** [why this should be pushed]  
   **Impact:** [what it affects]  
   **Command:** `git add [path] && git commit -m "[message]"`

### Medium Priority

[Same template as above]

### Low Priority / Optional

[Same template as above]

---

## 7. Semantic Analysis

### New Features in GitHub
- [Feature name]: [Description and files involved]

### New Features in Local
- Arkiver Processors: Complete set of 5 processors for data processing
- Michigan Citation Validator: Comprehensive citation validation system
- [Add others]

### Breaking Changes
- [Change description]: [Files affected, migration needed?]

### Deprecated/Removed
- **In GitHub:** [what was removed]
- **In Local:** [what was removed]

---

## 8. Reconciliation Strategy

### Phase 1: Non-Conflicting Merges
**Goal:** Merge files that exist only in one location

**Steps:**
1. Review local-only files
2. Push valuable local files to GitHub
3. Pull useful GitHub-only files to local
4. Update .gitignore for build artifacts

**Timeline:** [estimate]

### Phase 2: Simple Updates
**Goal:** Merge files with clear, non-conflicting changes

**Steps:**
1. Review modified files with changes in only one direction
2. Merge based on which version is newer/better
3. Test after each merge

**Timeline:** [estimate]

### Phase 3: Conflict Resolution
**Goal:** Manually merge files changed in both locations

**Steps:**
1. Identify true conflicts (incompatible changes)
2. Create merge branches for complex conflicts
3. Manual merge with testing
4. Review combined functionality

**Timeline:** [estimate]

### Phase 4: Validation
**Goal:** Ensure merged codebase works correctly

**Steps:**
1. Run full test suite
2. Check build process
3. Verify MCP server starts
4. Test key workflows
5. Update documentation

**Timeline:** [estimate]

---

## 9. Decision Matrix

For each file, use this decision tree:

```
File exists in...
├── GitHub only
│   ├── Is it useful? → YES → Pull to local
│   └── Is it useful? → NO → Document and skip
│
├── Local only
│   ├── Is it production-ready? → YES → Push to GitHub
│   ├── Is it experimental? → Maybe → Review and decide
│   └── Is it generated/temp? → NO → Add to .gitignore
│
└── Both (modified)
    ├── Changed in GitHub only → Pull GitHub version
    ├── Changed in local only → Push local version
    └── Changed in both → Manual merge required
```

---

## 10. Post-Reconciliation Checklist

After reconciliation is complete:

- [ ] All valuable local changes pushed to GitHub
- [ ] All valuable GitHub changes pulled to local
- [ ] Conflicts resolved and tested
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] MCP server starts (`npm run dev`)
- [ ] Documentation updated
- [ ] .gitignore updated to prevent future issues
- [ ] Commit history is clean
- [ ] README updated if needed
- [ ] Dependencies synced (`npm install`)

---

## Notes & Observations

### Canonical Source Decision
**Decision:** [Local / GitHub / Hybrid]  
**Rationale:** [Why this source is canonical]  
**Exceptions:** [Any files where different source is canonical]

### Branch Strategy
**Main Branch:** [origin/main]  
**Local Branch:** [current branch name]  
**Merge Target:** [where reconciled code will live]

### Backup Strategy
Before major reconciliation:
- [ ] Create backup branch: `git branch backup-pre-reconciliation`
- [ ] Create local backup: Copy entire directory to backup location
- [ ] Note current commit: `git rev-parse HEAD` → [commit hash]

---

## Appendix: Git Commands Reference

### Inspection
```bash
# View remote branches
git branch -r

# See what's different
git diff origin/main

# See what's different (names only)
git diff --name-only origin/main

# See commits in GitHub not in local
git log ..origin/main

# See commits in local not in GitHub
git log origin/main..
```

### Merging
```bash
# Pull specific file from GitHub
git checkout origin/main -- path/to/file

# Stage local file to push
git add path/to/file

# Merge GitHub changes
git merge origin/main

# Merge with strategy (keep ours/theirs)
git merge -X ours origin/main
git merge -X theirs origin/main
```

### Conflict Resolution
```bash
# Abort merge if needed
git merge --abort

# Use ours version for conflicts
git checkout --ours path/to/file

# Use theirs version for conflicts
git checkout --theirs path/to/file

# Mark conflict as resolved
git add path/to/file
```

---

**Completed By:** [Name]  
**Date Completed:** [Date]  
**Review Required:** [Yes/No]  
**Reviewer:** [Name]
