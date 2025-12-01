/**
 * CourtListener API Service
 * 
 * Integrates with CourtListener API for citation validation and case lookup
 * Free tier available at https://www.courtlistener.com/api/
 * 
 * Created: 2025-01-27
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface CaseResult {
  id: number;
  caseName: string;
  citation: string;
  docketNumber?: string;
  court?: string;
  dateFiled?: string;
  dateDecided?: string;
  url?: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  caseData?: CaseResult;
  confidence: number; // 0.0-1.0
  source?: string;
}

export class CourtListenerService {
  private apiKey: string;
  private baseUrl = 'https://www.courtlistener.com/api/rest/v3';
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.COURTLISTENER_API_KEY || '';
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.warn('CourtListener API key not set. Citation validation will use pattern matching only.');
    }
  }

  /**
   * Search for a citation in CourtListener database
   */
  async searchCitation(citation: string): Promise<CaseResult | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Clean citation for search
      const searchQuery = citation.trim();
      
      const response = await fetch(
        `${this.baseUrl}/search/?q=${encodeURIComponent(searchQuery)}&type=o`,
        {
          headers: {
            'Authorization': this.apiKey ? `Token ${this.apiKey}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('CourtListener API: Invalid API key');
          return null;
        }
        if (response.status === 429) {
          console.warn('CourtListener API: Rate limit exceeded');
          return null;
        }
        throw new Error(`CourtListener API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Return first result (most relevant)
        const result = data.results[0];
        return {
          id: result.id,
          caseName: result.case_name || result.caseName || '',
          citation: result.citation || result.citation_count || '',
          docketNumber: result.docket_number || result.docketNumber,
          court: result.court || result.court_name,
          dateFiled: result.date_filed || result.dateFiled,
          dateDecided: result.date_decided || result.dateDecided,
          url: result.absolute_url || result.url,
          ...result,
        };
      }

      return null;
    } catch (error) {
      console.error('CourtListener API search failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Validate a citation against CourtListener database
   */
  async validateCitation(citation: string): Promise<ValidationResult> {
    if (!this.enabled) {
      return {
        valid: false,
        confidence: 0.0,
        source: 'pattern_only',
      };
    }

    const caseData = await this.searchCitation(citation);
    
    if (caseData) {
      return {
        valid: true,
        caseData,
        confidence: 1.0,
        source: 'courtlistener',
      };
    }

    return {
      valid: false,
      confidence: 0.0,
      source: 'courtlistener_not_found',
    };
  }

  /**
   * Check if service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Default instance
 */
export const courtListenerService = new CourtListenerService();

