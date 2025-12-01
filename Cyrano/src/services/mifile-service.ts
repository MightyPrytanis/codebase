/**
 * MiFile Service
 * 
 * Michigan One Court of Justice Electronic Filing System Integration
 * 
 * NOTE: MiFile API access requires enrollment in the MiFile Developer Program
 * This implementation is speculative based on common e-filing system patterns
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';

export interface MiFileConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  attorneyId?: string;
  firmId?: string;
}

export interface MiFileCase {
  caseNumber: string;
  caseTitle: string;
  court: string;
  caseType: string;
  filingDate: string;
  status: string;
  parties: MiFileParty[];
  documents: MiFileDocument[];
}

export interface MiFileParty {
  name: string;
  role: string; // Plaintiff, Defendant, etc.
  attorney?: string;
}

export interface MiFileDocument {
  documentId: string;
  fileName: string;
  documentType: string;
  filedDate: string;
  filingParty: string;
  status: 'filed' | 'pending' | 'rejected';
  downloadUrl?: string;
}

export interface MiFileFilingRequest {
  caseNumber?: string; // For existing case
  court: string;
  caseType: string;
  documents: Array<{
    fileName: string;
    fileContent: string; // Base64 encoded
    documentType: string;
    description?: string;
  }>;
  filingParty: string;
  serviceContacts?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
}

export interface MiFileFilingResponse {
  filingId: string;
  status: 'submitted' | 'pending' | 'accepted' | 'rejected';
  caseNumber?: string;
  documents: Array<{
    documentId: string;
    status: string;
    rejectionReason?: string;
  }>;
  message?: string;
}

export class MiFileService {
  private config: MiFileConfig;
  private baseUrl: string;

  constructor(config: MiFileConfig) {
    this.config = config;
    // Default to production URL - may need to be updated based on actual API
    this.baseUrl = config.baseUrl || 'https://mifile.courts.michigan.gov/api/v1';
  }

  /**
   * Check if API credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  /**
   * Get case information by case number
   */
  async getCase(caseNumber: string): Promise<MiFileCase> {
    if (!this.isConfigured()) {
      throw new Error('MiFile API credentials not configured. Enrollment in MiFile Developer Program required.');
    }

    const url = `${this.baseUrl}/cases/${encodeURIComponent(caseNumber)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('MiFile API authentication failed. Please verify API credentials.');
      }
      if (response.status === 404) {
        throw new Error(`Case not found: ${caseNumber}`);
      }
      const error = await response.text();
      throw new Error(`Failed to get case: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return this.mapToMiFileCase(data);
  }

  /**
   * Search for cases
   */
  async searchCases(criteria: {
    court?: string;
    caseType?: string;
    partyName?: string;
    dateRange?: { start: string; end: string };
    attorneyId?: string;
  }): Promise<MiFileCase[]> {
    if (!this.isConfigured()) {
      throw new Error('MiFile API credentials not configured. Enrollment in MiFile Developer Program required.');
    }

    const params = new URLSearchParams();
    if (criteria.court) params.append('court', criteria.court);
    if (criteria.caseType) params.append('caseType', criteria.caseType);
    if (criteria.partyName) params.append('partyName', criteria.partyName);
    if (criteria.dateRange) {
      params.append('startDate', criteria.dateRange.start);
      params.append('endDate', criteria.dateRange.end);
    }
    if (criteria.attorneyId) params.append('attorneyId', criteria.attorneyId);

    const url = `${this.baseUrl}/cases/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to search cases: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.cases || []).map((c: any) => this.mapToMiFileCase(c));
  }

  /**
   * Get case status
   */
  async getCaseStatus(caseNumber: string): Promise<{
    caseNumber: string;
    status: string;
    lastActivity: string;
    nextHearing?: string;
    documents: Array<{ documentId: string; status: string }>;
  }> {
    if (!this.isConfigured()) {
      throw new Error('MiFile API credentials not configured. Enrollment in MiFile Developer Program required.');
    }

    const url = `${this.baseUrl}/cases/${encodeURIComponent(caseNumber)}/status`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get case status: ${response.status} ${error}`);
    }

    return await response.json() as any;
  }

  /**
   * Submit electronic filing
   */
  async submitFiling(request: MiFileFilingRequest): Promise<MiFileFilingResponse> {
    if (!this.isConfigured()) {
      throw new Error('MiFile API credentials not configured. Enrollment in MiFile Developer Program required.');
    }

    const url = `${this.baseUrl}/filings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit filing: ${response.status} ${error}`);
    }

    return await response.json() as any;
  }

  /**
   * Get filing status
   */
  async getFilingStatus(filingId: string): Promise<MiFileFilingResponse> {
    if (!this.isConfigured()) {
      throw new Error('MiFile API credentials not configured. Enrollment in MiFile Developer Program required.');
    }

    const url = `${this.baseUrl}/filings/${encodeURIComponent(filingId)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get filing status: ${response.status} ${error}`);
    }

    return await response.json() as any;
  }

  /**
   * Generate authentication token
   * This is speculative - actual implementation depends on MiFile API auth method
   */
  private getAuthToken(): string {
    // Common patterns: JWT, API key, or OAuth2
    // This assumes API key-based auth - may need adjustment
    if (this.config.apiKey) {
      return this.config.apiKey;
    }
    throw new Error('API key not configured');
  }

  /**
   * Map API response to MiFileCase
   */
  private mapToMiFileCase(data: any): MiFileCase {
    return {
      caseNumber: data.caseNumber || data.case_number,
      caseTitle: data.caseTitle || data.case_title || '',
      court: data.court || '',
      caseType: data.caseType || data.case_type || '',
      filingDate: data.filingDate || data.filing_date || '',
      status: data.status || 'unknown',
      parties: (data.parties || []).map((p: any) => ({
        name: p.name || '',
        role: p.role || '',
        attorney: p.attorney,
      })),
      documents: (data.documents || []).map((d: any) => ({
        documentId: d.documentId || d.document_id,
        fileName: d.fileName || d.file_name,
        documentType: d.documentType || d.document_type,
        filedDate: d.filedDate || d.filed_date,
        filingParty: d.filingParty || d.filing_party,
        status: d.status || 'filed',
        downloadUrl: d.downloadUrl || d.download_url,
      })),
    };
  }
}

