/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { Clock, Mail, Calendar, FileText, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkflowArchaeologyResult } from './workflow-archaeology';

interface WorkflowTimelineProps {
  result: WorkflowArchaeologyResult;
}

const artifactIcons = {
  email: Mail,
  calendar: Calendar,
  document: FileText,
  call: Phone,
  other: Clock,
};

const confidenceColors = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  medium: 'bg-blue-100 text-blue-800 border-blue-300',
  high: 'bg-green-100 text-green-800 border-green-300',
};

export function WorkflowTimeline({ result }: WorkflowTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const { timeline, period, confidence: overallConfidence } = result.workflow_archaeology_result;

  const toggleEvent = (timestamp: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(timestamp)) {
      newExpanded.delete(timestamp);
    } else {
      newExpanded.add(timestamp);
    }
    setExpandedEvents(newExpanded);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2C3E50' }}>
          <Clock className="w-5 h-5" style={{ color: '#D89B6A' }} />
          Workflow Timeline
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColors[overallConfidence]}`}>
          {overallConfidence.toUpperCase()} CONFIDENCE
        </span>
      </div>

      <div className="mb-4 text-sm" style={{ color: '#5B8FA3' }}>
        <p>
          Period: {formatTime(period.start)} - {formatTime(period.end)}
        </p>
        <p>Granularity: {period.granularity}</p>
        <p>Total Events: {timeline.length}</p>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {timeline.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#5B8FA3' }}>
            <p>No workflow events found for this period.</p>
          </div>
        ) : (
          timeline.map((event, index) => {
            const isExpanded = expandedEvents.has(event.timestamp);
            const Icon = artifactIcons[event.artifacts[0]?.type || 'other'] || Clock;
            const confidence = event.confidence || 'medium';

            return (
              <div
                key={`${event.timestamp}-${index}`}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      confidence === 'high' ? 'bg-green-100' :
                      confidence === 'medium' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        confidence === 'high' ? 'text-green-600' :
                        confidence === 'medium' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: '#2C3E50' }}>
                          {formatTime(event.timestamp)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${confidenceColors[confidence]}`}>
                          {confidence}
                        </span>
                        {event.duration_minutes && (
                          <span className="px-2 py-0.5 rounded text-xs border border-gray-300 text-gray-600">
                            {formatDuration(event.duration_minutes)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: '#5B8FA3' }}>{event.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {event.artifacts.map((artifact, artIndex) => {
                          const ArtifactIcon = artifactIcons[artifact.type] || Clock;
                          return (
                            <span
                              key={artIndex}
                              className="px-2 py-1 rounded text-xs border border-gray-300 flex items-center gap-1"
                              style={{ color: '#5B8FA3' }}
                            >
                              <ArtifactIcon className="w-3 h-3" />
                              {artifact.type}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleEvent(event.timestamp)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>Artifacts</h4>
                      <div className="space-y-2">
                        {event.artifacts.map((artifact, artIndex) => {
                          const ArtifactIcon = artifactIcons[artifact.type] || Clock;
                          return (
                            <div
                              key={artIndex}
                              className="bg-white rounded p-3 border border-gray-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <ArtifactIcon className="w-4 h-4" style={{ color: '#D89B6A' }} />
                                <span className="text-sm font-medium capitalize" style={{ color: '#2C3E50' }}>
                                  {artifact.type}
                                </span>
                                <span className="text-xs" style={{ color: '#5B8FA3' }}>
                                  {formatTime(artifact.timestamp)}
                                </span>
                              </div>
                              {artifact.content && (
                                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#5B8FA3' }}>
                                  {artifact.content}
                                </p>
                              )}
                              {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer hover:underline" style={{ color: '#5B8FA3' }}>
                                    Metadata
                                  </summary>
                                  <pre className="text-xs mt-1 overflow-auto" style={{ color: '#5B8FA3' }}>
                                    {JSON.stringify(artifact.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          );
                        })}
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
  );

}
