/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import ExpandedPanel from "./expanded-panel";
import { AttorneyReviewIcon } from "@cyrano/shared-assets/icon-components";
import { AlertTriangle } from "lucide-react";

interface AttorneyReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AttorneyReviewPanel({ isOpen, onClose }: AttorneyReviewPanelProps) {
  // TODO: Wire to backend for real data
  const awaitingReview = 8;
  const urgent = 1;

  return (
    <ExpandedPanel
      title="Attorney Review"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-6">
        <div className="stat-row">
          <span className="stat-label">Awaiting Review</span>
          <span className="stat-value">{awaitingReview}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Urgent</span>
          <span className="stat-value">{urgent}</span>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Pending Review</h3>
          <div className="insight-card critical">
            <div className="insight-text">
              <AlertTriangle size={18} className="inline mr-2" />
              <strong>Johnson v Johnson - Emergency Motion Response</strong>
            </div>
            <div className="insight-subtext">URGENT • Due 5 PM tomorrow</div>
          </div>
          <div className="insight-card info">
            <div className="insight-text">
              <AttorneyReviewIcon size={18} className="inline mr-2" />
              Hartley Estate - Discovery Response
            </div>
            <div className="insight-subtext">Due Friday</div>
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
