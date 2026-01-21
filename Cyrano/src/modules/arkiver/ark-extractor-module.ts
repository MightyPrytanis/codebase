/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  extractConversations,
  extractTextContent,
  categorizeWithKeywords,
  processWithRegex,
  generateCategorizedFiles,
  runExtractionPipeline,
} from '../../tools/arkiver-tools.js';
import {
  arkiverProcessFileTool,
  arkiverJobStatusTool,
} from '../../tools/arkiver-mcp-tools.js';

const ArkExtractorInputSchema = z.object({
  action: z.enum([
    'extract_conversations',
    'extract_text',
    'categorize',
    'process_regex',
    'generate_files',
    'run_pipeline',
    'process_file',
    'job_status',
  ]).describe('Action to perform'),
  file_path: z.string().optional().describe('Path to file for extraction'),
  file_id: z.string().optional().describe('File ID for processing'),
  job_id: z.string().optional().describe('Job ID for status check'),
  title_filter: z.string().optional().describe('Optional filter for conversation titles'),
  keywords: z.array(z.string()).optional().describe('Keywords for categorization'),
  regex_pattern: z.string().optional().describe('Regex pattern for processing'),
  processed_items: z.array(z.any()).optional().describe('Processed items for file generation'),
  output_dir: z.string().optional().describe('Output directory'),
  config_path: z.string().optional().describe('Configuration file path'),
  config_dict: z.any().optional().describe('Configuration dictionary'),
  processing_settings: z.any().optional().describe('Processing settings for file processing'),
});

/**
 * ArkExtractor Module
 * Document Extraction Module - Extracts content from various file formats
 * 
 * Composes extraction tools for:
 * - Conversation extraction (ChatGPT, Claude, etc.)
 * - Text content extraction
 * - Categorization with keywords
 * - Regex processing
 * - Categorized file generation
 * - Extraction pipeline execution
 * - File processing (async job pattern)
 * - Job status checking
 */
export class ArkExtractorModule extends BaseModule {
  constructor() {
    super({
      name: 'ark_extractor',
      description: 'Document Extraction Module - Extracts content from various file formats',
      version: '1.0.0',
      tools: [
        extractConversations,
        extractTextContent,
        categorizeWithKeywords,
        processWithRegex,
        generateCategorizedFiles,
        runExtractionPipeline,
        arkiverProcessFileTool,
        arkiverJobStatusTool,
      ],
    });
  }

  async initialize(): Promise<void> {
    // Module is initialized with tools in constructor
    // Additional setup can be done here if needed
  }

  async cleanup(): Promise<void> {
    // Cleanup if needed
  }

  async execute(input: z.infer<typeof ArkExtractorInputSchema>): Promise<CallToolResult> {
    try {
      // Validate input at runtime to ensure type safety
      const { action, ...args } = ArkExtractorInputSchema.parse(input);

      switch (action) {
        case 'extract_conversations':
          return await extractConversations.execute({
            file_path: args.file_path,
            title_filter: args.title_filter,
          });

        case 'extract_text':
          if (!args.file_path) {
            return this.createErrorResult('file_path is required for extract_text action');
          }
          return await extractTextContent.execute({
            file_path: args.file_path,
          });

        case 'categorize':
          return await categorizeWithKeywords.execute({
            processed_items: args.processed_items || [],
            keywords: args.keywords || [],
          });

        case 'process_regex':
          return await processWithRegex.execute({
            processed_items: args.processed_items || [],
            regex_pattern: args.regex_pattern,
          });

        case 'generate_files':
          return await generateCategorizedFiles.execute({
            processed_items: args.processed_items || [],
            output_dir: args.output_dir,
          });

        case 'run_pipeline':
          return await runExtractionPipeline.execute({
            config_path: args.config_path,
            config_dict: args.config_dict,
          });

        case 'process_file':
          return await arkiverProcessFileTool.execute({
            fileId: args.file_id,
            processingSettings: args.processing_settings,
          });

        case 'job_status':
          return await arkiverJobStatusTool.execute({
            jobId: args.job_id,
          });

        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(
        `ArkExtractor module error: ${error instanceof Error ? error.message : String(error)}`
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

export const arkExtractorModule = new ArkExtractorModule();
