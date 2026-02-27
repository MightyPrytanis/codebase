/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Clio Manage API Service
 * 
 * MCP-compliant thin client for Clio Manage API v4
 * 
 * REQUIRED CREDENTIALS: CLIO_API_KEY environment variable
 * - OAuth 2.0 authentication required
 * - See: https://docs.clio.com/api for OAuth setup
 * - Mock fallback: Enabled when CLIO_API_KEY not set (returns mock data)
 * 
 * Based on Clio API v4 documentation:
 * - Regionalized API (US, CA, EU, AU)
 * - OAuth 2.0 authentication
 * - Rate limiting (50 requests/minute default)
 * - Field selection required for most endpoints
 * - Cursor-based pagination for large datasets
 */

export const CLIO_API_CONFIG = {
  version: 'v4',
  regions: {
    US: 'https://app.clio.com/api/v4',
    CA: 'https://ca.app.clio.com/api/v4',
    EU: 'https://eu.app.clio.com/api/v4',
    AU: 'https://au.app.clio.com/api/v4',
  },
  auth: {
    authorize_url: '/oauth/authorize',
    token_url: '/oauth/token',
  },
  headers: {
    'X-API-VERSION': '2023-01-01',
    'Content-Type': 'application/json',
  },
  rateLimit: {
    default: 50, // requests per minute
    window: 60, // seconds
  },
} as const;

export type ClioRegion = keyof typeof CLIO_API_CONFIG.regions;

export interface ClioConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  region?: ClioRegion;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Clio Matter Resource
 */
export interface ClioMatter {
  id?: number;
  etag?: string;
  display_number?: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  client: { id: number; name?: string };
  practice_area?: { id: number; name?: string };
  responsible_attorney?: { id: number; name?: string };
  custom_field_values?: Array<{
    custom_field_id: number;
    value: string | number | boolean;
  }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Clio Activity (Time Entry or Expense)
 */
export interface ClioActivity {
  id?: number;
  type: 'TimeEntry' | 'ExpenseEntry';
  quantity: number; // Hours or Unit Count
  price: number; // Rate or Unit Price
  note?: string;
  matter_id: number;
  user_id: number;
  date: string; // ISO 8601
  created_at?: string;
  updated_at?: string;
}

/**
 * Clio Task
 */
export interface ClioTask {
  id?: number;
  name: string;
  description?: string;
  due_at?: string; // ISO 8601
  status: 'pending' | 'completed' | 'cancelled';
  matter?: { id: number; display_number?: string };
  assigned_to?: { id: number; name?: string };
  created_at?: string;
  updated_at?: string;
}

/**
 * Clio Contact
 */
export interface ClioContact {
  id?: number;
  name: string;
  type: 'Person' | 'Company';
  email_addresses?: Array<{ address: string; location: string }>;
  phone_numbers?: Array<{ number: string; location: string }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Clio Document
 */
export interface ClioDocument {
  id?: number;
  name: string;
  latest_document_version?: {
    size?: number;
    content_type?: string;
    file_name?: string;
  };
  matter?: { id: number; display_number?: string };
  folder?: { id: number; name?: string };
  created_at?: string;
  updated_at?: string;
}

/**
 * Clio Bill
 */
export interface ClioBill {
  id?: number;
  number?: string;
  total?: number;
  balance?: number;
  state?: 'draft' | 'sent' | 'paid' | 'overdue';
  client?: { id: number; name?: string };
  matter?: { id: number; display_number?: string };
  created_at?: string;
  updated_at?: string;
}

/**
 * Rate Limit Headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Pagination Response
 */
export interface ClioPaginationResponse<T> {
  data: T[];
  meta: {
    paging?: {
      next?: string; // URL with cursor parameter
      previous?: string;
    };
  };
}

export class ClioAPIService {
  private config: ClioConfig;
  private baseUrl: string;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: ClioConfig) {
    this.config = config;
    this.baseUrl = config.region 
      ? CLIO_API_CONFIG.regions[config.region]
      : CLIO_API_CONFIG.regions.US; // Default to US
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey || this.config.accessToken);
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    if (this.config.accessToken) {
      return `Bearer ${this.config.accessToken}`;
    }
    if (this.config.apiKey) {
      return `Bearer ${this.config.apiKey}`;
    }
    throw new Error('Clio API not configured: No API key or access token provided');
  }

