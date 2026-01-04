# GitHub Actions Workflow Changes Summary

**Date:** 2025-01-04  
**Purpose:** Fix CI/CD and Codacy workflows; narrow scans to active directories and add local git-lock cleanup helper

## Problem Statement

Multiple GitHub Actions workflows were failing repeatedly for routine dependency bump PRs and pushes, creating noise and blocking CI signal. The repository is a monorepo with active directories (Cyrano, Labs/Potemkin, apps/lexfiat, apps/arkiver, docs) and workflows were scanning irrelevant files on dependency-bump PRs.

## Goals Achieved

1. ✅ Reduced noise by limiting workflow runs to relevant directory changes only
2. ✅ Fixed workflow configurations to scan only active subprojects
3. ✅ Made CI jobs more robust with correct configurations
4. ✅ Provided local helper script to remove stale git lock files
5. ✅ Left Snyk configuration untouched as requested

## Active Directories (Path Filters)

All modified workflows now run only when changes occur in these directories:
- `Cyrano/**` - MCP server and engines
- `Labs/Potemkin/**` - Experimental Potemkin project
- `apps/lexfiat/**` - LexFiat application
- `apps/arkiver/**` - Arkiver application
- `docs/**` - Documentation
- Plus workflow files themselves (`.github/workflows/*.yml`)
- Plus core config files (`package.json`, `package-lock.json` for ci.yml)

## Files Modified

### 1. `.github/workflows/ci.yml` (CI/CD Pipeline)
**Changes:**
- ✅ Added `paths` filter to `push` and `pull_request` triggers
- ✅ Limits runs to active directories and core config files
- ✅ Prevents unnecessary runs on Dependabot PRs in other areas

**Already Correct:**
- Node 20 already configured
- `continue-on-error: true` already set for lint job
- Working directory correctly set to `./Cyrano`

**How to Revert:**
```bash
git show e3f4a41:.github/workflows/ci.yml > .github/workflows/ci.yml.backup
git checkout HEAD~1 -- .github/workflows/ci.yml
```

### 2. `.github/workflows/codacy-analysis.yml` (Codacy Analysis & Coverage)
**Changes:**
- ✅ Added `paths` filter to `push` and `pull_request` triggers
- ✅ Limits coverage analysis to active directories only
- ✅ Includes workflow file itself to trigger on workflow changes

**Already Correct:**
- Node 20 already configured
- `test:coverage` command already used
- Working directory correctly set to `./Cyrano`

**How to Revert:**
```bash
git checkout HEAD~1 -- .github/workflows/codacy-analysis.yml
```

### 3. `.github/workflows/codacy.yml` (Codacy Security Scan)
**Changes:**
- ✅ Added `paths` filter to `push` and `pull_request` triggers
- ✅ Limits security scanning to active directories
- ✅ Scheduled runs still execute (cron not affected)
- ✅ Includes workflow file itself in path filter

**How to Revert:**
```bash
git checkout HEAD~1 -- .github/workflows/codacy.yml
```

### 4. `.github/workflows/codeql.yml` (CodeQL Advanced)
**Changes:**
- ✅ Replaced `paths-ignore` with `paths` (inverted logic)
- ✅ Now scans ONLY active directories instead of ignoring them
- ✅ Scheduled runs still execute (cron not affected)
- ✅ Includes workflow and config files in path filter

**Previous Behavior:** Ignored Cyrano, apps, docs, Labs - scanning only root files
**New Behavior:** Scans only Cyrano, apps/lexfiat, apps/arkiver, docs, Labs/Potemkin

**How to Revert:**
```bash
git checkout HEAD~1 -- .github/workflows/codeql.yml
```

### 5. `.github/codeql-config.yml` (CodeQL Configuration)
**Changes:**
- ✅ Added explicit `paths` list for active directories
- ✅ Updated `paths-ignore` to exclude only Legacy, Miscellaneous, and build artifacts
- ✅ Now includes active directories in scans

**Previous Behavior:** Ignored all project directories
**New Behavior:** Scans active project directories, excludes legacy/build artifacts

**How to Revert:**
```bash
git checkout HEAD~1 -- .github/codeql-config.yml
```

### 6. `.github/workflows/semgrep.yml` (Semgrep Security Scan)
**Changes:**
- ✅ Added `paths` filter to `push` and `pull_request` triggers
- ✅ Limits Semgrep scanning to active directories
- ✅ Scheduled runs still execute (cron not affected)

**How to Revert:**
```bash
git checkout HEAD~1 -- .github/workflows/semgrep.yml
```

### 7. `.github/workflows/pmd.yml` (PMD - Java Analysis)
**Changes:**
- ✅ No changes made - already properly disabled
- ✅ Already has `if: ${{ false }}` condition
- ✅ Trigger is `workflow_dispatch` only (manual)

**Status:** Correctly disabled for JS/TS repository

### 8. `.github/workflows/snyk-security.yml` (Snyk Security)
**Changes:**
- ✅ **NO CHANGES MADE** as requested
- Left completely untouched per requirements

## New Files Created

### 1. `scripts/git-clean-lock.sh`
**Purpose:** Safely remove stale Git lock files (.git/HEAD.lock)

