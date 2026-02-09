/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { GmailService } from '../services/gmail-service.js';
import { OutlookCalendarService } from '../services/outlook-calendar-service.js';

const CalendarArtifactCollectorSchema = z.object({
  start_date: z.string().describe('Start date for calendar collection (YYYY-MM-DD)'),
  end_date: z.string().describe('End date for calendar collection (YYYY-MM-DD)'),
  calendar_provider: z.enum(['google', 'outlook', 'both']).default('both').describe('Calendar provider to search'),
  include_cancelled: z.boolean().default(false).describe('Include cancelled events'),
});

export const calendarArtifactCollector = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'calendar_artifact_collector',
      description: 'Collect calendar events as circumstantial evidence for time reconstruction',
      inputSchema: {
        type: 'object' as const,
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for calendar collection (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date for calendar collection (YYYY-MM-DD)',
          },
          calendar_provider: {
            type: 'string',
            enum: ['google', 'outlook', 'both'],
            default: 'both',
            description: 'Calendar provider to search',
          },
          include_cancelled: {
            type: 'boolean',
            default: false,
            description: 'Include cancelled events',
          },
        },
        required: ['start_date', 'end_date'],
      },
    };
  }

  async execute(args: any) {
    try {
      // Beta limitation: Calendar API not implemented
      // This tool depends on email OAuth (Gmail/Outlook) for calendar access
      // See docs/BETA_LIMITATIONS.md for details
      
      const { start_date, end_date, calendar_provider, include_cancelled } = CalendarArtifactCollectorSchema.parse(args);
      
      const events: any[] = [];
      const errors: string[] = [];
      
      // Beta warning
      const betaWarning = '⚠️ CALENDAR FEATURES UNAVAILABLE: Calendar API integration is not available in beta release. This tool depends on Gmail/Outlook OAuth for calendar access. See docs/BETA_LIMITATIONS.md for details.';

      // Collect from Google Calendar if requested
      if (calendar_provider === 'google' || calendar_provider === 'both') {
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
            const calendarEvents = await gmailService.getCalendarEvents(start_date, end_date);
            
            events.push(...calendarEvents
              .filter(event => include_cancelled || event.status !== 'cancelled')
              .map(event => ({
                id: `google_${event.id}`,
                date: event.start.split('T')[0],
                start_time: event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : '00:00',
                end_time: event.end.includes('T') ? event.end.split('T')[1].substring(0, 5) : '00:00',
                title: event.summary,
                location: event.location,
                evidence_type: 'circumstantial',
                provider: 'google',
                status: event.status,
              })));
          } else {
            errors.push('Google Calendar not configured (missing GMAIL_CLIENT_ID or GMAIL_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Google Calendar error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Collect from Outlook Calendar if requested
      if (calendar_provider === 'outlook' || calendar_provider === 'both') {
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
            const outlookEvents = await outlookService.getCalendarEvents(start_date, end_date);
            
            events.push(...outlookEvents
              .filter(event => include_cancelled || !event.isCancelled)
              .map(event => ({
                id: `outlook_${event.id}`,
                date: event.start.split('T')[0],
                start_time: event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : '00:00',
                end_time: event.end.includes('T') ? event.end.split('T')[1].substring(0, 5) : '00:00',
                title: event.subject,
                location: event.location,
                evidence_type: 'circumstantial',
                provider: 'outlook',
                status: event.responseStatus || 'notResponded',
              })));
          } else {
            errors.push('Outlook Calendar not configured (missing OUTLOOK_CLIENT_ID or OUTLOOK_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Outlook Calendar error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const result = {
        period: { start_date, end_date },
        provider: calendar_provider,
        events_found: events.length,
        events: events,
        errors: errors.length > 0 ? errors : undefined,
        note: errors.length > 0 ? 'Some calendar providers not configured or failed' : undefined,
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in calendar_artifact_collector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
