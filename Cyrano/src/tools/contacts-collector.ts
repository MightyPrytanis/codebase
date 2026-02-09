/**
 * Contacts Collector Tool
 * 
 * Collects contacts from Gmail (Google Contacts) and Outlook (Microsoft Contacts)
 * for client/matter relationship tracking
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { GmailService } from '../services/gmail-service.js';
import { OutlookCalendarService } from '../services/outlook-calendar-service.js';

const ContactsCollectorSchema = z.object({
  provider: z.enum(['gmail', 'outlook', 'both']).default('both').describe('Contacts provider to search'),
  search_query: z.string().optional().describe('Optional search query to filter contacts'),
});

export const contactsCollector = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'contacts_collector',
      description: 'Collect contacts from Gmail (Google Contacts) and Outlook (Microsoft Contacts) for client/matter relationship tracking',
      inputSchema: {
        type: 'object' as const,
        properties: {
          provider: {
            type: 'string',
            enum: ['gmail', 'outlook', 'both'],
            default: 'both',
            description: 'Contacts provider to search',
          },
          search_query: {
            type: 'string',
            description: 'Optional search query to filter contacts',
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const { provider, search_query } = ContactsCollectorSchema.parse(args);
      
      const contacts: any[] = [];
      const errors: string[] = [];

      // Collect from Google Contacts if requested
      if (provider === 'gmail' || provider === 'both') {
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
            const googleContacts = await gmailService.getContacts();
            
            let filteredContacts = googleContacts;
            if (search_query) {
              const query = search_query.toLowerCase();
              filteredContacts = googleContacts.filter(contact =>
                contact.name?.toLowerCase().includes(query) ||
                contact.email?.toLowerCase().includes(query) ||
                contact.organization?.toLowerCase().includes(query)
              );
            }
            
            contacts.push(...filteredContacts.map(contact => ({
              id: `google_${contact.id}`,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              organization: contact.organization,
              provider: 'google',
            })));
          } else {
            errors.push('Google Contacts not configured (missing GMAIL_CLIENT_ID or GMAIL_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Google Contacts error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Collect from Outlook Contacts if requested
      if (provider === 'outlook' || provider === 'both') {
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
            const outlookService = new OutlookCalendarService(outlookConfig);
            const outlookContacts = await outlookService.getContacts();
            
            let filteredContacts = outlookContacts;
            if (search_query) {
              const query = search_query.toLowerCase();
              filteredContacts = outlookContacts.filter(contact =>
                contact.displayName?.toLowerCase().includes(query) ||
                contact.emailAddresses?.some(e => e.address?.toLowerCase().includes(query)) ||
                contact.companyName?.toLowerCase().includes(query)
              );
            }
            
            contacts.push(...filteredContacts.map(contact => ({
              id: `outlook_${contact.id}`,
              name: contact.displayName,
              email: contact.emailAddresses?.[0]?.address,
              phone: contact.mobilePhone || contact.businessPhones?.[0],
              organization: contact.companyName,
              jobTitle: contact.jobTitle,
              provider: 'outlook',
            })));
          } else {
            errors.push('Outlook Contacts not configured (missing OUTLOOK_CLIENT_ID or OUTLOOK_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Outlook Contacts error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const result = {
        provider,
        contacts_found: contacts.length,
        contacts: contacts,
        errors: errors.length > 0 ? errors : undefined,
        note: errors.length > 0 ? 'Some contacts providers not configured or failed' : undefined,
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in contacts_collector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

