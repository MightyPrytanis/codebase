/**
 * DOCX Extractor for Arkiver
 * 
 * Extracts text, metadata, and insights from DOCX files
 * Uses shared verification tools for claim/citation extraction
 * 
 * Created: 2025-11-22
 */

import mammoth from 'mammoth';
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
 * DOCX extraction result
 */
export interface DOCXExtractionResult {
  text: string;
  html: string;
  metadata: {
    filename: string;
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    hasFormatting: boolean;
  };
  structure: {
    headings: Array<{
      level: number;
      text: string;
      position: number;
    }>;
    lists: Array<{
      type: 'ordered' | 'unordered';
      items: string[];
      position: number;
    }>;
  };
  claims?: any[];
  citations?: any[];
  insights?: any[];
}

/**
 * DOCX Extractor
 */
export class DOCXExtractor {
  /**
   * Extract content from DOCX file
   */
  async extract(
    fileBuffer: Buffer,
    filename: string,
    settings: ExtractionSettings
  ): Promise<DOCXExtractionResult> {
    // Extract text with mammoth
    const textResult = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = textResult.value;

    // Extract HTML (preserves formatting)
    const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer });
    const html = htmlResult.value;

    // Extract structure
    const structure = this.extractStructure(html, text);

    // Calculate metadata
    const metadata = this.extractMetadata(filename, text, html);

    // Extract claims if requested
    let claims;
    if (settings.extractEntities || settings.extractCitations) {
      const claimResult = await claimExtractor.extractClaims({
        content: text,
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
          documentContext: text,
          verifyFormat: true,
          verifySource: false, // Skip network calls for MVP
          strictMode: false,
        });
        citations = citationResult.validations;
      }
    }

    return {
      text,
      html,
      metadata,
      structure,
      claims,
      citations,
    };
  }

  /**
   * Extract metadata from DOCX
   */
  private extractMetadata(
    filename: string,
    text: string,
    html: string
  ): DOCXExtractionResult['metadata'] {
    const wordCount = this.countWords(text);
    const characterCount = text.length;
    const paragraphCount = text.split(/\n\n+/).filter(Boolean).length;
    const hasFormatting = html.includes('<strong>') || html.includes('<em>') || html.includes('<ul>');

    return {
      filename,
      wordCount,
      characterCount,
      paragraphCount,
      hasFormatting,
    };
  }

  /**
   * Extract document structure from HTML
   */
  private extractStructure(html: string, text: string): DOCXExtractionResult['structure'] {
    const headings: DOCXExtractionResult['structure']['headings'] = [];
    const lists: DOCXExtractionResult['structure']['lists'] = [];

    // Extract headings (h1-h6)
    const headingRegex = /<h([1-6])>(.*?)<\/h\1>/gi;
    let headingMatch;
    
    while ((headingMatch = headingRegex.exec(html)) !== null) {
      const level = parseInt(headingMatch[1], 10);
      const headingText = this.stripHtml(headingMatch[2]);
      const position = text.indexOf(headingText);

      headings.push({
        level,
        text: headingText,
        position: position !== -1 ? position : 0,
      });
    }

    // Extract lists
    const ulRegex = /<ul>(.*?)<\/ul>/gis;
    const olRegex = /<ol>(.*?)<\/ol>/gis;

    // Unordered lists
    let ulMatch;
    while ((ulMatch = ulRegex.exec(html)) !== null) {
      const listHtml = ulMatch[1];
      const items = this.extractListItems(listHtml);
      const firstItem = items[0] || '';
      const position = firstItem ? text.indexOf(firstItem) : 0;

      lists.push({
        type: 'unordered',
        items,
        position: position !== -1 ? position : 0,
      });
    }

    // Ordered lists
    let olMatch;
    while ((olMatch = olRegex.exec(html)) !== null) {
      const listHtml = olMatch[1];
      const items = this.extractListItems(listHtml);
      const firstItem = items[0] || '';
      const position = firstItem ? text.indexOf(firstItem) : 0;

      lists.push({
        type: 'ordered',
        items,
        position: position !== -1 ? position : 0,
      });
    }

    return {
      headings,
      lists,
    };
  }

  /**
   * Extract list items from HTML
   */
  private extractListItems(listHtml: string): string[] {
    const items: string[] = [];
    const itemRegex = /<li>(.*?)<\/li>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(listHtml)) !== null) {
      const itemText = this.stripHtml(itemMatch[1]).trim();
      if (itemText) {
        items.push(itemText);
      }
    }

    return items;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
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
export const docxExtractor = new DOCXExtractor();
