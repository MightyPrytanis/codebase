/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, AlertCircle, Search } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";

export interface WorkflowArchaeologyResult {
  workflow_archaeology_result: {
    period: {
      start: string;
      end: string;
      granularity: 'hour' | 'day' | 'week';
    };
    timeline: Array<{
      timestamp: string;
      type: string;
      description: string;
      artifacts: Array<{
        type: 'email' | 'calendar' | 'document' | 'call' | 'other';
        id: string;
        timestamp: string;
        content?: string;
        metadata?: Record<string, any>;
      }>;
      confidence: 'low' | 'medium' | 'high';
      duration_minutes?: number;
    }>;
    evidence_chain: {
      total_artifacts: number;
      by_type: Record<string, number>;
      coverage_percentage: number;
    };
    confidence: 'low' | 'medium' | 'high';
    gaps: Array<{ start: string; end: string; reason: string }>;
    metadata: Record<string, any>;
  };
  usage_note: {
    lexfiat: string;
    arkiver: string;
  };
  note: string;
}

interface WorkflowArchaeologyProps {
  userId: string;
  onReconstruct?: (result: WorkflowArchaeologyResult) => void;
}

export function WorkflowArchaeology({ userId, onReconstruct }: WorkflowArchaeologyProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [matterId, setMatterId] = useState('');
  const [artifacts, setArtifacts] = useState<Array<{
    type: 'email' | 'calendar' | 'document' | 'call' | 'other';
    id: string;
    timestamp: string;
    content?: string;
    metadata?: Record<string, any>;
  }>>([]);

  const reconstructionMutation = useMutation({
    mutationFn: async (params: {
      start_time: string;
      end_time: string;
      granularity?: 'hour' | 'day' | 'week';
      context?: Record<string, any>;
      artifacts: Array<any>;
    }) => {
      const result = await executeCyranoTool('workflow_archaeology', params);
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Workflow archaeology reconstruction failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed as WorkflowArchaeologyResult;
    },
    onSuccess: (data) => {
      if (onReconstruct) {
        onReconstruct(data);
      }
    },
    onError: (error) => {
      showAIOfflineError(error);
    },
  });

  const handleReconstruct = () => {
    if (!startTime || !endTime) {
      alert('Please select both start and end times');
      return;
    }

    if (artifacts.length === 0) {
      alert('Please collect artifacts first or provide artifact data');
      return;
    }

    const context: Record<string, any> = { user_id: userId };
    if (matterId) context.matter_id = matterId;

    reconstructionMutation.mutate({
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      granularity: selectedPeriod,
      context,
      artifacts,
    });
  };

  // Helper to set time range based on period
  const setTimeRange = (period: 'hour' | 'day' | 'week') => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (period) {
      case 'hour':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
    }

    setStartTime(start.toISOString().slice(0, 16));
    setEndTime(end.toISOString().slice(0, 16));
  };

  return (
    <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
      <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-accent-gold" />
        Workflow Archaeology
      </h2>
      <p className="text-sm text-secondary mb-6">
        Reconstruct past hours, days, or weeks using artifact analysis
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Period Granularity
          </label>
          <Select value={selectedPeriod} onValueChange={(value: 'hour' | 'day' | 'week') => {
            setSelectedPeriod(value);
            setTimeRange(value);
          }}>
            <SelectTrigger className="w-full bg-primary-dark border border-border-gray text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hour</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Matter ID (optional)
          </label>
          <input
            type="text"
            value={matterId}
            onChange={(e) => setMatterId(e.target.value)}
            placeholder="Enter matter ID..."
            className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
          />
        </div>

        <div className="bg-primary-dark/50 rounded-lg p-4 border border-border-gray">
          <p className="text-sm text-secondary mb-2">
            <strong>Note:</strong> Artifacts should be collected first using Chronometric tools
            (email_artifact_collector, calendar_artifact_collector, document_artifact_collector).
            The artifacts array will be populated automatically when using the integrated workflow.
          </p>
          <p className="text-xs text-secondary/70">
            Artifacts: {artifacts.length} items
          </p>
        </div>

        <Button
          onClick={handleReconstruct}
          disabled={reconstructionMutation.isPending || !startTime || !endTime}
          className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold"
        >
          {reconstructionMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reconstructing...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Reconstruct Timeline
            </>
          )}
        </Button>

        {reconstructionMutation.isError && (
          <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
            <div className="flex items-center gap-2 text-status-critical mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Reconstruction Failed</span>
            </div>
            <p className="text-sm text-secondary">
              {reconstructionMutation.error instanceof Error 
                ? reconstructionMutation.error.message 
                : 'Unknown error occurred'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

