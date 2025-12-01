/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const DocumentProcessorSchema = z.object({
  document_text: z.string().describe('The document text to process'),
  processing_type: z.enum(['extract', 'transform', 'validate', 'format']).describe('Type of processing to perform'),
  options: z.record(z.any()).optional().describe('Processing options'),
});

export const documentProcessor = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'document_processor',
      description: 'Process legal documents for extraction, transformation, and validation',
      inputSchema: {
        type: 'object',
        properties: {
          document_text: {
            type: 'string',
            description: 'The document text to process',
          },
          processing_type: {
            type: 'string',
            enum: ['extract', 'transform', 'validate', 'format'],
            description: 'Type of processing to perform',
          },
          options: {
            type: 'object',
            description: 'Processing options',
          },
        },
        required: ['document_text', 'processing_type'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document_text, processing_type, options } = DocumentProcessorSchema.parse(args);
      const result = this.processDocument(document_text, processing_type, options);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Document processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public processDocument(document: string, type: string, options?: any) {
    switch (type) {
      case 'extract':
        return this.extractData(document, options);
      case 'transform':
        return this.transformDocument(document, options);
      case 'validate':
        return this.validateDocument(document, options);
      case 'format':
        return this.formatDocument(document, options);
      default:
        throw new Error(`Unknown processing type: ${type}`);
    }
  }

  public extractData(document: string, options?: any) {
    return {
      processing_type: 'extract',
      timestamp: new Date().toISOString(),
      extracted_data: {
        entities: this.extractEntities(document),
        dates: this.extractDates(document),
        numbers: this.extractNumbers(document),
        legal_terms: this.extractLegalTerms(document),
        parties: this.extractParties(document),
      },
      metadata: {
        document_length: document.length,
        extraction_options: options || {},
      },
    };
  }

  public transformDocument(document: string, options?: any) {
    return {
      processing_type: 'transform',
      timestamp: new Date().toISOString(),
      transformed_document: this.applyTransformations(document, options),
      transformations_applied: this.getAppliedTransformations(options),
      metadata: {
        original_length: document.length,
        transformed_length: this.applyTransformations(document, options).length,
        transformation_options: options || {},
      },
    };
  }

  public validateDocument(document: string, options?: any) {
    return {
      processing_type: 'validate',
      timestamp: new Date().toISOString(),
      validation_results: {
        is_valid: this.isValidDocument(document),
        errors: this.findValidationErrors(document),
        warnings: this.findValidationWarnings(document),
        compliance_score: this.calculateComplianceScore(document),
      },
      metadata: {
        document_length: document.length,
        validation_options: options || {},
      },
    };
  }

  public formatDocument(document: string, options?: any) {
    return {
      processing_type: 'format',
      timestamp: new Date().toISOString(),
      formatted_document: this.applyFormatting(document, options),
      formatting_applied: this.getAppliedFormatting(options),
      metadata: {
        original_length: document.length,
        formatted_length: this.applyFormatting(document, options).length,
        formatting_options: options || {},
      },
    };
  }

  public extractEntities(document: string): string[] {
    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    return document.match(entityPattern) || [];
  }

  public extractDates(document: string): string[] {
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
    return document.match(datePattern) || [];
  }

  public extractNumbers(document: string): string[] {
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    return document.match(numberPattern) || [];
  }

  public extractLegalTerms(document: string): string[] {
    const legalTerms = [
      'contract', 'agreement', 'liability', 'damages', 'breach', 'warranty',
      'indemnification', 'jurisdiction', 'governing law', 'force majeure'
    ];
    
    return legalTerms.filter(term => 
      document.toLowerCase().includes(term)
    );
  }

  public extractParties(document: string): string[] {
    const partyPattern = /(?:party|parties|between|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const matches = document.match(partyPattern) || [];
    return matches.map(match => match.replace(/(?:party|parties|between|and)\s+/i, '').trim());
  }

  public applyTransformations(document: string, options?: any): string {
    let transformed = document;
    
    if (options?.normalize_case) {
      transformed = this.normalizeCase(transformed);
    }
    
    if (options?.remove_extra_spaces) {
      transformed = this.removeExtraSpaces(transformed);
    }
    
    if (options?.standardize_formatting) {
      transformed = this.standardizeFormatting(transformed);
    }
    
    return transformed;
  }

  public getAppliedTransformations(options?: any): string[] {
    const transformations: string[] = [];
    
    if (options?.normalize_case) transformations.push('normalize_case');
    if (options?.remove_extra_spaces) transformations.push('remove_extra_spaces');
    if (options?.standardize_formatting) transformations.push('standardize_formatting');
    
    return transformations;
  }

  public isValidDocument(document: string): boolean {
    return document.length > 0 && 
           document.includes(' ') && 
           !this.hasInvalidCharacters(document);
  }

  public findValidationErrors(document: string): string[] {
    const errors: string[] = [];
    
    if (document.length === 0) {
      errors.push('Document is empty');
    }
    
    if (!document.includes(' ')) {
      errors.push('Document appears to be a single word');
    }
    
    if (this.hasInvalidCharacters(document)) {
      errors.push('Document contains invalid characters');
    }
    
    return errors;
  }

  public findValidationWarnings(document: string): string[] {
    const warnings: string[] = [];
    
    if (document.length < 100) {
      warnings.push('Document is very short');
    }
    
    if (!document.includes('.')) {
      warnings.push('Document may not contain proper sentences');
    }
    
    return warnings;
  }

  public calculateComplianceScore(document: string): number {
    let score = 0.5;
    
    if (document.length > 100) score += 0.2;
    if (document.includes('.')) score += 0.2;
    if (this.extractLegalTerms(document).length > 0) score += 0.1;
    
    return Math.min(score, 1);
  }

  public applyFormatting(document: string, options?: any): string {
    let formatted = document;
    
    if (options?.indent_paragraphs) {
      formatted = this.indentParagraphs(formatted);
    }
    
    if (options?.add_line_numbers) {
      formatted = this.addLineNumbers(formatted);
    }
    
    if (options?.standardize_quotes) {
      formatted = this.standardizeQuotes(formatted);
    }
    
    return formatted;
  }

  public getAppliedFormatting(options?: any): string[] {
    const formatting: string[] = [];
    
    if (options?.indent_paragraphs) formatting.push('indent_paragraphs');
    if (options?.add_line_numbers) formatting.push('add_line_numbers');
    if (options?.standardize_quotes) formatting.push('standardize_quotes');
    
    return formatting;
  }

  // Helper methods
  public normalizeCase(text: string): string {
    return text.toLowerCase();
  }

  public removeExtraSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  public standardizeFormatting(text: string): string {
    return text.replace(/\n\s*\n/g, '\n\n');
  }

  public hasInvalidCharacters(text: string): boolean {
    return /[^\x00-\x7F]/.test(text);
  }

  public indentParagraphs(text: string): string {
    return text.split('\n').map(line => line.trim() ? '  ' + line : line).join('\n');
  }

  public addLineNumbers(text: string): string {
    return text.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
  }

  public standardizeQuotes(text: string): string {
    return text.replace(/[""]/g, '"').replace(/['']/g, "'");
  }
})();

