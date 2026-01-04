#!/usr/bin/env bash
# Copyright © 2025 Cognisint LLC
# Licensed under the Apache License, Version 2.0
#
# Git Lock File Cleanup Script
# 
# This script safely removes stale Git lock files (.git/HEAD.lock) that can
# prevent Git operations. It checks for running Git processes before removal
# to avoid data corruption.
#
# Usage:
#   bash scripts/git-clean-lock.sh
#   OR
#   chmod +x scripts/git-clean-lock.sh && ./scripts/git-clean-lock.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="${REPO_ROOT}/.git/HEAD.lock"

echo "Git Lock File Cleanup Script"
echo "Repository: ${REPO_ROOT}"
echo ""

# Check if .git directory exists
if [ ! -d "${REPO_ROOT}/.git" ]; then
    echo "❌ Error: .git directory not found. Are you in a Git repository?"
    exit 1
fi

# Check if lock file exists
if [ ! -f "${LOCK_FILE}" ]; then
    echo "✅ No stale HEAD.lock file found. Git operations should work normally."
    exit 0
fi

echo "⚠️  Found stale lock file: ${LOCK_FILE}"
echo ""

# Check for running git processes
echo "Checking for running Git processes..."
if command -v lsof &> /dev/null; then
    # Use lsof if available (macOS, Linux)
    GIT_PROCS=$(lsof "${LOCK_FILE}" 2>/dev/null || true)
    if [ -n "${GIT_PROCS}" ]; then
        echo "❌ WARNING: Git processes are currently accessing the lock file:"
        echo "${GIT_PROCS}"
        echo ""
        echo "Do NOT remove the lock file while Git is running!"
        echo "Please wait for Git operations to complete or kill the processes."
        exit 1
    fi
elif command -v fuser &> /dev/null; then
    # Use fuser if available (some Linux systems)
    if fuser "${LOCK_FILE}" 2>/dev/null; then
        echo "❌ WARNING: A process is currently accessing the lock file."
        echo "Do NOT remove the lock file while Git is running!"
        echo "Please wait for Git operations to complete."
        exit 1
    fi
else
    # Manual check for git processes
    if pgrep -x git &> /dev/null; then
        echo "⚠️  WARNING: Git processes are currently running:"
        pgrep -x git | xargs -I {} ps -p {} -o pid,comm,args 2>/dev/null || true
        echo ""
        echo "This lock file might be in use. Proceed with caution."
        read -p "Continue with removal? (yes/no): " CONFIRM
        if [ "${CONFIRM}" != "yes" ]; then
            echo "Aborted. Lock file not removed."
            exit 0
        fi
    fi
fi

# Remove the lock file
echo "No Git processes detected accessing the lock file."
echo "Removing stale lock file..."
if rm -f "${LOCK_FILE}"; then
    echo "✅ Successfully removed ${LOCK_FILE}"
    echo ""
    echo "You should now be able to perform Git operations normally."
    echo "If you continue to experience issues, see docs/developer/git-fix-lock.md"
else
    echo "❌ Error: Failed to remove lock file. Check file permissions."
    exit 1
fi
