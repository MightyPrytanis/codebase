              /**
  * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from "@tanstack/react-query";
import { getCases } from "@/lib/cyrano-api";
import ExpandedPanel from "./expanded-panel";
import { mockCases } from "@/lib/demo-data";

interface TodaysFocusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TodaysFocusPanel({ isOpen, onClose }: TodaysFocusPanelProps) {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    refetchInterval: 60000,
    retry: false,
  });

  const displayCases = cases.length > 0 ? cases : mockCases;
  const urgentCases = displayCases.filter((c: any) => 
    c.priority === 'critical' || c.priority === 'high' || c.deadline
  );

  return (
    <ExpandedPanel
      title="Today's Focus"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-secondary">Loading cases...</p>
          </div>
        ) : urgentCases.length > 0 ? (
          urgentCases.map((caseItem: any, idx: number) => (
            <div key={idx} className="insight-card critical">
              <div className="insight-text">
                <strong>{caseItem.case_name || caseItem.name || 'Case'}</strong>
              </div>
              <div className="insight-subtext">
                <span>{caseItem.court || caseItem.jurisdiction || 'No location specified'}</span>
                {caseItem.deadline && (
                  <>
                    {' • '}
                    <span className="font-semibold">Due: {caseItem.deadline}</span>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <svg className="ui-icon" style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: 'var(--steel-gray)' }}><use href="#icon-alert"/></svg>
            <p className="text-secondary text-lg">No urgent cases or deadlines for today</p>
          </div>
        )}
      </div>
    </ExpandedPanel>
  );
