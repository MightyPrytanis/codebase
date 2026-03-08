/*
 * Health Monitor Service
 * Monitors Cyrano instance health continuously
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import os from 'os';
import { db } from '../../../db.js';
import { renderIntegrationService } from './render-integration.js';

export interface HealthIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  auto_fixable: boolean;
  details: any;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    response_time: number;
  };
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    http_bridge: 'healthy' | 'degraded' | 'unhealthy';
    mcp_server: 'healthy' | 'degraded' | 'unhealthy';
  };
  issues: HealthIssue[];
}

class HealthMonitorService {
  private initialized: boolean = false;
  private lastCheck: Date | null = null;

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[Health Monitor] Service initialized');
  }

  async getStatus(): Promise<{ initialized: boolean; last_check: Date | null }> {
    return {
      initialized: this.initialized,
      last_check: this.lastCheck,
    };
  }

  async checkHealth(target?: string): Promise<HealthStatus> {
    this.lastCheck = new Date();
    const issues: HealthIssue[] = [];

    // Get metrics - prefer Render metrics if available
    let cpuUsage: number;
    let memoryUsage: number;
    let responseTime: number;

    if (renderIntegrationService.isRender() && renderIntegrationService.isConfigured()) {
      const renderMetrics = await renderIntegrationService.getRenderMetrics();
      if (renderMetrics) {
        cpuUsage = renderMetrics.cpu_usage;
        memoryUsage = renderMetrics.memory_usage;
        responseTime = renderMetrics.response_time;
      } else {
        // Fallback to system metrics
        cpuUsage = this.getCpuUsage();
        memoryUsage = this.getMemoryUsage();
        responseTime = await this.getResponseTime();
      }
    } else {
      // Use system metrics
      cpuUsage = this.getCpuUsage();
      memoryUsage = this.getMemoryUsage();
      responseTime = await this.getResponseTime();
    }

    const diskUsage = await this.getDiskUsage();

    // Check thresholds
    if (cpuUsage > 90) {
      issues.push({
        type: 'high_cpu',
        severity: 'warning',
        description: `CPU usage is ${cpuUsage.toFixed(1)}%`,
        auto_fixable: false,
        details: { cpu_usage: cpuUsage },
      });
    }

    if (memoryUsage > 90) {
      issues.push({
        type: 'high_memory',
        severity: 'warning',
        description: `Memory usage is ${memoryUsage.toFixed(1)}%`,
        auto_fixable: true,
        details: { memory_usage: memoryUsage },
      });
    }

    if (diskUsage > 90) {
      issues.push({
        type: 'high_disk',
        severity: 'critical',
        description: `Disk usage is ${diskUsage.toFixed(1)}%`,
        auto_fixable: false,
        details: { disk_usage: diskUsage },
      });
    }

    // Service health checks
    const databaseHealth = await this.checkDatabase();
    const httpBridgeHealth = await this.checkHttpBridge();
    const mcpServerHealth = await this.checkMcpServer();

    if (databaseHealth !== 'healthy') {
      issues.push({
        type: 'database_unhealthy',
        severity: databaseHealth === 'unhealthy' ? 'critical' : 'warning',
        description: `Database is ${databaseHealth}`,
        auto_fixable: false,
        details: { health: databaseHealth },
      });
    }

    if (httpBridgeHealth !== 'healthy') {
      issues.push({
        type: 'http_bridge_unhealthy',
        severity: httpBridgeHealth === 'unhealthy' ? 'critical' : 'warning',
        description: `HTTP Bridge is ${httpBridgeHealth}`,
        auto_fixable: true,
        details: { health: httpBridgeHealth },
      });
    }

    if (mcpServerHealth !== 'healthy') {
      issues.push({
        type: 'mcp_server_unhealthy',
        severity: mcpServerHealth === 'unhealthy' ? 'critical' : 'warning',
        description: `MCP Server is ${mcpServerHealth}`,
        auto_fixable: true,
        details: { health: mcpServerHealth },
      });
    }

    // Determine overall status
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
      criticalIssues.length > 0 ? 'unhealthy' :
      issues.length > 0 ? 'degraded' :
      'healthy';

    return {
      status: overallStatus,
      timestamp: this.lastCheck,
      metrics: {
        cpu_usage: cpuUsage,
        memory_usage: memoryUsage,
        disk_usage: diskUsage,
        response_time: responseTime,
      },
      services: {
        database: databaseHealth,
        http_bridge: httpBridgeHealth,
        mcp_server: mcpServerHealth,
      },
      issues,
    };
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  private getMemoryUsage(): number {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return (used / total) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage check
    // In production, use a library like 'diskusage' for accurate disk space
    return 50; // Placeholder
  }

  private async getResponseTime(): Promise<number> {
    // Check HTTP bridge response time
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(5000) });
      const end = Date.now();
      if (response.ok) {
        return end - start;
      }
    } catch (error) {
      // Service not available
    }
    return -1; // Indicates service unavailable
  }

  private async checkDatabase(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      // Simple database health check
      await db.execute({ sql: 'SELECT 1', args: [] });
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  private async checkHttpBridge(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const response = await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        return 'healthy';
      }
      return 'degraded';
    } catch (error) {
      return 'unhealthy';
    }
  }

  private async checkMcpServer(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    // MCP server health check
    // In production, implement actual MCP server health check
    return 'healthy';
  }
}

export const healthMonitorService = new HealthMonitorService();

