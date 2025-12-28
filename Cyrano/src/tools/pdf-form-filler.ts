/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PDFDocument, PDFFont, rgb, StandardFonts, PDFForm, PDFTextField, PDFCheckBox, degrees } from 'pdf-lib';
import { getFormMappings, mapFormDataToFields } from './pdf-form-mappings.js';

const PDFFormFillerSchema = z.object({
  action: z.enum(['fill_form', 'apply_branding', 'get_status']).describe('Action to perform'),
  formType: z.enum(['tax_return', 'child_support', 'qdro']).optional().describe('Type of form to fill'),
  formData: z.any().optional().describe('Data to fill into form'),
  templateBuffer: z.any().optional().describe('PDF template buffer'),
  presentationMode: z.enum(['strip', 'watermark', 'none']).optional().describe('Branding presentation mode'),
});

/**
 * PDF Form Filler Tool
 * Fills PDF forms with calculated values and applies LexFiat Forecaster™ branding
 */
export const pdfFormFiller = new (class extends BaseTool {
  constructor() {
    super();
  }

  getToolDefinition() {
    return {
      name: 'pdf_form_filler',
      description: 'Fills PDF forms with calculated values and applies LexFiat Forecaster™ branding strips, watermarks, or removes branding based on user permissions',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['fill_form', 'apply_branding', 'get_status'],
            description: 'Action to perform',
          },
          formType: {
            type: 'string',
            enum: ['tax_return', 'child_support', 'qdro'],
            description: 'Type of form to fill',
          },
          formData: {
            type: 'object',
            description: 'Data to fill into form',
          },
          templateBuffer: {
            type: 'object',
            description: 'PDF template buffer',
          },
          presentationMode: {
            type: 'string',
            enum: ['strip', 'watermark', 'none'],
            description: 'Branding presentation mode',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      const parsed = PDFFormFillerSchema.parse(args);

      switch (parsed.action) {
        case 'fill_form':
          return await this.fillForm(parsed.formType, parsed.formData, parsed.templateBuffer);

        case 'apply_branding':
          return await this.applyBranding(parsed.templateBuffer, parsed.presentationMode, parsed.formType);

        case 'get_status':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tool: 'pdf_form_filler',
                  status: 'ready',
                  capabilities: ['fill_form', 'apply_branding'],
                }, null, 2),
              },
            ],
            isError: false,
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action: ${parsed.action}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in PDF Form Filler: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Fill PDF form with data
   */
  private async fillForm(
    formType: string | undefined,
    formData: any,
    templateBuffer: Buffer | undefined
  ): Promise<CallToolResult> {
    if (!templateBuffer) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Template buffer required for fill_form action',
          },
        ],
        isError: true,
      };
    }

    try {
      const pdfDoc = await PDFDocument.load(templateBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      // Get field mappings for this form type
      const mappings = getFormMappings(formType || '');
      const fieldValues = mapFormDataToFields(formType || '', formData || {}, mappings);
      
      // Create a map of field names to field objects for quick lookup
      const fieldMap = new Map<string, any>();
      fields.forEach(field => {
        fieldMap.set(field.getName(), field);
      });
      
      // Fill form fields
      let fieldsFilled = 0;
      let fieldsSkipped = 0;
      const skippedFields: string[] = [];
      
      for (const [fieldName, value] of fieldValues.entries()) {
        const field = fieldMap.get(fieldName);
        
        if (!field) {
          // Try to find field by partial match (for array indices like c1_3[0])
          const baseName = fieldName.replace(/\[\d+\]$/, '');
          const matchingFields = Array.from(fieldMap.keys()).filter(name => 
            name.startsWith(baseName) || name.includes(baseName)
          );
          
          if (matchingFields.length > 0) {
            // Handle checkbox arrays (e.g., filing status)
            if (fieldName.includes('filingStatus') && typeof value === 'number') {
              const checkboxField = fieldMap.get(matchingFields[value]);
              if (checkboxField && checkboxField instanceof PDFCheckBox) {
                checkboxField.check();
                fieldsFilled++;
              } else {
                fieldsSkipped++;
                skippedFields.push(fieldName);
              }
            } else {
              // Use first matching field
              const targetField = fieldMap.get(matchingFields[0]);
              if (targetField) {
                if (targetField instanceof PDFTextField) {
                  targetField.setText(String(value));
                  fieldsFilled++;
                } else if (targetField instanceof PDFCheckBox && (value === true || value === 'true' || value === '1')) {
                  targetField.check();
                  fieldsFilled++;
                } else {
                  fieldsSkipped++;
                  skippedFields.push(fieldName);
                }
              } else {
                fieldsSkipped++;
                skippedFields.push(fieldName);
              }
            }
          } else {
            fieldsSkipped++;
            skippedFields.push(fieldName);
          }
        } else {
          // Field found - fill it
          if (field instanceof PDFTextField) {
            field.setText(String(value));
            fieldsFilled++;
          } else if (field instanceof PDFCheckBox) {
            if (value === true || value === 'true' || value === '1' || value === 'checked') {
              field.check();
            } else {
              field.uncheck();
            }
            fieldsFilled++;
          } else {
            fieldsSkipped++;
            skippedFields.push(fieldName);
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Form filled: ${fieldsFilled} fields filled, ${fieldsSkipped} fields skipped`,
              fieldsFilled,
              fieldsSkipped,
              skippedFields: skippedFields.length > 0 ? skippedFields.slice(0, 10) : [], // Limit to first 10
              pdfSize: pdfBytes.length,
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error filling form: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Apply LexFiat Forecaster™ branding to PDF
   */
  private async applyBranding(
    templateBuffer: Buffer | undefined,
    presentationMode: string | undefined,
    formType: string | undefined
  ): Promise<CallToolResult> {
    if (!templateBuffer) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Template buffer required for apply_branding action',
          },
        ],
        isError: true,
      };
    }

    if (presentationMode === 'none') {
      // No branding applied
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'No branding applied (user override)',
            }, null, 2),
          },
        ],
        isError: false,
      };
    }

    try {
      const pdfDoc = await PDFDocument.load(templateBuffer);
      const pages = pdfDoc.getPages();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const disclaimerText = `HYPOTHETICAL FORECAST - NOT FILING READY\nThis document is a hypothetical forecast generated by LexFiat Forecaster™.\nIt is not an official tax return, child support order, or QDRO and is not filing-ready.\nConsult a licensed professional before filing or using for legal purposes.`;

      for (const page of pages) {
        const { width, height } = page.getSize();

        if (presentationMode === 'strip') {
          // Add warning strip at top of page
          page.drawRectangle({
            x: 0,
            y: height - 40,
            width: width,
            height: 40,
            color: rgb(1, 0.8, 0), // Yellow/orange warning color
          });

          page.drawText(`LexFiat Forecaster™ - HYPOTHETICAL FORECAST - NOT FILING READY`, {
            x: 10,
            y: height - 25,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          });

          page.drawText(disclaimerText, {
            x: 10,
            y: height - 15,
            size: 8,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        } else if (presentationMode === 'watermark') {
          // Add watermark across page
          page.drawText(`LexFiat Forecaster™ - HYPOTHETICAL FORECAST`, {
            x: width / 2 - 150,
            y: height / 2,
            size: 24,
            font: helveticaBoldFont,
            color: rgb(0.8, 0.8, 0.8), // Light gray
            rotate: degrees(-45), // 45 degree rotation
            opacity: 0.3,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Branding applied: ${presentationMode}`,
              pdfSize: pdfBytes.length,
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error applying branding: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
})();

