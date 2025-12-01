/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Untold Engine API Client
 * 
 * Integration with Untold Engine for journaling with feedback and insights.
 * API Documentation: https://untoldengine.github.io/api/
 */

export interface JournalEntry {
  id?: string;
  content: string;
  timestamp?: string;
  tags?: string[];
  mood?: string;
  context?: string;
}

export interface JournalFeedback {
  insights: string[];
  patterns: string[];
  suggestions: string[];
  encouragement?: string;
}

export interface UntoldEngineConfig {
  apiUrl?: string;
  apiKey?: string;
}

class UntoldEngineClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config: UntoldEngineConfig = {}) {
    this.apiUrl = config.apiUrl || 'https://api.untoldengine.com';
    this.apiKey = config.apiKey;
  }

  /**
   * Create a new journal entry
   */
  async createEntry(entry: JournalEntry): Promise<JournalEntry> {
    const response = await fetch(`${this.apiUrl}/journal/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        content: entry.content,
        tags: entry.tags || [],
        mood: entry.mood,
        context: entry.context,
        timestamp: entry.timestamp || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get feedback and insights for journal entries
   */
  async getFeedback(entryIds?: string[]): Promise<JournalFeedback> {
    const url = entryIds && entryIds.length > 0
      ? `${this.apiUrl}/journal/feedback?entries=${entryIds.join(',')}`
      : `${this.apiUrl}/journal/feedback`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recent journal entries
   */
  async getEntries(limit: number = 10, offset: number = 0): Promise<JournalEntry[]> {
    const response = await fetch(`${this.apiUrl}/journal/entries?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update an existing journal entry
   */
  async updateEntry(entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const response = await fetch(`${this.apiUrl}/journal/entries/${entryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/journal/entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get patterns and trends from journal entries
   */
  async getPatterns(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<{
    moodTrends: { date: string; mood: string; score: number }[];
    commonThemes: { theme: string; frequency: number }[];
    insights: string[];
  }> {
    const response = await fetch(`${this.apiUrl}/journal/patterns?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Untold Engine API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
let untoldEngineClient: UntoldEngineClient | null = null;

export function getUntoldEngineClient(config?: UntoldEngineConfig): UntoldEngineClient {
  if (!untoldEngineClient) {
    untoldEngineClient = new UntoldEngineClient(config);
  }
  return untoldEngineClient;
}

// Export for direct use
export const untoldEngine = {
  createEntry: async (entry: JournalEntry) => {
    const client = getUntoldEngineClient();
    return client.createEntry(entry);
  },
  getFeedback: async (entryIds?: string[]) => {
    const client = getUntoldEngineClient();
    return client.getFeedback(entryIds);
  },
  getEntries: async (limit?: number, offset?: number) => {
    const client = getUntoldEngineClient();
    return client.getEntries(limit, offset);
  },
  updateEntry: async (entryId: string, updates: Partial<JournalEntry>) => {
    const client = getUntoldEngineClient();
    return client.updateEntry(entryId, updates);
  },
  deleteEntry: async (entryId: string) => {
    const client = getUntoldEngineClient();
    return client.deleteEntry(entryId);
  },
  getPatterns: async (timeframe?: 'week' | 'month' | 'year') => {
    const client = getUntoldEngineClient();
    return client.getPatterns(timeframe);
  },
};

