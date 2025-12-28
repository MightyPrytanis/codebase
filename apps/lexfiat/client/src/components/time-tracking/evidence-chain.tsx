/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Shield, Mail, Calendar, FileText, Phone, Clock, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WorkflowArchaeologyResult } from "./workflow-archaeology";

interface EvidenceChainProps {
  result: WorkflowArchaeologyResult;
}

const artifactIcons = {
  email: Mail,
  calendar: Calendar,
  document: FileText,
  call: Phone,
  other: Clock,
};

export function EvidenceChain({ result }: EvidenceChainProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { evidence_chain, timeline, gaps, confidence } = result.workflow_archaeology_result;

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Collect all unique artifacts from timeline
  const allArtifacts = new Map<string, {
    artifact: {
      type: 'email' | 'calendar' | 'document' | 'call' | 'other';
      id: string;
      timestamp: string;
      content?: string;
      metadata?: Record<string, any>;
    };
    events: Array<{ timestamp: string; description: string }>;
  }>();

  timeline.forEach(event => {
    event.artifacts.forEach(artifact => {
      if (!allArtifacts.has(artifact.id)) {
        allArtifacts.set(artifact.id, {
          artifact,
          events: [],
        });
      }
      allArtifacts.get(artifact.id)!.events.push({
        timestamp: event.timestamp,
        description: event.description,
      });
    });
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-accent-gold" />
        <h3 className="text-lg font-bold text-primary">Evidence Chain</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-primary-dark border border-border-gray p-4">
          <div className="text-2xl font-bold text-primary">{evidence_chain.total_artifacts}</div>
          <div className="text-sm text-secondary">Total Artifacts</div>
        </Card>
        <Card className="bg-primary-dark border border-border-gray p-4">
          <div className="text-2xl font-bold text-primary">{Math.round(evidence_chain.coverage_percentage)}%</div>
          <div className="text-sm text-secondary">Coverage</div>
        </Card>
        <Card className="bg-primary-dark border border-border-gray p-4">
          <div className="text-2xl font-bold text-primary">{timeline.length}</div>
          <div className="text-sm text-secondary">Timeline Events</div>
        </Card>
        <Card className="bg-primary-dark border border-border-gray p-4">
          <div className="text-2xl font-bold text-primary capitalize">{confidence}</div>
          <div className="text-sm text-secondary">Confidence</div>
        </Card>
      </div>

      {/* Artifacts by Type */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-primary mb-3">Artifacts by Type</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(evidence_chain.by_type).map(([type, count]) => {
            const Icon = artifactIcons[type as keyof typeof artifactIcons] || Clock;
            return (
              <Badge
                key={type}
                variant="outline"
                className="flex items-center gap-2 px-3 py-1"
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{type}</span>
                <span className="font-semibold">{count}</span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-primary mb-3">Gaps in Coverage</h4>
          <div className="space-y-2">
            {gaps.map((gap, index) => (
              <Card
                key={index}
                className="bg-status-warning/10 border border-status-warning/50 p-3"
              >
                <div className="text-sm text-secondary">
                  <div className="font-medium text-status-warning mb-1">
                    {formatTime(gap.start)} - {formatTime(gap.end)}
                  </div>
                  <div className="text-xs">{gap.reason}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Artifact Details */}
      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">Artifact Details</h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {Array.from(allArtifacts.values()).map((item) => {
            const isExpanded = expandedItems.has(item.artifact.id);
            const Icon = artifactIcons[item.artifact.type] || Clock;

            return (
              <Card
                key={item.artifact.id}
                className="bg-primary-dark border border-border-gray hover:border-accent-gold/50 transition-colors"
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-accent-gold/20">
                        <Icon className="w-4 h-4 text-accent-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-primary capitalize">
                            {item.artifact.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.events.length} event{item.events.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="text-xs text-secondary mb-1">
                          {formatTime(item.artifact.timestamp)}
                        </div>
                        <div className="text-xs text-secondary/70">
                          ID: {item.artifact.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleItem(item.artifact.id)}
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border-gray space-y-2">
                      {item.artifact.content && (
                        <div>
                          <div className="text-xs font-semibold text-secondary mb-1">Content</div>
                          <p className="text-xs text-secondary/70 line-clamp-3">
                            {item.artifact.content}
                          </p>
                        </div>
                      )}
                      {item.artifact.metadata && Object.keys(item.artifact.metadata).length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-secondary mb-1">Metadata</div>
                          <pre className="text-xs text-secondary/70 overflow-auto max-h-32">
                            {JSON.stringify(item.artifact.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-secondary mb-1">Linked Events</div>
                        <div className="space-y-1">
                          {item.events.map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="flex items-center gap-2 text-xs text-secondary/70"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>{formatTime(event.timestamp)}</span>
                              <span className="text-secondary/50">-</span>
                              <span>{event.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