  /**
   * Make authenticated request to Clio API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Clio API not configured. Please set CLIO_API_KEY or CLIO_ACCESS_TOKEN environment variable.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...CLIO_API_CONFIG.headers,
      'Authorization': this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse rate limit headers
    const rateLimitHeader = response.headers.get('X-RateLimit-Limit');
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');

    if (rateLimitHeader && rateLimitRemaining && rateLimitReset) {
      this.rateLimitInfo = {
        limit: parseInt(rateLimitHeader, 10),
        remaining: parseInt(rateLimitRemaining, 10),
        reset: parseInt(rateLimitReset, 10),
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clio API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json() as T;
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * List Matters
   * 
   * @param options Query options
   * @param options.status Filter by status (open, pending, closed)
   * @param options.query Wildcard search for matter name or description
   * @param options.limit Number of records (max 200, default 20)
   * @param options.fields Comma-separated list of fields to return
   * @param options.cursor Pagination cursor
   */
  async listMatters(options: {
    status?: 'open' | 'pending' | 'closed';
    query?: string;
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioMatter>> {
    const params = new URLSearchParams();
    
    if (options.status) params.append('status', options.status);
    if (options.query) params.append('query', options.query);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    // Default fields if not specified
    const fields = options.fields || 'id,display_number,description,status,client{id,name}';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioMatter>>(`/matters?${params.toString()}`);
  }

  /**
   * Get Matter by ID
   */
  async getMatter(matterId: number, fields?: string): Promise<{ data: ClioMatter }> {
    const params = new URLSearchParams();
    const fieldList = fields || 'id,display_number,description,status,client{id,name},practice_area{id,name},responsible_attorney{id,name}';
    params.append('fields', fieldList);

    return this.makeRequest<{ data: ClioMatter }>(`/matters/${matterId}?${params.toString()}`);
  }

  /**
   * Create Matter
   */
  async createMatter(matter: ClioMatter): Promise<{ data: ClioMatter }> {
    return this.makeRequest<{ data: ClioMatter }>('/matters', {
      method: 'POST',
      body: JSON.stringify({ data: matter }),
    });
  }

  /**
   * List Contacts
   */
  async listContacts(options: {
    type?: 'Person' | 'Company';
    query?: string;
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioContact>> {
    const params = new URLSearchParams();
    
    if (options.type) params.append('type', options.type);
    if (options.query) params.append('query', options.query);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const fields = options.fields || 'id,name,type,email_addresses,phone_numbers';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioContact>>(`/contacts?${params.toString()}`);
  }

  /**
   * List Activities (Time Entries and Expenses)
   */
  async listActivities(options: {
    matter_id?: number;
    type?: 'TimeEntry' | 'ExpenseEntry';
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioActivity>> {
    const params = new URLSearchParams();
    
    if (options.matter_id) params.append('matter_id', options.matter_id.toString());
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const fields = options.fields || 'id,type,quantity,price,note,matter_id,user_id,date';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioActivity>>(`/activities?${params.toString()}`);
  }

  /**
   * Create Activity (Time Entry or Expense)
   */
  async createActivity(activity: ClioActivity): Promise<{ data: ClioActivity }> {
    return this.makeRequest<{ data: ClioActivity }>('/activities', {
      method: 'POST',
      body: JSON.stringify({ data: activity }),
    });
  }

  /**
   * List Tasks
   */
  async listTasks(options: {
    matter_id?: number;
    status?: 'pending' | 'completed' | 'cancelled';
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioTask>> {
    const params = new URLSearchParams();
    
    if (options.matter_id) params.append('matter_id', options.matter_id.toString());
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const fields = options.fields || 'id,name,description,due_at,status,matter{id,display_number}';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioTask>>(`/tasks?${params.toString()}`);
  }

  /**
   * List Documents
   */
  async listDocuments(options: {
    matter_id?: number;
    query?: string;
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioDocument>> {
    const params = new URLSearchParams();
    
    if (options.matter_id) params.append('matter_id', options.matter_id.toString());
    if (options.query) params.append('query', options.query);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const fields = options.fields || 'id,name,latest_document_version{size,content_type,file_name},matter{id,display_number}';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioDocument>>(`/documents?${params.toString()}`);
  }

  /**
   * List Bills
   */
  async listBills(options: {
    matter_id?: number;
    client_id?: number;
    state?: 'draft' | 'sent' | 'paid' | 'overdue';
    limit?: number;
    fields?: string;
    cursor?: string;
  } = {}): Promise<ClioPaginationResponse<ClioBill>> {
    const params = new URLSearchParams();
    
    if (options.matter_id) params.append('matter_id', options.matter_id.toString());
    if (options.client_id) params.append('client_id', options.client_id.toString());
    if (options.state) params.append('state', options.state);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const fields = options.fields || 'id,number,total,balance,state,client{id,name},matter{id,display_number}';
    params.append('fields', fields);

    return this.makeRequest<ClioPaginationResponse<ClioBill>>(`/bills?${params.toString()}`);
}
}

