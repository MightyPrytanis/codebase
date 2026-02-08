/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from "@tanstack/react-query";
import { getRedFlags } from "@/lib/cyrano-api";
import ExpandedPanel from "./expanded-panel";
import { mockRedFlags } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/demo-service";
import { AIAnalysisIcon } from "@cyrano/shared-assets/icon-components";
import { AlertTriangle } from "lucide-react";
import { DemoDataWrapper } from "@/components/demo/demo-data-wrapper";

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalysisPanel({ isOpen, onClose }: AnalysisPanelProps) {
  const { data: redFlags = [], isLoading } = useQuery({
    queryKey: ['redFlags'],
    queryFn: getRedFlags,
    refetchInterval: 30000,
    retry: false,
  });

  const displayRedFlags = redFlags.length > 0 ? redFlags : mockRedFlags;
  const isUsingDemoData = isDemoMode() && redFlags.length === 0;
  const processingCount = displayRedFlags.filter((rf: any) => rf.status === 'processing').length;

  return (
    <ExpandedPanel
      title="AI Analysis"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <DemoDataWrapper
        isDemo={isUsingDemoData}
        showBadge={true}
        showWarning={isUsingDemoData}
        demoWarning={isUsingDemoData ? "Displaying demo red flag data. Real analysis will appear when documents are processed." : undefined}
      >
        <div className="space-y-6">
        <div className="stat-row">
          <span className="stat-label">Processing</span>
          <span className="stat-value">{processingCount}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Red Flags Detected</span>
          <span className="stat-value">{displayRedFlags.length}</span>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Red Flags</h3>
          {displayRedFlags.length > 0 ? (
            displayRedFlags.map((flag: any, idx: number) => (
              <div key={idx} className="insight-card warning">
                <div className="insight-text">
                  <AlertTriangle size={18} className="inline mr-2" />
                  {flag.description || flag.issue || 'Red flag detected'}
                </div>
                <div className="insight-subtext">
                  {flag.case_name || flag.case || 'Unknown case'} • {flag.severity || 'Medium'}
                </div>
              </div>
            ))
          ) : (
            <div className="insight-card positive">
              <div className="insight-text">
                <AIAnalysisIcon size={18} className="inline mr-2" />
                No red flags detected
              </div>
            </div>
          )}
        </div>
        </div>
      </DemoDataWrapper>
    </ExpandedPanel>
  );

}