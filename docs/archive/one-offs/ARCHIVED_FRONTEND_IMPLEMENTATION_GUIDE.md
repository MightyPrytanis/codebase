---
Document ID: ARCHIVED-FRONTEND_IMPLEMENTATION_GUIDE
Title: Frontend Implementation Guide
Subject(s): Archived | One-Off | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current utility (superseded by other docs, one-off, or historical).
Status: Archived
---

**ARCHIVED:** This document has limited current utility and has been archived. Archived 2025-11-28.

---

---
Document ID: FRONTEND-IMPLEMENTATION-GUIDE
Title: Frontend Implementation Guide
Subject(s): LexFiat | Guide | UI
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# LexFiat Frontend Implementation Guide

This guide provides complete implementation details for the remaining frontend functionality that needs to be wired up in the LexFiat React application.

## Overview

The following features need to be implemented:
1. **Workflow Customization**: Drag-drop widget reordering with Cyrano backend integration
2. **Workflow Notification**: Popup when widgets are reordered
3. **Widget Add/Remove Menu**: Dynamic workflow grid expansion
4. **Sync Status Panels**: Interactive panels for Clio, Gmail, Calendar, etc.

---

## 1. Workflow Customization - Drag & Drop Integration

### Backend: Cyrano API Endpoint
The Cyrano MCP server already has the `workflow_manager` tool with customization support. It accepts HTTP calls to:

**Endpoint**: `POST http://your-cyrano-server:5002/mcp/tool`

**Request Body**:
```json
{
  "tool": "workflow_manager",
  "arguments": {
    "action": "customize",
    "workflow_type": "custom",
    "custom_stages": [
      {
        "id": "intake",
        "name": "Document Intake",
        "agent": "document_analyzer",
        "description": "Initial document processing",
        "order": 0
      },
      {
        "id": "ai_analysis",
        "name": "AI Analysis",
        "agent": "legal_comparator",
        "description": "AI-powered analysis",
        "order": 1
      }
      // ... more stages
    ]
  }
}
```

### Frontend: React Component Implementation

**File**: `/Users/davidtowne/projects/LexFiat/client/src/components/dashboard/workflow-pipeline.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkflowStage {
  id: string;
  name: string;
  agent: string;
  description: string;
  order: number;
  icon?: string;
  color?: string;
}

interface WorkflowPipelineProps {
  onWorkflowChange?: (stages: WorkflowStage[]) => void;
}

// Sortable workflow stage component
function SortableStage({ stage }: { stage: WorkflowStage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="workflow-stage"
    >
      <div className="stage-icon">{stage.icon || '📄'}</div>
      <div className="stage-name">{stage.name}</div>
      <div className="stage-agent">{stage.agent}</div>
    </div>
  );
}

export function WorkflowPipeline({ onWorkflowChange }: WorkflowPipelineProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([
    { id: 'intake', name: 'Document Intake', agent: 'document_analyzer', description: 'Initial processing', order: 0, icon: '📥' },
    { id: 'ai_analysis', name: 'AI Analysis', agent: 'legal_comparator', description: 'AI analysis', order: 1, icon: '🤖' },
    { id: 'draft_prep', name: 'Draft Preparation', agent: 'draft_generator', description: 'Draft generation', order: 2, icon: '📝' },
    { id: 'attorney_review', name: 'Attorney Review', agent: 'human_review', description: 'Final review', order: 3, icon: '⚖️' },
  ]);

  const [showNotification, setShowNotification] = useState(false);

  // Call Cyrano API to save workflow configuration
  const saveWorkflowToCyrano = async (updatedStages: WorkflowStage[]) => {
    try {
      const response = await fetch('http://localhost:5002/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'workflow_manager',
          arguments: {
            action: 'customize',
            workflow_type: 'custom',
            custom_stages: updatedStages,
          },
        }),
      });

      const result = await response.json();
      console.log('Workflow saved to Cyrano:', result);
      return result;
    } catch (error) {
      console.error('Failed to save workflow to Cyrano:', error);
      throw error;
    }
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      // Reorder stages
      const newStages = arrayMove(stages, oldIndex, newIndex).map((stage, index) => ({
        ...stage,
        order: index,
      }));

      setStages(newStages);

      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);

      // Save to Cyrano
      try {
        await saveWorkflowToCyrano(newStages);
        onWorkflowChange?.(newStages);
      } catch (error) {
        console.error('Failed to save workflow:', error);
        // Optionally revert on error
      }
    }
  };

  return (
    <div className="workflow-pipeline">
      {/* Notification Popup */}
      {showNotification && (
        <div className="workflow-notification">
          <div className="notification-content">
            <span className="notification-icon">⚠️</span>
            <div className="notification-text">
              <strong>Workflow Order Changed</strong>
              <p>This will affect the order in which documents are processed. The new sequence will be applied to all future workflows.</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="notification-close">✕</button>
          </div>
        </div>
      )}

      {/* Draggable Workflow Stages */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
          <div className="stages-container">
            {stages.map((stage) => (
              <SortableStage key={stage.id} stage={stage} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

### Required Dependencies
Add to `/Users/davidtowne/projects/LexFiat/package.json`:

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2",
    "@dnd-kit/utilities": "^3.2.1"
  }
}
```

