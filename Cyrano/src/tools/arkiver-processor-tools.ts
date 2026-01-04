/**
 * Arkiver Processor MCP Tools
 * 
 * Individual MCP tool wrappers for Arkiver processors
 * Enables direct access to text, email, entity, insight, and timeline processors
 * 
 * Created: 2025-11-25
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { TextProcessor, TextProcessorSchema } from '../modules/arkiver/processors/text-processor.js';
import { EmailProcessor, EmailProcessorSchema } from '../modules/arkiver/processors/email-processor.js';
import { EntityProcessor, EntityProcessorSchema } from '../modules/arkiver/processors/entity-processor.js';
import { InsightProcessor, InsightProcessorSchema } from '../modules/arkiver/processors/insight-processor.js';
import { TimelineProcessor, TimelineProcessorSchema } from '../modules/arkiver/processors/timeline-processor.js';

/**
 * Text Processor Tool
 * Extracts plain text content with metadata and structure analysis
 */
export class ArkiverTextProcessorTool extends BaseTool {
  private processor = new TextProcessor();

  getToolDefinition() {
    return {
      name: 'arkiver_process_text',
      description: 'Process text content and extract metadata, statistics, and structure. Returns word count, line count, sections, and linguistic analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Text content to process',
          },
          source: {
            type: 'string',
            description: 'Optional source identifier (e.g., filename, document ID)',
          },
          encoding: {
            type: 'string',
            default: 'utf-8',
            description: 'Text encoding (default: utf-8)',
          },
          preserveFormatting: {
            type: 'boolean',
            default: false,
            description: 'Preserve original formatting (whitespace, newlines)',
          },
        },
        required: ['content'],
      },
    };
  }

  async execute(args: unknown) {
    try {
      const validated = TextProcessorSchema.parse(args);
      const result = await this.processor.process(validated);
      
      return this.createSuccessResult(JSON.stringify({
        text: result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''), // Truncate for response
        metadata: result.metadata,
        statistics: result.statistics,
        structure: {
          headings: result.structure.headings,
          sectionCount: result.structure.sections.length,
        },
      }, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Text processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Email Processor Tool
 * Extracts structured data from email content (headers, body, attachments)
 */
export class ArkiverEmailProcessorTool extends BaseTool {
  private processor = new EmailProcessor();

  getToolDefinition() {
    return {
      name: 'arkiver_process_email',
      description: 'Process email content and extract structured data including headers, body, participants, and attachments. Supports .eml and .msg formats.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Email content (raw email text, .eml format, or parsed email object)',
          },
          format: {
            type: 'string',
            enum: ['eml', 'msg', 'json'],
            default: 'eml',
            description: 'Email format',
          },
          extractAttachments: {
            type: 'boolean',
            default: true,
            description: 'Extract attachment metadata',
          },
          parseThreads: {
            type: 'boolean',
            default: true,
            description: 'Identify and parse email threads',
          },
        },
        required: ['content'],
      },
    };
  }

  async execute(args: unknown) {
    try {
      const validated = EmailProcessorSchema.parse(args);
      const result = await this.processor.process(validated);
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Email processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Entity Processor Tool
 * Extracts named entities (persons, organizations, locations, legal entities)
 */
export class ArkiverEntityProcessorTool extends BaseTool {
  private processor = new EntityProcessor();

  getToolDefinition() {
    return {
      name: 'arkiver_extract_entities',
      description: 'Extract named entities from text including persons, organizations, locations, and legal-specific entities (case names, statutes, court names). Returns structured entity data with confidence scores.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Text content to extract entities from',
          },
          entityTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['person', 'organization', 'location', 'date', 'case', 'statute', 'court', 'attorney', 'judge'],
            },
            description: 'Entity types to extract (default: all types)',
          },
          context: {
            type: 'object',
            description: 'Optional context for entity resolution (e.g., case information)',
          },
          minConfidence: {
            type: 'number',
            default: 0.5,
            minimum: 0,
            maximum: 1,
            description: 'Minimum confidence threshold (0-1)',
          },
        },
        required: ['content'],
      },
    };
  }

  async execute(args: unknown) {
    try {
      const validated = EntityProcessorSchema.parse(args);
      const result = await this.processor.process(validated);
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Entity extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Insight Processor Tool
 * Generates insights and summaries from content using AI analysis
 */
export class ArkiverInsightProcessorTool extends BaseTool {
  private processor = new InsightProcessor();

  getToolDefinition() {
    return {
      name: 'arkiver_generate_insights',
      description: 'Generate insights, summaries, and AI-powered analysis from document content. Identifies key points, themes, and actionable items.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Content to analyze',
          },
          insightTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['summary', 'key_points', 'themes', 'action_items', 'risks', 'opportunities'],
            },
            description: 'Types of insights to generate',
          },
          context: {
            type: 'object',
            description: 'Additional context for insight generation (e.g., case type, document purpose)',
          },
          maxLength: {
            type: 'number',
            default: 500,
            description: 'Maximum length for summaries (in words)',
          },
          aiProvider: {
            type: 'string',
            enum: ['perplexity', 'openai', 'anthropic', 'gemini', 'xai', 'deepseek'],
            description: 'AI provider for analysis (default: automatic selection)',
          },
        },
        required: ['content'],
      },
    };
  }

  async execute(args: unknown) {
    try {
      const validated = InsightProcessorSchema.parse(args);
      const result = await this.processor.process(validated);
      
      // Ethics check: AI-generated insights must comply with Ten Rules
      const resultText = JSON.stringify(result, null, 2);
      const { checkGeneratedContent } = await import('../services/ethics-check-helper.js');
      const ethicsCheck = await checkGeneratedContent(resultText, {
        toolName: 'arkiver_generate_insights',
        contentType: 'report',
        strictMode: true, // Strict mode for AI-generated content
      });
      
      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return this.createErrorResult(
          'Insight generation blocked by ethics check. Content does not meet Ten Rules compliance standards.'
        );
      }
      
      // Add ethics metadata if warnings
      const finalResult = {
        ...result,
        ...(ethicsCheck.ethicsCheck.warnings.length > 0 && {
          _ethicsMetadata: {
            reviewed: true,
            warnings: ethicsCheck.ethicsCheck.warnings,
            complianceScore: ethicsCheck.ethicsCheck.complianceScore,
            auditId: ethicsCheck.ethicsCheck.auditId,
          },
        }),
      };
      
      return this.createSuccessResult(JSON.stringify(finalResult, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Insight generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Timeline Processor Tool
 * Extracts dates and events to create a chronological timeline
 */
export class ArkiverTimelineProcessorTool extends BaseTool {
  private processor = new TimelineProcessor();

  getToolDefinition() {
    return {
      name: 'arkiver_extract_timeline',
      description: 'Extract dates and events from content to create a chronological timeline. Identifies deadlines, filing dates, and key events.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Content to extract timeline from',
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: 'Filter events after this date (ISO format: YYYY-MM-DD)',
          },
          endDate: {
            type: 'string',
            format: 'date',
            description: 'Filter events before this date (ISO format: YYYY-MM-DD)',
          },
          eventTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['filing', 'hearing', 'deadline', 'correspondence', 'decision', 'other'],
            },
            description: 'Event types to extract',
          },
          includeInferred: {
            type: 'boolean',
            default: false,
            description: 'Include inferred dates (e.g., "30 days after filing")',
          },
        },
        required: ['content'],
      },
    };
  }

  async execute(args: unknown) {
    try {
      const validated = TimelineProcessorSchema.parse(args);
      const result = await this.processor.process(validated);
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Timeline extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export tool instances
export const arkiverTextProcessor = new ArkiverTextProcessorTool();
export const arkiverEmailProcessor = new ArkiverEmailProcessorTool();
export const arkiverEntityProcessor = new ArkiverEntityProcessorTool();
export const arkiverInsightProcessor = new ArkiverInsightProcessorTool();
export const arkiverTimelineProcessor = new ArkiverTimelineProcessorTool();
