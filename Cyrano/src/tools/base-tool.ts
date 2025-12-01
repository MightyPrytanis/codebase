/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { sanitizeErrorMessage } from '../utils/error-sanitizer.js';

export abstract class BaseTool {
  abstract getToolDefinition(): any;
  abstract execute(args: any): Promise<CallToolResult>;

  createErrorResult(message: string, context?: string): CallToolResult {
    // Sanitize error message for production
    const sanitized = sanitizeErrorMessage(message, context);
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${sanitized}`,
        },
      ],
      isError: true,
    };
  }

  createSuccessResult(content: string, metadata?: any): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      isError: false,
      metadata,
    };
  }
}
