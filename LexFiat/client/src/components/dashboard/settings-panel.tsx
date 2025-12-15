/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Bell, Palette, Globe, Link as LinkIcon, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeSelector } from "@/components/theme/theme-selector";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleNavigate = (path: string, tab?: string) => {
    setLocation(path + (tab ? `?tab=${tab}` : ""));
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-4xl bg-charcoal border-gray-800 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-white">Settings</SheetTitle>
        </SheetHeader>
      <div className="space-y-6">
        <div 
          className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={() => handleNavigate("/settings")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-5 w-5" />
            <h3 className="font-semibold">Full Settings Page</h3>
          </div>
          <p className="text-sm text-muted-foreground">Access all settings, integrations, and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => handleNavigate("/settings", "preferences")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">Configure email and desktop notifications</p>
          </div>

          <div 
            className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => {
              setActiveSection(activeSection === "appearance" ? null : "appearance");
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Palette className="h-5 w-5" />
              <h3 className="font-semibold">Appearance</h3>
            </div>
            <p className="text-sm text-muted-foreground">Customize theme and display options</p>
            {activeSection === "appearance" && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <ThemeSelector />
              </div>
            )}
          </div>

          <div 
            className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => handleNavigate("/settings", "preferences")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5" />
              <h3 className="font-semibold">Language & Region</h3>
            </div>
            <p className="text-sm text-muted-foreground">Set timezone and regional preferences</p>
          </div>

          <div 
            className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => handleNavigate("/settings", "integrations")}
          >
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="h-5 w-5" />
              <h3 className="font-semibold">Integrations</h3>
            </div>
            <p className="text-sm text-muted-foreground">Manage Clio, Gmail, and other integrations</p>
          </div>

          <div 
            className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => handleNavigate("/settings", "ai-providers")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">AI Providers</h3>
            </div>
            <p className="text-sm text-muted-foreground">Configure AI service providers and API keys</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

