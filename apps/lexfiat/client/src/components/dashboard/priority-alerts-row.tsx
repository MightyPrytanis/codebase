/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";

interface PriorityAlert {
  id: string;
  type: 'red_flag' | 'deadline' | 'urgent';
  priority: 'critical' | 'high' | 'medium';
  client?: string;
  matter?: string;
  item?: string;
  title: string;
  date?: string;
  deadline?: string;
  onClick?: () => void;
}

interface PriorityAlertsRowProps {
  onAlertClick?: (alert: PriorityAlert) => void;
  onSummaryCardOpen?: (type: 'client' | 'matter' | 'pleading' | 'event', id: string, data: any) => void;
  className?: string;
}

/**
 * Priority Alerts Row
 * 
 * Full-width row displaying priority alerts (red flags, approaching deadlines)
 * with client/matter/item information and clickthroughs
 */
export function PriorityAlertsRow({
  onAlertClick,
  onSummaryCardOpen,
  className,
}: PriorityAlertsRowProps) {
  // Fetch red flags and urgent deadlines
  const { data: alerts = [], isLoading } = useQuery<PriorityAlert[]>({
    queryKey: ['priority-alerts'],
    queryFn: async () => {
      try {
        // Fetch red flags
        const redFlagsResult = await executeCyranoTool('red_flag_finder', {});
        // Fetch urgent deadlines
        const deadlinesResult = await executeCyranoTool('workflow_status', {});

        const alerts: PriorityAlert[] = [];

        // Parse red flags
        if (!redFlagsResult.isError && redFlagsResult.content[0]?.text) {
          try {
            const redFlags = JSON.parse(redFlagsResult.content[0].text);
            if (Array.isArray(redFlags)) {
              redFlags.forEach((flag: any) => {
                const matter = flag.matter || flag.case_name || flag.matter_name;
                const item = flag.item || flag.document_name;
                const description = flag.description || flag.message || 'Red flag detected';
                // Remove redundant matter/item/client info from title if already present
                let title = description;
                // Remove matter name if it appears in title
                if (matter && title.toLowerCase().includes(matter.toLowerCase())) {
                  title = title.replace(new RegExp(matter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                // Remove item/document name if it appears in title
                if (item && title.toLowerCase().includes(item.toLowerCase())) {
                  title = title.replace(new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                // Remove client name if it appears in title
                if (flag.client && title.toLowerCase().includes(flag.client.toLowerCase())) {
                  title = title.replace(new RegExp(flag.client.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                // Remove common patterns like "Notice received -", "Hearing on", etc. if matter/item follows
                title = title.replace(/^(Notice received|Hearing on|Deadline for|Response due|Motion for|Document|File|Case)\s*[-:•]\s*/i, '').trim();
                // Clean up extra spaces, punctuation, and separators
                title = title.replace(/\s+/g, ' ').replace(/^[,\-\s•:]+|[,\-\s•:]+$/g, '').trim();
                if (!title) title = 'Red flag detected';
                
                alerts.push({
                  id: flag.id || `flag-${Date.now()}-${Math.random()}`,
                  type: 'red_flag',
                  priority: flag.severity || flag.priority || 'high',
                  client: flag.client || flag.client_name,
                  matter,
                  item,
                  title,
                  date: flag.date || flag.timestamp,
                });
              });
            }
          } catch (e) {
            // If not JSON, skip this alert (don't create mock data)
            console.warn('Failed to parse red flags response:', e);
          }
        }

        // Parse urgent deadlines from workflow status
        if (!deadlinesResult.isError && deadlinesResult.content[0]?.text) {
          try {
            const status = JSON.parse(deadlinesResult.content[0].text);
            if (status.urgentDeadlines && Array.isArray(status.urgentDeadlines)) {
              status.urgentDeadlines.forEach((deadline: any) => {
                const matter = deadline.matter || deadline.matterId;
                const item = deadline.title || deadline.item;
                let title = deadline.title || 'Urgent deadline';
                // Remove redundant matter/item/client info from title
                if (matter && title.toLowerCase().includes(matter.toLowerCase())) {
                  title = title.replace(new RegExp(matter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                if (item && title.toLowerCase().includes(item.toLowerCase())) {
                  title = title.replace(new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                if (deadline.client && title.toLowerCase().includes(deadline.client.toLowerCase())) {
                  title = title.replace(new RegExp(deadline.client.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
                }
                // Remove common patterns like "Notice received -", "Hearing on", etc. if matter/item follows
                title = title.replace(/^(Notice received|Hearing on|Deadline for|Response due|Motion for|Document|File|Case)\s*[-:•]\s*/i, '').trim();
                // Clean up extra spaces, punctuation, and separators
                title = title.replace(/\s+/g, ' ').replace(/^[,\-\s•:]+|[,\-\s•:]+$/g, '').trim();
                if (!title) title = 'Urgent deadline';
                
                alerts.push({
                  id: deadline.id || `deadline-${Date.now()}-${Math.random()}`,
                  type: 'deadline',
                  priority: 'critical',
                  client: deadline.client,
                  matter,
                  item,
                  title,
                  deadline: deadline.time || deadline.deadline,
                });
              });
            }
          } catch (e) {
            // If not JSON, skip this alert (don't create mock data)
            console.warn('Failed to parse workflow status response:', e);
          }
        }

        // Return alerts (empty array if none found - no mock data)
        return alerts;
      } catch (error) {
        console.error('Error fetching priority alerts:', error);
        // Fail gracefully - return empty array (no mock error alerts)
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // CRITICAL: ALL hooks must be called BEFORE any early returns
  // This ensures hooks are always called in the same order on every render
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (alerts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  // Helper functions (not hooks, safe to call conditionally)
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-white border-white bg-[#B56C6C]';
      case 'high':
        return 'text-white border-white bg-[#B56C6C]';
      default:
        return 'text-white border-white bg-[#B56C6C]';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="h-4 w-4" />;
      case 'red_flag':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Always show the alert bar structure, even when loading
  if (isLoading) {
    return (
      <div className={cn("priority-ticker p-4", className)} style={{ 
        background: '#B35C5C',
        border: '4px solid #9E4B4B',
        borderLeft: '8px solid #8F3F3F',
        borderRadius: '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Priority Alerts</h3>
        </div>
        <div className="ticker-content" style={{ minHeight: '80px' }}>
          <div className="ticker-item active animate-pulse" style={{
            background: '#B56C6C',
            borderLeft: '4px solid #9E4B4B',
            padding: '0.75rem',
            borderRadius: '4px',
            color: '#FFFFFF'
          }}>
            <div className="text-sm text-white">Loading alerts...</div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure currentIndex is within bounds
  const safeIndex = alerts.length > 0 && currentIndex >= 0 && currentIndex < alerts.length ? currentIndex : 0;
  const currentAlert = alerts.length > 0 ? alerts[safeIndex] : null;
  
  // Always show the alert bar, even if empty
  if (!alerts || alerts.length === 0 || !currentAlert) {
    return (
      <div className={cn("priority-ticker p-4", className)} style={{ 
        background: '#B35C5C',
        border: '4px solid #9E4B4B',
        borderLeft: '8px solid #8F3F3F',
        borderRadius: '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Priority Alerts</h3>
        </div>
        <div className="ticker-content" style={{ minHeight: '80px' }}>
          <div className="ticker-item active" style={{
            background: '#B56C6C',
            borderLeft: '4px solid #9E4B4B',
            padding: '0.75rem',
            borderRadius: '4px',
            color: '#FFFFFF'
          }}>
            <div className="text-sm text-white">No alerts at this time</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("priority-ticker p-4", className)} style={{ 
      background: '#B35C5C',
      border: '4px solid #9E4B4B',
      borderLeft: '8px solid #8F3F3F',
      borderRadius: '0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-white" />
        <h3 className="text-lg font-semibold text-white">Priority Alerts</h3>
      </div>

      <div className="ticker-content" style={{ minHeight: '80px' }}>
        <div
          key={currentAlert.id}
          className="ticker-item active cursor-pointer"
          onClick={() => {
            onAlertClick?.(currentAlert);
            // Open summary card for the alert
            if (currentAlert.matter || currentAlert.client || currentAlert.item) {
              const itemType = currentAlert.item ? 'pleading' : currentAlert.matter ? 'matter' : 'client';
              onSummaryCardOpen?.(itemType, currentAlert.id, {
                title: currentAlert.title,
                client: currentAlert.client,
                matter: currentAlert.matter,
                item: currentAlert.item,
                type: currentAlert.type,
                priority: currentAlert.priority,
                deadline: currentAlert.deadline,
                date: currentAlert.date,
                _demo: true,
                _simulated: true,
              });
            }
          }}
          style={{
            background: '#B56C6C',
            borderLeft: '4px solid #9E4B4B',
            padding: '0.75rem',
            borderRadius: '4px'
          }}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0">
              {getPriorityIcon(currentAlert.type)}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="text-sm text-white truncate">
                {currentAlert.title.includes(':') ? (
                  <>
                    <span className="font-bold">{currentAlert.title.split(':')[0]}</span>
                    <span className="font-normal">: {currentAlert.title.split(':').slice(1).join(':')}</span>
                  </>
                ) : (
                  <span className="font-bold">{currentAlert.title}</span>
                )}
              </div>
              {(currentAlert.client || (currentAlert.matter && !currentAlert.title.toLowerCase().includes(currentAlert.matter.toLowerCase())) || (currentAlert.item && !currentAlert.title.toLowerCase().includes(currentAlert.item.toLowerCase()))) && (
                <div className="text-xs text-white/80 flex items-center gap-2 flex-shrink-0">
                  {currentAlert.client && !currentAlert.title.toLowerCase().includes(currentAlert.client.toLowerCase()) && <span>{currentAlert.client}</span>}
                  {currentAlert.matter && !currentAlert.title.toLowerCase().includes(currentAlert.matter.toLowerCase()) && <span>• {currentAlert.matter}</span>}
                  {currentAlert.item && !currentAlert.title.toLowerCase().includes(currentAlert.item.toLowerCase()) && <span>• {currentAlert.item}</span>}
                </div>
              )}
              {(currentAlert.date || currentAlert.deadline) && (
                <div className="text-xs text-white/70 flex items-center gap-1 flex-shrink-0">
                  <Calendar className="h-3 w-3" />
                  {currentAlert.deadline
                    ? new Date(currentAlert.deadline).toLocaleDateString()
                    : currentAlert.date
                    ? new Date(currentAlert.date).toLocaleDateString()
                    : ''}
                </div>
              )}
            </div>
            <div className="text-xs text-white/70 flex-shrink-0">
              {currentIndex + 1} / {alerts.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



}
)
}
}