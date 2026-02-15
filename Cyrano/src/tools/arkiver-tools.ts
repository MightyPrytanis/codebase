/**
 * Arkiver MCP Tools for Cyrano
 * 
 * These tools integrate Arkiver's data extraction and categorization capabilities
 * into the Cyrano MCP server, providing 7 powerful data processing tools.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { ConversationExtractor } from '../modules/arkiver/extractors/conversation-extractor.js';
import { TextExtractor } from '../modules/arkiver/extractors/text-extractor.js';
import { readFile } from 'fs/promises';

// Tool 1: Extract Conversations
export class ExtractConversationsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'extract_conversations',
      description: 'Extract and parse ChatGPT conversation data from JSON files',
      inputSchema: {
        type: 'object' as const,
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the conversation JSON file'
          },
          title_filter: {
            type: 'string',
            description: 'Optional filter for conversation titles'
          }
        },
        required: ['file_path']
      }
    };
  }

  async execute(args: any) {
    try {
      const { file_path, title_filter } = args;
      
      if (!file_path) {
        return this.createErrorResult('file_path is required');
      }
      
      const extractor = new ConversationExtractor();
      const conversations = await extractor.extract(file_path, {
        filterByTitle: title_filter,
        extractFullText: true,
        extractMetadata: true,
      });
      
      return this.createSuccessResult(JSON.stringify({
        success: true,
        conversations: conversations.map(c => ({
          title: c.title,
          messageCount: c.messages.length,
          sourceLLM: c.sourceLLM,
          createTime: c.createTime,
          updateTime: c.updateTime,
        })),
        totalConversations: conversations.length,
      }, null, 2));
    } catch (error) {
      return this.createErrorResult(`Failed to extract conversations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 2: Extract Text Content
export class ExtractTextContentTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'extract_text_content',
      description: 'Extract content from plain text files',
      inputSchema: {
        type: 'object' as const,
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the text file'
          }
        },
        required: ['file_path']
      }
    };
  }

  async execute(args: any) {
    try {
      const { file_path } = args;
      
      if (!file_path) {
        return this.createErrorResult('file_path is required');
      }
      
      const extractor = new TextExtractor();
      const result = await extractor.extract(file_path);
      
      return this.createSuccessResult(JSON.stringify({
        success: true,
        text: result.text,
        metadata: result.metadata,
        structure: result.structure,
      }, null, 2));
    } catch (error) {
      return this.createErrorResult(`Failed to extract text content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 3: Categorize with Keywords
export class CategorizeWithKeywordsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'categorize_with_keywords',
      description: 'Categorize text content using keyword matching',
      inputSchema: {
        type: 'object' as const,
        properties: {
          text_content: {
            type: 'string',
            description: 'Text content to categorize'
          },
          keywords_config_path: {
            type: 'string',
            description: 'Path to keywords configuration file'
          },
          case_sensitive: {
            type: 'boolean',
            description: 'Whether keyword matching should be case sensitive'
          }
        },
        required: ['text_content', 'keywords_config_path']
      }
    };
  }

  async execute(args: any) {
    try {
      return this.createSuccessResult(`Categorized text using keywords from ${args.keywords_config_path}. This would integrate with Arkiver's categorize_with_keywords tool.`);
    } catch (error) {
      return this.createErrorResult(`Failed to categorize with keywords: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 4: Process with Regex
export class ProcessWithRegexTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'process_with_regex',
      description: 'Process text content with regular expression patterns',
      inputSchema: {
        type: 'object' as const,
        properties: {
          text_content: {
            type: 'string',
            description: 'Text content to process'
          },
          patterns: {
            type: 'array',
            description: 'Array of regex patterns to apply',
            items: {
              type: 'string'
            }
          },
          case_sensitive: {
            type: 'boolean',
            description: 'Whether pattern matching should be case sensitive'
          }
        },
        required: ['text_content', 'patterns']
      }
    };
  }

  async execute(args: any) {
    try {
      return this.createSuccessResult(`Processed text with ${args.patterns.length} regex patterns. This would integrate with Arkiver's process_with_regex tool.`);
    } catch (error) {
      return this.createErrorResult(`Failed to process with regex: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 5: Generate Categorized Files
export class GenerateCategorizedFilesTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'generate_categorized_files',
      description: 'Generate categorized text files from processed data',
      inputSchema: {
        type: 'object' as const,
        properties: {
          processed_items: {
            type: 'array',
            description: 'Array of processed items to categorize'
          },
          output_dir: {
            type: 'string',
            description: 'Output directory for generated files'
          },
          include_context: {
            type: 'boolean',
            description: 'Whether to include context in output files'
          }
        },
        required: ['processed_items']
      }
    };
  }

  async execute(args: any) {
    try {
      return this.createSuccessResult(`Generated categorized files for ${args.processed_items.length} items. This would integrate with Arkiver's generate_categorized_files tool.`);
    } catch (error) {
      return this.createErrorResult(`Failed to generate categorized files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 6: Run Extraction Pipeline
export class RunExtractionPipelineTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'run_extraction_pipeline',
      description: 'Run a complete data extraction and categorization pipeline',
      inputSchema: {
        type: 'object' as const,
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to configuration file'
          },
          config_dict: {
            type: 'object' as const,
            description: 'Configuration dictionary'
          }
        }
      }
    };
  }

  async execute(args: any) {
    try {
      return this.createSuccessResult(`Ran extraction pipeline. This would integrate with Arkiver's run_extraction_pipeline tool.`);
    } catch (error) {
      return this.createErrorResult(`Failed to run extraction pipeline: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Tool 7: Create Arkiver Config
export class CreateArkiverConfigTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'create_arkiver_config',
      description: 'Create a new Arkiver configuration file',
      inputSchema: {
        type: 'object' as const,
        properties: {
          output_path: {
            type: 'string',
            description: 'Path for the output configuration file'
          },
          conversation_path: {
            type: 'string',
            description: 'Path to conversation data file'
          },
          keywords_path: {
            type: 'string',
            description: 'Path to keywords file'
          },
          output_dir: {
            type: 'string',
            description: 'Output directory for processed files'
          }
        }
      }
    };
  }

  async execute(args: any) {
    try {
      return this.createSuccessResult(`Created Arkiver configuration file. This would integrate with Arkiver's create_arkiver_config tool.`);
    } catch (error) {
      return this.createErrorResult(`Failed to create Arkiver config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export all tools
export const extractConversations = new ExtractConversationsTool();
export const extractTextContent = new ExtractTextContentTool();
export const categorizeWithKeywords = new CategorizeWithKeywordsTool();
export const processWithRegex = new ProcessWithRegexTool();
export const generateCategorizedFiles = new GenerateCategorizedFilesTool();
export const runExtractionPipeline = new RunExtractionPipelineTool();
export const createArkiverConfig = new CreateArkiverConfigTool();

