#!/usr/bin/env node
/**
 * Script to replace full Apache 2.0 license headers with short headers
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

const FULL_HEADER_PATTERN = /^\/\*\s*Copyright\s+\d{4}\s+Cognisint\s+LLC[\s\S]*?limitations\s+under\s+the\s+License\.\s*\*\/\s*/i;

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

interface FileStats {
  processed: number;
  replaced: number;
  skipped: number;
  errors: number;
}

async function shouldExcludeDir(dirName: string): Promise<boolean> {
  return EXCLUDE_DIRS.includes(dirName) || dirName.startsWith('.');
}

function hasFullHeader(content: string): boolean {
  return FULL_HEADER_PATTERN.test(content);
}

function replaceFullHeader(content: string): string {
  // Replace full header with short header
  return content.replace(FULL_HEADER_PATTERN, SHORT_HEADER + '\n');
}

async function processFile(filePath: string, stats: FileStats): Promise<void> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    if (!hasFullHeader(content)) {
      stats.skipped++;
      return;
    }
    
    const newContent = replaceFullHeader(content);
    writeFileSync(filePath, newContent, 'utf-8');
    stats.replaced++;
    stats.processed++;
    console.log(`✓ Replaced header in: ${filePath}`);
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
        const ext = extname(entry);
        if (FILE_EXTENSIONS.includes(ext)) {
          await processFile(fullPath, stats);
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
  
  console.log(`Replacing full headers with short headers in: ${rootDir}`);
  console.log('---\n');
  
  const stats: FileStats = {
    processed: 0,
    replaced: 0,
    skipped: 0,
    errors: 0,
  };
  
  await processDirectory(rootDir, stats);
  
  console.log('\n---');
  console.log('Summary:');
  console.log(`  Files processed: ${stats.processed}`);
  console.log(`  Headers replaced: ${stats.replaced}`);
  console.log(`  Files skipped: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
}

main().catch(console.error);