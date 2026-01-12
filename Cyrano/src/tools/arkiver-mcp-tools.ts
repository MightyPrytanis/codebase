/**
 * Arkiver MCP Tools
 * 
 * Implements the MCP interface contract for Arkiver file processing
 * Tools: arkiver_process_file, arkiver_job_status
 * 
 * Created: 2025-01-XX
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { db } from '../db.js';
import { arkiverFiles, arkiverJobs } from '../modules/arkiver/schema.js';
import { eq } from 'drizzle-orm';
import { defaultJobQueue, JobStatus } from '../modules/arkiver/queue/database-queue.js';

const jobQueue = defaultJobQueue;
import { PDFExtractor } from '../modules/arkiver/extractors/pdf-extractor.js';
import { DOCXExtractor } from '../modules/arkiver/extractors/docx-extractor.js';
import { ConversationExtractor } from '../modules/arkiver/extractors/conversation-extractor.js';
import { TextExtractor } from '../modules/arkiver/extractors/text-extractor.js';
import { processorPipeline } from '../modules/arkiver/processor-pipeline.js';
import { Jurisdiction } from './verification/citation-formatter.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { apiValidator } from '../utils/api-validator.js';
import { AIProvider } from '../services/ai-service.js';

/**
 * Processing Settings Schema
 */
