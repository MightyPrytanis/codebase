#!/usr/bin/env python3
"""
Archive Non-Essential Directories
Moves experimental, archived, and duplicate directories to Legacy/archive/

Copyright 2025 Cognisint LLC
Licensed under Apache License, Version 2.0
"""

import os
import shutil
import sys
from pathlib import Path

def get_base_dir():
    """Get the base directory of the codebase"""
    script_dir = Path(__file__).parent
    return script_dir.parent

def move_directory(source, dest, name):
    """Move a directory with error handling"""
    source_path = Path(source)
    dest_path = Path(dest)
    
    if not source_path.exists():
        print(f"⚠️  Skipping {name}: Source directory does not exist: {source}")
        return False
    
    if not source_path.is_dir():
        print(f"⚠️  Skipping {name}: Source is not a directory: {source}")
        return False
    
    if dest_path.exists():
        print(f"⚠️  Skipping {name}: Destination already exists: {dest}")
        print(f"   (Remove destination manually if you want to overwrite)")
        return False
    
    try:
        print(f"📦 Moving {name}...")
        print(f"   From: {source_path}")
        print(f"   To:   {dest_path}")
        
        # Create parent directory if needed
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Move the directory
        shutil.move(str(source_path), str(dest_path))
        
        print(f"   ✅ Moved successfully")
        print()
        return True
    except Exception as e:
        print(f"   ❌ Error moving {name}: {e}")
        print()
        return False

def main():
    base_dir = get_base_dir()
    archive_dir = base_dir / "Legacy" / "archive"
    
    print("=" * 50)
    print("Archive Non-Essential Directories")
    print("=" * 50)
    print(f"Base directory: {base_dir}")
    print(f"Archive directory: {archive_dir}")
    print()
    
    # Create archive subdirectories
    (archive_dir / "labs").mkdir(parents=True, exist_ok=True)
    (archive_dir / "cyrano-archive").mkdir(parents=True, exist_ok=True)
    (archive_dir / "docs-archive").mkdir(parents=True, exist_ok=True)
    (archive_dir / "miscellaneous").mkdir(parents=True, exist_ok=True)
    
    moved_count = 0
    
    # Move Labs experimental projects
    print("Moving Labs experimental projects...")
    if move_directory(
        base_dir / "Labs" / "Potemkin",
        archive_dir / "labs" / "Potemkin",
        "Labs/Potemkin"
    ):
        moved_count += 1
    
    if move_directory(
        base_dir / "Labs" / "infinite-helix",
        archive_dir / "labs" / "infinite-helix",
        "Labs/infinite-helix"
    ):
        moved_count += 1
    
    if move_directory(
        base_dir / "Labs" / "muskification-meter",
        archive_dir / "labs" / "muskification-meter",
        "Labs/muskification-meter"
    ):
        moved_count += 1
    
    # Move Cyrano archive
    print("Moving Cyrano archive...")
    if move_directory(
        base_dir / "Cyrano" / "archive",
        archive_dir / "cyrano-archive",
        "Cyrano/archive"
    ):
        moved_count += 1
    
    # Move docs archive
    print("Moving docs archive...")
    if move_directory(
        base_dir / "docs" / "archive",
        archive_dir / "docs-archive",
        "docs/archive"
    ):
        moved_count += 1
    
    # Move Miscellaneous
    print("Moving Miscellaneous directory...")
    if move_directory(
        base_dir / "Miscellaneous",
        archive_dir / "miscellaneous",
        "Miscellaneous"
    ):
        moved_count += 1
    
    # Clean up Labs directory - remove .DS_Store and empty directory
    labs_dir = base_dir / "Labs"
    if labs_dir.exists() and labs_dir.is_dir():
        try:
            # Remove .DS_Store if present
            ds_store = labs_dir / ".DS_Store"
            if ds_store.exists():
                print("🗑️  Removing .DS_Store from Labs directory...")
                ds_store.unlink()
                print("   ✅ Removed")
            
            # Check remaining contents (excluding . and ..)
            contents = [item for item in labs_dir.iterdir() if item.name != ".DS_Store"]
            if not contents:
                print("🗑️  Removing empty Labs directory...")
                labs_dir.rmdir()
                print("   ✅ Removed")
            else:
                print("ℹ️  Labs directory still contains:")
                for item in contents:
                    print(f"   - {item.name}")
                print("   (These items were not moved - may need manual review)")
        except Exception as e:
            print(f"ℹ️  Could not check/remove Labs directory: {e}")
        print()
    
    print("=" * 50)
    print("✅ Archive Complete")
    print("=" * 50)
    print()
    print(f"Successfully moved {moved_count} directories")
    print()
    print("Archived directories:")
    print("  - Labs/Potemkin → Legacy/archive/labs/Potemkin")
    print("  - Labs/infinite-helix → Legacy/archive/labs/infinite-helix")
    print("  - Labs/muskification-meter → Legacy/archive/labs/muskification-meter")
    print("  - Cyrano/archive → Legacy/archive/cyrano-archive")
    print("  - docs/archive → Legacy/archive/docs-archive")
    print("  - Miscellaneous → Legacy/archive/miscellaneous")
    print()
    print("Next steps:")
    print("  1. Review the moved directories")
    print("  2. Verify .gitignore and .cursorignore are updated")
    print("  3. Update README.md if needed (already done)")
    print("  4. Commit changes")
    print()
    
    return 0 if moved_count > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
