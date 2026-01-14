/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import { X, ExternalLink, Briefcase, Mail, Calendar, FileText, User } from "lucide-react";
import { isDemoMode } from "@/lib/demo-service";
import { DEMO_CASES, getDemoCase } from "@/lib/demo-data";

interface SummaryCardProps {
  type: 'client' | 'matter' | 'pleading' | 'event' | 'contact';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  onClose: () => void;
  onOpenInClio?: () => void;
  onOpenInOutlook?: () => void;
  onOpenInCalendar?: () => void;
}

/**
 * Summary Card Component
 * 
 * Displays a detailed card for any clickable entity (client, matter, pleading, event)
 * with clickthrough options to external services (Clio, Outlook, Calendar, etc.)
 */
export function SummaryCard({
  type,
  id,
  title,
  subtitle,
  description,
  metadata = {},
  onClose,
  onOpenInClio,
  onOpenInOutlook,
  onOpenInCalendar,
}: SummaryCardProps) {
  const demoMode = isDemoMode();
  const isSimulated = demoMode || metadata._demo || metadata._simulated;

  // Get demo case data if available
  const demoCase = type === 'matter' && demoMode ? getDemoCase(id) : null;

  const getTypeIcon = () => {
    switch (type) {
      case 'client':
      case 'contact':
        return <User className="w-5 h-5" />;
      case 'matter':
        return <Briefcase className="w-5 h-5" />;
      case 'pleading':
      case 'event':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'client':
        return 'Client';
      case 'matter':
        return 'Matter';
      case 'pleading':
        return 'Pleading/Document';
      case 'event':
        return 'Event';
      case 'contact':
        return 'Contact';
      default:
        return 'Item';
    }
  };

  return (
    <div className="panel-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="expanded-panel max-w-2xl">
        <div className="expanded-panel-header">
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <div>
              <h2 className="expanded-panel-title">{getTypeLabel()}: {title}</h2>
              {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕ Close</button>
        </div>

        <div className="expanded-panel-content space-y-4">
          {/* Demo Mode Warning */}
          {isSimulated && (
            <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-yellow-400 font-bold text-sm">⚠️ SIMULATED DATA</div>
                <p className="text-sm text-white/90">
                  This {getTypeLabel().toLowerCase()} is simulated for demonstration purposes. 
                  Any similarity to real persons or events is unintended.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <h3 className="text-sm font-semibold text-white/90 mb-2">Description</h3>
              <p className="text-sm text-white/80">{description}</p>
            </div>
          )}

          {/* Demo Case Details */}
          {demoCase && (
            <div>
              <h3 className="text-sm font-semibold text-white/90 mb-2">Case Details</h3>
              <div className="space-y-2 text-sm text-white/80">
                <div><strong>Court:</strong> {demoCase.court}</div>
                <div><strong>Jurisdiction:</strong> {demoCase.jurisdiction}</div>
                <div><strong>Status:</strong> {demoCase.status}</div>
                {demoCase.deadline && (
                  <div><strong>Deadline:</strong> {new Date(demoCase.deadline).toLocaleString()}</div>
                )}
                {demoCase.documents && demoCase.documents.length > 0 && (
                  <div>
                    <strong>Documents:</strong> {demoCase.documents.length} file(s)
                    <ul className="list-disc list-inside mt-1 ml-4">
                      {demoCase.documents.map((doc) => (
                        <li key={doc.id}>{doc.filename}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(metadata).length > 0 && !demoCase && (
            <div>
              <h3 className="text-sm font-semibold text-white/90 mb-2">Details</h3>
              <div className="space-y-2 text-sm text-white/80">
                {Object.entries(metadata).map(([key, value]) => {
                  if (key.startsWith('_')) return null; // Skip internal metadata
                  return (
                    <div key={key}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/20">
            {onOpenInClio && (
              <button
                onClick={onOpenInClio}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Open in Clio
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {onOpenInOutlook && (
              <button
                onClick={onOpenInOutlook}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-colors"
              >
                <Mail className="w-4 h-4" />
                Open in Outlook
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {onOpenInCalendar && (
              <button
                onClick={onOpenInCalendar}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Open in Calendar
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

