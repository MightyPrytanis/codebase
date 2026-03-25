#!/usr/bin/env python3
"""
Validate that all platform-constrained packages in a package-lock.json
have `"optional": true` set, so `npm ci` skips them on incompatible platforms
instead of raising EBADPLATFORM.

Usage: python3 validate-lockfile.py [path/to/package-lock.json]
Defaults to package-lock.json in the current directory.
"""
import json
import sys

lockfile_path = sys.argv[1] if len(sys.argv) > 1 else "package-lock.json"

try:
    with open(lockfile_path) as f:
        lock = json.load(f)
except FileNotFoundError:
    print(f"::error::Lockfile not found: {lockfile_path}")
    sys.exit(1)

bad = [
    k for k, v in lock.get("packages", {}).items()
    if (v.get("os") or v.get("cpu")) and not v.get("optional")
]

if bad:
    print(f"::error::package-lock.json has platform-constrained entries missing 'optional: true':")
    for k in bad:
        print(f"  {k}")
    print("Fix: rm -rf node_modules package-lock.json && npm install")
    print("Then verify: npm ci --dry-run")
    sys.exit(1)

print(f"Lockfile platform check passed ({len(lock.get('packages', {}))} packages, none mis-constrained)")
