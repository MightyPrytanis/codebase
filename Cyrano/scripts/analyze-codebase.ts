#!/usr/bin/env tsx

/**
 * Codebase Analysis Script
 * Analyzes codebase for mocks, missing implementations, code quality issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs', 'analysis');

// Patterns to identify mock/dummy code
const MOCK_PATTERNS = [
  /return.*mock|fake|dummy|simulate|placeholder/i,
  /TODO.*implement|FIXME.*implement/i,
  /hardcoded|static.*response/i,
  /\/\*.*mock.*\*\//i,
  /\/\/.*mock/i,
];

// Patterns to identify missing implementations
const MISSING_PATTERNS = [
  /throw new Error\(['"]Not implemented/i,
  /\/\* TODO: Implement/i,
  /\/\/ TODO: Implement/i,
  /return.*not.*implement/i,
];

function analyzeFile(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: any = {
    mocks: [],
    missing: [],
    quality: [],
  };

  // Check for mock patterns
  MOCK_PATTERNS.forEach((pattern, index) => {
    // Pattern from internal MOCK_PATTERNS array - RegExp objects converted to string source
    const matches = content.match(new RegExp(pattern.source, 'g')); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    if (matches) {
      issues.mocks.push({
        pattern: pattern.source,
        matches: matches.length,
      });
    }
  });

  // Check for missing implementations
  MISSING_PATTERNS.forEach((pattern) => {
    // Pattern from internal MISSING_PATTERNS array - RegExp objects converted to string source
    const matches = content.match(new RegExp(pattern.source, 'g')); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    if (matches) {
      issues.missing.push({
        pattern: pattern.source,
        matches: matches.length,
      });
    }
  });

  // Basic quality checks
  if (content.length > 10000) {
    issues.quality.push('Large file (>10KB) - consider splitting');
  }

  if ((content.match(/any/g) || []).length > 5) {
    issues.quality.push('Multiple uses of `any` type - reduce type safety');
  }

  if (!content.includes('@ts-') && (content.match(/eslint-disable/g) || []).length > 3) {
    issues.quality.push('Multiple eslint-disable comments');
  }

  return {
    file: filePath,
    hasIssues: issues.mocks.length > 0 || issues.missing.length > 0 || issues.quality.length > 0,
    issues,
  };
}

function analyzeCodebase() {
  console.log('🔍 Analyzing codebase...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const srcDir = path.join(PROJECT_ROOT, 'src');
  const files: string[] = [];

  // Find all TypeScript files
  function findFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const fullPath = path.join(dir, entry.name); // Safe: Development script analyzing trusted local codebase
      if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist')) {
        findFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }

  findFiles(srcDir);

  console.log(`Found ${files.length} TypeScript files\n`);

  // Analyze each file
  const results = files.map(analyzeFile);
  const filesWithIssues = results.filter(r => r.hasIssues);

  // Generate reports
  const mockReport = filesWithIssues
    .filter(r => r.issues.mocks.length > 0)
    .map(r => ({
      file: path.relative(PROJECT_ROOT, r.file),
      mocks: r.issues.mocks,
    }));

  const missingReport = filesWithIssues
    .filter(r => r.issues.missing.length > 0)
    .map(r => ({
      file: path.relative(PROJECT_ROOT, r.file),
      missing: r.issues.missing,
    }));

  const qualityReport = filesWithIssues
    .filter(r => r.issues.quality.length > 0)
    .map(r => ({
      file: path.relative(PROJECT_ROOT, r.file),
      issues: r.issues.quality,
    }));

  // Write reports
  const mockReportFile = path.join(OUTPUT_DIR, 'MOCK_CODE_REPORT.md');
  let mockContent = '# Mock Code Report\n\n';
  mockContent += `**Generated:** ${new Date().toISOString()}\n\n`;
  mockContent += `Found ${mockReport.length} files with mock/dummy code\n\n`;
  mockReport.forEach(item => {
    mockContent += `## ${item.file}\n\n`;
    item.mocks.forEach((mock: any) => {
      mockContent += `- Pattern: \`${mock.pattern}\` (${mock.matches} occurrences)\n`;
    });
    mockContent += '\n';
  );
  fs.writeFileSync(mockReportFile, mockContent);
  console.log(`✅ Generated ${mockReportFile}`);

  const missingReportFile = path.join(OUTPUT_DIR, 'MISSING_IMPLEMENTATIONS.md');
  let missingContent = '# Missing Implementations Report\n\n';
  missingContent += `**Generated:** ${new Date().toISOString()}\n\n`;
  missingContent += `Found ${missingReport.length} files with missing implementations\n\n`;
  missingReport.forEach(item => {
    missingContent += `## ${item.file}\n\n`;
    item.missing.forEach((miss: any) => {
      missingContent += `- Pattern: \`${miss.pattern}\` (${miss.matches} occurrences)\n`;
    });
    missingContent += '\n';
  ;
  fs.writeFileSync(missingReportFile, missingContent);
  console.log(`✅ Generated ${missingReportFile}`);

  const qualityReportFile = path.join(OUTPUT_DIR, 'CODE_QUALITY_REPORT.md');
  let qualityContent = '# Code Quality Report\n\n';
  qualityContent += `**Generated:** ${new Date().toISOString()}\n\n`;
  qualityContent += `Found ${qualityReport.length} files with quality issues\n\n`;
  qualityReport.forEach(item => {
    qualityContent += `## ${item.file}\n\n`;
    item.issues.forEach((issue: string) => {
      qualityContent += `- ${issue}\n`;
    });
    qualityContent += '\n';
  );
  fs.writeFileSync(qualityReportFile, qualityContent);
  console.log(`✅ Generated ${qualityReportFile}`);

  // Summary
  console.log('\n📊 Analysis Summary:');
  console.log(`  Files analyzed: ${files.length}`);
  console.log(`  Files with mocks: ${mockReport.length}`);
  console.log(`  Files with missing implementations: ${missingReport.length}`);
  console.log(`  Files with quality issues: ${qualityReport.length}`);
  console.log(`\nReports saved to: ${OUTPUT_DIR}`);
}

analyzeCodebase();
)