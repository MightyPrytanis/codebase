#!/usr/bin/env node
/**
 * BraceCase Scanner - Scans all code files for unbalanced braces, brackets, and parentheses
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

interface DelimiterError {
  file: string;
  line: number;
  type: 'missing-opener' | 'missing-closer' | 'mismatched' | 'extra-opener' | 'extra-closer';
  delimiter: string;
  context: string[];
  openerLine?: number;
}

interface ScanResult {
  file: string;
  errors: DelimiterError[];
  fixed: boolean;
}

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.yml', '.yaml', '.md'
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache', 
  'coverage', '.turbo', '.vercel', '.svelte-kit'
]);

function shouldIgnorePath(path: string): boolean {
  const parts = path.split('/');
  return parts.some(part => IGNORE_DIRS.has(part) || part.startsWith('.'));
}

function getFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(baseDir, fullPath);
      
      if (shouldIgnorePath(relPath)) {
        continue;
      }
      
      try {
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getFiles(fullPath, baseDir));
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (CODE_EXTENSIONS.has(ext)) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // Skip files we can't access
        continue;
      }
    }
  } catch (err) {
    // Skip directories we can't access
  }
  
  return files;
}

interface DelimiterState {
  stack: Array<{ type: string; line: number; char: string }>;
  inString: boolean;
  stringChar: string | null;
  inComment: boolean;
  commentType: 'single' | 'multi' | null;
  inTemplate: boolean;
  templateDepth: number;
  inRegex: boolean;
  inMarkdownCodeBlock: boolean;
  markdownCodeBlockFence: string | null;
  escapeNext: boolean;
  fileExt: string;
}

function scanFile(filePath: string): DelimiterError[] {
  const errors: DelimiterError[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileExt = extname(filePath);
    const isMarkdown = fileExt === '.md';
    const isJSX = fileExt === '.tsx' || fileExt === '.jsx';
    
    const state: DelimiterState = {
      stack: [],
      inString: false,
      stringChar: null,
      inComment: false,
      commentType: null,
      inTemplate: false,
      templateDepth: 0,
      inRegex: false,
      inMarkdownCodeBlock: false,
      markdownCodeBlockFence: null,
      escapeNext: false,
      fileExt
    };
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      
      // Handle markdown code blocks
      if (isMarkdown) {
        const codeBlockMatch = line.match(/^(\s*)```/);
        if (codeBlockMatch) {
          if (state.inMarkdownCodeBlock && state.markdownCodeBlockFence === '```') {
            state.inMarkdownCodeBlock = false;
            state.markdownCodeBlockFence = null;
          } else if (!state.inMarkdownCodeBlock) {
            state.inMarkdownCodeBlock = true;
            state.markdownCodeBlockFence = '```';
          }
          continue; // Skip the fence line entirely
        }
      }
      
      // Skip entire line if in markdown code block
      if (state.inMarkdownCodeBlock) {
        continue;
      }
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i < line.length - 1 ? line[i + 1] : null;
        const prevChar = i > 0 ? line[i - 1] : null;
        const prev2Char = i > 1 ? line[i - 2] : null;
        
        // Handle escape sequences
        if (state.escapeNext) {
          state.escapeNext = false;
          continue;
        }
        
        if (char === '\\' && (state.inString || state.inTemplate || state.inRegex)) {
          state.escapeNext = true;
          continue;
        }
        
        // Handle regex patterns (only in JS/TS files, not in strings/templates)
        // Note: Regex detection is complex and error-prone, so we'll be conservative
        // Only detect obvious cases to avoid false positives
        if (!state.inString && !state.inTemplate && !state.inComment && !state.inRegex &&
            (fileExt === '.ts' || fileExt === '.js' || fileExt === '.tsx' || fileExt === '.jsx')) {
          // Very conservative regex detection - only if it's clearly a regex
          if (char === '/' && !state.inRegex && nextChar && nextChar !== '/' && nextChar !== '*') {
            // Only treat as regex if preceded by =, (, ,, [, or whitespace (not after identifier)
            const looksLikeRegex = /[=(,\[\s]/.test(prevChar || ' ') && 
                                   !/[a-zA-Z0-9_)]/.test(prevChar || '');
            if (looksLikeRegex) {
              state.inRegex = true;
              continue;
            }
          }
        }
        
        if (state.inRegex) {
          if (char === '/' && !state.escapeNext) {
            // End of regex
            state.inRegex = false;
            // Skip potential flags
            let flagIndex = i + 1;
            while (flagIndex < line.length && /[gimsuy]/.test(line[flagIndex])) {
              flagIndex++;
            }
            i = flagIndex - 1;
            continue;
          }
          continue;
        }
        
        // Handle comments
        if (!state.inString && !state.inTemplate) {
          if (char === '/' && nextChar === '/') {
            // Single-line comment
            break; // Rest of line is comment
          }
          if (char === '/' && nextChar === '*') {
            state.inComment = true;
            state.commentType = 'multi';
            i++; // Skip next char
            continue;
          }
          if (state.inComment && state.commentType === 'multi') {
            if (char === '*' && nextChar === '/') {
              state.inComment = false;
              state.commentType = null;
              i++; // Skip next char
              continue;
            }
            continue;
          }
          if (char === '#' && (lineNum === 0 || prevChar === '\n' || i === 0)) {
            // Python-style comment (only at start of line or after newline)
            break;
          }
        }
        
        // Skip everything in comments
        if (state.inComment) {
          continue;
        }
        
        // Handle strings
        if (!state.inString && !state.inTemplate) {
          if (char === '"' || char === "'") {
            state.inString = true;
            state.stringChar = char;
            continue;
          }
          if (char === '`') {
            state.inTemplate = true;
            state.templateDepth = 1;
            continue;
          }
        } else if (state.inString) {
          if (char === state.stringChar && !state.escapeNext) {
            state.inString = false;
            state.stringChar = null;
          }
          continue;
        } else if (state.inTemplate) {
          if (char === '`' && !state.escapeNext) {
            state.templateDepth--;
            if (state.templateDepth === 0) {
              state.inTemplate = false;
            }
            continue;
          }
          // In template literals, ${} expressions increase depth
          if (char === '{' && !state.escapeNext && prevChar === '$') {
            // This is ${} in template - don't count as delimiter
            continue;
          }
          if (char === '{' && !state.escapeNext) {
            state.templateDepth++;
            continue;
          }
          if (char === '}' && !state.escapeNext) {
            state.templateDepth--;
            if (state.templateDepth === 0) {
              state.inTemplate = false;
            }
            continue;
          }
          continue;
        }
        
        // Handle JSX (only in .tsx/.jsx files)
        // Note: JSX is complex - we'll be very conservative to avoid false positives
        // For now, we'll only skip JSX tags that are clearly JSX (not comparison operators)
        // This is a simplified approach - a full JSX parser would be more accurate
        if (isJSX && !state.inString && !state.inTemplate && !state.inComment && !state.inRegex) {
          // Only skip JSX if it's clearly a tag (starts with < followed by letter or /)
          // This is imperfect but better than skipping all < and >
          if (char === '<' && nextChar && (/[a-zA-Z\/]/.test(nextChar))) {
            // This looks like JSX - skip to matching >
            // Find the matching > (simplified - doesn't handle nested tags)
            let depth = 1;
            let j = i + 1;
            while (j < line.length && depth > 0) {
              if (line[j] === '<' && j + 1 < line.length && line[j + 1] !== '/') {
                depth++;
              } else if (line[j] === '>' && (j === 0 || line[j - 1] !== '-')) {
                depth--;
                if (depth === 0) {
                  i = j; // Skip to the closing >
                  break;
                }
              }
              j++;
            }
            if (depth === 0) {
              continue; // Successfully skipped JSX tag
            }
            // If we couldn't find matching >, treat < as regular character
          }
        }
        
        // Now check delimiters (only if not in string/comment/regex/template)
        if (char === '{' || char === '[' || char === '(') {
          state.stack.push({ type: char, line: lineNum + 1, char });
        } else if (char === '}' || char === ']' || char === ')') {
          const expected = char === '}' ? '{' : char === ']' ? '[' : '(';
          
          if (state.stack.length === 0) {
            // Extra closer
            errors.push({
              file: filePath,
              line: lineNum + 1,
              type: 'extra-closer',
              delimiter: char,
              context: getContext(lines, lineNum, 3)
            });
          } else {
            const top = state.stack[state.stack.length - 1];
            if (top.type !== expected) {
              // Mismatched
              errors.push({
                file: filePath,
                line: lineNum + 1,
                type: 'mismatched',
                delimiter: char,
                context: getContext(lines, lineNum, 3),
                openerLine: top.line
              });
              state.stack.pop();
            } else {
              state.stack.pop();
            }
          }
        }
      }
    }
    
    // Check for unclosed delimiters
    for (const unclosed of state.stack) {
      errors.push({
        file: filePath,
        line: unclosed.line,
        type: 'missing-closer',
        delimiter: unclosed.type,
        context: getContext(lines, unclosed.line - 1, 3)
      });
    }
    
  } catch (err) {
    // Skip files we can't read
  }
  
  return errors;
}

function getContext(lines: string[], lineNum: number, contextLines: number): string[] {
  const start = Math.max(0, lineNum - contextLines);
  const end = Math.min(lines.length, lineNum + contextLines + 1);
  return lines.slice(start, end);
}

function fixError(filePath: string, error: DelimiterError, lines: string[]): boolean {
  // Only fix unambiguous cases
  if (error.type === 'missing-closer') {
    // Add closer at end of file or end of block
    const closer = error.delimiter === '{' ? '}' : error.delimiter === '[' ? ']' : ')';
    const lastLine = lines[lines.length - 1];
    const trimmed = lastLine.trimEnd();
    const indent = lastLine.length - trimmed.length;
    const indentStr = lastLine.substring(0, indent);
    lines.push(indentStr + closer);
    return true;
  } else if (error.type === 'extra-closer') {
    // Remove extra closer
    const line = lines[error.line - 1];
    const newLine = line.replace(error.delimiter, '');
    if (newLine.trim() === '') {
      lines.splice(error.line - 1, 1);
    } else {
      lines[error.line - 1] = newLine;
    }
    return true;
  }
  return false;
}

function main() {
  const rootDir = process.cwd();
  console.log(`🔍 Scanning codebase for unbalanced delimiters...\n`);
  
  const files = getFiles(rootDir);
  console.log(`Found ${files.length} files to scan\n`);
  
  const results: ScanResult[] = [];
  let totalErrors = 0;
  let totalFixed = 0;
  
  for (const file of files) {
    const errors = scanFile(file);
    if (errors.length > 0) {
      totalErrors += errors.length;
      
      // Try to fix unambiguous errors
      let fixed = false;
      const fixableErrors = errors.filter(e => 
        e.type === 'missing-closer' || e.type === 'extra-closer'
      );
      
      if (fixableErrors.length > 0) {
        try {
          const content = readFileSync(file, 'utf-8');
          const lines = content.split('\n');
          let madeChanges = false;
          
          for (const error of fixableErrors) {
            if (fixError(file, error, lines)) {
              madeChanges = true;
            }
          }
          
          if (madeChanges) {
            // Re-scan to verify
            const newContent = lines.join('\n');
            writeFileSync(file, newContent, 'utf-8');
            const newErrors = scanFile(file);
            
            if (newErrors.length < errors.length) {
              fixed = true;
              totalFixed += errors.length - newErrors.length;
              console.log(`✅ Fixed ${errors.length - newErrors.length} error(s) in ${file}`);
            }
          }
        } catch (err) {
          // Couldn't fix, continue
        }
      }
      
      results.push({
        file,
        errors: fixed ? scanFile(file) : errors,
        fixed
      });
    }
  }
  // Report results
  console.log(`\n📊 Scan Complete\n`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files with errors: ${results.length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Errors fixed: ${totalFixed}\n`);
  
  if (results.length > 0) {
    console.log(`\n❌ ERRORS FOUND:\n`);
    
    for (const result of results) {
      console.log(`\n${result.file}:`);
      for (const error of result.errors) {
        console.log(`  Line ${error.line}: ${error.type} - ${error.delimiter}`);
        if (error.openerLine) {
          console.log(`    (opener at line ${error.openerLine})`);
        }
        console.log(`    Context:`);
        error.context.forEach((line, idx) => {
          const lineNum = error.line - Math.floor(error.context.length / 2) + idx;
          const marker = lineNum === error.line ? '>>>' : '   ';
          console.log(`    ${marker} ${lineNum}: ${line}`);
        });
      }
    }
  } else {
    console.log(`✅ No unbalanced delimiters found!`);
  }
  
  process.exit(results.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}