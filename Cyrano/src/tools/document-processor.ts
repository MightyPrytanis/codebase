/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { pdfFormFiller } from './pdf-form-filler.js';

const DocumentProcessorSchema = z.object({
  document_text: z.string().optional().describe('The document text to process'),
  processing_type: z.enum(['extract', 'transform', 'validate', 'format']).optional().describe('Type of processing to perform'),
  action: z.enum(['fill_pdf_forms', 'apply_forecast_branding', 'redact']).optional().describe('Action to perform (for PDF and redaction operations)'),
  options: z.record(z.string(), z.any()).optional().describe('Processing options'),
  // PDF form filling parameters
  form_type: z.enum(['tax_return', 'child_support', 'qdro']).optional().describe('Type of form to fill'),
  form_data: z.any().optional().describe('Data to fill into form'),
  template_buffer: z.any().optional().describe('PDF template buffer'),
  // Forecast branding parameters
  forecast_type: z.enum(['tax_return', 'child_support', 'qdro']).optional().describe('Type of forecast'),
  presentation_mode: z.enum(['strip', 'watermark', 'none']).optional().describe('Branding presentation mode'),
  user_role: z.string().optional().describe('User role for branding permissions'),
  licensed_in_any: z.boolean().optional().describe('Whether user is licensed in any jurisdiction'),
  risk_acknowledged: z.boolean().optional().describe('Whether user acknowledged risks'),
  // Redaction parameters
  redaction_rules: z.object({
    phi: z.boolean().optional(),
    hipaa: z.boolean().optional(),
    ferpa: z.boolean().optional(),
    pii: z.boolean().optional(),
    minors: z.boolean().optional(),
    former_names: z.boolean().optional(),
    prevent_deadnaming: z.boolean().optional(),
  }).optional().describe('Redaction rules configuration'),
});

