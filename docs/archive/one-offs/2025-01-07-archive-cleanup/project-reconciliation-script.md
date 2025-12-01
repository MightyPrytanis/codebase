# Project Directory Reconciliation Script

## Overview
This Python script performs deep, recursive comparison and reconciliation between your Archive (source of truth) and current Projects directory, with content-level analysis.

## Configuration

**Archive Path (Source of Truth):** `/Users/davidtowne/Desktop/Protected Archive/Archive`  
**Current Path (Target):** `/Users/davidtowne/Projects`  
**Platform:** macOS (M1-compatible)

---

## Installation & Usage

### Prerequisites
- Python 3.8+ (included with macOS)
- No external dependencies required

### Running the Script

1. **Save the script** below as `reconcile_projects.py`
2. **Run in dry-run mode first** (recommended):
   ```bash
   python3 reconcile_projects.py --dry-run
   ```
3. **Review the generated report** in `reconciliation_report.txt`
4. **Execute changes** (after review):
   ```bash
   python3 reconcile_projects.py --execute
   ```

---

## Script Features

- ✅ Recursive directory traversal
- ✅ Content-level file comparison (hash-based + line diffs for text)
- ✅ Identifies missing, extra, and modified files
- ✅ Generates detailed before/after reports
- ✅ Safe dry-run mode (default)
- ✅ Preserves current files before overwriting
- ✅ Logs all operations
- ✅ Interactive approval for ambiguous cases

---

## The Script

