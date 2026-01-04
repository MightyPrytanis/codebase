/**
 * @fileoverview ESLint 9.x flat configuration for Cyrano MCP Server
 * Copyright © 2025 Cognisint LLC
 * 
 * ESLint configuration for TypeScript project with MCP server implementation
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      'test-output.txt',
      'results.sarif',
      '*.sarif',
      'archive/**',
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript files in src/ with project references
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Disable 'no-undef' for TypeScript (TypeScript handles this)
      'no-undef': 'off',
      
      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      
      // Allow explicit any when needed (MCP server has dynamic types)
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow empty functions (common in test stubs)
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },

  // TypeScript files outside src/ without project references
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
);
