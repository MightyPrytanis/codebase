#!/bin/bash
#
# Copyright 2025 Cognisint LLC
# Licensed under the Apache License, Version 2.0
# See LICENSE.md for full license text
#
# Nightly Library Refresh Cron Wrapper
#
# This script wraps the nightly library refresh job for use with cron.
# It should be added to crontab to run daily:
#
# Example crontab entry (runs at 2 AM daily):
# 0 2 * * * /path/to/Cyrano/scripts/cron-nightly-library-refresh.sh
#

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CYRANO_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to Cyrano root directory
cd "$CYRANO_ROOT" || exit 1

# Load environment variables if .env exists
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Log output to a file
LOG_DIR="$CYRANO_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/nightly-library-refresh-$(date +%Y%m%d).log"

echo "=== Nightly Library Refresh - $(date) ===" >> "$LOG_FILE"

# Run the nightly refresh job with tsx (TypeScript execution)
npx tsx src/jobs/nightly-library-refresh.ts >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "=== Nightly Library Refresh Completed Successfully - $(date) ===" >> "$LOG_FILE"
else
  echo "=== Nightly Library Refresh Failed with exit code $EXIT_CODE - $(date) ===" >> "$LOG_FILE"
fi

# Keep only last 7 days of logs
find "$LOG_DIR" -name "nightly-library-refresh-*.log" -mtime +7 -delete

exit $EXIT_CODE