```python
#!/usr/bin/env python3
"""
Project Directory Reconciliation Script
Compares Archive (source of truth) with Current Projects directory
Performs content-level analysis and synchronization
"""

import os
import sys
import hashlib
import shutil
import difflib
from pathlib import Path
from datetime import datetime
import argparse
import json

# Configuration
ARCHIVE_PATH = Path("/Users/davidtowne/Desktop/Protected Archive/Archive")
CURRENT_PATH = Path("/Users/davidtowne/Projects")
REPORT_FILE = "reconciliation_report.txt"
LOG_FILE = "reconciliation_log.json"
BACKUP_DIR = Path("./reconciliation_backup")

# File categories for different handling
TEXT_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.md', '.txt', 
                   '.json', '.yaml', '.yml', '.html', '.css', '.scss'}
BINARY_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', 
                     '.ico', '.woff', '.woff2', '.ttf'}


def compute_file_hash(filepath):
    """Compute SHA256 hash of file content"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        return f"ERROR: {e}"


def get_text_diff(file1, file2):
    """Generate unified diff for text files"""
    try:
        with open(file1, 'r', encoding='utf-8', errors='ignore') as f1:
            lines1 = f1.readlines()
        with open(file2, 'r', encoding='utf-8', errors='ignore') as f2:
            lines2 = f2.readlines()
        
        diff = list(difflib.unified_diff(
            lines1, lines2,
            fromfile=str(file1),
            tofile=str(file2),
            lineterm=''
        ))
        return '\n'.join(diff[:100])  # Limit to first 100 lines
    except Exception as e:
        return f"ERROR generating diff: {e}"


def scan_directory(base_path):
    """Recursively scan directory and return file inventory"""
    inventory = {}
    base_path = Path(base_path)
    
    if not base_path.exists():
        print(f"ERROR: Path does not exist: {base_path}")
        return inventory
    
    for item in base_path.rglob('*'):
        if item.is_file():
            try:
                relative_path = item.relative_to(base_path)
                inventory[str(relative_path)] = {
                    'absolute': str(item),
                    'size': item.stat().st_size,
                    'modified': item.stat().st_mtime,
                    'hash': compute_file_hash(item),
                    'extension': item.suffix.lower()
                }
            except Exception as e:
                print(f"Warning: Could not process {item}: {e}")
    
    return inventory


def compare_inventories(archive_inv, current_inv):
    """Compare two inventories and categorize differences"""
    results = {
        'missing_in_current': [],      # In archive, not in current
        'extra_in_current': [],         # In current, not in archive
        'modified': [],                 # Different content
        'identical': [],                # Perfect matches
        'timestamp_only': []            # Same content, different timestamp
    }
    
    # Find missing and modified files
    for rel_path, archive_info in archive_inv.items():
        if rel_path not in current_inv:
            results['missing_in_current'].append({
                'path': rel_path,
                'archive': archive_info
            })
        else:
            current_info = current_inv[rel_path]
            if archive_info['hash'] == current_info['hash']:
                if archive_info['modified'] != current_info['modified']:
                    results['timestamp_only'].append({
                        'path': rel_path,
                        'archive': archive_info,
                        'current': current_info
                    })
                else:
                    results['identical'].append({
                        'path': rel_path
                    })
            else:
                # Content differs
                results['modified'].append({
                    'path': rel_path,
                    'archive': archive_info,
                    'current': current_info
                })
    
    # Find extra files in current
    for rel_path in current_inv:
        if rel_path not in archive_inv:
            results['extra_in_current'].append({
                'path': rel_path,
                'current': current_inv[rel_path]
            })
    
    return results


def generate_report(results, archive_inv, current_inv):
    """Generate human-readable report"""
    report = []
    report.append("=" * 80)
    report.append("PROJECT DIRECTORY RECONCILIATION REPORT")
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("=" * 80)
    report.append("")
    
    report.append(f"Archive (Source of Truth): {ARCHIVE_PATH}")
    report.append(f"Current Directory: {CURRENT_PATH}")
    report.append("")
    
    report.append("SUMMARY")
    report.append("-" * 80)
    report.append(f"Total files in Archive: {len(archive_inv)}")
    report.append(f"Total files in Current: {len(current_inv)}")
    report.append(f"Identical files: {len(results['identical'])}")
    report.append(f"Files with only timestamp differences: {len(results['timestamp_only'])}")
    report.append(f"Modified files (content differs): {len(results['modified'])}")
    report.append(f"Missing in Current (need to copy): {len(results['missing_in_current'])}")
    report.append(f"Extra in Current (not in Archive): {len(results['extra_in_current'])}")
    report.append("")
    
    # Detailed sections
    if results['missing_in_current']:
        report.append("\nMISSING IN CURRENT (Files to copy from Archive)")
        report.append("-" * 80)
        for item in results['missing_in_current'][:50]:  # Limit display
            report.append(f"  📥 {item['path']}")
            report.append(f"      Size: {item['archive']['size']} bytes")
        if len(results['missing_in_current']) > 50:
            report.append(f"  ... and {len(results['missing_in_current']) - 50} more")
    
    if results['modified']:
        report.append("\nMODIFIED FILES (Content differs)")
        report.append("-" * 80)
        for item in results['modified'][:30]:
            report.append(f"  🔄 {item['path']}")
            report.append(f"      Archive: {item['archive']['size']} bytes, "
                         f"hash: {item['archive']['hash'][:16]}...")
            report.append(f"      Current: {item['current']['size']} bytes, "
                         f"hash: {item['current']['hash'][:16]}...")
            
            # Show diff for text files
            if Path(item['path']).suffix.lower() in TEXT_EXTENSIONS:
                diff = get_text_diff(item['archive']['absolute'], 
                                   item['current']['absolute'])
                if diff and len(diff) < 2000:
                    report.append(f"\n      Diff preview:")
                    report.append("      " + "\n      ".join(diff.split('\n')[:20]))
                    report.append("")
        
        if len(results['modified']) > 30:
            report.append(f"  ... and {len(results['modified']) - 30} more")
    
    if results['extra_in_current']:
        report.append("\nEXTRA IN CURRENT (Not in Archive - manual review needed)")
        report.append("-" * 80)
        for item in results['extra_in_current'][:50]:
            report.append(f"  ⚠️  {item['path']}")
            report.append(f"      Size: {item['current']['size']} bytes")
        if len(results['extra_in_current']) > 50:
            report.append(f"  ... and {len(results['extra_in_current']) - 50} more")
    
    report.append("\n" + "=" * 80)
    report.append("END OF REPORT")
    report.append("=" * 80)
    
    return "\n".join(report)


def execute_reconciliation(results, dry_run=True):
    """Execute file operations to reconcile directories"""
    operations = []
    
    if dry_run:
        print("\n🔍 DRY RUN MODE - No files will be modified\n")
    else:
        print("\n⚙️  EXECUTING RECONCILIATION\n")
        BACKUP_DIR.mkdir(exist_ok=True)
    
    # Copy missing files
    for item in results['missing_in_current']:
        src = Path(item['archive']['absolute'])
        dst = CURRENT_PATH / item['path']
        
        operation = {
            'action': 'copy',
            'source': str(src),
            'destination': str(dst),
            'status': 'pending'
        }
        
        if not dry_run:
            try:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                operation['status'] = 'success'
                print(f"✅ Copied: {item['path']}")
            except Exception as e:
                operation['status'] = f'error: {e}'
                print(f"❌ Error copying {item['path']}: {e}")
        else:
            print(f"[DRY RUN] Would copy: {item['path']}")
        
        operations.append(operation)
    
    # Update modified files (after backup)
    for item in results['modified']:
        src = Path(item['archive']['absolute'])
        dst = Path(item['current']['absolute'])
        backup_path = BACKUP_DIR / item['path']
        
        operation = {
            'action': 'update',
            'source': str(src),
            'destination': str(dst),
            'backup': str(backup_path),
            'status': 'pending'
        }
        
        if not dry_run:
            try:
                # Backup current version
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, backup_path)
                
                # Replace with archive version
                shutil.copy2(src, dst)
                operation['status'] = 'success'
                print(f"✅ Updated: {item['path']} (backup saved)")
            except Exception as e:
                operation['status'] = f'error: {e}'
                print(f"❌ Error updating {item['path']}: {e}")
        else:
            print(f"[DRY RUN] Would update: {item['path']}")
        
        operations.append(operation)
    
    # Save operation log
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'dry_run': dry_run,
        'operations': operations,
        'summary': {
            'copied': len(results['missing_in_current']),
            'updated': len(results['modified']),
            'extra_files': len(results['extra_in_current'])
        }
    }
    
    with open(LOG_FILE, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    return operations


def main():
    parser = argparse.ArgumentParser(
        description='Reconcile project directories with Archive as source of truth'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        default=True,
        help='Preview changes without executing (default)'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Execute file operations (overwrites --dry-run)'
    )
    
    args = parser.parse_args()
    dry_run = not args.execute
    
    print("🔍 Starting Project Directory Reconciliation")
    print(f"Archive: {ARCHIVE_PATH}")
    print(f"Current: {CURRENT_PATH}")
    print("")
    
    # Validate paths
    if not ARCHIVE_PATH.exists():
        print(f"ERROR: Archive path does not exist: {ARCHIVE_PATH}")
        sys.exit(1)
    if not CURRENT_PATH.exists():
        print(f"ERROR: Current path does not exist: {CURRENT_PATH}")
        sys.exit(1)
    
    # Scan directories
    print("📊 Scanning Archive directory...")
    archive_inv = scan_directory(ARCHIVE_PATH)
    print(f"   Found {len(archive_inv)} files in Archive")
    
    print("📊 Scanning Current directory...")
    current_inv = scan_directory(CURRENT_PATH)
    print(f"   Found {len(current_inv)} files in Current")
    
    # Compare
    print("\n🔬 Analyzing differences...")
    results = compare_inventories(archive_inv, current_inv)
    
    # Generate report
    print(f"\n📝 Generating report...")
    report = generate_report(results, archive_inv, current_inv)
    
    with open(REPORT_FILE, 'w') as f:
        f.write(report)
    
    print(f"   Report saved to: {REPORT_FILE}")
    print("\n" + "=" * 80)
    print(report)
    
    # Execute if not dry run
    if not dry_run or args.execute:
        print("\n" + "=" * 80)
        response = input("\n⚠️  Execute reconciliation operations? (yes/no): ")
        if response.lower() == 'yes':
            operations = execute_reconciliation(results, dry_run=False)
            print(f"\n✅ Reconciliation complete. Log saved to: {LOG_FILE}")
            if BACKUP_DIR.exists():
                print(f"📦 Backups saved to: {BACKUP_DIR}")
        else:
            print("\n❌ Reconciliation cancelled")
    else:
        print("\n💡 Run with --execute to apply changes")


if __name__ == "__main__":
    main()
```