Install with:
```bash
cd /Users/davidtowne/projects/LexFiat
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 2. Workflow Notification Styling

Add to `/Users/davidtowne/projects/LexFiat/client/src/styles/workflow.css`:

```css
.workflow-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.notification-content {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(147, 197, 253, 0.5);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 500px;
  color: white;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-text strong {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.notification-text p {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.notification-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}
```

---

## 3. Widget Add/Remove Menu

**File**: `/Users/davidtowne/projects/LexFiat/client/src/components/dashboard/workflow-menu.tsx`

```typescript
import React, { useState } from 'react';

interface AvailableWidget {
  id: string;
  name: string;
  agent: string;
  description: string;
  icon: string;
}

const AVAILABLE_WIDGETS: AvailableWidget[] = [
  { id: 'final_review', name: 'Final Review', agent: 'quality_checker', description: 'Final quality check', icon: '✅' },
  { id: 'file_serve', name: 'File and Serve', agent: 'filing_service', description: 'File with court', icon: '📤' },
  { id: 'client_update', name: 'Client Update', agent: 'notification_service', description: 'Notify client', icon: '📧' },
  { id: 'progress_summary', name: 'Progress Summary', agent: 'reporter', description: 'Generate summary', icon: '📊' },
];

interface WorkflowMenuProps {
  currentStages: string[];
  onAddWidget: (widget: AvailableWidget) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function WorkflowMenu({ currentStages, onAddWidget, onRemoveWidget }: WorkflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableToAdd = AVAILABLE_WIDGETS.filter(w => !currentStages.includes(w.id));

  return (
    <div className="workflow-menu">
      <button 
        className="workflow-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Add or remove workflow stages"
      >
        <span className="menu-icon">{isOpen ? '−' : '+'}</span>
        <span className="menu-label">Customize Workflow</span>
      </button>

      {isOpen && (
        <div className="workflow-menu-panel">
          <h3>Add Workflow Stage</h3>
          <div className="widget-grid">
            {availableToAdd.map((widget) => (
              <button
                key={widget.id}
                className="widget-card"
                onClick={() => {
                  onAddWidget(widget);
                  setIsOpen(false);
                }}
              >
                <div className="widget-icon">{widget.icon}</div>
                <div className="widget-name">{widget.name}</div>
                <div className="widget-description">{widget.description}</div>
              </button>
            ))}
            {availableToAdd.length === 0 && (
              <p className="no-widgets">All available stages are already in your workflow</p>
            )}
          </div>

          <h3>Remove Workflow Stage</h3>
          <div className="widget-list">
            {currentStages.map((stageId) => {
              const widget = AVAILABLE_WIDGETS.find(w => w.id === stageId);
              if (!widget) return null;
              return (
                <button
                  key={stageId}
                  className="widget-remove-item"
                  onClick={() => onRemoveWidget(stageId)}
                >
                  <span className="widget-icon">{widget.icon}</span>
                  <span className="widget-name">{widget.name}</span>
                  <span className="remove-icon">✕</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Styling for Workflow Menu

Add to `/Users/davidtowne/projects/LexFiat/client/src/styles/workflow.css`:

```css
.workflow-menu {
  position: relative;
  margin-bottom: 1rem;
}

.workflow-menu-toggle {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.workflow-menu-toggle:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.25) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
}

.menu-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.workflow-menu-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background: rgba(15, 20, 25, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 400px;
  max-width: 600px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.workflow-menu-panel h3 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  padding-bottom: 0.5rem;
}

.workflow-menu-panel h3:not(:first-child) {
  margin-top: 1.5rem;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.widget-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.widget-card:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.widget-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.widget-name {
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.widget-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.widget-remove-item {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.08) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.widget-remove-item:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%);
  border-color: rgba(239, 68, 68, 0.5);
}

.widget-remove-item .remove-icon {
  margin-left: auto;
  font-size: 1.2rem;
  color: #ef4444;
}

.no-widgets {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 1rem;
  font-style: italic;
}
```

---

## 4. Sync Status Panels

**File**: `/Users/davidtowne/projects/LexFiat/client/src/components/dashboard/sync-panel.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  progress: number;
  lastSync: string | null;
  message: string;
}

interface SyncPanelProps {
  service: 'clio' | 'gmail' | 'calendar' | 'westlaw' | 'icle' | 'mifile';
  onClose: () => void;
}

const SERVICE_NAMES = {
  clio: 'Clio',
  gmail: 'Gmail',
  calendar: 'Calendar',
  westlaw: 'Westlaw',
  icle: 'ICLE',
  mifile: 'MiFile',
};

const SERVICE_ICONS = {
  clio: '⚖️',
  gmail: '📧',
  calendar: '📅',
  westlaw: '📚',
  icle: '🎓',
  mifile: '📁',
};

export function SyncPanel({ service, onClose }: SyncPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    progress: 0,
    lastSync: null,
    message: 'Ready to sync',
  });

  // Fetch current sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('http://localhost:5002/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'sync_manager',
          arguments: {
            action: 'get_status',
            service: service,
          },
        }),
      });

      const result = await response.json();
      if (result.content && result.content[0]) {
        const data = JSON.parse(result.content[0].text);
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  // Force sync
  const handleForceSync = async () => {
    try {
      setSyncStatus({ status: 'syncing', progress: 0, lastSync: null, message: 'Initiating sync...' });

      const response = await fetch('http://localhost:5002/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'sync_manager',
          arguments: {
            action: 'force_sync',
            service: service,
          },
        }),
      });

      const result = await response.json();
      console.log('Sync initiated:', result);
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        await fetchSyncStatus();
        if (syncStatus.status === 'completed' || syncStatus.status === 'error') {
          clearInterval(pollInterval);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to force sync:', error);
      setSyncStatus({ status: 'error', progress: 0, lastSync: null, message: 'Sync failed' });
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [service]);

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'syncing': return '#3b82f6'; // blue
      case 'completed': return '#10b981'; // green
      case 'error': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="sync-panel-overlay" onClick={onClose}>
      <div className="sync-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sync-panel-header">
          <div className="sync-panel-title">
            <span className="service-icon">{SERVICE_ICONS[service]}</span>
            <span>{SERVICE_NAMES[service]} Sync</span>
          </div>
          <button className="sync-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="sync-panel-body">
          {/* Status Indicator */}
          <div className="sync-status-row">
            <span className="status-label">Status:</span>
            <span className="status-value" style={{ color: getStatusColor() }}>
              {getStatusIcon()} {syncStatus.status}
            </span>
          </div>

          {/* Progress Bar */}
          {syncStatus.status === 'syncing' && (
            <div className="sync-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${syncStatus.progress}%`,
                    backgroundColor: getStatusColor(),
                  }}
                >
                  <span className="progress-text">{syncStatus.progress}%</span>
                </div>
              </div>
              <div className="progress-spinner">
                <div className="spinner"></div>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="sync-message">{syncStatus.message}</div>

          {/* Last Sync */}
          {syncStatus.lastSync && (
            <div className="sync-last">
              Last synced: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}

          {/* Actions */}
          <div className="sync-actions">
            <button 
              className="sync-button force-sync"
              onClick={handleForceSync}
              disabled={syncStatus.status === 'syncing'}
            >
              {syncStatus.status === 'syncing' ? 'Syncing...' : 'Force Sync Now'}
            </button>
            <button className="sync-button refresh" onClick={fetchSyncStatus}>
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Styling for Sync Panels

Add to `/Users/davidtowne/projects/LexFiat/client/src/styles/sync.css`:

```css
.sync-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.sync-panel {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(20, 25, 35, 0.98) 100%);
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.sync-panel-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sync-panel-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.service-icon {
  font-size: 1.5rem;
}

.sync-panel-close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-panel-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.sync-panel-body {
  padding: 1.5rem;
}

.sync-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.status-value {
  font-weight: 600;
  font-size: 1.1rem;
  text-transform: uppercase;
}

.sync-progress {
  margin: 1.5rem 0;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  height: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  position: relative;
  z-index: 1;
}

.progress-spinner {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sync-message {
  color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  margin: 1rem 0;
}

.sync-last {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  text-align: center;
  margin: 1rem 0;
}

.sync-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.sync-button {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.sync-button.force-sync {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.sync-button.force-sync:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.sync-button.force-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-button.refresh {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sync-button.refresh:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
```

---

## 5. Integration into Dashboard

Update `/Users/davidtowne/projects/LexFiat/client/src/pages/dashboard.tsx`:

```typescript
import React, { useState } from 'react';
import { WorkflowPipeline } from '../components/dashboard/workflow-pipeline';
import { WorkflowMenu } from '../components/dashboard/workflow-menu';
import { SyncPanel } from '../components/dashboard/sync-panel';
import '../styles/workflow.css';
import '../styles/sync.css';

export function Dashboard() {
  const [workflowStages, setWorkflowStages] = useState<string[]>([
    'intake', 'ai_analysis', 'draft_prep', 'attorney_review'
  ]);
  const [activeSyncPanel, setActiveSyncPanel] = useState<string | null>(null);

  const handleAddWidget = (widget: any) => {
    setWorkflowStages([...workflowStages, widget.id]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWorkflowStages(workflowStages.filter(id => id !== widgetId));
  };

  const handleSyncClick = (service: string) => {
    setActiveSyncPanel(service);
  };

  return (
    <div className="dashboard">
      <header className="header">
        {/* ... existing header content ... */}
        
        {/* Sync indicators - make them clickable */}
        <button onClick={() => handleSyncClick('gmail')} className="header-indicator">
          📧 Gmail
        </button>
        <button onClick={() => handleSyncClick('calendar')} className="header-indicator">
          📅 Calendar
        </button>
        {/* ... more indicators ... */}
      </header>

      <main className="main-content">
        {/* Workflow Menu */}
        <WorkflowMenu
          currentStages={workflowStages}
          onAddWidget={handleAddWidget}
          onRemoveWidget={handleRemoveWidget}
        />

        {/* Workflow Pipeline with Drag & Drop */}
        <WorkflowPipeline
          onWorkflowChange={(stages) => {
            setWorkflowStages(stages.map(s => s.id));
          }}
        />

        {/* ... rest of dashboard content ... */}
      </main>

      {/* Sync Panel Modal */}
      {activeSyncPanel && (
        <SyncPanel
          service={activeSyncPanel as any}
          onClose={() => setActiveSyncPanel(null)}
        />
      )}
    </div>
  );
}
```

---

## 6. Environment Configuration

Ensure Cyrano server URL is configurable:

**File**: `/Users/davidtowne/projects/LexFiat/client/.env`

```env
VITE_CYRANO_URL=http://localhost:5002
```

Update all API calls to use:
```typescript
const CYRANO_URL = import.meta.env.VITE_CYRANO_URL || 'http://localhost:5002';
```

---

## Testing Checklist

- [ ] Install @dnd-kit dependencies
- [ ] Implement WorkflowPipeline component
- [ ] Test drag-drop reordering
- [ ] Verify API calls to Cyrano workflow_manager
- [ ] Test workflow reorder notification popup
- [ ] Implement WorkflowMenu component
- [ ] Test adding/removing workflow stages
- [ ] Verify workflow grid expands to 2-3 rows dynamically
- [ ] Implement SyncPanel component
- [ ] Test sync status fetching for all services
- [ ] Test force sync functionality
- [ ] Verify progress indicators work correctly
- [ ] Test all sync panels (Clio, Gmail, Calendar, etc.)
- [ ] Verify background syncing continues
- [ ] Test responsive behavior on different screen sizes

---

## Notes

1. **Background Syncing**: To enable automatic background syncing, add a global polling mechanism in the main App component that calls `sync_manager` with `action: 'start_sync'` for each service on an interval (e.g., every 5 minutes).

2. **Error Handling**: All API calls should include proper error handling and user feedback.

3. **Loading States**: Add loading spinners/indicators during API calls.

4. **Accessibility**: Ensure all interactive elements have proper ARIA labels and keyboard navigation support.

5. **Render Deployment**: When deploying to Render, update `VITE_CYRANO_URL` to point to the deployed Cyrano server URL.

---

## Next Steps

After implementing these features:
1. Test all functionality locally with Cyrano running
2. Update Render deployment configuration
3. Add comprehensive error logging
4. Implement user preferences storage (localStorage or backend)
5. Add analytics tracking for workflow customization patterns
6. Consider adding workflow templates/presets

