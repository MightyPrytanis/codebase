/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import ExpandedPanel from "./expanded-panel";
import { DraftPreparationIcon } from "@cyrano/shared-assets/icon-components";
import { DraftingModeSelector } from "./drafting-mode-selector";

interface DraftPrepPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DraftPrepPanel({ isOpen, onClose }: DraftPrepPanelProps) {
  // TODO: Wire to backend for real data
  const draftsReady = 6;
  const draftsInProgress = 3;

  return (
    <ExpandedPanel
      title="Draft Preparation"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Drafting Mode Selector */}
        <DraftingModeSelector
          documentId={undefined}
          matterId={undefined}
          documentType={undefined}
          currentMode="auto-draft"
          onModeChange={(mode) => {
            console.log('Drafting mode changed:', mode);
          }}
          onExecute={(mode) => {
            console.log('Executing mode:', mode);
          }}
        />

        <div className="stat-row">
          <span className="stat-label">Drafts Ready</span>
          <span className="stat-value">{draftsReady}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{draftsInProgress}</span>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent Drafts</h3>
          <div className="insight-card info">
            <div className="insight-text">
              <DraftPreparationIcon size={18} className="inline mr-2" />
              Johnson v Johnson - TRO Response Draft
            </div>
            <div className="insight-subtext">Ready for review</div>
          </div>
          <div className="insight-card info">
            <div className="insight-text">
              <DraftPreparationIcon size={18} className="inline mr-2" />
              Hartley Estate - Discovery Response
            </div>
            <div className="insight-subtext">In progress</div>
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
}

