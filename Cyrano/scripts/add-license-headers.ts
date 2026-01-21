#!/usr/bin/env node
/**
 * Script to add consistent license headers to all source files
 * Adds short Apache 2.0 license header to files that don't have one
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const SHORT_HEADER = `/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */
`;

const FULL_HEADER_PATTERNS = [
  /Copyright.*Cognisint/i,
  /Licensed under the Apache License/i,
  /Apache License, Version 2\.0/i,
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
const EXCLUDE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

interface FileStats {
  processed: number;
  skipped: number;
  added: number;
  errors: number;
}

async function shouldExcludeDir(dirName: string): Promise<boolean> {
  return EXCLUDE_DIRS.includes(dirName) || dirName.startsWith('.');
}

async function shouldExcludeFile(fileName: string): Promise<boolean> {
  return EXCLUDE_FILES.includes(fileName);
}

function hasLicenseHeader(content: string): boolean {
  // Check if file already has any license header
  const firstLines = content.split('\n').slice(0, 20).join('\n');
  return FULL_HEADER_PATTERNS.some(pattern => pattern.test(firstLines));
}

function needsHeader(content: string): boolean {
  // Skip if already has header
  if (hasLicenseHeader(content)) {
    return false;
  }
  
  // Skip if file is empty or very short
  if (content.trim().length < 10) {
    return false;
  }
  
  // Skip if starts with shebang
  if (content.startsWith('#!/')) {
    return false;
  }
  
  return true;
}

function addHeader(content: string): string {
  // If file starts with shebang, add header after it
  if (content.startsWith('#!/')) {
    const lines = content.split('\n');
    const shebang = lines[0];
    const rest = lines.slice(1).join('\n');
    return `${shebang}\n${SHORT_HEADER}\n${rest}`;
  }
  
  // If file starts with existing comment, add after it
  if (content.trim().startsWith('/*') || content.trim().startsWith('//')) {
    // Find end of first comment block
    const lines = content.split('\n');
    let insertIndex = 0;
    
    if (content.trim().startsWith('/*')) {
      // Multi-line comment
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('*/')) {
          insertIndex = i + 1;
          break;
        }
      }
    } else {
      // Single-line comments - find first non-comment line
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim().startsWith('//') && lines[i].trim() !== '') {
          insertIndex = i;
          break;
        }
      }
    }
    
    const before = lines.slice(0, insertIndex).join('\n');
    const after = lines.slice(insertIndex).join('\n');
    return `${before}\n${SHORT_HEADER}${after}`;
  }
  
  // Otherwise, add at the beginning
  return `${SHORT_HEADER}\n${content}`;
}

async function processFile(filePath: string, stats: FileStats): Promise<void> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    if (!needsHeader(content)) {
      stats.skipped++;
      return;
    }
    
    const newContent = addHeader(content);
    writeFileSync(filePath, newContent, 'utf-8');
    stats.added++;
    stats.processed++;
    console.log(`✓ Added header to: ${filePath}`);
  } catch (error) {
    stats.errors++;
    console.error(`✗ Error processing ${filePath}:`, error instanceof Error ? error.message : error);
  }
}

async function processDirectory(dirPath: string, stats: FileStats): Promise<void> {
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const fullPath = join(dirPath, entry); // Safe: Development script processing trusted local codebase
      const stats_entry = await stat(fullPath);
      
      if (stats_entry.isDirectory()) {
        if (!(await shouldExcludeDir(entry))) {
          await processDirectory(fullPath, stats);
        }
      } else if (stats_entry.isFile()) {
        if (!(await shouldExcludeFile(entry))) {
          const ext = extname(entry);
          if (FILE_EXTENSIONS.includes(ext)) {
            await processFile(fullPath, stats);
          } else {
            stats.skipped++;
          }
        } else {
          stats.skipped++;
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error instanceof Error ? error.message : error);
  }
}

async function main() {
  const rootDir = process.argv[2] || join(process.cwd(), 'src');
  
  if (!existsSync(rootDir)) {
    console.error(`Directory not found: ${rootDir}`);
    process.exit(1);
  }
  
  console.log(`Adding license headers to files in: ${rootDir}`);
  console.log('---\n');
  
  const stats: FileStats = {
    processed: 0,
    skipped: 0,
    added: 0,
    errors: 0,
  };
  
  await processDirectory(rootDir, stats);
  
  console.log('\n---');
  console.log('Summary:');
  console.log(`  Files processed: ${stats.processed}`);
  console.log(`  Headers added: ${stats.added}`);
  console.log(`  Files skipped: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch(console.error);