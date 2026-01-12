/**
 * Enhanced PDF Extractor using pdf.js
 * 
 * Provides better layout analysis and table extraction compared to pdf-parse
 * Falls back to pdf-parse for basic extraction
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFExtractor, PDFExtractionResult, ExtractionSettings } from './pdf-extractor.js';

// Configure pdf.js worker for Node.js
// Use CDN worker as fallback for Node.js environments
if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs';
}

export interface EnhancedPDFExtractionResult extends PDFExtractionResult {
  tables?: Array<{
    pageNumber: number;
    rows: Array<Array<string>>;
    headers?: string[];
  }>;
  layout?: {
    hasColumns: boolean;
    hasTables: boolean;
    hasImages: boolean;
    structure: 'simple' | 'complex' | 'mixed';
  };
}

/**
 * Enhanced PDF Extractor using pdf.js
 * Provides better layout analysis and table extraction
 */
export class EnhancedPDFExtractor extends PDFExtractor {
  /**
   * Extract content with enhanced layout analysis
   */
  async extractEnhanced(
    fileBuffer: Buffer,
    filename: string,
    settings: ExtractionSettings
  ): Promise<EnhancedPDFExtractionResult> {
    try {
      // Try pdf.js first for better layout analysis
      const pdfjsResult = await this.extractWithPDFJS(fileBuffer, settings);
      
      // Merge with basic extraction for metadata
      const basicResult = await super.extract(fileBuffer, filename, settings);
      
      return {
        ...basicResult,
        tables: pdfjsResult.tables,
        layout: pdfjsResult.layout,
      };
    } catch (error) {
      // Fallback to basic extraction if pdf.js fails
      console.warn('Enhanced PDF extraction failed, using basic extraction:', error);
      const basicResult = await super.extract(fileBuffer, filename, settings);
      return {
        ...basicResult,
        tables: [],
        layout: {
          hasColumns: false,
          hasTables: false,
          hasImages: false,
          structure: 'simple',
        },
      };
    }
  }

  /**
   * Extract using pdf.js for better layout analysis
   */
  private async extractWithPDFJS(
    fileBuffer: Buffer,
    settings: ExtractionSettings
  ): Promise<{ tables: EnhancedPDFExtractionResult['tables']; layout: EnhancedPDFExtractionResult['layout'] }> {
    const loadingTask = pdfjsLib.getDocument({
      data: fileBuffer,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const tables: EnhancedPDFExtractionResult['tables'] = [];
    let hasColumns = false;
    let hasTables = false;
    let hasImages = false;
    let structure: 'simple' | 'complex' | 'mixed' = 'simple';

    // Analyze each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      // Detect tables (heuristic: look for aligned text)
      const pageTables = this.detectTables(textContent, viewport);
      if (pageTables.length > 0) {
        hasTables = true;
        tables.push(...pageTables.map(table => ({
          pageNumber: pageNum,
          ...table,
        })));
      }

      // Detect columns (heuristic: text items with similar x positions)
      if (this.detectColumns(textContent)) {
        hasColumns = true;
      }

      // Check for images
      const opList = await page.getOperatorList();
      if (this.hasImages(opList)) {
        hasImages = true;
      }
    }

    // Determine structure complexity
    if (hasTables && hasColumns) {
      structure = 'complex';
    } else if (hasTables || hasColumns) {
      structure = 'mixed';
    }

    return {
      tables,
      layout: {
        hasColumns,
        hasTables,
        hasImages,
        structure,
      },
    };
  }

  /**
   * Detect tables in text content (heuristic approach)
   */
  private detectTables(
    textContent: any,
    viewport: any
  ): Array<{ rows: Array<Array<string>>; headers?: string[] }> {
    const tables: Array<{ rows: Array<Array<string>>; headers?: string[] }> = [];
    
    // Group text items by y-position (rows)
    const rows = new Map<number, Array<{ text: string; x: number }>>();
    
    for (const item of textContent.items) {
      const y = Math.round(item.transform[5]); // y position
      if (!rows.has(y)) {
        rows.set(y, []);
      }
      rows.get(y)!.push({
        text: item.str,
        x: item.transform[4], // x position
      });
    }

    // Find aligned columns (similar x positions across rows)
    const columnPositions = this.findColumnPositions(Array.from(rows.values()));
    
    if (columnPositions.length >= 2) {
      // Likely a table - extract rows
      const sortedRows = Array.from(rows.entries()).sort((a, b) => b[0] - a[0]); // Sort by y (top to bottom)
      const tableRows: Array<Array<string>> = [];
      
      for (const [y, items] of sortedRows) {
        const row: string[] = new Array(columnPositions.length).fill('');
        
        for (const item of items) {
          const colIndex = this.findColumnIndex(item.x, columnPositions);
          if (colIndex >= 0) {
            row[colIndex] = (row[colIndex] + ' ' + item.text).trim();
          }
        }
        
        if (row.some(cell => cell.length > 0)) {
          tableRows.push(row);
        }
      }

      if (tableRows.length >= 2) {
        // First row might be headers
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);
        
        tables.push({
          rows: dataRows,
          headers: headers.some(h => h.length > 0) ? headers : undefined,
        });
      }
    }

    return tables;
  }

