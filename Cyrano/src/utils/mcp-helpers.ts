/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Safely extract text content from CallToolResult
 * Handles type-safe access to content items after SDK upgrade
 */
export function getTextFromResult(result: CallToolResult, index: number = 0): string {
  if (!result.content || result.content.length === 0) {
    return '';
  }
  const item = result.content[index];
  if (item && item.type === 'text' && 'text' in item) {
    return item.text;
  }
  return '';
