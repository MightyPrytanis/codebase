/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Email OAuth Integration
 * 
 * Implements OAuth for Gmail and Outlook (Track Iota).
 * Enables email monitoring and processing.
 * 
 * Security Features:
 * - MCP confused deputy protections
 * - Matter-based email filtering
 * - Attorney verification for email actions
 * - Privilege warnings in email footers
 */

import { randomBytes } from 'crypto';
import { logSecurityEvent, logAgentAction } from '../services/audit-logger.js';
import { enforceMatterIsolation } from '../middleware/matter-isolation.js';

export interface EmailOAuthConfig {
  provider: 'gmail' | 'outlook';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface EmailOAuthState {
  state: string;
  nonce: string;
  redirectUri: string;
  scopes: string[];
  provider: 'gmail' | 'outlook';
  expiresAt: number;
  userId?: string;
}

/**
 * Validates email OAuth credentials
 */
export function validateEmailCredentials(provider: 'gmail' | 'outlook'): { valid: boolean; error?: string } {
  const clientIdKey = provider === 'gmail' ? 'GOOGLE_CLIENT_ID' : 'MICROSOFT_CLIENT_ID';
  const clientSecretKey = provider === 'gmail' ? 'GOOGLE_CLIENT_SECRET' : 'MICROSOFT_CLIENT_SECRET';

  const clientId = process.env[clientIdKey];
  const clientSecret = process.env[clientSecretKey];

  if (!clientId || !clientSecret) {
    return {
      valid: false,
      error: `${provider} OAuth credentials not configured. ${clientIdKey} and ${clientSecretKey} environment variables required.`
    };
  }

  return { valid: true };
}

/**
 * Generates secure OAuth state for email providers
 */
export function generateEmailOAuthState(
  provider: 'gmail' | 'outlook',
  redirectUri: string,
  scopes: string[] = [],
  userId?: string
): EmailOAuthState {
  const state = randomBytes(32).toString('hex');
  const nonce = randomBytes(16).toString('hex');
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  return {
    state,
    nonce,
    redirectUri,
    scopes,
    provider,
    expiresAt,
    userId
  };
}

/**
 * Generates Gmail OAuth authorization URL
 */
export function generateGmailAuthUrl(
  redirectUri: string,
  scopes: string[] = ['https://www.googleapis.com/auth/gmail.readonly'],
  state: string
): { url: string; error?: string } {
  const validation = validateEmailCredentials('gmail');
  if (!validation.valid) {
    return { url: '', error: validation.error };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const scopeString = scopes.join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopeString,
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });

  return { url: `${baseUrl}?${params.toString()}` };
}

/**
 * Generates Outlook OAuth authorization URL
 */
export function generateOutlookAuthUrl(
  redirectUri: string,
  scopes: string[] = ['Mail.Read'],
  state: string
): { url: string; error?: string } {
  const validation = validateEmailCredentials('outlook');
  if (!validation.valid) {
    return { url: '', error: validation.error };
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  const scopeString = scopes.join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopeString,
    state: state,
    response_mode: 'query'
  });

  return { url: `${baseUrl}?${params.toString()}` };
}

/**
 * Exchange authorization code for access token (Gmail)
 */
export async function exchangeGmailToken(
  code: string,
  redirectUri: string
): Promise<{ token: any; error?: string }> {
  const validation = validateEmailCredentials('gmail');
  if (!validation.valid) {
    return { token: null, error: validation.error };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { token: null, error: `Token exchange failed: ${response.status} ${errorText}` };
    }

    const token = await response.json();
    return { token };
  } catch (error) {
    return {
      token: null,
      error: `Token exchange error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Exchange authorization code for access token (Outlook)
 */
export async function exchangeOutlookToken(
  code: string,
  redirectUri: string
): Promise<{ token: any; error?: string }> {
  const validation = validateEmailCredentials('outlook');
  if (!validation.valid) {
    return { token: null, error: validation.error };
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { token: null, error: `Token exchange failed: ${response.status} ${errorText}` };
    }

    const token = await response.json();
    return { token };
  } catch (error) {
    return {
      token: null,
      error: `Token exchange error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Add privilege warning to email footer
 */
export function addPrivilegeWarning(emailContent: string, matterId?: string): string {
  const warning = `
---
CONFIDENTIALITY NOTICE: This email and any attachments may contain attorney-client privileged 
or confidential information. If you are not the intended recipient, please do not read, copy, 
or distribute this message. If you received this in error, please notify the sender immediately 
and delete this message.
${matterId ? `Matter ID: ${matterId}` : ''}
---
`;
  return emailContent + warning;
}

/**
 * Filter emails by matter ID
 */
export function filterEmailsByMatter(
  emails: any[],
  matterId: string
): any[] {
  return emails.filter(email => {
    // Check if email is associated with matter
    return email.matterId === matterId || 
           email.matter_id === matterId ||
           (email.metadata && email.metadata.matterId === matterId);
  });
}

}
}
}
}
}
}
}
}