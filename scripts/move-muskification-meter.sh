#!/bin/bash
# Quick script to move remaining muskification-meter directory

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Move muskification-meter
if [ -d "${BASE_DIR}/Labs/muskification-meter" ]; then
    mkdir -p "${BASE_DIR}/Legacy/archive/labs"
    mv "${BASE_DIR}/Labs/muskification-meter" "${BASE_DIR}/Legacy/archive/labs/muskification-meter"
    echo "✅ Moved muskification-meter"
fi

# Remove empty Labs directory
if [ -d "${BASE_DIR}/Labs" ]; then
    if [ -z "$(ls -A "${BASE_DIR}/Labs" 2>/dev/null)" ]; then
        rmdir "${BASE_DIR}/Labs"
        echo "✅ Removed empty Labs directory"
    fi
fi

echo "✅ Cleanup complete"
