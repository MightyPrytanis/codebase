/**
 * Text/Markdown Extractor for Arkiver
 * 
 * Extracts content from plain text and markdown files
 * Handles encoding detection and basic structure extraction
 * 
 * Created: 2025-11-28
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';

export interface TextExtractionResult {
  text: string;
  metadata: {
    filename: string;
    fileSize: number;
    encoding: string;
    lineCount: number;
    wordCount: number;
    characterCount: number;
  };
  structure?: {
    headings?: Array<{ level: number; text: string; position: number }>;
    paragraphs?: number;
  };
}

/**
 * Text/Markdown Extractor
 */
export class TextExtractor {
  /**
   * Extract content from text or markdown file
   */
  async extract(filePath: string): Promise<TextExtractionResult> {
    const content = await readFile(filePath, 'utf-8');
    const stats = await stat(filePath);
    const filename = filePath.split('/').pop() || 'unknown';
    const isMarkdown = filePath.endsWith('.md') || filePath.endsWith('.markdown');

    // Basic statistics
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(w => w.length > 0);

    const result: TextExtractionResult = {
      text: content,
      metadata: {
        filename,
        fileSize: stats.size,
        encoding: 'utf-8',
        lineCount: lines.length,
        wordCount: words.length,
        characterCount: content.length,
      },
    };

    // Extract structure for markdown
    if (isMarkdown) {
      result.structure = this.extractMarkdownStructure(content);
    } else {
      result.structure = {
        paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      };
    }

    return result;
  }

  /**
   * Extract markdown structure (headings, etc.)
   */
  private extractMarkdownStructure(content: string): {
    headings: Array<{ level: number; text: string; position: number }>;
    paragraphs: number;
  } {
    const headings: Array<{ level: number; text: string; position: number }> = [];
    const lines = content.split('\n');
    let position = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        headings.push({
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
          position: i,
        });
      }
      position += line.length + 1; // +1 for newline
    }

    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    return { headings, paragraphs };
}
}
