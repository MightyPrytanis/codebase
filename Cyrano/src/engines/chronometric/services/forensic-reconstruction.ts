/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { workflowArchaeologyService, ArtifactSource, ReconstructionResult } from '../../../services/workflow-archaeology.js';

/**
 * Forensic Reconstruction Service
 * Chronometric-specific wrapper around Workflow Archaeology Service
 * 
 * Adds time entry generation and billable time context to the shared
 * workflow archaeology service. Integrates with Chronometric modules.
 */

export interface TimeEntry {
  date: string;
  hours: number;
  description: string;
  matter_id?: string;
  billable: boolean;
  source: 'reconstructed';
  artifacts: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface ForensicReconstructionResult extends ReconstructionResult {
  time_entries: TimeEntry[];
  billable_hours: number;
  non_billable_hours: number;
}

/**
 * Forensic Reconstruction Service
 * Wraps workflow archaeology with time entry generation
 */
export class ForensicReconstructionService {
  /**
   * Reconstruct time period and generate time entries
   */
  async reconstructWithTimeEntries(
    startTime: string,
    endTime: string,
    context: Record<string, any>,
    artifactSources: ArtifactSource[]
  ): Promise<ForensicReconstructionResult> {
    // Use shared workflow archaeology service
    const baseResult = await workflowArchaeologyService.reconstructTimePeriod(
      startTime,
      endTime,
      context,
      artifactSources
    );

    // Generate time entries from timeline events
    const time_entries: TimeEntry[] = [];
    let billable_hours = 0;
    let non_billable_hours = 0;

    for (const event of baseResult.timeline) {
      const hours = (event.duration_minutes || 0) / 60;
      const isBillable = this.isBillable(event.artifacts, context);

      const entry: TimeEntry = {
        date: event.timestamp.split('T')[0],
        hours: Math.round(hours * 100) / 100,
        description: event.description,
        matter_id: context.matter_id,
        billable: isBillable,
        source: 'reconstructed',
        artifacts: event.artifacts.map(a => a.id),
        confidence: event.confidence,
      };

      time_entries.push(entry);

      if (isBillable) {
        billable_hours += hours;
      } else {
        non_billable_hours += hours;
      }
    }

    return {
      ...baseResult,
      time_entries,
      billable_hours: Math.round(billable_hours * 100) / 100,
      non_billable_hours: Math.round(non_billable_hours * 100) / 100,
    };
  }

  /**
   * Determine if artifacts represent billable time
   */
  private isBillable(artifacts: ArtifactSource[], context: Record<string, any>): boolean {
    // If matter_id is provided, consider it billable
    if (context.matter_id) {
      return true;
    }

    // Check artifact metadata for billability indicators
    const billableIndicators = ['client', 'matter', 'case', 'motion', 'brief'];
    for (const artifact of artifacts) {
      if (artifact.metadata) {
        const metadataStr = JSON.stringify(artifact.metadata).toLowerCase();
        if (billableIndicators.some(indicator => metadataStr.includes(indicator))) {
          return true;
        }
      }
      if (artifact.content) {
        const contentStr = artifact.content.toLowerCase();
        if (billableIndicators.some(indicator => contentStr.includes(indicator))) {
          return true;
        }
      }
    }

    // Default to non-billable
    return false;
  }

  /**
   * Reconstruct a single hour with high detail
   */
  async reconstructHour(
    startTime: string,
    context: Record<string, any>,
    artifactSources: ArtifactSource[]
  ): Promise<ForensicReconstructionResult> {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    return await this.reconstructWithTimeEntries(
      start.toISOString(),
      end.toISOString(),
      { ...context, granularity: 'hour' },
      artifactSources
    );
  }

  /**
   * Reconstruct a single day
   */
  async reconstructDay(
    date: string,
    context: Record<string, any>,
    artifactSources: ArtifactSource[]
  ): Promise<ForensicReconstructionResult> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return await this.reconstructWithTimeEntries(
      start.toISOString(),
      end.toISOString(),
      { ...context, granularity: 'day' },
      artifactSources
    );
  }

  /**
   * Reconstruct a week
   */
  async reconstructWeek(
    weekStart: string,
    context: Record<string, any>,
    artifactSources: ArtifactSource[]
  ): Promise<ForensicReconstructionResult> {
    const start = new Date(weekStart);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    return await this.reconstructWithTimeEntries(
      start.toISOString(),
      end.toISOString(),
      { ...context, granularity: 'week' },
      artifactSources
    );
  }
}

// Export singleton instance
export const forensicReconstructionService = new ForensicReconstructionService();
