#!/bin/bash
# Conservative fix for BraceCase corruption
# Only removes lines that are SOLELY closing delimiters at the end of files

set -e

echo "🔧 Fixing BraceCase corruption - Conservative approach..."

cd /home/runner/work/codebase/codebase/Cyrano

# Get list of files with TypeScript build errors
npm run build 2>&1 | grep "error TS1128" | grep -oE "src/[^(]+" | sort -u > /tmp/ts_error_files.txt

file_count=$(wc -l < /tmp/ts_error_files.txt)
echo "Found $file_count files with 'Declaration or statement expected' errors"

fixed_count=0

while IFS= read -r filepath; do
  if [ ! -f "$filepath" ]; then
    continue
  fi
  
  echo "Processing: $filepath"
  
  # Use perl to remove trailing lines that contain ONLY whitespace and/or single closing delimiters
  # This is safer than Python as it won't modify the file structure
  perl -i -pe '
    BEGIN { @lines = (); }
    push @lines, $_;
    END {
      # Trim trailing lines that are only closing delimiters
      while (@lines && $lines[-1] =~ /^\s*[)}\]]\s*$/) {
        pop @lines;
      }
      print @lines;
    }
  ' "$filepath"
  
  ((fixed_count++))
  
done < /tmp/ts_error_files.txt

echo ""
echo "✅ Processed $fixed_count files"
echo ""
echo "🔍 Verifying build..."
if npm run build 2>&1 | grep -q "error TS"; then
  error_count=$(npm run build 2>&1 | grep "error TS" | wc -l)
  echo "⚠️  Still have $error_count errors"
  npm run build 2>&1 | tail -20
else
  echo "✅ Build successful!"
fi
