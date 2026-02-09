/**
 * Free Legal Research Service
 * 
 * Integrates with free legal research tools for Michigan family law practitioners:
 * 1. CourtListener (already integrated, enhanced here)
 * 2. Google Scholar (free case law search)
 * 3. Justia (free legal research)
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';
import { CourtListenerService } from './courtlistener.js';

export interface LegalResearchResult {
  source: 'courtlistener' | 'google_scholar' | 'justia' | 'michigan_legal_help';
  title: string;
  citation: string;
  court?: string;
  date?: string;
  url: string;
  snippet: string;
  fullText?: string;
  relevanceScore?: number;
}

export interface ResearchQuery {
  query: string;
  jurisdiction?: 'michigan' | 'federal' | 'both';
  caseType?: string;
  dateRange?: { start: string; end: string };
  sources?: ('courtlistener' | 'google_scholar' | 'justia' | 'michigan_legal_help')[];
}

export class LegalResearchService {
  private courtListener: CourtListenerService;

  constructor() {
    this.courtListener = new CourtListenerService();
  }

  /**
   * Search across all free legal research sources
   */
  async search(query: ResearchQuery): Promise<LegalResearchResult[]> {
    const sources = query.sources || ['courtlistener', 'google_scholar', 'justia'];
    const results: LegalResearchResult[] = [];

    // Search each source in parallel
    const promises: Promise<LegalResearchResult[]>[] = [];

    if (sources.includes('courtlistener')) {
      promises.push(this.searchCourtListener(query));
    }

    if (sources.includes('google_scholar')) {
      promises.push(this.searchGoogleScholar(query));
    }

    if (sources.includes('justia')) {
      promises.push(this.searchJustia(query));
    }

    if (sources.includes('michigan_legal_help')) {
      promises.push(this.searchMichiganLegalHelp(query));
    }

    const allResults = await Promise.allSettled(promises);
    
    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      } else {
        console.warn('Legal research source failed:', result.reason);
      }
    }

    // Sort by relevance score if available
    return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Search CourtListener (enhanced)
   */
  private async searchCourtListener(query: ResearchQuery): Promise<LegalResearchResult[]> {
    try {
      // Use existing CourtListener service
      const results: LegalResearchResult[] = [];

      // Search by citation if query looks like a citation
      const citationMatch = query.query.match(/\d+\s+[A-Z][a-z.]+\s+\d+/);
      if (citationMatch) {
        const validation = await this.courtListener.validateCitation(citationMatch[0]);
        if (validation.valid && validation.caseData) {
          results.push({
            source: 'courtlistener',
            title: validation.caseData.caseName || '',
            citation: validation.caseData.citation || '',
            court: validation.caseData.court,
            date: validation.caseData.dateDecided,
            url: validation.caseData.url || '',
            snippet: `Case found: ${validation.caseData.caseName}`,
            relevanceScore: validation.confidence,
          });
        }
      }

      // Search by keyword (CourtListener API search)
      // Note: CourtListener free tier has limited search - may need API key
      const searchUrl = `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(query.query)}&type=o`;
      
      try {
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json() as any;
          if (data.results) {
            for (const result of data.results.slice(0, 10)) {
              results.push({
                source: 'courtlistener',
                title: result.caseName || result.title || '',
                citation: result.citation || '',
                court: result.court,
                date: result.dateDecided,
                url: `https://www.courtlistener.com${result.absolute_url || ''}`,
                snippet: result.snippet || '',
                relevanceScore: result.score || 0.5,
              });
            }
          }
        }
      } catch (error) {
        // CourtListener search may require API key or have rate limits
        console.warn('CourtListener search failed:', error);
      }

      return results;
    } catch (error) {
      console.error('CourtListener search error:', error);
      return [];
    }
  }

  /**
   * Search Google Scholar (free, no API key required)
   */
  private async searchGoogleScholar(query: ResearchQuery): Promise<LegalResearchResult[]> {
    try {
      const results: LegalResearchResult[] = [];

      // Google Scholar doesn't have a public API, so we scrape search results
      // This is a basic implementation - may need enhancement for production
      let searchQuery = query.query;
      if (query.jurisdiction === 'michigan') {
        searchQuery += ' site:scholar.google.com Michigan';
      }

      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}&hl=en`;

      // Note: Google Scholar scraping may violate ToS - consider using official API if available
      // For now, return structured results that would come from scraping
      // In production, this should use a proper scraping service or official API

      // Placeholder implementation - actual scraping would go here
      // This is a template for what the results would look like
      results.push({
        source: 'google_scholar',
        title: 'Google Scholar Search Result',
        citation: '',
        url: searchUrl,
        snippet: `Search Google Scholar for: ${query.query}`,
        relevanceScore: 0.7,
      });

      return results;
    } catch (error) {
      console.error('Google Scholar search error:', error);
      return [];
    }
  }

  /**
   * Search Justia (free legal research)
   */
  private async searchJustia(query: ResearchQuery): Promise<LegalResearchResult[]> {
    try {
      const results: LegalResearchResult[] = [];

      // Justia has a search API, but it may require registration
      // This is a basic implementation
      const searchQuery = query.query;
      let searchUrl = `https://law.justia.com/search?q=${encodeURIComponent(searchQuery)}`;

      if (query.jurisdiction === 'michigan') {
        searchUrl += '&state=mi';
      }

      // Justia search - may need to scrape or use official API
      // Placeholder implementation
      results.push({
        source: 'justia',
        title: 'Justia Search Result',
        citation: '',
        url: searchUrl,
        snippet: `Search Justia for: ${query.query}`,
        relevanceScore: 0.6,
      });

      return results;
    } catch (error) {
      console.error('Justia search error:', error);
      return [];
    }
  }
  /**
   * Search Michigan Legal Help (free Michigan-specific resources)
   */
  private async searchMichiganLegalHelp(query: ResearchQuery): Promise<LegalResearchResult[]> {
    try {
      const results: LegalResearchResult[] = [];

      // Michigan Legal Help is a free resource for Michigan residents
      // Focuses on family law, housing, consumer issues
      const searchUrl = `https://michiganlegalhelp.org/search?q=${encodeURIComponent(query.query)}`;

      // This would scrape or use their search API if available
      results.push({
        source: 'michigan_legal_help',
        title: 'Michigan Legal Help Resource',
        citation: '',
        url: searchUrl,
        snippet: `Search Michigan Legal Help for: ${query.query}`,
        relevanceScore: 0.8, // High relevance for Michigan family law
      });

      return results;
    } catch (error) {
      console.error('Michigan Legal Help search error:', error);
      return [];
    }
  }
  /**
   * Get case by citation (uses CourtListener)
   */
  async getCaseByCitation(citation: string): Promise<LegalResearchResult | null> {
    const validation = await this.courtListener.validateCitation(citation);
    if (validation.valid && validation.caseData) {
      return {
        source: 'courtlistener',
        title: validation.caseData.caseName || '',
        citation: validation.caseData.citation || '',
        court: validation.caseData.court,
        date: validation.caseData.dateDecided,
        url: validation.caseData.url || '',
        snippet: `Case: ${validation.caseData.caseName}`,
        relevanceScore: validation.confidence,
      };
    }
    return null;
  }
}
