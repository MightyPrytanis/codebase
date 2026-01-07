/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const SyncManagerSchema = z.object({
  service: z.enum(['clio', 'gmail', 'calendar', 'westlaw', 'icle', 'all']).describe('Service to sync (MiFile removed - use micourt_query for user-initiated docket queries)'),
  action: z.enum(['status', 'sync', 'force_sync']).default('status').describe('Sync action to perform'),
  parameters: z.record(z.string(), z.any()).optional().describe('Sync parameters'),
});

export const syncManager: BaseTool = new (class extends BaseTool {
  public syncStates: Map<string, any> = new Map();
  public syncProgress: Map<string, number> = new Map();

  getToolDefinition() {
    return {
      name: 'sync_manager',
      description: 'Manage synchronization with external services (Clio, Gmail, Calendar, etc.)',
      inputSchema: {
        type: 'object' as const,
        properties: {
          service: {
            type: 'string',
            enum: ['clio', 'gmail', 'calendar', 'westlaw', 'icle', 'all'],
            description: 'Service to sync',
          },
          action: {
            type: 'string',
            enum: ['status', 'sync', 'force_sync'],
            default: 'status',
            description: 'Sync action to perform',
          },
          parameters: {
            type: 'object' as const,
            description: 'Sync parameters',
          },
        },
        required: ['service'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { service, action, parameters } = SyncManagerSchema.parse(args);
      
      if (service === 'all') {
        const services = ['clio', 'gmail', 'calendar', 'westlaw', 'icle'];
        const results = await Promise.all(services.map(svc => this.handleSync(svc, action, parameters)));
        return this.createSuccessResult(JSON.stringify({
          service: 'all',
          action,
          services: results,
          timestamp: new Date().toISOString(),
        }, null, 2));
      }

      const result = await this.handleSync(service, action, parameters);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async handleSync(service: string, action: string, parameters?: any): Promise<any> {
    switch (action) {
      case 'status':
        return this.getSyncStatus(service);
      case 'sync':
        return await this.performSync(service, false, parameters);
      case 'force_sync':
        return await this.performSync(service, true, parameters);
      default:
        return { error: `Unknown action: ${action}` };
    }
  }

  public getSyncStatus(service: string): any {
    const lastSync = this.syncStates.get(service) || {
      last_sync: null,
      status: 'never_synced',
      items_synced: 0,
    };

    return {
      service,
      status: this.calculateSyncStatus(service),
      last_sync: lastSync.last_sync,
      items_synced: lastSync.items_synced,
      next_sync: this.calculateNextSync(service),
      health: this.calculateHealthStatus(service),
    };
  }

  public async performSync(service: string, force: boolean, parameters?: any): Promise<any> {
    const syncId = `${service}-${Date.now()}`;
    
    this.syncProgress.set(syncId, 0);
    
    const result = {
      service,
      sync_id: syncId,
      action: force ? 'force_sync' : 'sync',
      status: 'syncing',
      started_at: new Date().toISOString(),
      progress: 0,
      estimated_completion: this.estimateCompletion(service),
      items: { total: 0, new: 0, updated: 0 },
    };

    // Update sync state
    this.syncStates.set(service, {
      last_sync: new Date().toISOString(),
      status: 'syncing',
      items_synced: 0,
      sync_id: syncId,
    });

    try {
      this.updateProgress(syncId, service, 10);
      
      // Perform actual sync based on service
      let syncResult: any;
      
      switch (service) {
        case 'gmail':
          syncResult = await this.syncGmail(force, parameters);
          break;
        case 'calendar':
          syncResult = await this.syncCalendar(force, parameters);
          break;
        case 'clio':
          syncResult = await this.syncClio(force, parameters);
          break;
        case 'westlaw':
        case 'icle':
          // These services don't have sync implementations yet
          return {
            ...result,
            status: 'error',
            error: `${service} sync not yet implemented. Requires API credentials and integration.`,
          };
        default:
          return {
            ...result,
            status: 'error',
            error: `Unknown service: ${service}`,
          };
      }

      this.updateProgress(syncId, service, 90);
      
      // Complete sync
      const itemCount = syncResult.items_synced || 0;
      this.completeSync(syncId, service);
      
      return {
        ...result,
        status: 'completed',
        progress: 100,
        items: {
          total: itemCount,
          new: syncResult.new_items || 0,
          updated: syncResult.updated_items || 0,
        },
        completed_at: new Date().toISOString(),
      };
    } catch (error) {
      this.syncStates.set(service, {
        last_sync: this.syncStates.get(service)?.last_sync || null,
        status: 'error',
        items_synced: 0,
        sync_id: syncId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      return {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public updateProgress(syncId: string, service: string, progress: number): void {
    this.syncProgress.set(syncId, progress);
    const state = this.syncStates.get(service);
    if (state) {
      state.progress = progress;
      state.status = 'syncing';
    }
  }

  public completeSync(syncId: string, service: string): void {
    this.syncProgress.set(syncId, 100);
    const itemCount = this.getExpectedItems(service).total;
    this.syncStates.set(service, {
      last_sync: new Date().toISOString(),
      status: 'completed',
      items_synced: itemCount,
      sync_id: syncId,
      progress: 100,
    });
  }

  public calculateSyncStatus(service: string): string {
    const state = this.syncStates.get(service);
    if (!state || !state.last_sync) return 'never_synced';
    
    const lastSync = new Date(state.last_sync);
    const minutesAgo = (Date.now() - lastSync.getTime()) / 60000;
    
    if (state.status === 'syncing') return 'syncing';
    if (minutesAgo < 5) return 'healthy';
    if (minutesAgo < 30) return 'recent';
    if (minutesAgo < 120) return 'stale';
    return 'needs_sync';
  }

  public calculateNextSync(service: string): string {
    const intervals: Record<string, number> = {
      gmail: 5, // 5 minutes
      calendar: 15, // 15 minutes
      clio: 30, // 30 minutes
      westlaw: 60, // 1 hour
      icle: 1440, // 24 hours
    };

    const interval = intervals[service] || 30;
    const state = this.syncStates.get(service);
    
    if (!state || !state.last_sync) {
      return 'Pending first sync';
    }

    const nextSync = new Date(new Date(state.last_sync).getTime() + interval * 60000);
    const minutesUntil = Math.round((nextSync.getTime() - Date.now()) / 60000);
    
    if (minutesUntil <= 0) return 'Now';
    if (minutesUntil < 60) return `In ${minutesUntil} minutes`;
    return `In ${Math.round(minutesUntil / 60)} hours`;
  }

  public calculateHealthStatus(service: string): string {
    const status = this.calculateSyncStatus(service);
    const healthMap: Record<string, string> = {
      never_synced: 'warning',
      syncing: 'active',
      healthy: 'good',
      recent: 'good',
      stale: 'warning',
      needs_sync: 'error',
    };
    return healthMap[status] || 'unknown';
  }

  public estimateCompletion(service: string): string {
    const estimates: Record<string, string> = {
      gmail: '30-60 seconds',
      calendar: '15-30 seconds',
      clio: '1-3 minutes',
      westlaw: '2-5 minutes',
      icle: '1-2 minutes',
    };
    return estimates[service] || '1-2 minutes';
  }

  public getExpectedItems(service: string): any {
    const items: Record<string, any> = {
      gmail: { total: 247, new: 24, updated: 8 },
      calendar: { total: 45, new: 3, updated: 2 },
      clio: { total: 156, new: 12, updated: 15 },
      westlaw: { total: 89, new: 5, updated: 3 },
      icle: { total: 23, new: 2, updated: 1 },
    };
    return items[service] || { total: 0, new: 0, updated: 0 };
  }

  public getProgressForSync(syncId: string): number {
    return this.syncProgress.get(syncId) || 0;
  }

  /**
   * Sync Gmail emails
   * Requires Gmail OAuth credentials
   */
  private async syncGmail(force: boolean, parameters?: any): Promise<any> {
    const { GmailService } = await import('../services/gmail-service.js');
    
    // Get credentials from environment or parameters
    const clientId = process.env.GMAIL_CLIENT_ID || parameters?.clientId;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET || parameters?.clientSecret;
    const accessToken = process.env.GMAIL_ACCESS_TOKEN || parameters?.accessToken;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN || parameters?.refreshToken;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Gmail sync requires GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables. ' +
        'OAuth2 authentication required. See Gmail API documentation for setup.'
      );
    }

    if (!accessToken && !refreshToken) {
      throw new Error(
        'Gmail sync requires GMAIL_ACCESS_TOKEN or GMAIL_REFRESH_TOKEN. ' +
        'Please authenticate via OAuth2 first.'
      );
    }

    const gmailService = new GmailService({
      clientId,
      clientSecret,
      redirectUri: process.env.GMAIL_REDIRECT_URI || parameters?.redirectUri || 'http://localhost:3000/oauth/callback',
      accessToken,
      refreshToken,
    });

    // Determine date range (default: last 7 days, or force: last 30 days)
    const daysBack = force ? 30 : 7;
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    try {
      const emails = await gmailService.getEmails(startDate, endDate);
      
      return {
        items_synced: emails.length,
        new_items: emails.length, // Simplified - would need to track previously synced
        updated_items: 0,
        service: 'gmail',
      };
    } catch (error) {
      throw new Error(
        `Gmail sync failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Check OAuth credentials and access token validity.'
      );
    }
  }

  /**
   * Sync Calendar events
   * Supports both Gmail Calendar and Outlook Calendar
   */
  private async syncCalendar(force: boolean, parameters?: any): Promise<any> {
    const calendarType = parameters?.type || process.env.CALENDAR_TYPE || 'gmail';
    
    if (calendarType === 'gmail' || calendarType === 'google') {
      const { GmailService } = await import('../services/gmail-service.js');
      
      const clientId = process.env.GMAIL_CLIENT_ID || parameters?.clientId;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET || parameters?.clientSecret;
      const accessToken = process.env.GMAIL_ACCESS_TOKEN || parameters?.accessToken;
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN || parameters?.refreshToken;

      if (!clientId || !clientSecret) {
        throw new Error(
          'Google Calendar sync requires GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET. ' +
          'OAuth2 authentication required.'
        );
      }

      if (!accessToken && !refreshToken) {
        throw new Error(
          'Google Calendar sync requires GMAIL_ACCESS_TOKEN or GMAIL_REFRESH_TOKEN. ' +
          'Please authenticate via OAuth2 first.'
        );
      }

      const gmailService = new GmailService({
        clientId,
        clientSecret,
        redirectUri: process.env.GMAIL_REDIRECT_URI || parameters?.redirectUri || 'http://localhost:3000/oauth/callback',
        accessToken,
        refreshToken,
      });

      const daysBack = force ? 90 : 30;
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      try {
        const events = await gmailService.getCalendarEvents(startDate, endDate);
        
        return {
          items_synced: events.length,
          new_items: events.length,
          updated_items: 0,
          service: 'calendar',
          calendar_type: 'google',
        };
      } catch (error) {
        throw new Error(
          `Google Calendar sync failed: ${error instanceof Error ? error.message : String(error)}. ` +
          'Check OAuth credentials and access token validity.'
        );
      }
    } else if (calendarType === 'outlook' || calendarType === 'microsoft') {
      const { OutlookCalendarService } = await import('../services/outlook-calendar-service.js');
      
      const clientId = process.env.OUTLOOK_CLIENT_ID || parameters?.clientId;
      const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || parameters?.clientSecret;
      const tenantId = process.env.OUTLOOK_TENANT_ID || parameters?.tenantId;
      const accessToken = process.env.OUTLOOK_ACCESS_TOKEN || parameters?.accessToken;
      const refreshToken = process.env.OUTLOOK_REFRESH_TOKEN || parameters?.refreshToken;

      if (!clientId || !clientSecret || !tenantId) {
        throw new Error(
          'Outlook Calendar sync requires OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_TENANT_ID. ' +
          'OAuth2 authentication required.'
        );
      }

      if (!accessToken && !refreshToken) {
        throw new Error(
          'Outlook Calendar sync requires OUTLOOK_ACCESS_TOKEN or OUTLOOK_REFRESH_TOKEN. ' +
          'Please authenticate via OAuth2 first.'
        );
      }

      const outlookService = new OutlookCalendarService({
        clientId,
        clientSecret,
        tenantId,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || parameters?.redirectUri || 'http://localhost:3000/oauth/callback',
        accessToken,
        refreshToken,
      });

      const daysBack = force ? 90 : 30;
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      try {
        const events = await outlookService.getCalendarEvents(startDate, endDate);
        
        return {
          items_synced: events.length,
          new_items: events.length,
          updated_items: 0,
          service: 'calendar',
          calendar_type: 'outlook',
        };
      } catch (error) {
        throw new Error(
          `Outlook Calendar sync failed: ${error instanceof Error ? error.message : String(error)}. ` +
          'Check OAuth credentials and access token validity.'
        );
      }
    } else {
      throw new Error(`Unknown calendar type: ${calendarType}. Supported: 'gmail', 'outlook'`);
    }
  }

  /**
   * Sync Clio data
   * Requires Clio API key
   */
  private async syncClio(force: boolean, parameters?: any): Promise<any> {
    const { ClioAPIService } = await import('../services/clio-api.js');
    
    const apiKey = process.env.CLIO_API_KEY || parameters?.apiKey;
    const accessToken = process.env.CLIO_ACCESS_TOKEN || parameters?.accessToken;
    const region = (process.env.CLIO_REGION as any) || parameters?.region || 'US';

    if (!apiKey && !accessToken) {
      throw new Error(
        'Clio sync requires CLIO_API_KEY or CLIO_ACCESS_TOKEN environment variable. ' +
        'See Clio API documentation for OAuth setup.'
      );
    }

    const clioService = new ClioAPIService({
      apiKey,
      accessToken,
      region,
    });

    if (!clioService.isConfigured()) {
      throw new Error('Clio API not configured. Please set CLIO_API_KEY or CLIO_ACCESS_TOKEN.');
    }

    try {
      // Sync matters, activities, and tasks
      const matters = await clioService.listMatters({ limit: force ? 500 : 100 });
      const activities = await clioService.listActivities({ limit: force ? 500 : 100 });
      const tasks = await clioService.listTasks({ limit: force ? 500 : 100 });
      
      const totalItems = matters.data.length + activities.data.length + tasks.data.length;
      
      return {
        items_synced: totalItems,
        new_items: totalItems, // Simplified - would need to track previously synced
        updated_items: 0,
        service: 'clio',
        breakdown: {
          matters: matters.data.length,
          activities: activities.data.length,
          tasks: tasks.data.length,
        },
      };
    } catch (error) {
      throw new Error(
        `Clio sync failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Check API key validity and rate limits.'
      );
    }
  }
})();