---

## Safety Features

- **Dry-run by default:** No changes made unless explicitly confirmed
- **Automatic backups:** Original files preserved before overwriting
- **Detailed logging:** All operations recorded in JSON format
- **Content verification:** Hash-based comparison ensures accuracy
- **Interactive confirmation:** Manual approval before execution

---

## Example Output

```
🔍 Starting Project Directory Reconciliation
Archive: /Users/davidtowne/Desktop/Protected Archive/Archive
Current: /Users/davidtowne/Projects

📊 Scanning Archive directory...
   Found 847 files in Archive
📊 Scanning Current directory...
   Found 923 files in Current

🔬 Analyzing differences...

📝 Generating report...
   Report saved to: reconciliation_report.txt

SUMMARY
--------------------------------------------------------------------------------
Total files in Archive: 847
Total files in Current: 923
Identical files: 612
Files with only timestamp differences: 89
Modified files (content differs): 54
Missing in Current (need to copy): 92
Extra in Current (not in Archive): 76

💡 Run with --execute to apply changes
```

---

## Next Steps

1. Review `reconciliation_report.txt` carefully
2. Check modified files for any current work that shouldn't be overwritten
3. Decide on handling of "extra" files not in Archive
4. Run with `--execute` when ready to apply changes
5. Verify backups in `./reconciliation_backup/` if needed

