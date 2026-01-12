/**
 * Microsoft Outlook Email Service
 * 
 * Integrates with Microsoft Graph API to access Outlook email
 * Requires OAuth2 authentication via Microsoft Azure AD
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';

export interface OutlookConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface OutlookEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  bodyPreview: string;
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  importance: 'low' | 'normal' | 'high';
  hasAttachments: boolean;
  attachments?: OutlookAttachment[];
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string; // Base64 encoded
}

export class OutlookService {
  protected config: OutlookConfig;
  protected baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(config: OutlookConfig) {
    this.config = config;
  }

  /**
   * Get OAuth2 authorization URL
   * User must visit this URL to authorize the application
   */
  getAuthorizationUrl(scopes: string[] = ['Mail.Read', 'Mail.ReadWrite']): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state: 'outlook-auth-state', // Should be random in production
    });

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(authorizationCode: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

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
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token not available');
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

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
   * Get emails from Outlook
   */
  async getEmails(
    startDate: string,
    endDate: string,
    folder: string = 'Inbox',
    filter?: string
  ): Promise<OutlookEmail[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    let query = `$filter=receivedDateTime ge ${start} and receivedDateTime le ${end}`;
    if (filter) {
      query += ` and ${filter}`;
    }
    query += `&$orderby=receivedDateTime desc&$top=1000`;

    const url = `${this.baseUrl}/me/mailFolders/${folder}/messages?${query}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try refreshing token
        await this.refreshAccessToken();
        return this.getEmails(startDate, endDate, folder, filter);
      }
      const error = await response.text();
      throw new Error(`Failed to get emails: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.value || []).map((msg: any) => this.mapToOutlookEmail(msg));
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId: string): Promise<OutlookEmail> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.baseUrl}/me/messages/${emailId}?$expand=attachments`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getEmailById(emailId);
      }
      const error = await response.text();
      throw new Error(`Failed to get email: ${response.status} ${error}`);
    }

    const msg = await response.json();
    return this.mapToOutlookEmail(msg);
  }

  /**
   * Map Microsoft Graph API message to OutlookEmail
   */
  private mapToOutlookEmail(msg: any): OutlookEmail {
    return {
      id: msg.id,
      subject: msg.subject || '',
      from: msg.from?.emailAddress?.address || '',
      to: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address || '').filter(Boolean),
      cc: (msg.ccRecipients || []).map((r: any) => r.emailAddress?.address || '').filter(Boolean),
      bcc: (msg.bccRecipients || []).map((r: any) => r.emailAddress?.address || '').filter(Boolean),
      body: msg.body?.content || '',
      bodyPreview: msg.bodyPreview || '',
      receivedDateTime: msg.receivedDateTime,
      sentDateTime: msg.sentDateTime,
      isRead: msg.isRead || false,
      importance: msg.importance || 'normal',
      hasAttachments: msg.hasAttachments || false,
      attachments: msg.attachments?.map((att: any) => ({
        id: att.id,
        name: att.name,
        contentType: att.contentType,
        size: att.size,
        contentBytes: att.contentBytes,
      })),
    };
  }

  /**
   * Set access token (for use after OAuth flow)
   */
  setAccessToken(token: string, refreshToken?: string) {
    this.config.accessToken = token;
    if (refreshToken) {
      this.config.refreshToken = refreshToken;

}
}
}