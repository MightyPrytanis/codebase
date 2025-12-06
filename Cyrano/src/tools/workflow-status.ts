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

export const workflowStatusTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'workflow_status',
      description: 'Get high-level workflow status for compact HUD, including counts of incoming items by action type (respond, review for response, review and forward, read FYI), drafts in progress, items waiting for review, and active GoodCounsel prompts',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    };
  }

  async execute(args: any): Promise<CallToolResult> {
    try {
      // Get audit logs to count documents in various states
      const auditLogs = getAllAuditLogs();
      
      // Count documents by their current state (simplified - in production would query database)
      // For demo purposes, return mock counts
      // Action-oriented incoming statuses
      const incomingRespond = Math.floor(Math.random() * 5);
      const incomingReviewForResponse = Math.floor(Math.random() * 3);
      const incomingReviewAndFwd = Math.floor(Math.random() * 2);
      const incomingReadFyi = Math.floor(Math.random() * 4);
      
      const draftsInProgress = Math.floor(Math.random() * 3);
      const itemsWaitingForReview = Math.floor(Math.random() * 8);
      const draftsReady = Math.floor(Math.random() * 4);
      const reviewsPending = Math.floor(Math.random() * 6);

      // Get GoodCounsel prompts (would be integrated with GoodCounsel engine)
      // For now, return 0 - this will be wired up in E2
      const activeGoodCounselPrompts = 0;
      const goodCounselPrompts = 0;

      // Get urgent deadlines (would be integrated with calendar/event system)
      // For now, return empty array
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
      };

      return this.createSuccessResult(JSON.stringify(status, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();


