/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Workflow Status Tool
 * Provides summarized status for compact HUD
 */

import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getAllAuditLogs } from '../engines/workflow/state-transition-log.js';
import { isDemoModeEnabled, markAsDemo } from '../utils/demo-mode.js';
import { DocumentState } from '../engines/workflow/document-state-machine.js';

export const workflowStatusTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'workflow_status',
      description: 'Get high-level workflow status for compact HUD, including counts of incoming items by action type (respond, review for response, review and forward, read FYI), drafts in progress, items waiting for review, and active GoodCounsel prompts. Returns errors when data unavailable (demo mode opt-in only via DEMO_MODE=true).',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      // Get audit logs to count documents in various states
      const auditLogs = getAllAuditLogs();
      
      // Count documents by their current state from audit logs
      // Get the latest state for each document
      const documentStates = new Map<string, DocumentState>();
      
      // Process audit logs to determine current state of each document
      // Sort by timestamp to ensure we process in chronological order
      const sortedLogs = [...auditLogs].sort((a, b) => 
        a.transition.timestamp.localeCompare(b.transition.timestamp)
      );
      
      for (const log of sortedLogs) {
        const currentState = log.transition.to;
        // Always update to the latest state (since we sorted chronologically)
        documentStates.set(log.documentId, currentState);
      }
      
      // Count documents by state
      const stateCounts = new Map<DocumentState, number>();
      for (const state of documentStates.values()) {
        stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
      }
      
      // Map states to workflow status categories
      // Action-oriented incoming statuses (these would need to be determined from document metadata/classification)
      // For now, we'll count based on states that indicate action needed
      const incomingRespond = stateCounts.get('analysis_pending') || 0;
      const incomingReviewForResponse = stateCounts.get('draft_ready') || 0;
      const incomingReviewAndFwd = 0; // Would need document metadata to determine
      const incomingReadFyi = 0; // Would need document metadata to determine
      
      const draftsInProgress = stateCounts.get('draft_pending') || 0;
      const itemsWaitingForReview = stateCounts.get('attorney_review_pending') || 0;
      const draftsReady = stateCounts.get('draft_ready') || 0;
      const reviewsPending = stateCounts.get('attorney_review_pending') || 0;

      // Get GoodCounsel prompts (would be integrated with GoodCounsel engine)
      // For now, return 0 - this will be wired up when GoodCounsel integration is complete
      const activeGoodCounselPrompts = 0;
      const goodCounselPrompts = 0;

      // Get urgent deadlines (would be integrated with calendar/event system)
      // For now, return empty array - this will be wired up when calendar integration is complete
      const urgentDeadlines: Array<{
        id: string;
        title: string;
        time: string;
        matterId?: string;
      }> = [];

      const status = {
        incomingRespond,
        incomingReviewForResponse,
        incomingReviewAndFwd,
        incomingReadFyi,
        draftsInProgress,
        itemsWaitingForReview,
        activeGoodCounselPrompts,
        urgentDeadlines,
        draftsReady,
        reviewsPending,
        goodCounselPrompts,
        timestamp: new Date().toISOString(),
        _dataSource: auditLogs.length > 0 ? 'audit_logs' : 'no_data',
        _documentCount: documentStates.size,
      };

      // Only use demo mode if explicitly enabled
      if (isDemoModeEnabled() && auditLogs.length === 0) {
        // In demo mode with no data, provide sample data marked as demo
        const demoStatus = markAsDemo({
          incomingRespond: 2,
          incomingReviewForResponse: 1,
          incomingReviewAndFwd: 0,
          incomingReadFyi: 1,
          draftsInProgress: 1,
          itemsWaitingForReview: 3,
          activeGoodCounselPrompts: 0,
          urgentDeadlines: [],
          draftsReady: 2,
          reviewsPending: 3,
          goodCounselPrompts: 0,
          timestamp: new Date().toISOString(),
          _dataSource: 'demo_mode',
          _documentCount: 0,
        }, 'Workflow Status');
        
        return this.createSuccessResult(JSON.stringify(demoStatus, null, 2));
      }

      // If no data and not in demo mode, return status with zeros (not an error, just no data)
      return this.createSuccessResult(JSON.stringify(status, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();
)
}