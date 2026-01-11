/*
 * View Mode Selector Component
 * Allows users to switch between Full Stack, Essentials, and Floating Panel modes
 * 
 * Copyright 2025 Cognisint LLC
 */

import React from "react";
import { useViewMode, ViewMode } from "@/lib/view-mode-context";
import { LayoutDashboard, LayoutList, Monitor } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const viewModeLabels: Record<ViewMode, { label: string; icon: React.ReactNode; description: string; available?: boolean }> = {
  'full-stack': {
    label: "Full Stack",
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: "Complete dashboard with all features",
    available: true,
  },
  'essentials': {
    label: "Essentials",
    icon: <LayoutList className="h-4 w-4" />,
    description: "Simplified view with core features only",
    available: true,
  },
  'floating-panel': {
    label: "Floating Panel (Coming Soon)",
    icon: <Monitor className="h-4 w-4" />,
    description: "Lightweight desktop widget",
    available: false,
  },
};

/**
 * View Mode Selector Component
 * Allows users to switch between available UI modes
 */
export function ViewModeSelector() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="space-y-2">
      <Label>UI Mode</Label>
      <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(viewModeLabels) as ViewMode[]).map((mode) => {
            const modeInfo = viewModeLabels[mode];
            if (!modeInfo.available) {
              return (
                <SelectItem
                  key={mode}
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 w-full">
                    {modeInfo.icon}
                    <div className="flex flex-col">
                      <span>{modeInfo.label}</span>
                      <span className="text-xs text-muted-foreground">{modeInfo.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            }
            return (
              <SelectItem
                key={mode}
                value={mode}
                className={viewMode === mode ? "bg-muted" : ""}
              >
                <div className="flex items-center gap-2 w-full">
                  {modeInfo.icon}
                  <div className="flex flex-col">
                    <span>{modeInfo.label}</span>
                    <span className="text-xs text-muted-foreground">{modeInfo.description}</span>
                  </div>
                  {viewMode === mode && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Choose how LexFiat displays: full dashboard, essentials only, or floating panel
      </p>
    </div>
  );
}

}
}