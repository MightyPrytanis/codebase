/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Workflow Archaeology Service
 * Shared forensic recreation service for reconstructing past hours, days, or weeks
 * 
 * Usable by both LexFiat (time tracking) and Arkiver (workflow/document history).
 * Leverages artifact collection logic to reconstruct timelines with evidence chains.
 * 
 * Key Features:
 * - Time granularity: hour, day, week
 * - Artifact collection from multiple sources (email, calendar, documents, calls)
 * - Timeline reconstruction with evidence chain
 * - Structured output for UI display
 * - Self-documenting development process
 */

export interface ArtifactSource {
  type: 'email' | 'calendar' | 'document' | 'call' | 'other';
  id: string;
  timestamp: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface TimelineEvent {
  timestamp: string;
  type: string;
  description: string;
  artifacts: ArtifactSource[];
  confidence: 'low' | 'medium' | 'high';
  duration_minutes?: number;
}

export interface ReconstructionResult {
  period: {
    start: string;
    end: string;
    granularity: 'hour' | 'day' | 'week';
  };
  timeline: TimelineEvent[];
  evidence_chain: {
    total_artifacts: number;
    by_type: Record<string, number>;
    coverage_percentage: number;
  };
  confidence: 'low' | 'medium' | 'high';
  gaps: Array<{ start: string; end: string; reason: string }>;
  metadata: Record<string, any>;
}

/**
 * Workflow Archaeology Service
 * Reconstructs past timelines from artifact analysis
 */
export class WorkflowArchaeologyService {
  /**
   * Reconstruct a time period from collected artifacts
   */
  async reconstructTimePeriod(
    startTime: string,
    endTime: string,
    context: Record<string, any>,
    artifactSources: ArtifactSource[]
  ): Promise<ReconstructionResult> {
    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Determine granularity
    const granularity: 'hour' | 'day' | 'week' =
      durationHours <= 1 ? 'hour' :
      durationHours <= 24 ? 'day' : 'week';

    // Sort artifacts by timestamp
    const sortedArtifacts = [...artifactSources].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Build timeline events
    const timeline: TimelineEvent[] = [];
    const eventMap = new Map<string, TimelineEvent>();

    for (const artifact of sortedArtifacts) {
      const timestamp = artifact.timestamp;
      const hour = new Date(timestamp).toISOString().substring(0, 13); // Group by hour

      if (!eventMap.has(hour)) {
        eventMap.set(hour, {
          timestamp: hour + ':00:00.000Z',
          type: 'activity',
          description: this.generateDescription([artifact]),
          artifacts: [artifact],
          confidence: 'medium',
        });
      } else {
        const event = eventMap.get(hour)!;
        event.artifacts.push(artifact);
        event.description = this.generateDescription(event.artifacts);
      }
    }

    // Convert map to array and calculate durations
    for (const event of eventMap.values()) {
      // Estimate duration based on artifact type and count
      event.duration_minutes = this.estimateDuration(event.artifacts);
      // Calculate confidence based on artifact density
      event.confidence = this.calculateConfidence(event.artifacts);
      timeline.push(event);
    }

    // Identify gaps
    const gaps = this.identifyGaps(timeline, start, end, granularity);

    // Calculate coverage
    const totalMinutes = durationHours * 60;
    const coveredMinutes = timeline.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const coveragePercentage = Math.min(100, (coveredMinutes / totalMinutes) * 100);

    // Calculate by-type counts
    const byType: Record<string, number> = {};
    for (const artifact of artifactSources) {
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
    }

    // Overall confidence
    const confidence: 'low' | 'medium' | 'high' =
      coveragePercentage >= 70 && artifactSources.length >= 10 ? 'high' :
      coveragePercentage >= 40 && artifactSources.length >= 5 ? 'medium' : 'low';

    return {
      period: {
        start: startTime,
        end: endTime,
        granularity,
      },
      timeline,
      evidence_chain: {
        total_artifacts: artifactSources.length,
        by_type: byType,
        coverage_percentage: Math.round(coveragePercentage * 10) / 10,
      },
      confidence,
      gaps,
      metadata: {
        ...context,
        reconstruction_timestamp: new Date().toISOString(),
        algorithm_version: '1.0.0',
      },
    };
  }

