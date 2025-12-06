/**
 * Arkiver Processor Pipeline
 * 
 * Orchestrates the use of all processors in the extraction pipeline
 * Integrates text, email, insight, entity, and timeline processors
 */

import { textProcessor } from './processors/text-processor.js';
import { emailProcessor } from './processors/email-processor.js';
import { insightProcessor } from './processors/insight-processor.js';
import { entityProcessor } from './processors/entity-processor.js';
import { timelineProcessor } from './processors/timeline-processor.js';
import { citationFormatter, Jurisdiction } from '../../tools/verification/citation-formatter.js';

export interface ProcessorPipelineInput {
  text: string;
  source?: string;
  extractionSettings: {
    extractionMode?: 'standard' | 'deep' | 'fast';
    enableOCR?: boolean;
    extractEntities?: boolean;
    extractCitations?: boolean;
    extractTimeline?: boolean;
    categories?: string[];
    jurisdiction?: Jurisdiction; // For citation formatting
  };
}

export interface ProcessorPipelineOutput {
  text: {
    processed: string;
    metadata: any;
    statistics: any;
    structure: any;
  };
  entities?: {
    entities: any[];
    summary: any;
    relationships: any[];
  };
  insights?: {
    insights: any[];
    patterns: any[];
    anomalies: any[];
    trends: any[];
  };
  timeline?: {
    events: any[];
    timeline: any;
    gaps: any[];
  };
  citations?: {
    corrected: string;
    corrections: any[];
  };
  metadata: {
    processingTime: number;
    processorsUsed: string[];
  };
}

/**
 * Processor Pipeline
 * Orchestrates all processors for comprehensive document analysis
 */
export class ProcessorPipeline {
  /**
   * Process text through all relevant processors
   */
  async process(input: ProcessorPipelineInput): Promise<ProcessorPipelineOutput> {
    const startTime = Date.now();
    const processorsUsed: string[] = [];
    
    // Step 1: Text processing (always done)
    const textResult = await textProcessor.process({
      content: input.text,
      encoding: 'utf-8',
      source: input.source,
      preserveFormatting: false,
    });
    processorsUsed.push('text');
    
    // Step 2: Entity extraction (if requested)
    let entitiesResult;
    if (input.extractionSettings.extractEntities) {
      entitiesResult = await entityProcessor.process({
        text: textResult.text,
        types: ['person', 'organization', 'location', 'date', 'money', 'statute', 'case'],
      });
      processorsUsed.push('entity');
    }
    
    // Step 3: Insight processing (if requested)
    let insightsResult;
    if (input.extractionSettings.extractionMode === 'deep' || input.extractionSettings.extractionMode === 'standard') {
      insightsResult = await insightProcessor.process({
        data: textResult.text,
        type: 'claims', // Default to claims extraction
        context: input.source,
        threshold: 0.5,
      });
      processorsUsed.push('insight');
    }
    
    // Step 4: Timeline extraction (if requested)
    let timelineResult;
    if (input.extractionSettings.extractTimeline) {
      timelineResult = await timelineProcessor.process({
        data: textResult.text,
        source: input.source,
        includeRelative: false,
        sortOrder: 'chronological',
      });
      processorsUsed.push('timeline');
    }
    
    // Step 5: Citation formatting (if requested and jurisdiction specified)
    let citationsResult;
    if (input.extractionSettings.extractCitations && input.extractionSettings.jurisdiction) {
      const citationResult = await citationFormatter.formatCitations({
        text: textResult.text,
        jurisdiction: input.extractionSettings.jurisdiction,
        documentMode: true,
        correct: true,
        strictMode: true,
      });
      
      if ('correctedText' in citationResult) {
        citationsResult = {
          corrected: citationResult.correctedText,
          corrections: citationResult.corrections,
        };
        processorsUsed.push('citation');
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      text: {
        processed: textResult.text,
        metadata: textResult.metadata,
        statistics: textResult.statistics,
        structure: textResult.structure,
      },
      entities: entitiesResult,
      insights: insightsResult,
      timeline: timelineResult,
      citations: citationsResult,
      metadata: {
        processingTime,
        processorsUsed,
      },
    };
  }
  
  /**
   * Process email through email processor and then text pipeline
   */
  async processEmail(
    emailContent: string,
    format: 'eml' | 'json' | 'raw' = 'raw',
    extractionSettings: ProcessorPipelineInput['extractionSettings']
  ): Promise<ProcessorPipelineOutput & { email: any }> {
    // First process email
    const emailResult = await emailProcessor.process({
      content: emailContent,
      format,
      extractAttachments: true,
    });
    
    // Then process email body through text pipeline
    const textInput: ProcessorPipelineInput = {
      text: emailResult.body.text,
      source: emailResult.headers.from?.[0]?.address || 'email',
      extractionSettings,
    };
    
    const pipelineResult = await this.process(textInput);
    
    return {
      ...pipelineResult,
      email: {
        headers: emailResult.headers,
        attachments: emailResult.attachments,
        threadInfo: emailResult.threadInfo,
      },
    };
  }
}

export const processorPipeline = new ProcessorPipeline();

