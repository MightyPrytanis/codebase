/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface ClioClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class ClioClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ClioClientConfig) {
    if (!config.apiKey) throw new Error('ClioClient requires apiKey');
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://app.clio.com/api/v4';
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private async request<T>(method: 'GET'|'POST'|'PUT'|'DELETE', path: string, options?: { query?: Record<string, any>, body?: any }): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Clio API error ${response.status} ${response.statusText}: ${text}`);
    }
    return await response.json() as T;
  }

  // Generic list endpoint
  async list<T = any>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  // Create time entry (activity)
  async createTimeEntry(entry: {
    matter_id: string | number;
    date: string; // YYYY-MM-DD
    quantity: number; // hours in decimal
    description?: string;
    rate?: number;
    user_id?: string | number;
  }): Promise<any> {
    // Clio v4: POST /activities with type=time_entry
    const body = { data: { type: 'TimeEntry', ...entry } };
    return this.request('POST', '/activities', { body });
  }
}

}
}
)
}
)