  /**
   * Find column positions by analyzing x-coordinates
   */
  private findColumnPositions(rows: Array<Array<{ text: string; x: number }>>): number[] {
    const xPositions = new Set<number>();
    
    // Collect all x positions
    for (const row of rows) {
      for (const item of row) {
        xPositions.add(Math.round(item.x / 10) * 10); // Round to nearest 10
      }
    }

    // Find clusters of x positions (likely columns)
    const positions = Array.from(xPositions).sort((a, b) => a - b);
    const clusters: number[] = [];
    const threshold = 20; // Pixels

    for (const pos of positions) {
      const nearby = clusters.find(c => Math.abs(c - pos) < threshold);
      if (!nearby) {
        clusters.push(pos);
      }
    }

    return clusters.sort((a, b) => a - b);
  }

  /**
   * Find which column an x position belongs to
   */
  private findColumnIndex(x: number, columnPositions: number[]): number {
    const threshold = 20;
    for (let i = 0; i < columnPositions.length; i++) {
      if (Math.abs(x - columnPositions[i]) < threshold) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Detect if text is in columns
   */
  private detectColumns(textContent: any): boolean {
    const xPositions = new Set<number>();
    
    for (const item of textContent.items) {
      xPositions.add(Math.round(item.transform[4] / 50) * 50); // Round to nearest 50
    }

    // If we have distinct x position clusters, likely columns
    return xPositions.size >= 3;
  }

  /**
   * Check if page has images
   * 
   * In PDF.js, opList.fnArray contains operator function IDs (numbers),
   * and opList.argsArray is a parallel array with arguments.
   * We need to iterate by index to access both arrays correctly.
   */
  private hasImages(opList: any): boolean {
    if (!opList || !opList.fnArray || !opList.argsArray) {
      return false;
    }

    // Iterate by index (fnArray and argsArray are parallel arrays)
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fnId = opList.fnArray[i];
      const args = opList.argsArray[i];
      
      // Check for 'Do' operator (most common image operator)
      // In PDF.js, operator 79 typically corresponds to 'Do'
      // We can also check if args contain image-related data
      if (fnId === 79 || (args && Array.isArray(args) && args.length > 0)) {
        // 'Do' operator typically has a name reference as first argument
        // Check if it looks like an image reference (XObject with /Im prefix or similar)
        if (args && args[0] && typeof args[0] === 'object' && args[0].name) {
          const name = args[0].name;
          // Image XObjects often have names starting with /Im or contain 'Image'
          if (name.includes('Im') || name.includes('Image') || name.includes('XObject')) {
            return true;
          }
        }
        // Also check for inline image operators (BI/EI) by looking for patterns
        // Inline images have specific argument structures
        if (args && Array.isArray(args) && args.some((arg: any) => 
          arg && typeof arg === 'object' && (arg.name === 'BI' || arg.name === 'EI')
        )) {
          return true;
        }
      }
    }

    // Fallback: check if operator list has sufficient complexity that might indicate images
    // This is a heuristic - if there are many operators but little text, might have images
    return false;

}
}
}
}
}
}