/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Briefcase, Calendar, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { isDemoMode } from "@/lib/demo-service";
import { DEMO_CASES } from "@/lib/demo-data";
import { SummaryCard } from "./summary-card";

interface DemoMatterCardsProps {
  onMatterClick?: (matterId: string) => void;
}

/**
 * Demo Matter Cards Component
 * 
 * Displays cards for four visible matters in demo mode
 * Each card is clickable and opens a summary card with clickthrough options
 */
export function DemoMatterCards({ onMatterClick }: DemoMatterCardsProps) {
  const [selectedMatter, setSelectedMatter] = useState<string | null>(null);
  const demoMode = isDemoMode();

  if (!demoMode) {
    return null;
  }

  // Get first 4 demo cases
  const visibleMatters = DEMO_CASES.slice(0, 4);

  const handleMatterClick = (matterId: string) => {
    setSelectedMatter(matterId);
    onMatterClick?.(matterId);
  };

  const handleOpenInClio = (matterId: string) => {
    // TODO: Implement Clio integration
    console.log(`Opening matter ${matterId} in Clio`);
    window.open(`https://app.clio.com/matters/${matterId}`, '_blank');
  };

  const handleOpenInOutlook = (matterId: string) => {
    // TODO: Implement Outlook integration
    console.log(`Opening matter ${matterId} in Outlook`);
  };

  const handleOpenInCalendar = (matterId: string) => {
    // TODO: Implement Calendar integration
    console.log(`Opening matter ${matterId} in Calendar`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {visibleMatters.map((matter) => (
          <div
            key={matter.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${getPriorityColor(matter.priority)}`}
            onClick={() => handleMatterClick(matter.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-white/90" />
                <h4 className="font-semibold text-white/90">{matter.case_name}</h4>
              </div>
              <div className="px-2 py-1 bg-yellow-500/30 border border-yellow-500/50 rounded text-xs font-bold text-yellow-200">
                SIMULATED
              </div>
            </div>
            <p className="text-sm text-white/70 mb-2">{matter.court}</p>
            {matter.deadline && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Calendar className="w-3 h-3" />
                <span>Due: {new Date(matter.deadline).toLocaleDateString()}</span>
              </div>
            )}
            {matter.documents && matter.documents.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/60 mt-2">
                <FileText className="w-3 h-3" />
                <span>{matter.documents.length} document(s)</span>
              </div>
            )}
          </div>
        ))}
      </div>

    </>
  );

}
