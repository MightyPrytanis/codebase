#!/bin/bash
# Move remaining archive directories from active codebase to Legacy/archive/
# Handles cases where destinations may already exist

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_DIR="${BASE_DIR}/Legacy/archive"

echo "=========================================="
echo "Move Remaining Archive Directories"
echo "=========================================="
echo ""

# Function to move directory, handling existing destinations
move_with_merge() {
    local source="$1"
    local dest="$2"
    local name="$3"
    
    if [ ! -d "$source" ]; then
        echo "⚠️  Skipping $name: Source does not exist: $source"
        return
    fi
    
    if [ -d "$dest" ]; then
        echo "⚠️  $name: Destination already exists: $dest"
        echo "   Checking if source can be removed..."
        
        # Check if source and dest are the same (symlink or already moved)
        if [ "$(readlink -f "$source")" = "$(readlink -f "$dest")" ]; then
            echo "   ✅ Source is already linked to destination - removing source"
            rm -rf "$source"
        else
            echo "   ℹ️  Source and destination are different"
            echo "   Source size: $(du -sh "$source" 2>/dev/null | cut -f1)"
            echo "   Dest size: $(du -sh "$dest" 2>/dev/null | cut -f1)"
            echo "   ⚠️  Manual review needed - not removing source"
        fi
    else
        echo "📦 Moving $name..."
        echo "   From: $source"
        echo "   To:   $dest"
        mkdir -p "$(dirname "$dest")"
        mv "$source" "$dest"
        echo "   ✅ Moved successfully"
    fi
    echo ""
}

# Move Cyrano archive
move_with_merge \
    "${BASE_DIR}/Cyrano/archive" \
    "${ARCHIVE_DIR}/cyrano-archive" \
    "Cyrano/archive"

# Move docs archive
move_with_merge \
    "${BASE_DIR}/docs/archive" \
    "${ARCHIVE_DIR}/docs-archive" \
    "docs/archive"

# Move Miscellaneous
move_with_merge \
    "${BASE_DIR}/Miscellaneous" \
    "${ARCHIVE_DIR}/miscellaneous" \
    "Miscellaneous"

echo "=========================================="
echo "✅ Move Complete"
echo "=========================================="
echo ""
echo "Review the output above for any warnings."
echo "If destinations already existed, verify they contain the expected content."
echo ""
