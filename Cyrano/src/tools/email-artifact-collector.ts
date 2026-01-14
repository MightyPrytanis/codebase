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

export const emailArtifactCollector: BaseTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'email_artifact_collector',
      description: 'Collect email artifacts (sent/received emails) as evidence for time reconstruction',
      inputSchema: {
        type: 'object' as const,
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
      // REQUIRED CREDENTIALS: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_ACCESS_TOKEN
      // OAuth 2.0 required - See: https://developers.google.com/gmail/api/quickstart/nodejs
      // NO mock fallback - Gmail integration requires valid OAuth credentials
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
            
            emails.push(...gmailEmails.map(email => {
              const processedEmail = this.processEmail(email, 'gmail');
              return {
                id: `gmail_${email.id}`,
                date: email.date,
                subject: email.subject,
                from: email.from,
                to: email.to,
                sent: true,
                evidence_type: processedEmail.evidence_type || 'direct',
                provider: 'gmail',
                snippet: email.snippet,
                ...processedEmail.metadata,
              };
            }));
          } else {
            errors.push('Gmail not configured (missing GMAIL_CLIENT_ID or GMAIL_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Gmail error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Collect from Outlook if requested
      // REQUIRED CREDENTIALS: OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_ACCESS_TOKEN
      // OAuth 2.0 required - See: https://learn.microsoft.com/en-us/graph/auth-v2-user
      // NO mock fallback - Outlook integration requires valid OAuth credentials
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

      // Attempt to link MiFile confirmations to matters if case numbers found
      const linkedEmails = await this.linkMiFileConfirmationsToMatters(filteredEmails, matter_id);

      const result = {
        period: { start_date, end_date },
        provider: email_provider,
        emails_found: linkedEmails.length,
        emails: linkedEmails,
        mifile_confirmations: linkedEmails.filter((e: any) => e.mifile_confirmation).length,
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

  /**
   * Process email to detect court filing/service confirmation emails and extract metadata
   * NOTE: This detects emails FROM MiFile/courts (not an API integration - just email detection)
   */
  private processEmail(email: { subject?: string; from?: string; snippet?: string; date?: string }, provider: string): {
    evidence_type: 'direct' | 'circumstantial';
    metadata: Record<string, any>;
  } {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();
    const combined = `${subject} ${snippet}`;

    // Detect MiFile confirmation emails
    const isMiFileConfirmation = 
      subject.includes('mifile') ||
      subject.includes('michigan') && (subject.includes('filing') || subject.includes('service') || subject.includes('confirmation')) ||
      from.includes('mifile') ||
      from.includes('courts.michigan.gov') ||
      combined.includes('electronic filing confirmation') ||
      combined.includes('service confirmation') ||
      combined.includes('filing accepted') ||
      combined.includes('filing received');

    if (isMiFileConfirmation) {
      // Extract case number (common patterns: 2024-CV-12345, 24-CV-12345, etc.)
      const caseNumberMatch = combined.match(/(\d{2,4}[- ]?[A-Z]{2,4}[- ]?\d{4,})/i);
      const caseNumber = caseNumberMatch ? caseNumberMatch[1].replace(/\s+/g, '-') : null;

      // Determine confirmation type
      const isFilingConfirmation = 
        subject.includes('filing') || 
        snippet.includes('filing') || 
        snippet.includes('filed') ||
        snippet.includes('accepted');
      
      const isServiceConfirmation = 
        subject.includes('service') || 
        snippet.includes('service') || 
        snippet.includes('served');

      // Extract dates (filing date, service date)
      const dateMatch = combined.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
      const extractedDate = dateMatch ? dateMatch[1] : null;

      return {
        evidence_type: 'direct', // Filing/service confirmations are direct evidence
        metadata: {
          mifile_confirmation: true,
          confirmation_type: isFilingConfirmation ? 'filing' : isServiceConfirmation ? 'service' : 'general',
          case_number: caseNumber,
          extracted_date: extractedDate,
          chronometric_priority: 'high', // High priority for time tracking
          matter_linking_candidate: caseNumber ? true : false,
        },
      };
    }

    // Regular email - determine evidence type
    const isDirectEvidence = 
      subject.includes('sent') || 
      subject.includes('filed') ||
      snippet.includes('attached') ||
      snippet.includes('enclosed');

    return {
      evidence_type: isDirectEvidence ? 'direct' : 'circumstantial',
      metadata: {},
    };
  }

  /**
   * Link court filing confirmation emails to matters based on case numbers
   * NOTE: These are emails FROM MiFile/courts (not an API integration - just email detection)
   */
  private async linkMiFileConfirmationsToMatters(emails: any[], matter_id?: string): Promise<any[]> {
    // If matter_id provided, try to link confirmations to that matter
    if (matter_id) {
      return emails.map(email => {
        if (email.mifile_confirmation && email.case_number) {
          return {
            ...email,
            linked_matter_id: matter_id,
            linking_method: 'explicit_matter_id',
          };
        }
        return email;
      });
    }

    // Otherwise, emails with case numbers are candidates for automatic linking
    // (Actual linking would require case_manager integration - this is a placeholder)
    return emails.map(email => {
      if (email.mifile_confirmation && email.case_number) {
        return {
          ...email,
          linking_candidate: true,
          note: 'Case number extracted - can be linked to matter if case number matches',
        };
      }
      return email;
    });
  }
})();

)
}
}
}
}
}
}
}
}