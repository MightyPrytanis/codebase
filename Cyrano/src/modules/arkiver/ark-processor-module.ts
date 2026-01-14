/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  arkiverTextProcessor,
  arkiverEmailProcessor,
} from '../../tools/arkiver-processor-tools.js';

const ArkProcessorInputSchema = z.object({
  action: z.enum([
    'process_text',
    'process_email',
  ]).describe('Action to perform'),
  content: z.string().optional().describe('Text or email content to process'),
  source: z.string().optional().describe('Source identifier'),
  encoding: z.string().optional().describe('Text encoding'),
  preserveFormatting: z.boolean().optional().describe('Preserve formatting'),
  emailHeaders: z.any().optional().describe('Email headers'),
  extractAttachments: z.boolean().optional().describe('Extract email attachments'),
});

/**
 * ArkProcessor Module
 * Text Processing Module - Processes extracted text and email content
 * 
 * Composes processor tools for:
 * - Text processing (metadata, statistics, structure analysis)
 * - Email processing (headers, body, attachments)
 */
export class ArkProcessorModule extends BaseModule {
  constructor() {
    super({
      name: 'ark_processor',
      description: 'Text Processing Module - Processes extracted text and email content',
      version: '1.0.0',
      tools: [
        arkiverTextProcessor,
        arkiverEmailProcessor,
      ],
    });
  }

  async initialize(): Promise<void> {
    // Module is initialized with tools in constructor
  }

  async cleanup(): Promise<void> {
    // Cleanup if needed
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const { action, ...args } = ArkProcessorInputSchema.parse(input);

      switch (action) {
        case 'process_text':
          return await arkiverTextProcessor.execute({
            content: args.content,
            source: args.source,
            encoding: args.encoding,
            preserveFormatting: args.preserveFormatting,
          });

        case 'process_email':
          return await arkiverEmailProcessor.execute({
            content: args.content,
            source: args.source,
            emailHeaders: args.emailHeaders,
            extractAttachments: args.extractAttachments,
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `ArkProcessor module error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private createErrorResult(message: string): CallToolResult {
    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }
}

export const arkProcessorModule = new ArkProcessorModule();


}
}
}
}