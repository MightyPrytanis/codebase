#!/bin/bash
# Archive Non-Essential Directories
# Moves experimental, archived, and duplicate directories to Legacy/archive/
# 
# Copyright 2025 Cognisint LLC
# Licensed under Apache License, Version 2.0

set -e  # Exit on error

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_DIR="${BASE_DIR}/Legacy/archive"

echo "=========================================="
echo "Archive Non-Essential Directories"
echo "=========================================="
echo "Base directory: ${BASE_DIR}"
echo "Archive directory: ${ARCHIVE_DIR}"
echo ""

# Create archive subdirectories
mkdir -p "${ARCHIVE_DIR}/labs"
mkdir -p "${ARCHIVE_DIR}/cyrano-archive"
mkdir -p "${ARCHIVE_DIR}/docs-archive"
mkdir -p "${ARCHIVE_DIR}/miscellaneous"

# Function to move directory with confirmation
move_directory() {
    local source="$1"
    local dest="$2"
    local name="$3"
    
    if [ ! -d "$source" ]; then
        echo "⚠️  Skipping $name: Source directory does not exist: $source"
        return
    fi
    
    if [ -d "$dest" ]; then
        echo "⚠️  Skipping $name: Destination already exists: $dest"
        echo "   (Remove destination manually if you want to overwrite)"
        return
    fi
    
    echo "📦 Moving $name..."
    echo "   From: $source"
    echo "   To:   $dest"
    mv "$source" "$dest"
    echo "   ✅ Moved successfully"
    echo ""
}

# Move Labs experimental projects
echo "Moving Labs experimental projects..."
move_directory "${BASE_DIR}/Labs/Potemkin" "${ARCHIVE_DIR}/labs/Potemkin" "Labs/Potemkin"
move_directory "${BASE_DIR}/Labs/infinite-helix" "${ARCHIVE_DIR}/labs/infinite-helix" "Labs/infinite-helix"
move_directory "${BASE_DIR}/Labs/muskification-meter" "${ARCHIVE_DIR}/labs/muskification-meter" "Labs/muskification-meter"

# Move Cyrano archive
echo "Moving Cyrano archive..."
move_directory "${BASE_DIR}/Cyrano/archive" "${ARCHIVE_DIR}/cyrano-archive" "Cyrano/archive"

# Move docs archive
echo "Moving docs archive..."
move_directory "${BASE_DIR}/docs/archive" "${ARCHIVE_DIR}/docs-archive" "docs/archive"

# Move Miscellaneous
echo "Moving Miscellaneous directory..."
move_directory "${BASE_DIR}/Miscellaneous" "${ARCHIVE_DIR}/miscellaneous" "Miscellaneous"

# Clean up Labs directory - remove .DS_Store and empty directory
if [ -d "${BASE_DIR}/Labs" ]; then
    # Remove .DS_Store if present
    if [ -f "${BASE_DIR}/Labs/.DS_Store" ]; then
        echo "🗑️  Removing .DS_Store from Labs directory..."
        rm "${BASE_DIR}/Labs/.DS_Store"
        echo "   ✅ Removed"
    fi
    
    # Check if directory is now empty (excluding . and ..)
    remaining=$(find "${BASE_DIR}/Labs" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
    if [ "$remaining" -eq 0 ]; then
        echo "🗑️  Removing empty Labs directory..."
        rmdir "${BASE_DIR}/Labs"
        echo "   ✅ Removed"
    else
        echo "ℹ️  Labs directory still contains:"
        ls -la "${BASE_DIR}/Labs" | grep -v "^total" | grep -v "^\.$" | grep -v "^\.\.$" || true
        echo "   (These items were not moved - may need manual review)"
    fi
    echo ""
fi

echo "=========================================="
echo "✅ Archive Complete"
echo "=========================================="
echo ""
echo "Archived directories:"
echo "  - Labs/Potemkin → Legacy/archive/labs/Potemkin"
echo "  - Labs/infinite-helix → Legacy/archive/labs/infinite-helix"
echo "  - Labs/muskification-meter → Legacy/archive/labs/muskification-meter"
echo "  - Cyrano/archive → Legacy/archive/cyrano-archive"
echo "  - docs/archive → Legacy/archive/docs-archive"
echo "  - Miscellaneous → Legacy/archive/miscellaneous"
echo ""
echo "Next steps:"
echo "  1. Review the moved directories"
echo "  2. Update .gitignore and .cursorignore (if needed)"
echo "  3. Update README.md to reflect changes"
echo "  4. Commit changes"
echo ""
