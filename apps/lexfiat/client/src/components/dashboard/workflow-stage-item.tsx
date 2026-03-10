/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import { 
  DocumentIntakeIcon, 
  AIAnalysisIcon, 
  DraftPreparationIcon, 
  AttorneyReviewIcon 
} from '@cyrano/shared-assets/icon-components';

interface WorkflowStageItemProps {
  stageId: string;
  title: string;
  description: string;
  metrics: { label: string; value: string | number }[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onExpand: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

const stageConfig = {
  'intake': {
    icon: DocumentIntakeIcon,
    className: 'intake',
  },
  'analysis': {
    icon: AIAnalysisIcon,
    className: 'analysis',
  },
  'draft-prep': {
    icon: DraftPreparationIcon,
    className: 'review',
  },
  'attorney-review': {
    icon: AttorneyReviewIcon,
    className: 'output',
  },
};

export default function WorkflowStageItem({
  stageId,
  title,
  description,
  metrics,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onClick,
  onExpand,
  onRemove,
}: WorkflowStageItemProps) {
  const config = stageConfig[stageId as keyof typeof stageConfig];
  const IconComponent = config?.icon || DocumentIntakeIcon;
  const stageClass = config?.className || 'intake';

  return (
    <div
      className={`workflow-stage ${stageClass} ${isDragging ? 'dragging' : ''}`}
      draggable={true}
      data-stage={stageId}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="track-connector"></div>
      <div className="track-shoe"></div>
      <div className="glass-surface"></div>
      <div className="glass-reflection"></div>
      <button className="expand-btn" onClick={onExpand}>⤢</button>
      <button className="remove-widget" onClick={onRemove} title="Remove widget">−</button>
      <div className="stage-icon">
        <IconComponent size={22} color="currentColor" />
      </div>
      <h3 className="stage-title">{title}</h3>
      <p className="stage-description">{description}</p>
      <div className="stage-metrics">
        {metrics.map((metric, idx) => (
          <div key={idx} className="metric-row">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>
      <div className="resize-handle"></div>
    </div>
  );

}
