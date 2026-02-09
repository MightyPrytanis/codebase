/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Microsoft Office Integration Service
 * Handles document generation and manipulation for Word, Excel, PowerPoint
 */

import fs from 'fs/promises';
import path from 'path';

export interface OfficeDocumentOptions {
  template?: string;
  format: 'docx' | 'xlsx' | 'pptx';
  outputPath?: string;
}

export interface DocumentContent {
  title: string;
  sections: Array<{
    heading?: string;
    content: string;
    style?: 'normal' | 'heading1' | 'heading2' | 'list' | 'quote';
  }>;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export class OfficeIntegrationService {
  /**
   * Generate a Word document from content
   */
  async generateWordDocument(
    content: DocumentContent,
    options: OfficeDocumentOptions = { format: 'docx' }
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Use docx library to generate documents
      // In production, this would integrate with Microsoft Office APIs
      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: content.title,
              heading: HeadingLevel.HEADING_1,
            }),
            ...content.sections.map(section => {
              if (section.heading) {
                return new Paragraph({
                  text: section.heading,
                  heading: HeadingLevel.HEADING_2,
                });
              }
              return new Paragraph({
                children: [
                  new TextRun(section.content),
                ],
              });
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const outputPath = options.outputPath || path.join(process.cwd(), 'generated', `${content.title.replace(/\s+/g, '_')}.docx`);
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, buffer);

      return { success: true, filePath: outputPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Word document',
      };
    }
  }

  /**
   * Generate a PDF using Adobe Acrobat or alternative
   */
  async generatePDF(
    content: DocumentContent | string,
    options: { outputPath?: string } = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Use puppeteer or pdfkit to generate PDF
      // In production, this would integrate with Adobe Acrobat APIs
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      const htmlContent = typeof content === 'string' 
        ? content 
        : this.contentToHTML(content);

      await page.setContent(htmlContent);
      const outputPath = options.outputPath || path.join(process.cwd(), 'generated', `document_${Date.now()}.pdf`);
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await page.pdf({ path: outputPath, format: 'Letter' });
      await browser.close();

      return { success: true, filePath: outputPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      };
    }
  }

  /**
   * Convert content to HTML for PDF generation
   */
  private contentToHTML(content: DocumentContent): string {
    const sections = content.sections.map(s => {
      if (s.heading) {
        return `<h2>${s.heading}</h2><p>${s.content}</p>`;
      }
      return `<p>${s.content}</p>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; }
            h1 { font-size: 18pt; }
            h2 { font-size: 14pt; margin-top: 20px; }
            p { font-size: 12pt; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>${content.title}</h1>
          ${sections}
        </body>
      </html>
    `;
  }

  /**
   * Draft a legal document using AI and generate Office/Acrobat format
   */
  async draftDocument(
    prompt: string,
    documentType: 'motion' | 'brief' | 'letter' | 'contract' | 'pleading',
    format: 'docx' | 'pdf' = 'docx'
  ): Promise<{ success: boolean; filePath?: string; content?: string; error?: string }> {
    try {
      // TODO: Integrate with AI service to generate document content
      // For now, return simulated response
      const content: DocumentContent = {
        title: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Document`,
        sections: [
          {
            content: `This is a draft ${documentType} generated based on: ${prompt}`,
            style: 'normal',
          },
        ],
        metadata: {
          author: 'LexFiat AI',
          subject: documentType,
        },
      };

      if (format === 'docx') {
        const result = await this.generateWordDocument(content);
        return result;
      } else {
        const result = await this.generatePDF(content);
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to draft document',
      };
    }
  }
}

export const officeIntegration = new OfficeIntegrationService();