const ProcessingSettingsSchema = z.object({
  extractionMode: z.enum(['standard', 'deep', 'fast']).describe('Extraction depth'),
  enableOCR: z.boolean().optional().describe('Enable OCR for scanned documents'),
  categories: z.array(z.string()).optional().describe('Pre-defined categories to apply'),
  extractCitations: z.boolean().optional().default(true).describe('Extract legal citations'),
  extractEntities: z.boolean().optional().default(true).describe('Extract entities'),
  extractTimeline: z.boolean().optional().default(true).describe('Extract dates and create timeline'),
  caseId: z.string().optional().describe('Associate with LexFiat case'),
  jurisdiction: z.enum(['michigan', 'federal', 'bluebook', 'auto']).optional().describe('Jurisdiction for citation formatting'),
  useLLM: z.boolean().optional().default(false).describe('Use LLM for intelligent insight extraction (recommended for deep mode)'),
  llmProvider: z.enum(['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider for LLM extraction (default: auto-select)'),
  insightType: z.enum(['general', 'legal', 'medical', 'business']).optional().default('general').describe('Type of insights to extract'),
  customPrompt: z.string().optional().describe('Custom prompt for LLM extraction'),
});

/**
 * Process File Tool
 * Initiates processing of an uploaded file (async job pattern)
 */
export class ArkiverProcessFileTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'arkiver_process_file',
      description: 'Initiates processing of an uploaded file. Returns immediately with a job ID. Use arkiver_job_status to check progress.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID from upload endpoint',
          },
          processingSettings: {
            type: 'object' as const,
            properties: {
              extractionMode: {
                type: 'string',
                enum: ['standard', 'deep', 'fast'],
                description: 'Extraction depth: standard (balanced), deep (comprehensive), fast (quick scan)',
              },
              enableOCR: {
                type: 'boolean',
                description: 'Enable OCR for scanned documents/images',
              },
              categories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Pre-defined categories to apply',
              },
              extractCitations: {
                type: 'boolean',
                default: true,
                description: 'Extract legal citations',
              },
              extractEntities: {
                type: 'boolean',
                default: true,
                description: 'Extract entities (parties, attorneys, judges)',
              },
              extractTimeline: {
                type: 'boolean',
                default: true,
                description: 'Extract dates and create timeline',
              },
              useLLM: {
                type: 'boolean',
                default: false,
                description: 'Use LLM for intelligent insight extraction (recommended for deep mode)',
              },
              llmProvider: {
                type: 'string',
                enum: ['perplexity', 'anthropic', 'openai', 'google', 'xai', 'deepseek', 'auto'],
                default: 'auto',
                description: 'AI provider for LLM extraction (default: auto-select based on task and performance)',
              },
              insightType: {
                type: 'string',
                enum: ['general', 'legal', 'medical', 'business'],
                default: 'general',
                description: 'Type of insights to extract',
              },
              customPrompt: {
                type: 'string',
                description: 'Custom prompt for LLM extraction',
              },
              caseId: {
                type: 'string',
                description: 'Optional: Associate with LexFiat case',
              },
              jurisdiction: {
                type: 'string',
                enum: ['michigan', 'federal', 'bluebook', 'auto'],
                description: 'Jurisdiction for citation formatting',
              },
            },
            required: ['extractionMode'],
          },
        },
        required: ['fileId', 'processingSettings'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { fileId, processingSettings } = args;
      
      // Validate input
      const settings = ProcessingSettingsSchema.parse(processingSettings);
      
      // Verify file exists
      const [file] = await db
        .select()
        .from(arkiverFiles)
        .where(eq(arkiverFiles.id, fileId))
        .limit(1);
      
      if (!file) {
        return this.createErrorResult(`File not found: ${fileId}`);
      }
      
      if (file.status !== 'uploaded') {
        return this.createErrorResult(`File is not in 'uploaded' status. Current status: ${file.status}`);
      }
      
      // Create job
      const jobId = await jobQueue.createJob({
        type: 'file_extraction',
        fileId: fileId,
        config: {
          extractionMode: settings.extractionMode,
          enableOCR: settings.enableOCR || false,
          categories: settings.categories || [],
          extractCitations: settings.extractCitations ?? true,
          extractEntities: settings.extractEntities ?? true,
          extractTimeline: settings.extractTimeline ?? true,
          caseId: settings.caseId,
          jurisdiction: settings.jurisdiction,
        },
      });
      
      // Update file status
      await db
        .update(arkiverFiles)
        .set({
          status: 'processing',
          extractionSettings: {
            extractionMode: settings.extractionMode,
            enableOCR: settings.enableOCR,
            categories: settings.categories,
            extractCitations: settings.extractCitations,
            extractEntities: settings.extractEntities,
            extractTimeline: settings.extractTimeline,
          },
        })
        .where(eq(arkiverFiles.id, fileId));
      
      // Start processing (async)
      this.processFileAsync(jobId, fileId, file, settings).catch((error) => {
        console.error(`Error processing file ${fileId}:`, error);
      });
      
      return this.createSuccessResult(
        JSON.stringify({
          success: true,
          jobId: jobId,
          fileId: fileId,
          status: 'queued',
          message: 'Processing started',
        })
      );
    } catch (error) {
      return this.createErrorResult(
        `Error in arkiver_process_file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Process file asynchronously
   */
  private async processFileAsync(
    jobId: string,
    fileId: string,
    file: any,
    settings: z.infer<typeof ProcessingSettingsSchema>
  ) {
    try {
      // Update job status to processing
      await jobQueue.updateJobStatus(jobId, JobStatus.PROCESSING);
      
      // Read file from storage
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = file.storagePath;
      
      if (!filePath || !(await fs.access(filePath).then(() => true).catch(() => false))) {
        throw new Error(`File not found at storage path: ${filePath}`);
      }
      
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(file.fileName).toLowerCase();
      const fileType = file.fileType?.toLowerCase() || ext.replace('.', '');
      
      // Extract based on file type
      let extractedText = '';
      let metadata: any = {};
      
      if (ext === '.pdf') {
        const extractor = new PDFExtractor();
        const result = await extractor.extract(fileBuffer, file.fileName, {
          extractionMode: settings.extractionMode || 'standard',
          enableOCR: settings.enableOCR || false,
          extractEntities: settings.extractEntities ?? true,
          extractCitations: settings.extractCitations ?? true,
        });
        extractedText = result.text;
        metadata = result.metadata;
      } else if (ext === '.docx' || ext === '.doc') {
        const extractor = new DOCXExtractor();
        const result = await extractor.extract(fileBuffer, file.fileName, {
          extractionMode: settings.extractionMode || 'standard',
          extractEntities: settings.extractEntities ?? true,
          extractCitations: settings.extractCitations ?? true,
        });
        extractedText = result.text;
        metadata = result.metadata;
      } else if (fileType === 'json' || (ext === '.json' && file.sourceType === 'conversation')) {
        // LLM conversation JSON (ChatGPT, Claude, etc.)
        const extractor = new ConversationExtractor();
        const conversations = await extractor.extract(filePath, {
          extractFullText: true,
          extractMetadata: true,
        });
        // Combine all conversations into single text
        extractedText = conversations.map(c => extractor.getTextContent(c)).join('\n\n');
        metadata = {
          conversationCount: conversations.length,
          sourceLLM: conversations[0]?.sourceLLM || 'Unknown',
          conversations: conversations.map(c => ({
            title: c.title,
            messageCount: c.messages.length,
          })),
        };
      } else if (ext === '.md' || ext === '.markdown' || ext === '.txt') {
        // Text or Markdown file
        const extractor = new TextExtractor();
        const result = await extractor.extract(filePath);
        extractedText = result.text;
        metadata = {
          ...result.metadata,
          structure: result.structure,
        };
      } else {
        // Plain text fallback
        extractedText = fileBuffer.toString('utf-8');
        metadata = {
          filename: file.fileName,
          fileSize: fileBuffer.length,
        };
      }
      
      // Process through pipeline
      const jurisdiction = settings.jurisdiction 
        ? (settings.jurisdiction.toUpperCase() as Jurisdiction)
        : undefined;
      
      const pipelineResult = await processorPipeline.process({
        text: extractedText,
        source: file.fileName,
        extractionSettings: {
          extractionMode: settings.extractionMode || 'standard',
          enableOCR: settings.enableOCR,
          extractEntities: settings.extractEntities ?? true,
          extractCitations: settings.extractCitations ?? true,
          extractTimeline: settings.extractTimeline ?? true,
          categories: settings.categories,
          jurisdiction: jurisdiction,
          useLLM: settings.useLLM ?? (settings.extractionMode === 'deep'),
          llmProvider: (() => {
            // Resolve provider (handle 'auto' mode with user sovereignty)
            if (settings.llmProvider === 'auto' || !settings.llmProvider) {
              return aiProviderSelector.getProviderForTask({
                taskType: 'arkiver_extraction',
                subjectMatter: settings.insightType || 'general',
                complexity: settings.extractionMode === 'deep' ? 'high' : 'medium',
                preferredProvider: 'auto',
                balanceQualitySpeed: settings.extractionMode === 'deep' ? 'quality' : 'balanced',
              });
            } else {
              // User explicitly selected a provider (user sovereignty)
              const validation = apiValidator.validateProvider(settings.llmProvider as AIProvider);
              if (!validation.valid) {
                throw new Error(`Selected AI provider ${settings.llmProvider} is not configured: ${validation.error}`);
              }
              return settings.llmProvider as AIProvider;
            }
          })(),
          insightType: settings.insightType || 'general',
          customPrompt: settings.customPrompt,
        },
      });
      
      // Create insights
      const insights = pipelineResult.insights?.insights || [];
      const entities = pipelineResult.entities?.entities || [];
      
      // Update file status
      await db
        .update(arkiverFiles)
        .set({
          status: 'processed',
          processedAt: new Date(),
          metadata: {
            ...metadata,
            wordCount: extractedText.split(/\s+/).length,
            pageCount: metadata.pageCount || 1,
          },
        })
        .where(eq(arkiverFiles.id, fileId));
      
      // Update job with results
      await jobQueue.completeJob(jobId, {
        insightsCreated: insights.length,
        entitiesExtracted: entities.length,
        processingTime: pipelineResult.metadata.processingTime,
      });
      
    } catch (error) {
      // Update job with error
      await jobQueue.failJob(jobId, {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: { fileId },
      });
      
      // Update file status
      await db
        .update(arkiverFiles)
        .set({
          status: 'failed',
        })
        .where(eq(arkiverFiles.id, fileId));
      
      // Update job with error instead (error field is in arkiverJobs, not arkiverFiles)
      if (jobId) {
        await db
          .update(arkiverJobs)
          .set({
            status: 'failed',
            error: {
              code: 'PROCESSING_ERROR',
              message: error instanceof Error ? error.message : String(error),
            },
          })
          .where(eq(arkiverJobs.id, jobId));
      }
    }
  }
}

/**
 * Job Status Tool
 * Check status of processing job
 */
export class ArkiverJobStatusTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'arkiver_job_status',
      description: 'Check the status of a processing job. Returns current status, progress, and results if completed.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          jobId: {
            type: 'string',
            description: 'Job ID from arkiver_process_file',
          },
        },
        required: ['jobId'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { jobId } = args;
      
      if (!jobId) {
        return this.createErrorResult('jobId is required');
      }
      
      // Get job from queue
      const job = await jobQueue.getJob(jobId);
      
      if (!job) {
        return this.createErrorResult(`Job not found: ${jobId}`);
      }
      
      // Format response
      const response: any = {
        success: true,
        jobId: job.id,
        status: job.status,
        progress: job.progress || 0,
        createdAt: job.createdAt.toISOString(),
      };
      
      if (job.status === 'completed' && job.result) {
        response.result = job.result;
        response.completedAt = job.completedAt?.toISOString();
      }
      
      if (job.status === 'failed' && job.error) {
        response.error = job.error;
        response.failedAt = job.completedAt?.toISOString();
      }
      
      if (job.status === 'processing') {
        response.processingStartedAt = job.startedAt?.toISOString();
      }
      
      return this.createSuccessResult(JSON.stringify(response, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in arkiver_job_status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Export singleton instances
export const arkiverProcessFileTool = new ArkiverProcessFileTool();
export const arkiverJobStatusTool = new ArkiverJobStatusTool();

}
}
}
}
)
}
)
)
}
}
}
}
}
}
}
}