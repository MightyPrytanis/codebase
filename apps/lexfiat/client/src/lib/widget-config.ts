/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Widget Configuration System
 * Handles per-user widget preferences and persistence
 */

export interface WidgetConfig {
  id: string;
  type: string;
  visible: boolean;
  order: number;
  position?: { x: number; y: number; w: number; h: number };
}

export interface UserWidgetPreferences {
  userId: string;
  widgets: WidgetConfig[];
  lastUpdated: string;
}

const WIDGET_PREFS_KEY = 'lexfiat_widget_preferences';

/**
 * Get user widget preferences from localStorage
 */
export function getUserWidgetPreferences(userId: string): UserWidgetPreferences | null {
  try {
    const stored = localStorage.getItem(`${WIDGET_PREFS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load widget preferences:', error);
  }
  return null;
}

/**
 * Save user widget preferences to localStorage
 */
export function saveUserWidgetPreferences(prefs: UserWidgetPreferences): void {
  try {
    localStorage.setItem(`${WIDGET_PREFS_KEY}_${prefs.userId}`, JSON.stringify({
      ...prefs,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to save widget preferences:', error);
  }
}

/**
 * Get default widget configuration
 */
export function getDefaultWidgetConfig(): WidgetConfig[] {
  return [
    { id: 'intake', type: 'intake', visible: true, order: 0 },
    { id: 'analysis', type: 'analysis', visible: true, order: 1 },
    { id: 'draft-prep', type: 'draft-prep', visible: true, order: 2 },
    { id: 'attorney-review', type: 'attorney-review', visible: true, order: 3 },
    { id: 'goodcounsel', type: 'goodcounsel', visible: true, order: 4 },
    { id: 'focus', type: 'focus', visible: true, order: 5 },
    { id: 'final-review', type: 'final-review', visible: false, order: 6 },
    { id: 'file-serve', type: 'file-serve', visible: false, order: 7 },
    { id: 'client-update', type: 'client-update', visible: false, order: 8 },
    { id: 'progress-summary', type: 'progress-summary', visible: false, order: 9 },
  ];
}

/**
 * Get widget configuration for user (with defaults)
 */
export function getWidgetConfig(userId: string): WidgetConfig[] {
  const prefs = getUserWidgetPreferences(userId);
  if (prefs && prefs.widgets.length > 0) {
    return prefs.widgets;
  }
  return getDefaultWidgetConfig();
}

/**
 * Update widget visibility
 */
export function updateWidgetVisibility(
  userId: string,
  widgetId: string,
  visible: boolean
): WidgetConfig[] {
  const configs = getWidgetConfig(userId);
  const updated = configs.map(w => 
    w.id === widgetId ? { ...w, visible } : w
  );
  
  saveUserWidgetPreferences({
    userId,
    widgets: updated,
    lastUpdated: new Date().toISOString(),
  });
  
  return updated;
}

/**
 * Update widget order (for drag-and-drop)
 */
export function updateWidgetOrder(
  userId: string,
  widgetId: string,
  newOrder: number
): WidgetConfig[] {
  const configs = getWidgetConfig(userId);
  const widget = configs.find(w => w.id === widgetId);
  if (!widget) return configs;
  
  // Remove widget from current position
  const filtered = configs.filter(w => w.id !== widgetId);
  
  // Insert at new position
  const updated = [
    ...filtered.slice(0, newOrder),
    { ...widget, order: newOrder },
    ...filtered.slice(newOrder),
  ].map((w, index) => ({ ...w, order: index }));
  
  saveUserWidgetPreferences({
    userId,
    widgets: updated,
    lastUpdated: new Date().toISOString(),
  });
  
  return updated;
}

/**
 * Connect widget config to workflow config
 * Warns user if hiding a stage widget
 */
export function handleWidgetVisibilityChange(
  userId: string,
  widgetId: string,
  visible: boolean,
  onWarning?: (message: string) => void
): boolean {
  const workflowWidgets = ['intake', 'analysis', 'draft-prep', 'attorney-review'];
  
  if (!visible && workflowWidgets.includes(widgetId)) {
    const message = `Hiding the "${widgetId}" widget will also hide this stage in the workflow view. Continue?`;
    if (onWarning) {
      onWarning(message);
    }
    // Return false to indicate user should confirm
    return false;
  }
  
  updateWidgetVisibility(userId, widgetId, visible);
  return true;
}

/**
 * Save widget configuration to backend
 */
export async function saveWidgetConfigToBackend(
  userId: string,
  widgets: WidgetConfig[]
): Promise<boolean> {
  try {
    // Import here to avoid circular dependencies
    const { executeCyranoTool } = await import('./cyrano-api');
    
    // Map widget config to workflow stages format
    const workflowStages = widgets
      .filter(w => ['intake', 'analysis', 'draft-prep', 'attorney-review'].includes(w.id))
      .map((widget, index) => ({
        id: widget.id,
        name: widget.id.charAt(0).toUpperCase() + widget.id.slice(1).replace('-', ' '),
        agent: widget.id,
        description: `Workflow stage: ${widget.id}`,
        order: index,
      }));
    
    if (workflowStages.length > 0) {
      await executeCyranoTool('workflow_manager', {
        action: 'customize',
        workflow_type: 'custom',
        custom_stages: workflowStages,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save widget config to backend:', error);
    return false;
  }
}



}
}
}
}
}
}
}
}
}
}
}
}