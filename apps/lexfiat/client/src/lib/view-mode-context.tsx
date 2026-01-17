/*
 * View Mode Context
 * Manages UI mode state (Full Stack, Essentials, Floating Panel)
 * 
 * Copyright 2025 Cognisint LLC
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ViewMode = 'full-stack' | 'essentials' | 'floating-panel';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isFullStack: boolean;
  isEssentials: boolean;
  isFloatingPanel: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'lexfiat-view-mode';

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Load from localStorage or default to full-stack
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['full-stack', 'essentials', 'floating-panel'].includes(saved)) {
        return saved as ViewMode;
      }
    }
    return 'full-stack';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  useEffect(() => {
    // Persist to localStorage whenever viewMode changes
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, viewMode);
    }
  }, [viewMode]);

  const value: ViewModeContextType = {
    viewMode,
    setViewMode,
    isFullStack: viewMode === 'full-stack',
    isEssentials: viewMode === 'essentials',
    isFloatingPanel: viewMode === 'floating-panel',
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
