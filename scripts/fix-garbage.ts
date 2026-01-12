
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

function getFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(baseDir, fullPath);
      if (IGNORE_DIRS.has(entry) || entry.startsWith('.')) continue;
      
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...getFiles(fullPath, baseDir));
        } else if (stat.isFile() && EXTENSIONS.has(extname(entry))) {
          files.push(fullPath);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return files;
}

function hasGarbage(content: string): boolean {
  // Pattern: Sequence of lines at end that are just closing braces/parens
  // e.g. \n}\n)\n}
  const lines = content.trimEnd().split('\n');
  if (lines.length < 5) return false;

  // Look at last 5 lines. If at least 2 of them are JUST closing delimiters, it's suspicious.
  let garbageCount = 0;
  let garbageLines: number[] = [];
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '' || line === '}' || line === ')' || line === ']' || line === '})' || line === '};' || line === ');') {
      if (line !== '') garbageCount++;
      garbageLines.push(i);
    } else {
      // Found code?
      // If we found code, stop checking.
      // But we need to make sure we don't delete valid closings.
      break;
    }
  }

  // Heuristic: If we found more than 2 lines of just closings at the very end, 
  // and the structure seems wrong (e.g. indentation doesn't match), we might flag it.
  // But strictly, if we see the PATTERN `}\n)\n}\n)` it's definitely garbage.
  
  return garbageCount >= 3; // Aggressive?
}

function fixGarbage(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  // Regex to match trailing garbage lines
  // Matches newlines followed by only closing chars, repeated at end of string
  const regex = /(\r?\n\s*[}\])]+\s*){3,}$/;
  
  if (regex.test(content)) {
    console.log(`Fixing garbage in ${filePath}`);
    const newContent = content.replace(regex, '\n');
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }
  return false;
}

function main() {
  const root = process.cwd();
  console.log('Scanning for trailing garbage...');
  const files = getFiles(root);
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixGarbage(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} files.`);
}

main();

}
}
}
)