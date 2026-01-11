/**
 * PDF Extractor for Arkiver
 * 
 * Extracts text, metadata, and insights from PDF files
 * Uses shared verification tools for claim/citation extraction
 * 
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import pdf-parse - handle both CommonJS and ESM
// Use dynamic require to avoid issues in test environments
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pdfParse: (buffer: Buffer) => Promise<any>;
try {
  // Try CommonJS require first
  const pdfParseModule = require('pdf-parse');
  if (typeof pdfParseModule === 'function') {
    pdfParse = pdfParseModule;
  } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
    pdfParse = pdfParseModule.default;
  } else if (pdfParseModule.PDFParse && typeof pdfParseModule.PDFParse === 'function') {
    // Some versions export as PDFParse class
    pdfParse = (buffer: Buffer) => {
      const parser = new pdfParseModule.PDFParse(buffer);
      return parser.parse();
    };
  } else {
    throw new Error('pdf-parse module structure not recognized');
  }
} catch (e) {
  // Fallback: create a stub that throws a helpful error
  pdfParse = async () => {
    throw new Error('pdf-parse module not available. Install with: npm install pdf-parse');
  };
}
import Tesseract from 'tesseract.js';
import { claimExtractor } from '../../../tools/verification/claim-extractor';
import { citationChecker } from '../../../tools/verification/citation-checker';

// ExtractionSettings type
export interface ExtractionSettings {
  extractionMode?: 'standard' | 'deep' | 'fast';
  enableOCR?: boolean;
  extractEntities?: boolean;
  extractCitations?: boolean;
  extractTimeline?: boolean;
  categories?: string[];
}

/**
 * PDF extraction result
 */
export interface PDFExtractionResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
    wordCount: number;
    hasImages: boolean;
  };
  pages: Array<{
    pageNumber: number;
    text: string;
    wordCount: number;
  }>;
  claims?: any[];
  citations?: any[];
  insights?: any[];
}

/**
 * PDF Extractor
 */
export class PDFExtractor {
  /**
   * Extract content from PDF file
   */
  async extract(
    fileBuffer: Buffer,
    filename: string,
    settings: ExtractionSettings
  ): Promise<PDFExtractionResult> {
    // Parse PDF
    const pdfData = await pdfParse(fileBuffer);

    // Extract basic metadata
    const metadata = this.extractMetadata(pdfData);

    // Extract text by page
    const pages = this.extractPages(pdfData);

    // Full text
    const text = pdfData.text;

    // OCR if enabled and little text extracted
    let ocrText = '';
    if (settings.enableOCR && text.trim().length < 100) {
      ocrText = await this.performOCR(fileBuffer);
    }

    const finalText = ocrText || text;

    // Extract claims if requested
    let claims;
    if (settings.extractEntities || settings.extractCitations) {
      const claimResult = await claimExtractor.extractClaims({
        content: finalText,
        extractionType: 'all',
        minConfidence: 0.5,
        includeEntities: settings.extractEntities || false,
        includeKeywords: true,
      });
      claims = claimResult.claims;
    }

    // Extract and verify citations if requested
    let citations;
    if (settings.extractCitations && claims) {
      const citationClaims = claims.filter((c) => c.type === 'citation');
      if (citationClaims.length > 0) {
        const citationResult = await citationChecker.checkCitations({
          citations: citationClaims.map((c) => c.text),
          documentContext: finalText,
          verifyFormat: true,
          verifySource: false, // Skip network calls for MVP
          strictMode: false,
        });
        citations = citationResult.validations;
      }
    }

    return {
      text: finalText,
      metadata: {
        ...metadata,
        wordCount: this.countWords(finalText),
        hasImages: pdfData.numpages > 0 && text.length < 100, // Heuristic
      },
      pages,
      claims,
      citations,
    };
  }

  /**
   * Extract metadata from PDF
   */
  private extractMetadata(pdfData: any): PDFExtractionResult['metadata'] {
    const info = pdfData.info || {};

    return {
      title: info.Title,
      author: info.Author,
      subject: info.Subject,
      creator: info.Creator,
      producer: info.Producer,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      pageCount: pdfData.numpages,
      wordCount: 0, // Calculated later
      hasImages: false, // Calculated later
    };
  }

  /**
   * Extract text by page
   */
  private extractPages(pdfData: any): PDFExtractionResult['pages'] {
    const pages: PDFExtractionResult['pages'] = [];

    // Note: pdf-parse doesn't provide per-page text by default
    // This is a simplified implementation
    // Real implementation would use pdf-lib or pdfjs-dist for page-level extraction

    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;
    
    if (pageCount === 0) return pages;

    // Split text roughly by page (heuristic)
    const lines = fullText.split('\n');
    const linesPerPage = Math.ceil(lines.length / pageCount);

    for (let i = 0; i < pageCount; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min((i + 1) * linesPerPage, lines.length);
      const pageText = lines.slice(startLine, endLine).join('\n');

      pages.push({
        pageNumber: i + 1,
        text: pageText,
        wordCount: this.countWords(pageText),
      });
    }

    return pages;
  }

  /**
   * Perform OCR on PDF (for scanned documents)
   * Uses Tesseract.js to extract text from image-based PDFs
   */
  private async performOCR(fileBuffer: Buffer): Promise<string> {
    try {
      const language = process.env.ARKIVER_OCR_LANGUAGE || 'eng';
      
      // Tesseract.js can work with image data
      // For PDFs, we attempt OCR directly on the buffer
      // Note: For best results with multi-page PDFs, pages should be extracted as images first
      // This implementation works for single-page image PDFs and provides a foundation for enhancement
      
      const { data: { text } } = await Tesseract.recognize(
        fileBuffer,
        language,
        {
          logger: (m) => {
            // Only log progress for verbose mode
            if (process.env.ARKIVER_OCR_VERBOSE === 'true') {
              console.log('OCR progress:', m.status, m.progress);
            }
          }
        }
      );
      
      if (!text || text.trim().length === 0) {
        console.warn('OCR completed but no text extracted. PDF may need image extraction first.');
        return '';
      }
      
      return text.trim();
    } catch (error) {
      console.error('OCR failed:', error instanceof Error ? error.message : String(error));
      // Return empty string on error - caller can fall back to regular extraction
      return '';
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
}

/**
 * Default instance
 */
export const pdfExtractor = new PDFExtractor();

}
}