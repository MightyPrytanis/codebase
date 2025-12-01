/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const SyncManagerSchema = z.object({
  service: z.enum(['clio', 'gmail', 'calendar', 'westlaw', 'icle', 'mifile', 'all']).describe('Service to sync'),
  action: z.enum(['status', 'sync', 'force_sync']).default('status').describe('Sync action to perform'),
  parameters: z.record(z.any()).optional().describe('Sync parameters'),
});

export const syncManager = new (class extends BaseTool {
  public syncStates: Map<string, any> = new Map();
  public syncProgress: Map<string, number> = new Map();

  getToolDefinition() {
    return {
      name: 'sync_manager',
      description: 'Manage synchronization with external services (Clio, Gmail, Calendar, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          service: {
            type: 'string',
            enum: ['clio', 'gmail', 'calendar', 'westlaw', 'icle', 'mifile', 'all'],
            description: 'Service to sync',
          },
          action: {
            type: 'string',
            enum: ['status', 'sync', 'force_sync'],
            default: 'status',
            description: 'Sync action to perform',
          },
          parameters: {
            type: 'object',
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
        const services = ['clio', 'gmail', 'calendar', 'westlaw', 'icle', 'mifile'];
        const results = services.map(svc => this.handleSync(svc, action, parameters));
        return this.createSuccessResult(JSON.stringify({
          service: 'all',
          action,
          services: results,
          timestamp: new Date().toISOString(),
        }, null, 2));
      }

      const result = this.handleSync(service, action, parameters);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public handleSync(service: string, action: string, parameters?: any): any {
    switch (action) {
      case 'status':
        return this.getSyncStatus(service);
      case 'sync':
        return this.performSync(service, false, parameters);
      case 'force_sync':
        return this.performSync(service, true, parameters);
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

  public performSync(service: string, force: boolean, parameters?: any): any {
    const syncId = `${service}-${Date.now()}`;
    
    // Simulate sync process
    this.syncProgress.set(syncId, 0);
    
    const result = {
      service,
      sync_id: syncId,
      action: force ? 'force_sync' : 'sync',
      status: 'syncing',
      started_at: new Date().toISOString(),
      progress: 0,
      estimated_completion: this.estimateCompletion(service),
      items: this.getExpectedItems(service),
    };

    // Update sync state
    this.syncStates.set(service, {
      last_sync: new Date().toISOString(),
      status: 'syncing',
      items_synced: 0,
      sync_id: syncId,
    });

    // Simulate progress
    setTimeout(() => this.updateProgress(syncId, service, 25), 1000);
    setTimeout(() => this.updateProgress(syncId, service, 50), 2000);
    setTimeout(() => this.updateProgress(syncId, service, 75), 3000);
    setTimeout(() => this.completeSync(syncId, service), 4000);

    return result;
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
      mifile: 60, // 1 hour
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
      mifile: '2-4 minutes',
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
      mifile: { total: 67, new: 8, updated: 4 },
    };
    return items[service] || { total: 0, new: 0, updated: 0 };
  }

  public getProgressForSync(syncId: string): number {
    return this.syncProgress.get(syncId) || 0;
  }
})();





