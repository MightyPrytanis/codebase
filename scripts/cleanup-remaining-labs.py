#!/usr/bin/env python3
"""
Quick cleanup script for remaining Labs directory items
Moves muskification-meter and removes .DS_Store

Copyright 2025 Cognisint LLC
"""

import os
import shutil
from pathlib import Path

base_dir = Path(__file__).parent.parent
labs_dir = base_dir / "Labs"
archive_dir = base_dir / "Legacy" / "archive" / "labs"

# Ensure archive directory exists
archive_dir.mkdir(parents=True, exist_ok=True)

# Move muskification-meter
musk_dir = labs_dir / "muskification-meter"
if musk_dir.exists() and musk_dir.is_dir():
    dest = archive_dir / "muskification-meter"
    if not dest.exists():
        print(f"Moving {musk_dir} to {dest}")
        shutil.move(str(musk_dir), str(dest))
        print("✅ Moved successfully")
    else:
        print(f"⚠️  Destination already exists: {dest}")

# Remove .DS_Store
ds_store = labs_dir / ".DS_Store"
if ds_store.exists():
    print(f"Removing {ds_store}")
    ds_store.unlink()
    print("✅ Removed .DS_Store")

# Remove empty Labs directory
if labs_dir.exists():
    try:
        contents = [item for item in labs_dir.iterdir() if item.name != ".DS_Store"]
        if not contents:
            print(f"Removing empty {labs_dir}")
            labs_dir.rmdir()
            print("✅ Removed Labs directory")
        else:
            print(f"⚠️  Labs directory still contains: {[item.name for item in contents]}")
    except Exception as e:
        print(f"⚠️  Could not remove Labs directory: {e}")

print("✅ Cleanup complete")
