/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { executeTool } from '../lib/arkiver-api';

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
  fileId?: string;
  jobId?: string;
  onReconstruct?: (result: WorkflowArchaeologyResult) => void;
}

export function WorkflowArchaeology({ fileId, jobId, onReconstruct }: WorkflowArchaeologyProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
      const result = await executeTool('workflow_archaeology', params);
      
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || 'Workflow archaeology reconstruction failed');
      }
      
      return result as WorkflowArchaeologyResult;
    },
    onSuccess: (data) => {
      if (onReconstruct) {
        onReconstruct(data);
      }
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

    const context: Record<string, any> = {};
    if (fileId) context.file_id = fileId;
    if (jobId) context.job_id = jobId;

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
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2C3E50' }}>
        <Search className="w-5 h-5" style={{ color: '#D89B6A' }} />
        Workflow Archaeology
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5B8FA3' }}>
        Reconstruct document processing workflow history using artifact analysis
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Period Granularity
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => {
              const value = e.target.value as 'hour' | 'day' | 'week';
              setSelectedPeriod(value);
              setTimeRange(value);
            }}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Note:</strong> Artifacts should be collected first using Chronometric tools
            or from document processing history. The artifacts array will be populated automatically
            when using the integrated workflow.
          </p>
          <p className="text-xs text-gray-500">
            Artifacts: {artifacts.length} items
          </p>
        </div>

        <button
          onClick={handleReconstruct}
          disabled={reconstructionMutation.isPending || !startTime || !endTime}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {reconstructionMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reconstructing...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Reconstruct Workflow
            </>
          )}
        </button>

        {reconstructionMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Reconstruction Failed</span>
            </div>
            <p className="text-sm text-gray-600">
              {reconstructionMutation.error instanceof Error 
                ? reconstructionMutation.error.message 
                : 'Unknown error occurred'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

