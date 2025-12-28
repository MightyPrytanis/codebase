/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { FileText, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkflowArchaeologyResult } from './workflow-archaeology';

interface ProcessingHistoryProps {
  result: WorkflowArchaeologyResult;
  fileId?: string;
  jobId?: string;
}

export function ProcessingHistory({ result, fileId, jobId }: ProcessingHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'email' | 'calendar' | 'document' | 'call'>('all');
  const { timeline, evidence_chain } = result.workflow_archaeology_result;

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Filter timeline by artifact type
  const filteredTimeline = filterType === 'all'
    ? timeline
    : timeline.filter(event => 
        event.artifacts.some(artifact => artifact.type === filterType)
      );

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2C3E50' }}>
          <FileText className="w-5 h-5" style={{ color: '#D89B6A' }} />
          Processing History
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: '#5B8FA3' }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="email">Email</option>
            <option value="calendar">Calendar</option>
            <option value="call">Calls</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
            {evidence_chain.total_artifacts}
          </div>
          <div className="text-sm" style={{ color: '#5B8FA3' }}>Total Artifacts</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
            {Math.round(evidence_chain.coverage_percentage)}%
          </div>
          <div className="text-sm" style={{ color: '#5B8FA3' }}>Coverage</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
            {filteredTimeline.length}
          </div>
          <div className="text-sm" style={{ color: '#5B8FA3' }}>Filtered Events</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold capitalize" style={{ color: '#2C3E50' }}>
            {Object.keys(evidence_chain.by_type).length}
          </div>
          <div className="text-sm" style={{ color: '#5B8FA3' }}>Artifact Types</div>
        </div>
      </div>

      {/* Processing Steps */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#2C3E50' }}>Processing Steps</h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#5B8FA3' }}>
              <p>No processing history found for selected filter.</p>
            </div>
          ) : (
            filteredTimeline.map((event, index) => {
              const isExpanded = expandedItems.has(event.timestamp);
              const eventId = `${event.timestamp}-${index}`;

              return (
                <div
                  key={eventId}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: '#2C3E50' }}>
                            {formatTime(event.timestamp)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs border ${confidenceColors[event.confidence]}`}>
                            {event.confidence}
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: '#5B8FA3' }}>{event.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {event.artifacts.map((artifact, artIndex) => (
                            <span
                              key={artIndex}
                              className="px-2 py-1 rounded text-xs border border-gray-300 capitalize"
                              style={{ color: '#5B8FA3' }}
                            >
                              {artifact.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleItem(eventId)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <div>
                        <div className="text-xs font-semibold mb-1" style={{ color: '#5B8FA3' }}>Artifacts</div>
                        <div className="space-y-1">
                          {event.artifacts.map((artifact, artIndex) => (
                            <div
                              key={artIndex}
                              className="bg-white rounded p-2 border border-gray-200 text-xs"
                              style={{ color: '#5B8FA3' }}
                            >
                              <div className="font-medium capitalize mb-1">{artifact.type}</div>
                              <div className="text-xs">{formatTime(artifact.timestamp)}</div>
                              {artifact.content && (
                                <div className="mt-1 line-clamp-2">{artifact.content}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const confidenceColors = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  medium: 'bg-blue-100 text-blue-800 border-blue-300',
  high: 'bg-green-100 text-green-800 border-green-300',
};

