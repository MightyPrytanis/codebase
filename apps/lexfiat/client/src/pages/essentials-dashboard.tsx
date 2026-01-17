/*
 * Essentials Dashboard
 * Simplified view with core features only
 * 
 * Copyright 2025 Cognisint LLC
 */

import React, { useState } from "react";
import { useViewMode } from "@/lib/view-mode-context";
import { CompactHUD } from "@/components/dashboard/compact-hud";
import Header from "@/components/layout/header";
import { GoodCounselEnhanced } from "@/components/dashboard/good-counsel-enhanced";
import TodaysFocusPanel from "@/components/dashboard/todays-focus-panel";
import IntakePanel from "@/components/dashboard/intake-panel";
import AnalysisPanel from "@/components/dashboard/analysis-panel";
import DraftPrepPanel from "@/components/dashboard/draft-prep-panel";
import AttorneyReviewPanel from "@/components/dashboard/attorney-review-panel";
import SettingsPanel from "@/components/dashboard/settings-panel";
import ProfilePanel from "@/components/dashboard/profile-panel";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

export default function EssentialsDashboard() {
  const { setViewMode } = useViewMode();
  const [panelOverlayOpen, setPanelOverlayOpen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const expandPanel = (panelType: string) => {
    setCurrentPanel(panelType);
    setPanelOverlayOpen(true);
  };

  const closePanel = () => {
    setPanelOverlayOpen(false);
    setCurrentPanel(null);
  };

  const handleCompactHUDClick = (item: "incoming" | "deadlines" | "drafts" | "reviews" | "goodcounsel") => {
    const panelMap: Record<string, string> = {
      incoming: 'intake',
      deadlines: 'calendar',
      drafts: 'draft-prep',
      reviews: 'attorney-review',
      goodcounsel: 'goodcounsel',
    };
    expandPanel(panelMap[item] || 'focus');
  };

  return (
    <>
      <Header 
        attorney={{ name: "Mekel S. Miller", specialization: "Family Law" }}
        onAdminClick={() => setSettingsOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
        onProfileClick={() => expandPanel('profile')}
      />
      
      {/* Compact HUD at top */}
      <CompactHUD 
        position="top"
        onItemClick={handleCompactHUDClick}
      />

      {/* Main content area - minimal, focused */}
      <div className="main-content" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Quick actions bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('full-stack')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Switch to Full Stack
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Essential widgets in compact grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Today's Focus - Compact */}
            <div 
              className="widget focus cursor-pointer"
              onClick={() => expandPanel('focus')}
            >
              <div className="widget-header">
                <h3 className="widget-title">Today's Focus</h3>
              </div>
              <div className="widget-content">
                <p className="text-sm text-muted-foreground">Click to view priorities</p>
              </div>
            </div>

            {/* GoodCounsel - Compact */}
            <div 
              className="widget goodcounsel cursor-pointer"
              onClick={() => expandPanel('goodcounsel')}
            >
              <div className="widget-header">
                <h3 className="widget-title">GoodCounsel</h3>
              </div>
              <div className="widget-content">
                <p className="text-sm text-muted-foreground">Click for wellness check</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Panel Overlays */}
      <GoodCounselEnhanced 
        isOpen={panelOverlayOpen && currentPanel === 'goodcounsel'} 
        onClose={closePanel}
      />
      <TodaysFocusPanel 
        isOpen={panelOverlayOpen && currentPanel === 'focus'} 
        onClose={closePanel}
      />
      <IntakePanel 
        isOpen={panelOverlayOpen && currentPanel === 'intake'} 
        onClose={closePanel}
      />
      <AnalysisPanel 
        isOpen={panelOverlayOpen && currentPanel === 'analysis'} 
        onClose={closePanel}
      />
      <DraftPrepPanel 
        isOpen={panelOverlayOpen && currentPanel === 'draft-prep'} 
        onClose={closePanel}
      />
      <AttorneyReviewPanel 
        isOpen={panelOverlayOpen && currentPanel === 'attorney-review'} 
        onClose={closePanel}
      />
      <SettingsPanel 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ProfilePanel 
        isOpen={panelOverlayOpen && currentPanel === 'profile'} 
        onClose={closePanel}
        attorney={{ name: "Mekel S. Miller", specialization: "Family Law" }}
      />
      <CalendarView 
        isOpen={panelOverlayOpen && currentPanel === 'calendar'} 
        onClose={closePanel}
      />
    </>
  );
