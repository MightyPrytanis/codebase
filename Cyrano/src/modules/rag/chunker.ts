/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface Chunk {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: {
    documentId?: string;
    documentType?: string;
    section?: string;
    page?: number;
    chunkType?: 'paragraph' | 'sentence' | 'section' | 'list' | 'table' | 'citation';
    hierarchyLevel?: number;
  };
}

export interface ChunkingOptions {
  chunkSize?: number;        // Target chunk size in characters
  overlap?: number;          // Overlap between chunks in characters
  respectBoundaries?: boolean; // Respect sentence/paragraph boundaries
  strategy?: 'fixed' | 'semantic' | 'hierarchical' | 'legal-aware';
  metadata?: {
    documentId?: string;
    documentType?: string;
    section?: string;
    page?: number;
    hierarchyLevel?: number;
    chunkType?: 'paragraph' | 'sentence' | 'section' | 'list' | 'table' | 'citation' | string;
  };
}

export class Chunker {
  private defaultChunkSize = 1000;  // ~500-1000 tokens
  private defaultOverlap = 200;     // ~100 tokens overlap

  /**
   * Chunk text using advanced strategies
   */
  chunkText(text: string, options: ChunkingOptions = {}): Chunk[] {
    const strategy = options.strategy || 'semantic';
    
    switch (strategy) {
      case 'hierarchical':
        return this.hierarchicalChunking(text, options);
      case 'legal-aware':
        return this.legalAwareChunking(text, options);
      case 'semantic':
        return this.semanticChunking(text, options);
      case 'fixed':
      default:
        return this.fixedSizeChunking(text, options);
    }
  }

