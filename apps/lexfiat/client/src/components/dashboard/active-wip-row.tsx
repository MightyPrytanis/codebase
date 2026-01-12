/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useWorkflowStatus } from "@/lib/workflow-status-service";
import { cn } from "@/lib/utils";
import {
  Inbox,
  FileText,
  Clock,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { GrLaunch } from "react-icons/gr";
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
  priority?: string;
  deadline?: string;
}

interface ActiveWIPRowProps {
  onItemClick?: (item: WorkItem, type: string) => void;
  onSummaryCardOpen?: (type: 'client' | 'matter' | 'pleading' | 'event', id: string, data: any) => void;
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
  onSummaryCardOpen,
  className,
}: ActiveWIPRowProps) {
  const { data: status, isLoading: statusLoading } = useWorkflowStatus();
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  // Fetch detailed work items
  const { data: workItems = [], isLoading: itemsLoading } = useQuery<WorkItem[]>({
    queryKey: ['work-items', status],
    queryFn: async () => {
      try {
        // Ensure status is available before using it
        const safeStatus = status || {
          incomingRespond: 0,
          incomingReviewForResponse: 0,
          incomingReviewAndFwd: 0,
          incomingReadFyi: 0,
          draftsInProgress: 0,
          itemsWaitingForReview: 0,
          activeGoodCounselPrompts: 0,
        };

        // Fetch intake items
        const intakeResult = await executeCyranoTool('workflow_status', {}).catch(() => ({ isError: true }));
        // Fetch processing items
        const processingResult = await executeCyranoTool('workflow_status', {}).catch(() => ({ isError: true }));

        const items: WorkItem[] = [];

        // Mock data for now - will be replaced with real API calls
        const totalIncoming = (safeStatus.incomingRespond || 0) +
          (safeStatus.incomingReviewForResponse || 0) +
          (safeStatus.incomingReviewAndFwd || 0) +
          (safeStatus.incomingReadFyi || 0);

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
        const totalProcessing = (safeStatus.draftsInProgress || 0) +
          (safeStatus.itemsWaitingForReview || 0);

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
        const totalReady = (safeStatus.draftsReady || 0) +
          (safeStatus.reviewsPending || 0);

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

  // Process data AFTER all hooks are called
  const isLoading = statusLoading || itemsLoading;

  // Safe defaults for status - must be computed after hooks
  const safeStatus = status || {
    incomingRespond: 0,
    incomingReviewForResponse: 0,
    incomingReviewAndFwd: 0,
    incomingReadFyi: 0,
    draftsInProgress: 0,
    itemsWaitingForReview: 0,
    draftsReady: 0,
    reviewsPending: 0,
  };

  const intakeItems = workItems.filter(item => item.type === 'intake');
  const processingItems = workItems.filter(item => item.type === 'processing');
  const readyItems = workItems.filter(item => item.type === 'ready');

  const totalIncoming = (safeStatus.incomingRespond || 0) +
    (safeStatus.incomingReviewForResponse || 0) +
    (safeStatus.incomingReviewAndFwd || 0) +
    (safeStatus.incomingReadFyi || 0);

  const totalProcessing = (safeStatus.draftsInProgress || 0) +
    (safeStatus.itemsWaitingForReview || 0);

  const totalReady = (safeStatus.draftsReady || 0) +
    (safeStatus.reviewsPending || 0);

  // Early return AFTER all hooks
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
    <div className={cn("workflow-wip-group", className)} style={{ position: 'relative', width: '100%' }}>
      <div className="grid grid-cols-4 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', width: '100%', maxWidth: '100%', boxSizing: 'border-box', position: 'relative' }}>
        {/* Visual connector line for workflow grouping */}
        <div className="workflow-connector-line"></div>
        {/* Column 1: Intake */}
      <div 
        className="widget rounded-lg p-6 border border-panel-border intake-wip widget-spaced cursor-pointer" 
        style={{
          borderLeft: '4px solid #3B82F6',
          minHeight: expandedColumn === 'intake' ? 'auto' : '120px'
        }}
        onClick={(e) => {
          // Only trigger if clicking on the widget itself, not child elements
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.widget-header')) {
            if (expandedColumn === 'intake') {
              setExpandedColumn(null);
            } else {
              setExpandedColumn('intake');
              onItemClick?.({ id: 'intake-all', type: 'intake', title: 'Intake Items' } as any, 'intake');
            }
          }
        }}
      >
        <div className="widget-header flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2">
            <Inbox className="widget-icon" style={{ width: '18px', height: '18px' }} />
            <span className="ml-1">Intake</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      priority: item.priority,
                      deadline: item.deadline,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'intake');
                  }}
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
          <div className="widget-content">
            <div className="insight-card info" style={{ marginBottom: '0.5rem' }}>
              <p className="insight-text">{totalIncoming} incoming email{totalIncoming !== 1 ? 's' : ''}</p>
            </div>
            {intakeItems.length > 0 && (
              <div className="space-y-1.5">
                {intakeItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="insight-card info cursor-pointer"
                    onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      priority: item.priority,
                      deadline: item.deadline,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'intake');
                  }}
                  >
                    <p className="insight-text truncate" title={item.title}>
                      {item.title}
                    </p>
                    {item.client && (
                      <p className="insight-subtext truncate">
                        {item.client} • {item.matter}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {totalIncoming > 2 && (
              <button
                className="text-xs text-primary hover:underline mt-2"
                onClick={() => setExpandedColumn('intake')}
              >
                View all {totalIncoming} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Columns 2-3: Processing (spans 2 columns) */}
      <div 
        className="col-span-2 widget rounded-lg p-6 border border-panel-border processing-wip widget-spaced cursor-pointer" 
        style={{
          borderLeft: '4px solid #9CA3AF',
          minHeight: expandedColumn === 'processing' ? 'auto' : '120px'
        }}
        onClick={(e) => {
          // Only trigger if clicking on the widget itself, not child elements
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.widget-header')) {
            if (expandedColumn === 'processing') {
              setExpandedColumn(null);
            } else {
              setExpandedColumn('processing');
              onItemClick?.({ id: 'processing-all', type: 'processing', title: 'Processing Items', status: 'reviewing' } as any, 'processing');
            }
          }
        }}
      >
        <div className="widget-header flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2">
            <RotateCw className="widget-icon" style={{ width: '18px', height: '18px' }} />
            <span className="ml-1">Processing</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      progress: item.progress,
                      type: item.type,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'processing');
                  }}
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
                    onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      progress: item.progress,
                      type: item.type,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'processing');
                  }}
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
      <div 
        className="widget rounded-lg p-6 border border-panel-border ready-wip widget-spaced cursor-pointer" 
        style={{
          borderLeft: '4px solid #10B981',
          minHeight: expandedColumn === 'ready' ? 'auto' : '120px'
        }}
        onClick={(e) => {
          // Only trigger if clicking on the widget itself, not child elements
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.widget-header')) {
            if (expandedColumn === 'ready') {
              setExpandedColumn(null);
            } else {
              setExpandedColumn('ready');
              onItemClick?.({ id: 'ready-all', type: 'ready', title: 'Ready Items' } as any, 'ready');
            }
          }
        }}
      >
        <div className="widget-header flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2">
            <GrLaunch className="widget-icon" style={{ width: '18px', height: '18px' }} />
            <span className="ml-1">Ready</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      type: item.type,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'ready');
                  }}
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
          <div className="widget-content">
            <div className="insight-card positive" style={{ marginBottom: '0.5rem' }}>
              <p className="insight-text">{totalReady} item{totalReady !== 1 ? 's' : ''} ready for review</p>
            </div>
            {readyItems.length > 0 && (
              <div className="space-y-1.5">
                {readyItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="insight-card positive cursor-pointer"
                    onClick={(e) => {
                    e.stopPropagation();
                    // Determine type based on item properties
                    const itemType = item.matter ? 'pleading' : item.client ? 'matter' : 'event';
                    onSummaryCardOpen?.(itemType, item.id, {
                      title: item.title,
                      client: item.client,
                      matter: item.matter,
                      item: item.item,
                      status: item.status,
                      type: item.type,
                      _demo: true,
                      _simulated: true,
                    });
                    onItemClick?.(item, 'ready');
                  }}
                  >
                    <p className="insight-text truncate" title={item.title}>
                      {item.title}
                    </p>
                    {item.client && (
                      <p className="insight-subtext truncate">
                        {item.client} • {item.matter}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {totalReady > 2 && (
              <button
                className="text-xs text-primary hover:underline mt-2"
                onClick={() => setExpandedColumn('ready')}
              >
                View all {totalReady} →
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );

}
)
}
}
)
}