export const documentProcessor = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'document_processor',
      description: 'Process legal documents for extraction, transformation, validation, PDF form filling, forecast branding, and redaction',
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
            description: 'Type of processing to perform (legacy mode)',
          },
          action: {
            type: 'string',
            enum: ['fill_pdf_forms', 'apply_forecast_branding', 'redact'],
            description: 'Action to perform (for PDF and redaction operations)',
          },
          options: {
            type: 'object',
            description: 'Processing options',
          },
          form_type: {
            type: 'string',
            enum: ['tax_return', 'child_support', 'qdro'],
            description: 'Type of form to fill (for fill_pdf_forms action)',
          },
          form_data: {
            type: 'object',
            description: 'Data to fill into form (for fill_pdf_forms action)',
          },
          template_buffer: {
            type: 'object',
            description: 'PDF template buffer (for fill_pdf_forms and apply_forecast_branding actions)',
          },
          forecast_type: {
            type: 'string',
            enum: ['tax_return', 'child_support', 'qdro'],
            description: 'Type of forecast (for apply_forecast_branding action)',
          },
          presentation_mode: {
            type: 'string',
            enum: ['strip', 'watermark', 'none'],
            description: 'Branding presentation mode (for apply_forecast_branding action)',
          },
          user_role: {
            type: 'string',
            description: 'User role for branding permissions (for apply_forecast_branding action)',
          },
          licensed_in_any: {
            type: 'boolean',
            description: 'Whether user is licensed in any jurisdiction (for apply_forecast_branding action)',
          },
          risk_acknowledged: {
            type: 'boolean',
            description: 'Whether user acknowledged risks (for apply_forecast_branding action)',
          },
          redaction_rules: {
            type: 'object',
            description: 'Redaction rules configuration (for redact action)',
            properties: {
              phi: { type: 'boolean' },
              hipaa: { type: 'boolean' },
              ferpa: { type: 'boolean' },
              pii: { type: 'boolean' },
              minors: { type: 'boolean' },
              former_names: { type: 'boolean' },
              prevent_deadnaming: { type: 'boolean' },
            },
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = DocumentProcessorSchema.parse(args);
      
      // Handle new action-based API
      if (parsed.action) {
        switch (parsed.action) {
          case 'fill_pdf_forms':
            return await this.handleFillPdfForms(parsed);
          case 'apply_forecast_branding':
            return await this.handleApplyForecastBranding(parsed);
          case 'redact':
            return await this.handleRedact(parsed);
          default:
            return this.createErrorResult(`Unknown action: ${parsed.action}`);
        }
      }
      
      // Handle legacy processing_type API
      if (parsed.processing_type && parsed.document_text) {
        const result = this.processDocument(parsed.document_text, parsed.processing_type, parsed.options);
        return this.createSuccessResult(JSON.stringify(result, null, 2));
      }
      
      return this.createErrorResult('Either action or processing_type with document_text must be provided');
    } catch (error) {
      return this.createErrorResult(`Document processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle PDF form filling - delegates to pdf-form-filler tool
   */
  private async handleFillPdfForms(parsed: z.infer<typeof DocumentProcessorSchema>): Promise<any> {
    if (!parsed.form_type || !parsed.form_data) {
      return this.createErrorResult('form_type and form_data are required for fill_pdf_forms action');
    }

    try {
      // Convert form_type to match pdf-form-filler enum
      const formTypeMap: Record<string, 'tax_return' | 'child_support' | 'qdro'> = {
        tax_return: 'tax_return',
        child_support: 'child_support',
        qdro: 'qdro',
      };

      const result = await pdfFormFiller.execute({
        action: 'fill_form',
        formType: formTypeMap[parsed.form_type] || parsed.form_type,
        formData: parsed.form_data,
        templateBuffer: parsed.template_buffer,
      });

      return result;
    } catch (error) {
      return this.createErrorResult(`PDF form filling failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle forecast branding - delegates to pdf-form-filler tool
   */
  private async handleApplyForecastBranding(parsed: z.infer<typeof DocumentProcessorSchema>): Promise<any> {
    if (!parsed.template_buffer) {
      return this.createErrorResult('template_buffer is required for apply_forecast_branding action');
    }

    // Determine presentation mode based on user permissions
    let presentationMode: 'strip' | 'watermark' | 'none' = 'strip'; // Default
    
    if (parsed.presentation_mode) {
      presentationMode = parsed.presentation_mode;
    } else if (parsed.licensed_in_any && parsed.risk_acknowledged) {
      // Licensed users who acknowledged risk can remove branding
      presentationMode = 'none';
    } else if (parsed.user_role === 'attorney' || parsed.user_role === 'lawyer') {
      // Attorneys get watermark by default
      presentationMode = 'watermark';
    }

    try {
      const result = await pdfFormFiller.execute({
        action: 'apply_branding',
        templateBuffer: parsed.template_buffer,
        presentationMode: presentationMode,
        formType: parsed.forecast_type,
      });

      return result;
    } catch (error) {
      return this.createErrorResult(`Forecast branding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle redaction - implements robust PHI/HIPAA/FERPA/PII redaction
   */
  private async handleRedact(parsed: z.infer<typeof DocumentProcessorSchema>): Promise<any> {
    if (!parsed.document_text) {
      return this.createErrorResult('document_text is required for redact action');
    }

    const rules = parsed.redaction_rules || {
      phi: true,
      hipaa: true,
      ferpa: true,
      pii: true,
      minors: true,
      former_names: true,
      prevent_deadnaming: true,
    };

    try {
      const result = this.performRedaction(parsed.document_text, rules);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Redaction failed: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * Perform robust redaction of sensitive information
   */
  public performRedaction(
    document: string,
    rules: {
      phi?: boolean;
      hipaa?: boolean;
      ferpa?: boolean;
      pii?: boolean;
      minors?: boolean;
      former_names?: boolean;
      prevent_deadnaming?: boolean;
    }
  ): {
    redacted_document: string;
    redaction_log: Array<{
      type: string;
      pattern: string;
      count: number;
      examples: string[];
    }>;
    timestamp: string;
  } {
    let redacted = document;
    const redactionLog: Array<{
      type: string;
      pattern: string;
      count: number;
      examples: string[];
    }> = [];

    // PII Detection and Redaction
    if (rules.pii) {
      // SSN patterns: XXX-XX-XXXX, XXX XX XXXX, XXXXXXXXX
      const ssnPattern = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;
      const ssnMatches = document.match(ssnPattern) || [];
      if (ssnMatches.length > 0) {
        redacted = redacted.replace(ssnPattern, '[REDACTED-SSN]');
        redactionLog.push({
          type: 'PII-SSN',
          pattern: 'SSN',
          count: ssnMatches.length,
          examples: ssnMatches.slice(0, 3),
        });
      }

      // Credit card numbers: XXXX-XXXX-XXXX-XXXX
      const ccPattern = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
      const ccMatches = document.match(ccPattern) || [];
      if (ccMatches.length > 0) {
        redacted = redacted.replace(ccPattern, '[REDACTED-CC]');
        redactionLog.push({
          type: 'PII-CC',
          pattern: 'Credit Card',
          count: ccMatches.length,
          examples: ccMatches.slice(0, 3),
        });
      }

      // Dates of birth: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
      const dobPattern = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-]\d{4}\b/g;
      const dobMatches = document.match(dobPattern) || [];
      if (dobMatches.length > 0) {
        redacted = redacted.replace(dobPattern, '[REDACTED-DOB]');
        redactionLog.push({
          type: 'PII-DOB',
          pattern: 'Date of Birth',
          count: dobMatches.length,
          examples: dobMatches.slice(0, 3),
        });
      }

      // Email addresses
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emailMatches = document.match(emailPattern) || [];
      if (emailMatches.length > 0) {
        redacted = redacted.replace(emailPattern, '[REDACTED-EMAIL]');
        redactionLog.push({
          type: 'PII-EMAIL',
          pattern: 'Email Address',
          count: emailMatches.length,
          examples: emailMatches.slice(0, 3),
        });
      }

      // Phone numbers: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXX.XXX.XXXX
      const phonePattern = /\b(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
      const phoneMatches = document.match(phonePattern) || [];
      if (phoneMatches.length > 0) {
        redacted = redacted.replace(phonePattern, '[REDACTED-PHONE]');
        redactionLog.push({
          type: 'PII-PHONE',
          pattern: 'Phone Number',
          count: phoneMatches.length,
          examples: phoneMatches.slice(0, 3),
        });
      }

      // Street addresses: Number + Street Name
      const addressPattern = /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b/gi;
      const addressMatches = document.match(addressPattern) || [];
      if (addressMatches.length > 0) {
        redacted = redacted.replace(addressPattern, '[REDACTED-ADDRESS]');
        redactionLog.push({
          type: 'PII-ADDRESS',
          pattern: 'Street Address',
          count: addressMatches.length,
          examples: addressMatches.slice(0, 3),
        });
      }
    }

    // PHI/HIPAA Detection and Redaction
    if (rules.phi || rules.hipaa) {
      // Medical record numbers: MRN, MR#, Medical Record #
      const mrnPattern = /\b(?:MRN|MR#?|Medical Record #?)[:\s]?\d{4,}\b/gi;
      const mrnMatches = document.match(mrnPattern) || [];
      if (mrnMatches.length > 0) {
        redacted = redacted.replace(mrnPattern, '[REDACTED-MRN]');
        redactionLog.push({
          type: 'PHI-MRN',
          pattern: 'Medical Record Number',
          count: mrnMatches.length,
          examples: mrnMatches.slice(0, 3),
        });
      }

      // Diagnosis codes: ICD-10 codes (e.g., E11.9, F32.1)
      const icdPattern = /\b[A-Z]\d{2}\.?\d{0,2}\b/g;
      const icdMatches = document.match(icdPattern) || [];
      if (icdMatches.length > 0) {
        // Filter to likely ICD codes (start with letter, followed by digits)
        const likelyIcd = icdMatches.filter(m => /^[A-Z]\d{2}/.test(m));
        if (likelyIcd.length > 0) {
          redacted = redacted.replace(/\b[A-Z]\d{2}\.?\d{0,2}\b/g, (match) => {
            return /^[A-Z]\d{2}/.test(match) ? '[REDACTED-ICD]' : match;
          });
          redactionLog.push({
            type: 'PHI-ICD',
            pattern: 'ICD Diagnosis Code',
            count: likelyIcd.length,
            examples: likelyIcd.slice(0, 3),
          });
        }
      }

      // Health conditions and diagnoses (common terms)
      const healthTerms = [
        /\b(?:diagnosis|diagnosed|condition|disorder|disease|syndrome|illness)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi,
        /\b(?:medication|prescription|dosage|mg|ml)\s+\d+/gi,
      ];
      healthTerms.forEach((pattern, index) => {
        const matches = document.match(pattern) || [];
        if (matches.length > 0) {
          redacted = redacted.replace(pattern, '[REDACTED-HEALTH]');
          redactionLog.push({
            type: 'PHI-HEALTH',
            pattern: index === 0 ? 'Health Condition' : 'Medication',
            count: matches.length,
            examples: matches.slice(0, 3),
          });
        }
      });
    }

    // FERPA Detection and Redaction
    if (rules.ferpa) {
      // Student ID numbers: Student ID, SID, Student #
      const studentIdPattern = /\b(?:Student ID|SID|Student #?)[:\s]?\d{4,}\b/gi;
      const studentIdMatches = document.match(studentIdPattern) || [];
      if (studentIdMatches.length > 0) {
        redacted = redacted.replace(studentIdPattern, '[REDACTED-STUDENT-ID]');
        redactionLog.push({
          type: 'FERPA-STUDENT-ID',
          pattern: 'Student ID',
          count: studentIdMatches.length,
          examples: studentIdMatches.slice(0, 3),
        });
      }

      // Grade references: Grade: A, Grade: 95, GPA: 3.5
      const gradePattern = /\b(?:Grade|GPA|Score)[:\s]?[A-F][+-]?\b|\b(?:Grade|GPA|Score)[:\s]?\d{1,3}(?:\.\d{1,2})?\b/gi;
      const gradeMatches = document.match(gradePattern) || [];
      if (gradeMatches.length > 0) {
        redacted = redacted.replace(gradePattern, '[REDACTED-GRADE]');
        redactionLog.push({
          type: 'FERPA-GRADE',
          pattern: 'Grade/GPA',
          count: gradeMatches.length,
          examples: gradeMatches.slice(0, 3),
        });
      }

      // Disciplinary records: Suspension, Expulsion, Disciplinary Action
      const disciplinaryPattern = /\b(?:Suspension|Expulsion|Disciplinary Action|Discipline)[:\s]?[A-Za-z\s]+/gi;
      const disciplinaryMatches = document.match(disciplinaryPattern) || [];
      if (disciplinaryMatches.length > 0) {
        redacted = redacted.replace(disciplinaryPattern, '[REDACTED-DISCIPLINE]');
        redactionLog.push({
          type: 'FERPA-DISCIPLINE',
          pattern: 'Disciplinary Record',
          count: disciplinaryMatches.length,
          examples: disciplinaryMatches.slice(0, 3),
        });
      }
    }

    // Minor names detection (heuristic: common patterns indicating minors)
    if (rules.minors) {
      // Patterns like "minor child", "age 15", "DOB: 2010" (recent DOB suggests minor)
      const minorPattern = /\b(?:minor|child|juvenile)[:\s]?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi;
      const minorMatches = document.match(minorPattern) || [];
      if (minorMatches.length > 0) {
        redacted = redacted.replace(minorPattern, '[REDACTED-MINOR]');
        redactionLog.push({
          type: 'MINOR-NAME',
          pattern: 'Minor Name',
          count: minorMatches.length,
          examples: minorMatches.slice(0, 3),
        });
      }
    }

    // Former names / deadnaming prevention
    // Note: This requires context about name changes, which is complex
    // For now, we'll redact patterns like "formerly known as", "previously", "nee"
    if (rules.former_names || rules.prevent_deadnaming) {
      const formerNamePattern = /\b(?:formerly known as|previously|nee|formerly|also known as)[:\s]?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi;
      const formerNameMatches = document.match(formerNamePattern) || [];
      if (formerNameMatches.length > 0) {
        redacted = redacted.replace(formerNamePattern, '[REDACTED-FORMER-NAME]');
        redactionLog.push({
          type: 'FORMER-NAME',
          pattern: 'Former Name (Deadnaming Prevention)',
          count: formerNameMatches.length,
          examples: formerNameMatches.slice(0, 3),
        });
      }
    }

    return {
      redacted_document: redacted,
      redaction_log: redactionLog,
      timestamp: new Date().toISOString(),
    };
  }
})();