  /**
   * Fixed-size chunking with boundary respect
   */
  private fixedSizeChunking(text: string, options: ChunkingOptions): Chunk[] {
    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const overlap = options.overlap || this.defaultOverlap;
    const respectBoundaries = options.respectBoundaries !== false;

    const chunks: Chunk[] = [];
    let currentIndex = 0;
    let chunkId = 0;

    while (currentIndex < text.length) {
      const endIndex = Math.min(currentIndex + chunkSize, text.length);
      
      let chunkEnd = endIndex;
      if (respectBoundaries && endIndex < text.length) {
        const sentenceEnd = this.findSentenceBoundary(text, currentIndex, endIndex);
        if (sentenceEnd > currentIndex) {
          chunkEnd = sentenceEnd;
        } else {
          const paragraphEnd = this.findParagraphBoundary(text, currentIndex, endIndex);
          if (paragraphEnd > currentIndex) {
            chunkEnd = paragraphEnd;
          }
        }
      }

      const chunkText = text.substring(currentIndex, chunkEnd).trim();
      
      if (chunkText.length > 0) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: chunkText,
          startIndex: currentIndex,
          endIndex: chunkEnd,
          metadata: {
            ...options.metadata,
            chunkType: 'paragraph',
          },
        });
      }

      currentIndex = Math.max(chunkEnd - overlap, currentIndex + 1);
      
      if (currentIndex >= text.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Semantic chunking - preserves meaning and context
   */
  private semanticChunking(text: string, options: ChunkingOptions): Chunk[] {
    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const overlap = options.overlap || this.defaultOverlap;

    // First, identify semantic units (paragraphs, sections)
    const paragraphs = this.splitIntoParagraphs(text);
    const chunks: Chunk[] = [];
    let chunkId = 0;
    let currentChunk: string[] = [];
    let currentLength = 0;
    let startIndex = 0;

    for (const para of paragraphs) {
      const paraLength = para.text.length;
      
      // If adding this paragraph would exceed chunk size, finalize current chunk
      if (currentLength + paraLength > chunkSize && currentChunk.length > 0) {
        const chunkText = currentChunk.join('\n\n');
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: chunkText,
          startIndex,
          endIndex: startIndex + chunkText.length,
          metadata: {
            ...options.metadata,
            chunkType: 'paragraph',
          },
        });
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(chunkText, overlap);
        currentChunk = overlapText ? [overlapText] : [];
        currentLength = overlapText.length;
        startIndex = chunks[chunks.length - 1].endIndex - overlap;
      }
      
      currentChunk.push(para.text);
      currentLength += paraLength;
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join('\n\n');
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: chunkText,
        startIndex,
        endIndex: startIndex + chunkText.length,
        metadata: {
          ...options.metadata,
          chunkType: 'paragraph',
        },
      });
    }

    return chunks;
  }

  /**
   * Hierarchical chunking - preserves document structure
   */
  private hierarchicalChunking(text: string, options: ChunkingOptions): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkId = 0;

    // Identify document sections (headers, sections, subsections)
    const sections = this.identifySections(text);
    
    for (const section of sections) {
      // Chunk each section semantically
      const sectionChunks = this.semanticChunking(section.text, {
        ...options,
        metadata: {
          ...options.metadata,
          section: section.title,
          hierarchyLevel: section.level,
        },
      });

      // Update metadata for section chunks
      for (const chunk of sectionChunks) {
        chunk.id = `chunk_${chunkId++}`;
        chunk.metadata = {
          ...chunk.metadata,
          ...options.metadata,
          section: section.title,
          hierarchyLevel: section.level,
          chunkType: 'section',
        };
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  /**
   * Legal-aware chunking - preserves citations and legal structure
   */
  private legalAwareChunking(text: string, options: ChunkingOptions): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkId = 0;

    // Identify legal document structure
    const legalSections = this.identifyLegalSections(text);
    
    for (const section of legalSections) {
      // Preserve citations within chunks
      const citations = this.extractCitations(section.text);
      
      // Chunk with citation awareness
      const sectionChunks = this.semanticChunking(section.text, {
        ...options,
        metadata: {
          ...options.metadata,
          section: section.title,
          chunkType: section.type as any,
        },
      });

      for (const chunk of sectionChunks) {
        chunk.id = `chunk_${chunkId++}`;
        chunk.metadata = {
          ...chunk.metadata,
          ...options.metadata,
          section: section.title,
          chunkType: section.type as any,
        };
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  /**
   * Split text into paragraphs
   */
  private splitIntoParagraphs(text: string): Array<{ text: string; startIndex: number }> {
    const paragraphs: Array<{ text: string; startIndex: number }> = [];
    const parts = text.split(/\n\n+/);
    let index = 0;

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        paragraphs.push({
          text: trimmed,
          startIndex: index,
        });
      }
      index += part.length + 2; // +2 for \n\n
    }

    return paragraphs;
  }

  /**
   * Identify document sections
   */
  private identifySections(text: string): Array<{ title: string; text: string; level: number }> {
    const sections: Array<{ title: string; text: string; level: number }> = [];
    
    // Match headers (lines starting with #, numbers, or all caps)
    const headerPattern = /^(#{1,6}\s+.+|\d+\.\s+[A-Z].+|^[A-Z][A-Z\s]{10,})$/gm;
    const lines = text.split('\n');
    let currentSection: { title: string; text: string; level: number } | null = null;
    let sectionText: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = headerPattern.test(line.trim());

      if (isHeader && currentSection) {
        // Finalize previous section
        currentSection.text = sectionText.join('\n');
        sections.push(currentSection);
        sectionText = [];
      }

      if (isHeader) {
        const level = this.getHeaderLevel(line);
        currentSection = {
          title: line.trim(),
          text: '',
          level,
        };
      } else if (currentSection) {
        sectionText.push(line);
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.text = sectionText.join('\n');
      sections.push(currentSection);
    }

    // If no sections found, treat entire document as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Document',
        text,
        level: 0,
      });
    }

    return sections;
  }

  /**
   * Identify legal document sections
   */
  private identifyLegalSections(text: string): Array<{ title: string; text: string; type: string }> {
    const sections: Array<{ title: string; text: string; type: string }> = [];
    
    // Legal document patterns
    const patterns = {
      case: /^(Case|Matter|Cause)\s+No\.?\s*:?/i,
      court: /^(Court|Before|In the)/i,
      parties: /^(Plaintiff|Defendant|Petitioner|Respondent)/i,
      facts: /^(Facts|Background|Statement of Facts)/i,
      analysis: /^(Analysis|Discussion|Legal Analysis)/i,
      conclusion: /^(Conclusion|Holding|Order)/i,
    };

    const lines = text.split('\n');
    let currentSection: { title: string; text: string; type: string } | null = null;
    let sectionText: string[] = [];

    for (const line of lines) {
      let matched = false;
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line.trim())) {
          if (currentSection) {
            currentSection.text = sectionText.join('\n');
            sections.push(currentSection);
            sectionText = [];
          }
          currentSection = {
            title: line.trim(),
            text: '',
            type,
          };
          matched = true;
          break;
        }
      }

      if (!matched && currentSection) {
        sectionText.push(line);
      }
    }

    if (currentSection) {
      currentSection.text = sectionText.join('\n');
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({
        title: 'Document',
        text,
        type: 'general',
      });
    }

    return sections;
  }

  /**
   * Extract citations from text
   */
  private extractCitations(text: string): string[] {
    // Common citation patterns
    const citationPatterns = [
      /\d+\s+[A-Z][a-z]+\s+\d+/g, // Case citations
      /\d+\s+U\.S\.C\.\s+§\s*\d+/g, // USC citations
      /\d+\s+[A-Z]{2,}\s+\d+/g, // State citations
    ];

    const citations: string[] = [];
    for (const pattern of citationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        citations.push(...matches);
      }
    }

    return citations;
  }

  /**
   * Get header level
   */
  private getHeaderLevel(line: string): number {
    if (line.startsWith('#')) {
      return line.match(/^#+/)?.[0].length || 1;
    }
    if (/^\d+\./.test(line)) {
      return 1;
    }
    if (/^\d+\.\d+\./.test(line)) {
      return 2;
    }
    return 0;
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text;
    }
    return text.slice(-overlapSize);
  }

  /**
   * Find sentence boundary near target position
   */
  private findSentenceBoundary(text: string, start: number, target: number): number {
    const sentencePattern = /[.!?]\s+/g;
    let lastMatch = -1;
    let match;

    sentencePattern.lastIndex = start;
    
    while ((match = sentencePattern.exec(text)) !== null) {
      if (match.index > target) {
        break;
      }
      lastMatch = match.index + match[0].length;
      if (lastMatch > target) {
        break;
      }
    }

    return lastMatch > start ? lastMatch : target;
  }

  /**
   * Find paragraph boundary near target position
   */
  private findParagraphBoundary(text: string, start: number, target: number): number {
    const paragraphPattern = /\n\n+/g;
    let lastMatch = -1;
    let match;

    paragraphPattern.lastIndex = start;
    
    while ((match = paragraphPattern.exec(text)) !== null) {
      if (match.index > target) {
        break;
      }
      lastMatch = match.index + match[0].length;
      if (lastMatch > target) {
        break;
      }
    }

    return lastMatch > start ? lastMatch : target;
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }
}

}
}
}
}
}
}
}
)
}
}
}
}
}
}
}
)