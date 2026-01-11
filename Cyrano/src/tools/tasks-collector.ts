/**
 * Tasks Collector Tool
 * 
 * Collects tasks/to-do items from Gmail (Google Tasks) and Outlook (Microsoft To-Do)
 * for time reconstruction and workflow tracking
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

const TasksCollectorSchema = z.object({
  provider: z.enum(['gmail', 'outlook', 'both']).default('both').describe('Task provider to search'),
  task_list_id: z.string().optional().describe('Optional task list ID (for Outlook)'),
  include_completed: z.boolean().default(false).describe('Include completed tasks'),
});

export const tasksCollector = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'tasks_collector',
      description: 'Collect tasks and to-do items from Gmail (Google Tasks) and Outlook (Microsoft To-Do) as evidence for time reconstruction',
      inputSchema: {
        type: 'object' as const,
        properties: {
          provider: {
            type: 'string',
            enum: ['gmail', 'outlook', 'both'],
            default: 'both',
            description: 'Task provider to search',
          },
          task_list_id: {
            type: 'string',
            description: 'Optional task list ID (for Outlook)',
          },
          include_completed: {
            type: 'boolean',
            default: false,
            description: 'Include completed tasks',
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const { provider, task_list_id, include_completed } = TasksCollectorSchema.parse(args);
      
      const tasks: any[] = [];
      const errors: string[] = [];

      // Collect from Google Tasks if requested
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
            const googleTasks = await gmailService.getTasks();
            
            tasks.push(...googleTasks
              .filter(task => include_completed || task.status !== 'completed')
              .map(task => ({
                id: `google_${task.id}`,
                title: task.title,
                notes: task.notes,
                due: task.due,
                status: task.status,
                updated: task.updated,
                provider: 'google',
                evidence_type: 'circumstantial',
              })));
          } else {
            errors.push('Google Tasks not configured (missing GMAIL_CLIENT_ID or GMAIL_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Google Tasks error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Collect from Outlook To-Do if requested
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
            const outlookTasks = await outlookService.getTasks(task_list_id);
            
            tasks.push(...outlookTasks
              .filter(task => include_completed || task.status !== 'completed')
              .map(task => ({
                id: `outlook_${task.id}`,
                title: task.subject,
                notes: task.body,
                due: task.dueDateTime,
                status: task.status,
                updated: task.dueDateTime || task.startDateTime,
                provider: 'outlook',
                evidence_type: 'circumstantial',
                importance: task.importance,
              })));
          } else {
            errors.push('Outlook To-Do not configured (missing OUTLOOK_CLIENT_ID or OUTLOOK_ACCESS_TOKEN)');
          }
        } catch (error) {
          errors.push(`Outlook To-Do error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const result = {
        provider,
        tasks_found: tasks.length,
        tasks: tasks,
        errors: errors.length > 0 ? errors : undefined,
        note: errors.length > 0 ? 'Some task providers not configured or failed' : undefined,
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in tasks_collector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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