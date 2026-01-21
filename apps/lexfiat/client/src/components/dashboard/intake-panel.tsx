/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from "@tanstack/react-query";
import { getCases } from "@/lib/cyrano-api";
import ExpandedPanel from "./expanded-panel";
import { mockCases } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/demo-service";
import { DocumentIntakeIcon } from "@cyrano/shared-assets/icon-components";
import { DemoDataWrapper } from "@/components/demo/demo-data-wrapper";

interface IntakePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntakePanel({ isOpen, onClose }: IntakePanelProps) {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    refetchInterval: 30000,
    retry: false,
  });

  const displayCases = cases.length > 0 ? cases : mockCases;
  const isUsingDemoData = isDemoMode() && cases.length === 0;
  const todayCount = displayCases.length;
  const pendingCount = displayCases.filter((c: any) => c.status === 'pending' || !c.status).length;

  return (
    <ExpandedPanel
      title="Document Intake"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <DemoDataWrapper
        isDemo={isUsingDemoData}
        showBadge={true}
        showWarning={isUsingDemoData}
        demoWarning={isUsingDemoData ? "Displaying demo case data. Real case data will appear when connected to your practice management system." : undefined}
      >
        <div className="space-y-6">
        <div className="stat-row">
          <span className="stat-label">Documents Today</span>
          <span className="stat-value">{todayCount}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Pending Processing</span>
          <span className="stat-value">{pendingCount}</span>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent Documents</h3>
          {displayCases.slice(0, 10).map((caseItem: any, idx: number) => (
            <div key={idx} className="insight-card info">
              <div className="insight-text">
                <DocumentIntakeIcon size={18} className="inline mr-2" />
                {caseItem.case_name || caseItem.name || 'Document'}
              </div>
              <div className="insight-subtext">
                Received: {caseItem.created_at || 'Today'}
              </div>
            </div>
          ))}
        </div>
        </div>
      </DemoDataWrapper>
    </ExpandedPanel>
  );
