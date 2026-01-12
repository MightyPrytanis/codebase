/**
 * Gmail Service
 * 
 * Integrates with Gmail API to access email, calendar, tasks, and contacts
 * Requires OAuth2 authentication via Google Cloud Platform
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  snippet: string;
  date: string;
  isRead: boolean;
  labels: string[];
  attachments?: GmailAttachment[];
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  attachmentId?: string;
}

export interface GmailCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface GmailTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  updated: string;
}

export interface GmailContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
}

export class GmailService {
  private config: GmailConfig;
  private gmailBaseUrl = 'https://gmail.googleapis.com/gmail/v1';
  private calendarBaseUrl = 'https://www.googleapis.com/calendar/v3';
  private tasksBaseUrl = 'https://tasks.googleapis.com/tasks/v1';
  private contactsBaseUrl = 'https://people.googleapis.com/v1';

  constructor(config: GmailConfig) {
    this.config = config;
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(scopes: string[] = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/tasks.readonly',
    'https://www.googleapis.com/auth/contacts.readonly'
  ]): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(authorizationCode: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: authorizationCode,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token not available');
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    this.config.accessToken = data.access_token;
    if (data.refresh_token) {
      this.config.refreshToken = data.refresh_token;
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get emails from Gmail
   */
  async getEmails(
    startDate: string,
    endDate: string,
    query?: string
  ): Promise<GmailEmail[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const end = Math.floor(new Date(endDate).getTime() / 1000);
    
    let searchQuery = `after:${start} before:${end}`;
    if (query) {
      searchQuery += ` ${query}`;
    }

    const url = `${this.gmailBaseUrl}/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getEmails(startDate, endDate, query);
      }
      const error = await response.text();
      throw new Error(`Failed to get emails: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    const messages = data.messages || [];

    // Fetch full message details
    const emailPromises = messages.slice(0, 50).map((msg: any) => this.getMessage(msg.id));
    const emails = await Promise.all(emailPromises);

    return emails.filter((e): e is GmailEmail => e !== null);
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId: string): Promise<GmailEmail | null> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.gmailBaseUrl}/users/me/messages/${messageId}?format=full`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getMessage(messageId);
      }
      return null;
    }

    const msg = await response.json() as any;
    return this.mapToGmailEmail(msg);
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(
    startDate: string,
    endDate: string,
    calendarId: string = 'primary'
  ): Promise<GmailCalendarEvent[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate).toISOString();

    const url = `${this.calendarBaseUrl}/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getCalendarEvents(startDate, endDate, calendarId);
      }
      const error = await response.text();
      throw new Error(`Failed to get calendar events: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.items || []).map((event: any) => this.mapToCalendarEvent(event));
  }

  /**
   * Get tasks
   */
  async getTasks(taskListId: string = '@default'): Promise<GmailTask[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.tasksBaseUrl}/lists/${taskListId}/tasks?maxResults=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getTasks(taskListId);
      }
      const error = await response.text();
      throw new Error(`Failed to get tasks: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.items || []).map((task: any) => this.mapToTask(task));
  }

  /**
   * Get contacts
   */
  async getContacts(): Promise<GmailContact[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.contactsBaseUrl}/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getContacts();
      }
      const error = await response.text();
      throw new Error(`Failed to get contacts: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.connections || []).map((contact: any) => this.mapToContact(contact));
  }

  /**
   * Map Gmail API message to GmailEmail
   */
  private mapToGmailEmail(msg: any): GmailEmail {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const body = this.extractBody(msg.payload);

    return {
      id: msg.id,
      threadId: msg.threadId,
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: this.parseEmailList(getHeader('to')),
      cc: this.parseEmailList(getHeader('cc')),
      bcc: this.parseEmailList(getHeader('bcc')),
      body,
      snippet: msg.snippet || '',
      date: getHeader('date'),
      isRead: !msg.labelIds?.includes('UNREAD'),
      labels: msg.labelIds || [],
      attachments: msg.payload?.parts?.filter((p: any) => p.body?.attachmentId).map((p: any) => ({
        id: p.body.attachmentId,
        filename: p.filename || '',
        mimeType: p.mimeType,
        size: p.body.size || 0,
        attachmentId: p.body.attachmentId,
      })),
    };
  }

  /**
   * Extract body from message payload
   */
  private extractBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  /**
   * Parse email list string into array
   */
  private parseEmailList(emailString: string): string[] {
    if (!emailString) return [];
    return emailString.split(',').map(e => e.trim()).filter(Boolean);
  }

  /**
   * Map Google Calendar event to GmailCalendarEvent
   */
  private mapToCalendarEvent(event: any): GmailCalendarEvent {
    return {
      id: event.id,
      summary: event.summary || '',
      description: event.description,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location,
      attendees: event.attendees?.map((a: any) => ({
        email: a.email,
        displayName: a.displayName,
      })),
      status: event.status || 'confirmed',
    };
  }

  /**
   * Map Google Task to GmailTask
   */
  private mapToTask(task: any): GmailTask {
    return {
      id: task.id,
      title: task.title || '',
      notes: task.notes,
      due: task.due,
      status: task.status || 'needsAction',
      updated: task.updated || '',
    };
  }

  /**
   * Map Google Contact to GmailContact
   */
  private mapToContact(contact: any): GmailContact {
    return {
      id: contact.resourceName || '',
      name: contact.names?.[0]?.displayName || contact.names?.[0]?.givenName || '',
      email: contact.emailAddresses?.[0]?.value,
      phone: contact.phoneNumbers?.[0]?.value,
      organization: contact.organizations?.[0]?.name,
    };
  }

  /**
   * Set access token
   */
  setAccessToken(token: string, refreshToken?: string) {
    this.config.accessToken = token;
    if (refreshToken) {
      this.config.refreshToken = refreshToken;

}
}
}