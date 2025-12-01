/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { GmailService } from '../services/gmail-service.js';
import { OutlookService } from '../services/outlook-service.js';

const EmailArtifactCollectorSchema = z.object({
  start_date: z.string().describe('Start date for email collection (YYYY-MM-DD)'),
  end_date: z.string().describe('End date for email collection (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID to filter emails'),
  email_provider: z.enum(['gmail', 'outlook', 'both']).default('both').describe('Email provider to search'),
  keywords: z.array(z.string()).optional().describe('Optional keywords to filter emails'),
});

export const emailArtifactCollector = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'email_artifact_collector',
      description: 'Collect email artifacts (sent/received emails) as evidence for time reconstruction',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for email collection (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date for email collection (YYYY-MM-DD)',
          },
          matter_id: {
            type: 'string',
            description: 'Optional matter ID to filter emails',
          },
          email_provider: {
            type: 'string',
            enum: ['gmail', 'outlook', 'both'],
            default: 'both',
            description: 'Email provider to search',
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional keywords to filter emails',
          },
        },
        required: ['start_date', 'end_date'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { start_date, end_date, matter_id, email_provider, keywords } = EmailArtifactCollectorSchema.parse(args);
      
      const emails: any[] = [];
      const errors: string[] = [];

      // Collect from Gmail if requested
      if (email_provider === 'gmail' || email_provider === 'both') {
        try {
          const gmailConfig = {
            clientId: process.env.GMAIL_CLIENT_ID || '',
            clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
            redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5002/auth/gmail/callback',
            accessToken: process.env.GMAIL_ACCESS_TOKEN,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          };

          if (gmailConfig.clientId && gmailConfig.accessToken) {
            const gmailService = new GmailService(gmailConfig);
            const query = keywords ? keywords.join(' ') : undefined;
            const gmailEmails = await gmailService.getEmails(start_date, end_date, query);
            
            emails.push(...gmailEmails.map(email => ({
              id: `gmail_${email.id}`,
              date: email.date,
              subject: email.subject,
              from: email.from,
              to: email.to,
              sent: true,
              evidence_type: 'direct',
              provider: 'gmail',
              snippet: email.snippet,
            })));
          } else {
            errors.push('Gmail not configured (missing GMAIL_CLIENT_ID or GMAIL_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Gmail error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Collect from Outlook if requested
      if (email_provider === 'outlook' || email_provider === 'both') {
        try {
          const outlookConfig = {
            clientId: process.env.OUTLOOK_CLIENT_ID || '',
            clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
            tenantId: process.env.OUTLOOK_TENANT_ID || 'common',
            redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5002/auth/outlook/callback',
            accessToken: process.env.OUTLOOK_ACCESS_TOKEN,
            refreshToken: process.env.OUTLOOK_REFRESH_TOKEN,
          };

          if (outlookConfig.clientId && outlookConfig.accessToken) {
            const outlookService = new OutlookService(outlookConfig);
            const outlookEmails = await outlookService.getEmails(start_date, end_date, 'Inbox');
            
            emails.push(...outlookEmails.map(email => ({
              id: `outlook_${email.id}`,
              date: email.receivedDateTime,
              subject: email.subject,
              from: email.from,
              to: email.to,
              sent: true,
              evidence_type: 'direct',
              provider: 'outlook',
              snippet: email.bodyPreview,
            })));
          } else {
            errors.push('Outlook not configured (missing OUTLOOK_CLIENT_ID or OUTLOOK_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Outlook error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Filter by matter_id if provided (basic keyword matching)
      let filteredEmails = emails;
      if (matter_id && keywords && keywords.length > 0) {
        const searchTerms = [matter_id, ...keywords].map(term => term.toLowerCase());
        filteredEmails = emails.filter(email => 
          searchTerms.some(term => 
            email.subject?.toLowerCase().includes(term) ||
            email.snippet?.toLowerCase().includes(term)
          )
        );
      }

      const result = {
        period: { start_date, end_date },
        provider: email_provider,
        emails_found: filteredEmails.length,
        emails: filteredEmails,
        errors: errors.length > 0 ? errors : undefined,
        note: errors.length > 0 ? 'Some email providers not configured or failed' : undefined,
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in email_artifact_collector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
