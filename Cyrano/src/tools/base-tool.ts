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

  /**
   * Helper function to safely extract text from CallToolResult content
   */
  getTextFromResult(result: CallToolResult, index: number = 0): string {
    if (!result.content || result.content.length === 0) {
      return '';
    }
    const item = result.content[index];
    if (item && item.type === 'text' && 'text' in item) {
      return item.text;
    }
    return '';
  }

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
    // Standard attorney review warning for AI-generated content
    const attorneyReviewWarning = '⚠️ ATTORNEY REVIEW REQUIRED: This AI-generated content has not been reviewed by a licensed attorney. All legal documents, calculations, and research results must be reviewed and verified by a qualified attorney before use. The system and its developers disclaim all liability for any errors, omissions, or inaccuracies in AI-generated content.';

    // Merge warnings into metadata
    const enhancedMetadata = {
      ...metadata,
      attorneyReviewRequired: true,
      standardWarning: attorneyReviewWarning,
      warnings: metadata?.warnings 
        ? [...metadata.warnings, attorneyReviewWarning]
        : [attorneyReviewWarning],
    };

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      isError: false,
      metadata: enhancedMetadata,
    };
}
}

}