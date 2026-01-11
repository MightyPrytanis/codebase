/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Workflow Status Service
 * Provides summarized status for compact HUD and dashboard
 */

import { useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "./cyrano-api";

export interface WorkflowStatus {
  /** Count of incoming items requiring response */
  incomingRespond: number;
  /** Count of incoming items requiring review before response */
  incomingReviewForResponse: number;
  /** Count of incoming items requiring review and forwarding */
  incomingReviewAndFwd: number;
  /** Count of incoming items that are FYI/read-only */
  incomingReadFyi: number;
  /** Count of drafts in progress */
  draftsInProgress: number;
  /** Count of items waiting for review */
  itemsWaitingForReview: number;
  /** Count of active GoodCounsel prompts */
  activeGoodCounselPrompts: number;
  /** Urgent deadlines for today */
  urgentDeadlines?: Array<{
    id: string;
    title: string;
    time: string;
    matterId?: string;
  }>;
  /** Count of drafts ready for review */
  draftsReady?: number;
  /** Count of reviews pending */
  reviewsPending?: number;
  /** Count of GoodCounsel prompts */
  goodCounselPrompts?: number;
}

/**
 * Fetch workflow status from backend
 */
async function fetchWorkflowStatus(): Promise<WorkflowStatus> {
  try {
    // Call workflow status tool
    const result = await executeCyranoTool("workflow_status", {});

    if (result.isError) {
      console.warn("Failed to fetch workflow status:", result.content[0]?.text);
      // Return default empty status
      return {
        incomingRespond: 0,
        incomingReviewForResponse: 0,
        incomingReviewAndFwd: 0,
        incomingReadFyi: 0,
        draftsInProgress: 0,
        itemsWaitingForReview: 0,
        activeGoodCounselPrompts: 0,
        urgentDeadlines: [],
        draftsReady: 0,
        reviewsPending: 0,
        goodCounselPrompts: 0,
      };
    }

    // Parse result
    const statusText = result.content[0]?.text || "{}";
    let status: WorkflowStatus;

    try {
      status = JSON.parse(statusText);
    } catch {
      // If not JSON, try to extract numbers from text
      status = {
        incomingRespond: extractNumber(statusText, "incoming respond") || 0,
        incomingReviewForResponse: extractNumber(statusText, "incoming review for response") || 0,
        incomingReviewAndFwd: extractNumber(statusText, "incoming review and fwd") || 0,
        incomingReadFyi: extractNumber(statusText, "incoming read fyi") || 0,
        draftsInProgress: extractNumber(statusText, "drafts") || 0,
        itemsWaitingForReview: extractNumber(statusText, "review") || 0,
        activeGoodCounselPrompts: extractNumber(statusText, "goodcounsel") || 0,
        urgentDeadlines: [],
        draftsReady: extractNumber(statusText, "drafts ready") || 0,
        reviewsPending: extractNumber(statusText, "reviews pending") || 0,
        goodCounselPrompts: extractNumber(statusText, "goodcounsel") || 0,
      };
    }

    return status;
  } catch (error) {
    console.error("Error fetching workflow status:", error);
    return {
      incomingRespond: 0,
      incomingReviewForResponse: 0,
      incomingReviewAndFwd: 0,
      incomingReadFyi: 0,
      draftsInProgress: 0,
      itemsWaitingForReview: 0,
      activeGoodCounselPrompts: 0,
      urgentDeadlines: [],
      draftsReady: 0,
      reviewsPending: 0,
      goodCounselPrompts: 0,
    };
  }
}

/**
 * Extract number from text (simple helper)
 */
function extractNumber(text: string, keyword: string): number | null {
  const regex = new RegExp(`${keyword}[^0-9]*([0-9]+)`, "i");
  const match = text.match(regex);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * React hook to use workflow status
 * Automatically refreshes every 30 seconds
 */
export function useWorkflowStatus(refreshInterval = 30000) {
  return useQuery<WorkflowStatus>({
    queryKey: ["workflow-status"],
    queryFn: fetchWorkflowStatus,
    refetchInterval: refreshInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

/**
 * Get workflow status (non-hook version for use outside React components)
 */
export async function getWorkflowStatus(): Promise<WorkflowStatus> {
  return fetchWorkflowStatus();
}





}
)