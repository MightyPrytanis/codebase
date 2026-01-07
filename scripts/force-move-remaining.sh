#!/bin/bash
# Force move remaining archive directories
# Replaces empty destination directories with source content

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_DIR="${BASE_DIR}/Legacy/archive"

echo "=========================================="
echo "Force Move Remaining Archive Directories"
echo "=========================================="
echo ""

# Function to force move (replace empty dest with source)
force_move() {
    local source="$1"
    local dest="$2"
    local name="$3"
    
    if [ ! -d "$source" ]; then
        echo "⚠️  Skipping $name: Source does not exist: $source"
        return
    fi
    
    if [ -d "$dest" ]; then
        # Check if destination is empty
        if [ -z "$(ls -A "$dest" 2>/dev/null)" ]; then
            echo "📦 Moving $name (replacing empty destination)..."
            echo "   From: $source"
            echo "   To:   $dest"
            rm -rf "$dest"
            mkdir -p "$(dirname "$dest")"
            mv "$source" "$dest"
            echo "   ✅ Moved successfully"
        else
            echo "⚠️  $name: Destination is not empty: $dest"
            echo "   Source size: $(du -sh "$source" 2>/dev/null | cut -f1)"
            echo "   Dest size: $(du -sh "$dest" 2>/dev/null | cut -f1)"
            echo "   ⚠️  Manual review needed"
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
force_move \
    "${BASE_DIR}/Cyrano/archive" \
    "${ARCHIVE_DIR}/cyrano-archive" \
    "Cyrano/archive"

# Move docs archive
force_move \
    "${BASE_DIR}/docs/archive" \
    "${ARCHIVE_DIR}/docs-archive" \
    "docs/archive"

# Move Miscellaneous
force_move \
    "${BASE_DIR}/Miscellaneous" \
    "${ARCHIVE_DIR}/miscellaneous" \
    "Miscellaneous"

echo "=========================================="
echo "✅ Move Complete"
echo "=========================================="
echo ""