**Features:**
- ✅ Checks if .git directory exists
- ✅ Detects if lock file exists
- ✅ Verifies no Git processes are running (using lsof, fuser, or pgrep)
- ✅ Prompts for confirmation if processes detected
- ✅ Safely removes lock file with clear status messages
- ✅ Executable with proper Apache License 2.0 header

**Usage:**
```bash
bash scripts/git-clean-lock.sh
# OR
chmod +x scripts/git-clean-lock.sh && ./scripts/git-clean-lock.sh
```

**Safety Checks:**
1. Repository validation
2. Process detection (lsof/fuser/pgrep)
3. User confirmation if processes running
4. Clear error messages and exit codes

### 2. `docs/developer/git-fix-lock.md`
**Purpose:** Comprehensive troubleshooting guide for Git lock errors

**Sections:**
- ✅ Problem description and symptoms
- ✅ Quick fix using automated script
- ✅ Manual fix for macOS/Linux/WSL
- ✅ Manual fix for Windows (PowerShell and Command Prompt)
- ✅ Important warnings about active Git processes
- ✅ Common causes and prevention tips
- ✅ Other lock file types (.git/index.lock, etc.)
- ✅ Troubleshooting section for edge cases
- ✅ Repository corruption recovery steps

**Document Metadata:**
- Document ID: DEV-GIT-LOCK-FIX
- Version: v502 (2025, Week 1)
- Status: Active
- Copyright: © 2025 Cognisint LLC

## Impact Analysis

### Positive Changes
1. **Reduced CI noise** - Workflows only run when relevant files change
2. **Faster feedback** - No scanning of unrelated files on dependency bumps
3. **Better resource usage** - Less compute time, fewer quota issues
4. **Targeted scanning** - Security scans focus on active code
5. **Developer productivity** - Git lock helper for common local issue

### What Didn't Change
1. **Workflow logic** - All jobs, steps, and actions remain the same
2. **Test commands** - No changes to npm scripts or test invocations
3. **Node versions** - Already using Node 20 where needed
4. **Error handling** - continue-on-error settings preserved
5. **Scheduled runs** - Cron jobs still execute on schedule regardless of path filters
6. **Snyk configuration** - Completely untouched

### When Workflows Run

**Push to main/develop:**
- Only when active directories change
- Always on scheduled runs (cron)

**Pull Requests:**
- Only when active directories change in the PR
- Includes changes to workflow files themselves

**Dependabot PRs:**
- Only if dependencies in active project directories change
- Root-level dependency bumps won't trigger (unless they affect active dirs)

## Testing & Validation

### Pre-deployment Checks ✅
- [x] YAML syntax validated with yamllint
- [x] All workflows parse correctly
- [x] Path filters follow GitHub Actions syntax
- [x] Script is executable and runs without errors
- [x] Script handles missing lock file correctly
- [x] Documentation is comprehensive and accurate

### Post-deployment Expectations
1. Next push to active directory → Workflows run
2. Next push to Legacy/ or Miscellaneous/ → Workflows don't run
3. Dependabot PR updating root package.json → CI runs (ci.yml includes it)
4. Dependabot PR updating Legacy/package.json → No workflows run
5. Scheduled runs → Always execute regardless of changes

## Rollback Instructions

### Rollback All Changes
```bash
# Reset to previous state
git revert e3f4a41

# Or reset branch (if not yet merged)
git reset --hard HEAD~1
git push -f origin copilot/fix-ci-cd-workflows-again
```

### Rollback Individual Files
See "How to Revert" section for each file above.

### Rollback Path Filters Only
For each workflow, remove the `paths:` block from the `on:` section:

```yaml
# Remove this block from each workflow
on:
  push:
    branches: [ main ]
    paths:  # <-- Remove from here
      - 'Cyrano/**'  # <-- Remove these lines
      - ...
```

### Remove New Files
```bash
git rm scripts/git-clean-lock.sh
git rm docs/developer/git-fix-lock.md
git commit -m "Remove git-lock helper files"
```

## Future Improvements (Out of Scope)

These were considered but intentionally not implemented to keep changes minimal:

1. **Matrix jobs** - Running tests for multiple projects in parallel
2. **Dynamic path detection** - Detecting which projects changed and testing only those
3. **Workflow consolidation** - Merging similar workflows
4. **Lint fixes** - Fixing trailing spaces and YAML style issues
5. **Coverage improvements** - Combining coverage from multiple projects
6. **Additional helper scripts** - Other developer productivity tools

## References

- **Problem Statement:** GitHub Actions failures blocking CI signal
- **Active Directories:** Cyrano, Labs/Potemkin, apps/lexfiat, apps/arkiver, docs
- **Commit:** e3f4a41
- **Branch:** copilot/fix-ci-cd-workflows-again

## Support

For questions or issues:
1. Review this summary document
2. Check workflow run logs in GitHub Actions
3. Consult docs/developer/git-fix-lock.md for local Git issues
4. Contact repository maintainers

---

**Changes implemented by:** GitHub Copilot  
**Date:** 2025-01-04  
**License:** Apache License 2.0  
**Copyright:** © 2025 Cognisint LLC
