/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useWorkflowStatus } from "@/lib/workflow-status-service";
import { cn } from "@/lib/utils";
import {
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";

interface WorkItem {
  id: string;
  client?: string;
  matter?: string;
  item?: string;
  title: string;
  status: string;
  progress?: number;
  type: 'intake' | 'processing' | 'ready';
}

interface ActiveWIPRowProps {
  onItemClick?: (item: WorkItem, type: string) => void;
  className?: string;
}

/**
 * Active WIP Row
 * 
 * Four-column layout displaying active work in progress:
 * - Column 1: Intake (all incoming email)
 * - Columns 2-3: Processing (client/matter/item with progress indicators)
 * - Column 4: Ready (items ready for attorney review)
 */
export function ActiveWIPRow({
  onItemClick,
  className,
}: ActiveWIPRowProps) {
  const { data: status, isLoading: statusLoading } = useWorkflowStatus();
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  // Fetch detailed work items
  const { data: workItems = [], isLoading: itemsLoading } = useQuery<WorkItem[]>({
    queryKey: ['work-items'],
    queryFn: async () => {
      try {
        // Fetch intake items
        const intakeResult = await executeCyranoTool('workflow_status', {});
        // Fetch processing items
        const processingResult = await executeCyranoTool('workflow_status', {});

        const items: WorkItem[] = [];

        // Mock data for now - will be replaced with real API calls
        const totalIncoming = (status?.incomingRespond || 0) +
          (status?.incomingReviewForResponse || 0) +
          (status?.incomingReviewAndFwd || 0) +
          (status?.incomingReadFyi || 0);

        // Intake items
        for (let i = 0; i < Math.min(totalIncoming, 5); i++) {
          items.push({
            id: `intake-${i}`,
            client: 'Client ' + (i + 1),
            matter: 'Matter ' + (i + 1),
            item: 'Email ' + (i + 1),
            title: `Incoming email ${i + 1}`,
            status: 'new',
            type: 'intake',
          });
        }

        // Processing items
        const totalProcessing = (status?.draftsInProgress || 0) +
          (status?.itemsWaitingForReview || 0);

        for (let i = 0; i < Math.min(totalProcessing, 6); i++) {
          items.push({
            id: `processing-${i}`,
            client: 'Client ' + (i + 1),
            matter: 'Matter ' + (i + 1),
            item: 'Document ' + (i + 1),
            title: `Processing item ${i + 1}`,
            status: i % 2 === 0 ? 'drafting' : 'reviewing',
            progress: Math.floor(Math.random() * 100),
            type: 'processing',
          });
        }

        // Ready items
        const totalReady = (status?.draftsReady || 0) +
          (status?.reviewsPending || 0);

        for (let i = 0; i < Math.min(totalReady, 5); i++) {
          items.push({
            id: `ready-${i}`,
            client: 'Client ' + (i + 1),
            matter: 'Matter ' + (i + 1),
            item: 'Draft ' + (i + 1),
            title: `Ready for review ${i + 1}`,
            status: 'ready',
            type: 'ready',
          });
        }

        return items;
      } catch (error) {
        console.error('Error fetching work items:', error);
        return [];
      }
    },
    enabled: !statusLoading,
    refetchInterval: 30000,
  });

  const isLoading = statusLoading || itemsLoading;

  const intakeItems = workItems.filter(item => item.type === 'intake');
  const processingItems = workItems.filter(item => item.type === 'processing');
  const readyItems = workItems.filter(item => item.type === 'ready');

  const totalIncoming = (status?.incomingRespond || 0) +
    (status?.incomingReviewForResponse || 0) +
    (status?.incomingReviewAndFwd || 0) +
    (status?.incomingReadFyi || 0);

  const totalProcessing = (status?.draftsInProgress || 0) +
    (status?.itemsWaitingForReview || 0);

  const totalReady = (status?.draftsReady || 0) +
    (status?.reviewsPending || 0);

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
        {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
      {/* Column 1: Intake */}
      <div className="bg-panel-glass rounded-lg p-6 border border-panel-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Intake
          </h3>
          <Badge variant="outline" className="text-lg font-mono">
            {totalIncoming}
          </Badge>
        </div>

        {expandedColumn === 'intake' ? (
          <div className="space-y-2">
            {intakeItems.length > 0 ? (
              intakeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onItemClick?.(item, 'intake')}
                >
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  {item.client && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.client} • {item.matter}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No incoming items
              </div>
            )}
            <button
              className="text-xs text-primary hover:underline mt-2"
              onClick={() => setExpandedColumn(null)}
            >
              Collapse
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {totalIncoming} incoming email{totalIncoming !== 1 ? 's' : ''}
            </div>
            {totalIncoming > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setExpandedColumn('intake')}
              >
                View all →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Columns 2-3: Processing (spans 2 columns) */}
      <div className="md:col-span-2 bg-panel-glass rounded-lg p-6 border border-panel-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
            Processing
          </h3>
          <Badge variant="outline" className="text-lg font-mono" style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}>
            {totalProcessing}
          </Badge>
        </div>

        {expandedColumn === 'processing' ? (
          <div className="space-y-3">
            {processingItems.length > 0 ? (
              processingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onItemClick?.(item, 'processing')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium truncate flex-1">{item.title}</div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {item.status}
                    </Badge>
                  </div>
                  {item.client && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {item.client} • {item.matter} • {item.item}
                    </div>
                  )}
                  {item.progress !== undefined && (
                    <div className="w-full bg-muted/30 rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No items in processing
              </div>
            )}
            <button
              className="text-xs text-primary hover:underline mt-2"
              onClick={() => setExpandedColumn(null)}
            >
              Collapse
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {totalProcessing} item{totalProcessing !== 1 ? 's' : ''} in progress
            </div>
            {processingItems.length > 0 && (
              <div className="space-y-2">
                {processingItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-muted/20 rounded cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onItemClick?.(item, 'processing')}
                  >
                    <div className="text-xs font-medium truncate">{item.title}</div>
                    {item.progress !== undefined && (
                      <div className="w-full bg-muted/30 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {totalProcessing > 2 && (
              <button
                className="text-xs text-primary hover:underline mt-2"
                onClick={() => setExpandedColumn('processing')}
              >
                View all {totalProcessing} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column 4: Ready */}
      <div className="bg-panel-glass rounded-lg p-6 border border-panel-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--status-success)' }} />
            Ready
          </h3>
          <Badge variant="outline" className="text-lg font-mono" style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}>
            {totalReady}
          </Badge>
        </div>

        {expandedColumn === 'ready' ? (
          <div className="space-y-2">
            {readyItems.length > 0 ? (
              readyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onItemClick?.(item, 'ready')}
                >
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  {item.client && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.client} • {item.matter}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nothing ready
              </div>
            )}
            <button
              className="text-xs text-primary hover:underline mt-2"
              onClick={() => setExpandedColumn(null)}
            >
              Collapse
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {totalReady} item{totalReady !== 1 ? 's' : ''} ready for review
            </div>
            {totalReady > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setExpandedColumn('ready')}
              >
                View all →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

