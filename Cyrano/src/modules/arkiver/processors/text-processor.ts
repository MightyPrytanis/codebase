/**
 * Text Processor
 * Extracts plain text content with metadata
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';

export const TextProcessorSchema = z.object({
  content: z.string(),
  source: z.string().optional(),
  encoding: z.string().default('utf-8'),
  preserveFormatting: z.boolean().default(false),
});

export type TextProcessorInput = z.infer<typeof TextProcessorSchema>;

export interface TextProcessorOutput {
  text: string;
  metadata: {
    length: number;
    wordCount: number;
    lineCount: number;
    paragraphCount: number;
    encoding: string;
    hasFormatting: boolean;
  };
  statistics: {
    averageWordLength: number;
    averageSentenceLength: number;
    uniqueWords: number;
  };
  structure: {
    headings: string[];
    sections: Array<{
      start: number;
      end: number;
      type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote';
    }>;
  };
}

export class TextProcessor {
  /**
   * Process text content and extract metadata
   */
  async process(input: TextProcessorInput): Promise<TextProcessorOutput> {
    const validated = TextProcessorSchema.parse(input);
    const text = validated.preserveFormatting 
      ? validated.content 
      : this.normalizeText(validated.content);

    const metadata = this.extractMetadata(text, validated.encoding);
    const statistics = this.calculateStatistics(text);
    const structure = this.analyzeStructure(text);

    return {
      text,
      metadata,
      statistics,
      structure,
    };
  }

  /**
   * Normalize text by removing extra whitespace while preserving structure
   */
  private normalizeText(text: string): string {
    let normalized = text;
    // Normalize line endings
    let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Preserve paragraph breaks (double newlines)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
    
    // Remove trailing spaces on each line
    normalized = normalized.split('\n').map(line => line.trimEnd()).join('\n');
    
    // Remove leading/trailing whitespace
    normalized = normalized.trim();
    
    return normalized;
  }

  /**
   * Extract basic metadata from text
   */
  private extractMetadata(text: string, encoding: string) {
    const lines = text.split('\n');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      length: text.length,
      wordCount: words.length,
      lineCount: lines.length,
      paragraphCount: paragraphs.length,
      encoding,
      hasFormatting: this.detectFormatting(text),
    };
  }

  /**
   * Calculate text statistics
   */
  private calculateStatistics(text: string) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = words.length > 0 ? totalWordLength / words.length : 0;
    
    const totalSentenceLength = sentences.reduce((sum, sent) => {
      return sum + sent.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    const averageSentenceLength = sentences.length > 0 ? totalSentenceLength / sentences.length : 0;
    
    return {
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      uniqueWords,
    };
  }

  /**
   * Analyze document structure
   */
  private analyzeStructure(text: string) {
    const headings = this.extractHeadings(text);
    const sections = this.extractSections(text);
    
    return {
      headings,
      sections,
    };
  }

  /**
   * Extract headings from text
   */
  private extractHeadings(text: string): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Markdown-style headings
      if (line.match(/^#{1,6}\s+/)) {
        headings.push(line.replace(/^#{1,6}\s+/, ''));
        continue;
      }
      
      // Underlined headings
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.match(/^(=|-){3,}$/)) {
          headings.push(line);
          continue;
        }
      }
      
      // ALL CAPS lines (if short enough)
      if (line.length > 3 && line.length < 80 && line === line.toUpperCase()) {
        headings.push(line);
      }
    }
    
    return headings;
  }

  /**
   * Extract sections from text
   */
  private extractSections(text: string) {
    const sections: Array<{
      start: number;
      end: number;
      type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote';
    }> = [];
    
    const lines = text.split('\n');
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const start = currentPos;
      const end = currentPos + line.length;
      
      let type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote' = 'paragraph';
      
      // Detect section type
      if (trimmed.match(/^#{1,6}\s+/)) {
        type = 'heading';
      } else if (trimmed.match(/^[*+-]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        type = 'list';
      } else if (trimmed.match(/^```/) || trimmed.match(/^ {4}/)) {
        type = 'code';
      } else if (trimmed.match(/^>/)) {
        type = 'quote';
      }
      
      sections.push({ start, end, type });
      currentPos = end + 1; // +1 for newline
    }
    
    return sections;
  }

  /**
   * Detect if text has special formatting
   */
  private detectFormatting(text: string): boolean {
    // Check for markdown/rich text indicators
    const formatPatterns = [
      /^#{1,6}\s+/m,           // Markdown headings
      /\*\*[^*]+\*\*/,         // Bold
      /\*[^*]+\*/,             // Italic
      /`[^`]+`/,               // Code
      /\[[^\]]+\]\([^)]+\)/,   // Links
      /^[*+-]\s+/m,            // Lists
      /^\d+\.\s+/m,            // Numbered lists
    ];
    
    return formatPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract specific content types
   */
  extractUrls(text: string): string[] {
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    return Array.from(text.matchAll(urlPattern)).map(m => m[0]);
  }

  extractEmails(text: string): string[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return Array.from(text.matchAll(emailPattern)).map(m => m[0]);
  }

  extractPhoneNumbers(text: string): string[] {
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}/g;
    return Array.from(text.matchAll(phonePattern)).map(m => m[0]);
  }

  extractDates(text: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,              // MM/DD/YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g,                    // YYYY-MM-DD
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi, // Month DD, YYYY
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      dates.push(...Array.from(text.matchAll(pattern)).map(m => m[0]));
    }
    return dates;
  }
}

export const textProcessor = new TextProcessor();
