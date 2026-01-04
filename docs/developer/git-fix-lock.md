---
Document ID: DEV-GIT-LOCK-FIX
Title: Fixing Git HEAD.lock Errors
Subject(s): Developer Tools | Git Troubleshooting
Project: Cyrano
Version: v502
Created: 2025-01-04 (2025-01)
Last Substantive Revision: 2025-01-04 (2025-01)
Last Format Update: 2025-01-04 (2025-01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Guide for resolving Git HEAD.lock errors caused by interrupted operations or editor crashes
Status: Active
---

# Fixing Git HEAD.lock Errors

## Problem

When Git operations are interrupted (e.g., by a crash, editor failure, or system shutdown), Git may leave behind a lock file at `.git/HEAD.lock`. This lock file prevents any subsequent Git operations and displays errors like:

```
fatal: Unable to create '/path/to/repo/.git/HEAD.lock': File exists.
Another git process seems to be running in this repository.
```

## Quick Fix (Automated)

The repository includes a helper script to safely remove stale lock files:

```bash
# From repository root
bash scripts/git-clean-lock.sh
```

The script will:
1. Check if the lock file exists
2. Verify no Git processes are currently running
3. Safely remove the lock file if it's stale
4. Provide clear status messages

## Manual Fix

### macOS / Linux / WSL

1. **Check for running Git processes:**
   ```bash
   ps aux | grep git
   # or
   pgrep git
   ```

2. **If Git processes are running:**
   - Wait for them to complete, OR
   - Kill them if they're stuck:
     ```bash
     # Find the process ID (PID)
     ps aux | grep git
     # Kill the process (replace <PID> with actual process ID)
     kill <PID>
     # If that doesn't work, use force kill (use with caution)
     kill -9 <PID>
     ```

3. **Remove the lock file:**
   ```bash
   rm -f .git/HEAD.lock
   ```

4. **Verify Git operations work:**
   ```bash
   git status
   ```

### Windows (PowerShell)

1. **Check for running Git processes:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*git*"}
   ```

2. **If Git processes are running:**
   - Wait for them to complete, OR
   - Stop them via Task Manager or:
     ```powershell
     Stop-Process -Name "git" -Force
     ```

3. **Remove the lock file:**
   ```powershell
   Remove-Item -Force .git\HEAD.lock
   ```

4. **Verify Git operations work:**
   ```powershell
   git status
   ```

### Windows (Command Prompt)

1. **Check for running Git processes:**
   ```cmd
   tasklist | findstr git
   ```

2. **If Git processes are running:**
   - Wait for them to complete, OR
   - Kill them:
     ```cmd
     taskkill /IM git.exe /F
     ```

3. **Remove the lock file:**
   ```cmd
   del /F .git\HEAD.lock
   ```

4. **Verify Git operations work:**
   ```cmd
   git status
   ```

## Important Warnings

⚠️ **DO NOT remove the lock file while Git operations are in progress!**

Removing an active lock file can cause:
- Repository corruption
- Loss of uncommitted changes
- Inconsistent repository state

### Safe Practices

1. **Always check for running processes first** - Use `ps`, `pgrep`, `tasklist`, or Task Manager
2. **Wait if possible** - If a Git operation is genuinely running, let it complete
3. **Backup if unsure** - If the repository contains critical uncommitted work, create a backup before removing locks
4. **Use the script** - The `scripts/git-clean-lock.sh` script includes safety checks

## Common Causes

This issue typically occurs when:
- **Editor crashes** - VS Code, Cursor, or other editors crash during Git operations
- **System interruptions** - Power loss, forced shutdown, or system crash
- **Interrupted operations** - Canceling Git commands mid-execution (Ctrl+C)
- **IDE/extension conflicts** - Multiple Git clients or extensions trying to access the repository simultaneously

## Prevention

To reduce the likelihood of this issue:
1. Let Git operations complete before closing editors or terminals
2. Avoid force-killing editors or terminal windows during Git operations
3. Use stable network connections for remote Git operations
4. Ensure adequate disk space for Git operations
5. Keep Git and editor extensions updated

## Other Lock Files

Git may create other lock files that can cause similar issues:

- `.git/index.lock` - Staging area lock
- `.git/refs/heads/<branch>.lock` - Branch reference lock
- `.git/refs/remotes/<remote>/<branch>.lock` - Remote reference lock

These can be removed using the same process:

```bash
# Example: Remove index lock
rm -f .git/index.lock
```

**Always verify no Git processes are running before removing any lock file.**

## Troubleshooting

### Lock file keeps reappearing
- Check for background processes or IDE extensions repeatedly triggering Git operations
- Disable Git-related IDE extensions temporarily
- Check system logs for disk or filesystem errors

### Repository appears corrupted after removing lock
1. Run Git's built-in consistency check:
   ```bash
   git fsck --full
   ```

2. If issues are found, try recovery:
   ```bash
   git reflog
   git reset --hard <commit-hash>
   ```

3. As a last resort, re-clone the repository (if you have no uncommitted work)

### Need help
- Review `.git/logs/` for operation history
- Check editor/IDE logs for crash information
- Consult the project maintainers if repository state is uncertain

## References

- [Git Documentation: File Locking](https://git-scm.com/docs/git-update-index#_using_index_lock)
- [Git FAQ: Lock Files](https://git.wiki.kernel.org/index.php/GitFaq#What_does_.22fatal:_Unable_to_create_.27.2Fpath.2Fto.2Frepo.2F.git.2Findex.lock.27:_File_exists..22_mean.3F)
- Repository: scripts/git-clean-lock.sh

---

*For questions or issues with this guide, contact the repository maintainers.*
