#!/bin/bash
# Fix BraceCase corruption by removing trailing orphan delimiters from TypeScript/JavaScript files

echo "🔧 Fixing BraceCase corruption..."

# Get list of files with build errors from TypeScript compilation
cd /home/runner/work/codebase/codebase/Cyrano

# Build and capture files with errors
npm run build 2>&1 | grep "error TS" | grep -oE "src/[^(]+" | sort -u > /tmp/corrupted_files.txt

echo "Found $(wc -l < /tmp/corrupted_files.txt) files with errors"

# For each file, remove trailing orphan closing delimiters
fixed_count=0
while IFS= read -r file; do
  if [ -f "$file" ]; then
    echo "Checking: $file"
    
    # Create temp file
    tmpfile=$(mktemp)
    
    # Read file and trim trailing orphan delimiters
    python3 << 'EOF' "$file" "$tmpfile"
import sys
import re

def fix_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove trailing empty lines and lines that are ONLY orphan closers
    while lines and re.match(r'^\s*[)}\]]\s*$', lines[-1]):
        lines.pop()
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        # Ensure file ends with newline
        if lines and not lines[-1].endswith('\n'):
            f.write('\n')

if __name__ == '__main__':
    fix_file(sys.argv[1], sys.argv[2])
EOF
    
    # Replace original with fixed
    if [ -f "$tmpfile" ]; then
      mv "$tmpfile" "$file"
      ((fixed_count++))
      echo "  ✓ Fixed"
    fi
  fi
done < /tmp/corrupted_files.txt

echo ""
echo "✅ Fixed $fixed_count files"
echo ""
echo "Rebuilding to verify..."
npm run build 2>&1 | tail -20