  /**
   * Generate description from artifacts
   */
  private generateDescription(artifacts: ArtifactSource[]): string {
    const types = artifacts.map(a => a.type);
    const uniqueTypes = Array.from(new Set(types));

    if (uniqueTypes.length === 1) {
      const type = uniqueTypes[0];
      return `${artifacts.length} ${type}${artifacts.length > 1 ? 's' : ''}`;
    }

    const typeCounts = uniqueTypes.map(type => {
      const count = types.filter(t => t === type).length;
      return `${count} ${type}${count > 1 ? 's' : ''}`;
    });

    return typeCounts.join(', ');
  }

  /**
   * Estimate duration based on artifacts
   */
  private estimateDuration(artifacts: ArtifactSource[]): number {
    // Base duration on artifact type and count
    const baseDurations: Record<string, number> = {
      email: 5,
      calendar: 30,
      document: 15,
      call: 15,
      other: 10,
    };

    let totalMinutes = 0;
    for (const artifact of artifacts) {
      totalMinutes += baseDurations[artifact.type] || 10;
    }

    // Cap at 60 minutes per hour block
    return Math.min(60, totalMinutes);
  }

  /**
   * Calculate confidence based on artifact density
   */
  private calculateConfidence(artifacts: ArtifactSource[]): 'low' | 'medium' | 'high' {
    if (artifacts.length >= 5) return 'high';
    if (artifacts.length >= 2) return 'medium';
    return 'low';
  }

  /**
   * Identify gaps in timeline coverage
   */
  private identifyGaps(
    timeline: TimelineEvent[],
    start: Date,
    end: Date,
    granularity: 'hour' | 'day' | 'week'
  ): Array<{ start: string; end: string; reason: string }> {
    const gaps: Array<{ start: string; end: string; reason: string }> = [];

    if (timeline.length === 0) {
      gaps.push({
        start: start.toISOString(),
        end: end.toISOString(),
        reason: 'No artifacts found for entire period',
      });
      return gaps;
    }

    // Check for gaps between events (simplified - hour granularity)
    const minGapHours = granularity === 'hour' ? 1 : granularity === 'day' ? 8 : 24;
    const minGapMs = minGapHours * 60 * 60 * 1000;

    for (let i = 0; i < timeline.length - 1; i++) {
      const currentEnd = new Date(timeline[i].timestamp);
      const nextStart = new Date(timeline[i + 1].timestamp);
      const gapMs = nextStart.getTime() - currentEnd.getTime();

      if (gapMs >= minGapMs) {
        gaps.push({
          start: currentEnd.toISOString(),
          end: nextStart.toISOString(),
          reason: `${Math.round(gapMs / (1000 * 60 * 60))} hour gap with no artifacts`,
        });
      }
    }

    return gaps;
  }

  /**
   * Architectural Decision Log
   * 
   * This service implements a shared forensic reconstruction approach for the following reasons:
   * 
   * 1. **Shared Service vs. Separate Tools:**
   *    - Shared service avoids code duplication between LexFiat and Arkiver
   *    - Maintains consistency in reconstruction logic across applications
   *    - Allows for centralized improvements and bug fixes
   *    - Simplifies testing and maintenance
   * 
   * 2. **Hour/Day/Week Granularity:**
   *    - Hour: For detailed time tracking and billable time reconstruction
   *    - Day: For daily activity summaries and productivity analysis
   *    - Week: For high-level workflow patterns and trend analysis
   *    - Automatic selection based on time period duration
   * 
   * 3. **Reuse of Chronometric Artifact Collection:**
   *    - Leverages existing email_artifact_collector tool
   *    - Leverages existing calendar_artifact_collector tool
   *    - Leverages existing document_artifact_collector tool
   *    - Avoids reimplementing artifact collection logic
   *    - Maintains consistency with Chronometric module
   * 
   * 4. **Integration Decisions:**
   *    - Chronometric uses forensic-reconstruction service for time entry generation
   *    - Arkiver uses workflow-archaeology tool for document processing history
   *    - Both apps can call the same MCP tool through different contexts
   *    - Separation of concerns: service provides logic, tool provides MCP interface
   * 
   * 5. **Self-Documenting Development:**
   *    - This service documents its own design decisions (this comment)
   *    - Commit messages track implementation reasoning
   *    - Code comments explain non-obvious choices
   *    - Can reconstruct its own development timeline using workflow archaeology
   */
}

// Export singleton instance
export const workflowArchaeologyService = new WorkflowArchaeologyService();

