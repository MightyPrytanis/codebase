/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import { useWorkflowStatus } from "@/lib/workflow-status-service";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Eye, 
  Forward, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkflowStatusPanelsProps {
  /** Callback when clicking on a panel or action */
  onActionClick?: (action: string, type: string) => void;
  /** Additional className */
  className?: string;
}

/**
 * Workflow Status Panels
 * 
 * Three large panels displaying action-oriented workflow status:
 * 1. Incoming - Items requiring action (respond, review, forward, FYI)
 * 2. In Progress - Active work items (drafts in progress, items waiting for review)
 * 3. Ready - Completed items awaiting next step (drafts ready, reviews pending)
 * 
 * Information-dense, organized, clear presentation using existing design system
 */
export function WorkflowStatusPanels({
  onActionClick,
  className,
}: WorkflowStatusPanelsProps) {
  const { data: status, isLoading } = useWorkflowStatus();

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-panel-glass rounded-lg p-6 border border-panel-border animate-pulse">
            <div className="h-6 bg-muted/20 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted/20 rounded w-full"></div>
              <div className="h-4 bg-muted/20 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate totals
  const totalIncoming = 
    (status?.incomingRespond || 0) +
    (status?.incomingReviewForResponse || 0) +
    (status?.incomingReviewAndFwd || 0) +
    (status?.incomingReadFyi || 0);

  const totalInProgress = 
    (status?.draftsInProgress || 0) +
    (status?.itemsWaitingForReview || 0);

  const totalReady = 
    (status?.draftsReady || 0) +
    (status?.reviewsPending || 0);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Panel 1: Incoming */}
      <div 
        className="bg-panel-glass rounded-lg p-6 border border-panel-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => onActionClick?.("view", "incoming")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Incoming
          </h3>
          <Badge variant="outline" className="text-lg font-mono">
            {totalIncoming}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Respond */}
          {status?.incomingRespond ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("respond", "incoming");
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Respond</span>
              </div>
              <Badge variant="default" className="font-mono">
                {status.incomingRespond}
              </Badge>
            </div>
          ) : null}

          {/* Review for Response */}
          {status?.incomingReviewForResponse ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("review_for_response", "incoming");
              }}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: 'var(--status-warning)' }} />
                <span className="text-sm font-medium">Review for Response</span>
              </div>
              <Badge variant="outline" className="font-mono" style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}>
                {status.incomingReviewForResponse}
              </Badge>
            </div>
          ) : null}

          {/* Review and Forward */}
          {status?.incomingReviewAndFwd ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("review_and_fwd", "incoming");
              }}
            >
              <div className="flex items-center gap-2">
                <Forward className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Review & Forward</span>
              </div>
              <Badge variant="outline" className="border-primary text-primary font-mono">
                {status.incomingReviewAndFwd}
              </Badge>
            </div>
          ) : null}

          {/* Read FYI */}
          {status?.incomingReadFyi ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("read_fyi", "incoming");
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Read FYI</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {status.incomingReadFyi}
              </Badge>
            </div>
          ) : null}

          {totalIncoming === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No incoming items
            </div>
          )}
        </div>
      </div>

      {/* Panel 2: In Progress */}
      <div 
        className="bg-panel-glass rounded-lg p-6 border border-panel-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => onActionClick?.("view", "in_progress")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: 'var(--status-warning)' }} />
            In Progress
          </h3>
          <Badge variant="outline" className="text-lg font-mono" style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}>
            {totalInProgress}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Drafts In Progress */}
          {status?.draftsInProgress ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("drafts_in_progress", "in_progress");
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Drafts In Progress</span>
              </div>
              <Badge variant="default" className="font-mono">
                {status.draftsInProgress}
              </Badge>
            </div>
          ) : null}

          {/* Items Waiting for Review */}
          {status?.itemsWaitingForReview ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("items_waiting_review", "in_progress");
              }}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: 'var(--status-warning)' }} />
                <span className="text-sm font-medium">Waiting for Review</span>
              </div>
              <Badge variant="outline" className="font-mono" style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}>
                {status.itemsWaitingForReview}
              </Badge>
            </div>
          ) : null}

          {totalInProgress === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No items in progress
            </div>
          )}
        </div>
      </div>

      {/* Panel 3: Ready */}
      <div 
        className="bg-panel-glass rounded-lg p-6 border border-panel-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => onActionClick?.("view", "ready")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--status-success)' }} />
            Ready
          </h3>
          <Badge variant="outline" className="text-lg font-mono" style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}>
            {totalReady}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Drafts Ready */}
          {status?.draftsReady ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("drafts_ready", "ready");
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: 'var(--status-success)' }} />
                <span className="text-sm font-medium">Drafts Ready</span>
              </div>
              <Badge variant="outline" className="font-mono" style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}>
                {status.draftsReady}
              </Badge>
            </div>
          ) : null}

          {/* Reviews Pending */}
          {status?.reviewsPending ? (
            <div 
              className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.("reviews_pending", "ready");
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--status-success)' }} />
                <span className="text-sm font-medium">Reviews Pending</span>
              </div>
              <Badge variant="outline" className="font-mono" style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}>
                {status.reviewsPending}
              </Badge>
            </div>
          ) : null}

          {totalReady === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nothing ready
            </div>
          )}
        </div>
      </div>
    </div>
  );
