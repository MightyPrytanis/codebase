/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Clock, Mail, Calendar, FileText, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WorkflowArchaeologyResult } from "./workflow-archaeology";

interface TimelineVisualizationProps {
  result: WorkflowArchaeologyResult;
  onTimeEntrySuggestion?: (entry: {
    date: string;
    hours: number;
    description: string;
    confidence: 'low' | 'medium' | 'high';
  }) => void;
}

const artifactIcons = {
  email: Mail,
  calendar: Calendar,
  document: FileText,
  call: Phone,
  other: Clock,
};

const confidenceColors = {
  low: 'bg-status-warning/20 text-status-warning border-status-warning',
  medium: 'bg-accent-gold/20 text-accent-gold border-accent-gold',
  high: 'bg-status-success/20 text-status-success border-status-success',
};

export function TimelineVisualization({ result, onTimeEntrySuggestion }: TimelineVisualizationProps) {
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
    <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-gold" />
          Timeline Visualization
        </h3>
        <Badge className={confidenceColors[overallConfidence]}>
          {overallConfidence.toUpperCase()} Confidence
        </Badge>
      </div>

      <div className="mb-4 text-sm text-secondary">
        <p>
          Period: {formatTime(period.start)} - {formatTime(period.end)}
        </p>
        <p>Granularity: {period.granularity}</p>
        <p>Total Events: {timeline.length}</p>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-secondary">
            <p>No timeline events found for this period.</p>
          </div>
        ) : (
          timeline.map((event, index) => {
            const isExpanded = expandedEvents.has(event.timestamp);
            const Icon = artifactIcons[event.artifacts[0]?.type || 'other'] || Clock;
            const confidence = event.confidence || 'medium';

            return (
              <Card
                key={`${event.timestamp}-${index}`}
                className="bg-primary-dark border border-border-gray hover:border-accent-gold/50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        confidence === 'high' ? 'bg-status-success/20' :
                        confidence === 'medium' ? 'bg-accent-gold/20' :
                        'bg-status-warning/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          confidence === 'high' ? 'text-status-success' :
                          confidence === 'medium' ? 'text-accent-gold' :
                          'text-status-warning'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-primary font-semibold">
                            {formatTime(event.timestamp)}
                          </span>
                          <Badge className={confidenceColors[confidence]} variant="outline">
                            {confidence}
                          </Badge>
                          {event.duration_minutes && (
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(event.duration_minutes)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-secondary text-sm mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event.artifacts.map((artifact, artIndex) => {
                            const ArtifactIcon = artifactIcons[artifact.type] || Clock;
                            return (
                              <Badge
                                key={artIndex}
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                              >
                                <ArtifactIcon className="w-3 h-3" />
                                {artifact.type}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEvent(event.timestamp)}
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border-gray space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Artifacts</h4>
                        <div className="space-y-2">
                          {event.artifacts.map((artifact, artIndex) => {
                            const ArtifactIcon = artifactIcons[artifact.type] || Clock;
                            return (
                              <div
                                key={artIndex}
                                className="bg-card-dark rounded p-3 border border-border-gray"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <ArtifactIcon className="w-4 h-4 text-accent-gold" />
                                  <span className="text-sm font-medium text-primary">
                                    {artifact.type}
                                  </span>
                                  <span className="text-xs text-secondary">
                                    {formatTime(artifact.timestamp)}
                                  </span>
                                </div>
                                {artifact.content && (
                                  <p className="text-xs text-secondary mt-1 line-clamp-2">
                                    {artifact.content}
                                  </p>
                                )}
                                {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-secondary cursor-pointer hover:text-primary">
                                      Metadata
                                    </summary>
                                    <pre className="text-xs text-secondary/70 mt-1 overflow-auto">
                                      {JSON.stringify(artifact.metadata, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {onTimeEntrySuggestion && event.duration_minutes && (
                        <button
                          onClick={() => {
                            const hours = event.duration_minutes! / 60;
                            onTimeEntrySuggestion({
                              date: event.timestamp.split('T')[0],
                              hours: Math.round(hours * 100) / 100,
                              description: event.description,
                              confidence: event.confidence,
                            });
                          }}
                          className="w-full bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold border border-accent-gold rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                        >
                          Use as Time Entry ({formatDuration(event.duration_minutes)})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
