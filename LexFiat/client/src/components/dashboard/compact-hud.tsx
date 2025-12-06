/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, FileText, AlertCircle, Heart, Inbox } from "lucide-react";
import { useWorkflowStatus } from "@/lib/workflow-status-service";

interface CompactHUDProps {
  /** Position: 'top' | 'side' */
  position?: "top" | "side";
  /** Callback when clicking a count/badge */
  onItemClick?: (item: "incoming" | "deadlines" | "drafts" | "reviews" | "goodcounsel") => void;
  /** Additional className */
  className?: string;
}

/**
 * Compact HUD Component
 * 
 * Shows:
 * - Today's key deadlines and urgent items
 * - Counts of items waiting on user action (drafts ready, reviews pending)
 * - Subtle GoodCounsel badge when there are pending reflections or ethics nudges
 * 
 * Can render as:
 * - Small strip (top or side) within main app
 * - Candidate for future menu-bar/tray window
 */
export function CompactHUD({
  position = "top",
  onItemClick,
  className,
}: CompactHUDProps) {
  const { status, isLoading } = useWorkflowStatus();

  if (isLoading) {
    return (
      <div className={cn(
        "compact-hud",
        position === "top" ? "compact-hud-top" : "compact-hud-side",
        className
      )}>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hasUrgentDeadlines = (status?.urgentDeadlines?.length || 0) > 0;
  const hasDraftsReady = (status?.draftsReady || 0) > 0;
  const hasReviewsPending = (status?.reviewsPending || 0) > 0;
  const hasGoodCounselPrompts = (status?.goodCounselPrompts || 0) > 0;
  
  // Incoming statuses
  const totalIncoming = 
    (status?.incomingRespond || 0) +
    (status?.incomingReviewForResponse || 0) +
    (status?.incomingReviewAndFwd || 0) +
    (status?.incomingReadFyi || 0);
  const hasIncoming = totalIncoming > 0;

  const handleClick = (item: "incoming" | "deadlines" | "drafts" | "reviews" | "goodcounsel") => {
    onItemClick?.(item);
  };

  return (
    <div
      className={cn(
        "compact-hud",
        position === "top" ? "compact-hud-top" : "compact-hud-side",
        "flex items-center gap-4 px-4 py-2 bg-panel-glass backdrop-blur-md border-b border-panel-border",
        className
      )}
    >
      {/* Incoming Items */}
      {hasIncoming && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 gap-1.5 hover:bg-muted/50"
          onClick={() => handleClick("incoming")}
        >
          <Inbox className="h-4 w-4 text-primary" />
          <Badge variant="default" className="text-xs">
            {totalIncoming}
          </Badge>
          <span className="text-xs font-medium">Incoming</span>
        </Button>
      )}

      {/* Urgent Deadlines */}
      {hasUrgentDeadlines && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 gap-1.5 hover:bg-muted/50"
          onClick={() => handleClick("deadlines")}
        >
          <Calendar className="h-4 w-4 text-destructive" />
          <Badge variant="destructive" className="text-xs">
            {status?.urgentDeadlines?.length || 0}
          </Badge>
          <span className="text-xs font-medium">Urgent</span>
        </Button>
      )}

      {/* Drafts Ready */}
      {hasDraftsReady && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 gap-1.5 hover:bg-muted/50"
          onClick={() => handleClick("drafts")}
        >
          <FileText className="h-4 w-4 text-primary" />
          <Badge variant="default" className="text-xs">
            {status?.draftsReady || 0}
          </Badge>
          <span className="text-xs font-medium">Drafts</span>
        </Button>
      )}

      {/* Reviews Pending */}
      {hasReviewsPending && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 gap-1.5 hover:bg-muted/50"
          onClick={() => handleClick("reviews")}
        >
          <AlertCircle className="h-4 w-4 text-warning" />
          <Badge variant="outline" className="text-xs border-warning text-warning">
            {status?.reviewsPending || 0}
          </Badge>
          <span className="text-xs font-medium">Reviews</span>
        </Button>
      )}

      {/* GoodCounsel Badge */}
      {hasGoodCounselPrompts && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1.5 gap-1.5 hover:bg-muted/50"
          onClick={() => handleClick("goodcounsel")}
        >
          <Heart className="h-4 w-4 text-pink-500" />
          <Badge variant="outline" className="text-xs border-pink-500 text-pink-500">
            {status?.goodCounselPrompts || 0}
          </Badge>
          <span className="text-xs font-medium">Reflection</span>
        </Button>
      )}

      {/* Empty State */}
      {!hasIncoming && !hasUrgentDeadlines && !hasDraftsReady && !hasReviewsPending && !hasGoodCounselPrompts && (
        <div className="text-xs text-muted-foreground">All caught up</div>
      )}
    </div>
  );
}




