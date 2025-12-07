/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import ExpandedPanel from "./expanded-panel";
import { Settings, Bell, Palette, Globe } from "lucide-react";
import { Link } from "wouter";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  return (
    <ExpandedPanel
      title="Settings"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-6">
        <Link href="/settings">
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5" />
              <h3 className="font-semibold">Full Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground">Open complete settings page</p>
          </div>
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">Configure notification preferences</p>
          </div>
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Palette className="h-5 w-5" />
              <h3 className="font-semibold">Appearance</h3>
            </div>
            <p className="text-sm text-muted-foreground">Customize theme and display options</p>
          </div>
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5" />
              <h3 className="font-semibold">Language & Region</h3>
            </div>
            <p className="text-sm text-muted-foreground">Set language and regional preferences</p>
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
}

