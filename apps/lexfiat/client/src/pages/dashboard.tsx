/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { LiaSwimmerSolid } from "react-icons/lia";
import Header from "@/components/layout/header";
import TestingSidebar from "@/components/dashboard/testing-sidebar-html";
import FooterBanner from "@/components/layout/footer-banner-html";
import { GoodCounselEnhanced } from "@/components/dashboard/good-counsel-enhanced";
import ExpandedPanel from "@/components/dashboard/expanded-panel";
import TodaysFocusPanel from "@/components/dashboard/todays-focus-panel";
import IntakePanel from "@/components/dashboard/intake-panel";
import AnalysisPanel from "@/components/dashboard/analysis-panel";
import DraftPrepPanel from "@/components/dashboard/draft-prep-panel";
import AttorneyReviewPanel from "@/components/dashboard/attorney-review-panel";
import AdminPanel from "@/components/dashboard/admin-panel";
import SettingsPanel from "@/components/dashboard/settings-panel";
import ProfilePanel from "@/components/dashboard/profile-panel";
import { CalendarView } from "@/components/dashboard/calendar-view";
import WorkflowStageItem from "@/components/dashboard/workflow-stage-item";
import { PriorityAlertsRow } from "@/components/dashboard/priority-alerts-row";
import { ActiveWIPRow } from "@/components/dashboard/active-wip-row";
import { DemoMatterCards } from "@/components/dashboard/demo-matter-cards";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { isDemoMode } from "@/lib/demo-service";
import { DEMO_CASES } from "@/lib/demo-data";
import { openInClio, openInEmail, openInCalendar } from "@/lib/deep-links";
import "@/styles/dashboard-html.css";
import { 
  DocumentIntakeIcon, 
  AIAnalysisIcon, 
  DraftPreparationIcon, 
  AttorneyReviewIcon,
  FinalReviewIcon,
  FileAndServeIcon,
  ClientUpdateIcon,
  ProgressSummaryIcon,
  BillingTimeIcon,
  GoodCounselIcon,
  BetaTestingIcon
} from "@cyrano/shared-assets/icon-components";
import { SearchCheck, Send, MessageSquare, TrendingUp } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewMode } from "@/lib/view-mode-context";
import EssentialsDashboard from "./essentials-dashboard";

export default function Dashboard() {
  const { viewMode } = useViewMode();

  // Route to Essentials mode if selected
  if (viewMode === 'essentials') {
    return <EssentialsDashboard />;
  }

  // Full Stack mode (default)
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false);
  const [panelOverlayOpen, setPanelOverlayOpen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<string | null>(null);
  const [trackingCardOpen, setTrackingCardOpen] = useState(false);
  const [trackingCardData, setTrackingCardData] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [browserWarningOpen, setBrowserWarningOpen] = useState(false);
  const [chromeAdvisoryOpen, setChromeAdvisoryOpen] = useState(false);
  const [testingSidebarOpen, setTestingSidebarOpen] = useState(false);
  const [workflowStages, setWorkflowStages] = useState([
    { 
      id: 'intake', 
      order: 0, 
      title: 'Document Intake',
      description: 'Email monitoring and document capture',
      metrics: [{ label: 'Today', value: 24 }, { label: 'Pending', value: 3 }],
    },
    { 
      id: 'analysis', 
      order: 1,
      title: 'AI Analysis',
      description: 'Document review and red flag detection',
      metrics: [{ label: 'Processing', value: 5 }, { label: 'Red Flags', value: 2 }],
    },
    { 
      id: 'draft-prep', 
      order: 2,
      title: 'Draft Preparation',
      description: 'AI-generated draft responses',
      metrics: [{ label: 'Drafts Ready', value: 6 }, { label: 'In Progress', value: 3 }],
    },
    { 
      id: 'attorney-review', 
      order: 3,
      title: 'Attorney Review',
      description: 'Final review and approval',
      metrics: [{ label: 'Awaiting', value: 8 }, { label: 'Urgent', value: 1 }],
    },
  ]);
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [selectedSummaryCard, setSelectedSummaryCard] = useState<{ type: string; id: string; data: any } | null>(null);
  const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOpenSidebar = () => setTestingSidebarOpen(true);
    window.addEventListener('open-testing-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-testing-sidebar', handleOpenSidebar);
  }, []);

  const tickerItems = [
    { id: 'emergency-motion-001', priority: 'critical', text: 'Johnson v Johnson - Emergency Motion Filed', time: '2 min ago' },
    { id: 'hearing-notice-002', priority: 'high', text: 'Hartley Estate - Court Hearing Notice', time: '15 min ago' },
    { id: 'document-review-003', priority: 'medium', text: 'Smith Family Trust - Document Review', time: '1 hour ago' },
    { id: 'system-status-004', priority: 'low', text: 'System: All AI providers operational', time: '2 hours ago' },
  ];

  useEffect(() => {
    // Start ticker rotation
    tickerIntervalRef.current = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
    };
  }, []);

  const expandPanel = (panelType: string) => {
    setCurrentPanel(panelType);
    setPanelOverlayOpen(true);
  };

  const closePanel = () => {
    setPanelOverlayOpen(false);
    setCurrentPanel(null);
  };

  const openTrackingCard = async (itemId: string) => {
    try {
      const result = await executeCyranoTool('clio_integration', {
        action: 'get_item_tracking',
        item_id: itemId,
      });
      
      if (result.isError) {
        // Fallback to basic data if API fails
        setTrackingCardData({ 
          id: itemId, 
          title: 'Item Tracking',
          error: result.content[0]?.text || 'Unable to fetch tracking data'
        });
      } else {
        const trackingData = typeof result.content[0]?.text === 'string'
          ? JSON.parse(result.content[0].text)
          : result.content[0]?.text;
        setTrackingCardData({ 
          id: itemId, 
          title: trackingData.title || 'Item Tracking',
          ...trackingData
        });
      }
    } catch (error) {
      setTrackingCardData({ 
        id: itemId, 
        title: 'Item Tracking',
        error: 'Failed to load tracking data'
      });
    }
    setTrackingCardOpen(true);
  };

  const closeTrackingCard = () => {
    setTrackingCardOpen(false);
    setTrackingCardData(null);
  };

  const handleDragStart = (stageId: string) => {
    setDraggedStage(stageId);
  };

  const handleDragOver = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedStage || draggedStage === targetStageId) return;

    const draggedIndex = workflowStages.findIndex(s => s.id === draggedStage);
    const targetIndex = workflowStages.findIndex(s => s.id === targetStageId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newStages = [...workflowStages];
    const [dragged] = newStages.splice(draggedIndex, 1);
    newStages.splice(targetIndex, 0, dragged);
    
    const reordered = newStages.map((s, idx) => ({ ...s, order: idx }));
    setWorkflowStages(reordered);
    setDraggedStage(targetStageId);
  };

  const handleDragEnd = async () => {
    setDraggedStage(null);
    // Save workflow order to backend
    try {
      const customStages = workflowStages.map((stage, index) => ({
        id: stage.id,
        name: stage.title,
        agent: stage.id, // Map stage ID to agent name
        description: stage.description,
        order: index,
      }));
      
      await executeCyranoTool('workflow_manager', {
        action: 'customize',
        workflow_type: 'custom',
        custom_stages: customStages,
      });
    } catch (error) {
      console.error('Failed to save workflow order:', error);
      // Silently fail - order is still saved in local state
    }
  };

  const toggleWidgetMenu = () => {
    setWidgetMenuOpen(!widgetMenuOpen);
  };

  const submitBetaChecklist = () => {
    const selected = document.querySelector('#beta-checklist input[type="radio"]:checked') as HTMLInputElement;
    if (!selected) {
      alert('Select an issue type.');
      return;
    }
    setReportModalOpen(true);
  };

  return (
    <>
      <Header 
        attorney={{ name: "Mekel S. Miller", specialization: "Family Law" }}
        onAdminClick={() => expandPanel('admin')}
        onSettingsClick={() => expandPanel('settings')}
        onProfileClick={() => expandPanel('profile')}
      />
      
      <div className="main-content" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        {/* Demo Mode Matter Cards */}
        {isDemoMode() && (
          <div style={{ width: '100%', marginBottom: '1.5rem' }}>
            <DemoMatterCards
              onMatterClick={(matterId) => {
                const matter = DEMO_CASES.find((m) => m.id === matterId);
                if (matter) {
                  setSelectedSummaryCard({
                    type: 'matter',
                    id: matterId,
                    data: matter,
                  });
                }
              }}
            />
          </div>
        )}

        {/* First Row: Priority Alerts (Full width, compact) with Urgent label */}
        <div style={{ width: '100%', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem', alignItems: 'stretch' }}>
          <div className="tier-label tier-urgent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Urgent</div>
          <div>
          <PriorityAlertsRow
            onAlertClick={(alert) => {
              openTrackingCard(alert.id);
            }}
            onSummaryCardOpen={(type, id, data) => {
              setSelectedSummaryCard({ type, id, data });
            }}
          />
          </div>
        </div>

        {/* Second Row: Today's Focus (Cols 1-2) and GoodCounsel (Cols 3-4) with Spotlight label */}
        <div style={{ width: '100%', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem', alignItems: 'stretch' }}>
          <div className="tier-label tier-spotlight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Spotlight</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1.5rem', width: '100%' }}>
          {/* Today's Focus Widget - Cols 1-2 */}
          <div className="col-span-2 widget focus" onClick={() => expandPanel('focus')}>
            <div className="widget-header">
              <div className="widget-indicator" style={{ background: 'var(--electric-purple)' }}></div>
              <h3 className="widget-title">
                <svg className="ui-icon"><use href="#icon-focus"/></svg>
                <span className="ml-1">Today's Focus</span>
              </h3>
            </div>
            <div className="widget-content">
              <div 
                className="insight-card critical cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const matter = DEMO_CASES.find(c => c.case_name === 'Johnson v Johnson');
                  if (matter) {
                    setSelectedSummaryCard({
                      type: 'pleading',
                      id: 'johnson-tro-response',
                      data: {
                        title: 'TRO Response',
                        matter: matter.case_name,
                        client: 'Johnson',
                        court: matter.court,
                        deadline: matter.deadline,
                        description: 'Draft response to Temporary Restraining Order',
                        _demo: true,
                        _simulated: true,
                      },
                    });
                  }
                }}
              >
                <p className="insight-text"><strong>TRO Response - Johnson v Johnson</strong></p>
                <p className="insight-subtext">Wayne County • Due 5 PM tomorrow</p>
              </div>
              <div 
                className="insight-card info cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const matter = DEMO_CASES.find(c => c.case_name.includes('Hartley') || c.case_name.includes('Estate'));
                  if (matter) {
                    setSelectedSummaryCard({
                      type: 'pleading',
                      id: 'hartley-discovery',
                      data: {
                        title: 'Discovery Response',
                        matter: matter.case_name || 'Hartley Estate',
                        client: 'Hartley',
                        court: matter.court || 'Oakland County',
                        deadline: matter.deadline,
                        description: 'Discovery response document',
                        _demo: true,
                        _simulated: true,
                      },
                    });
                  }
                }}
              >
                <p className="insight-text">Discovery Response - Hartley Estate</p>
                <p className="insight-subtext">Oakland County • Due Friday</p>
              </div>
            </div>
          </div>

          {/* GoodCounsel Widget - Cols 3-4 (no permanent raise/glow) */}
          <div className="col-span-2 widget goodcounsel widget-spaced" onClick={() => expandPanel('goodcounsel')} style={{ boxShadow: 'none' }}>
            <div className="widget-header">
              <div className="widget-indicator" style={{ background: '#FFD700' }}></div>
              <h3 className="widget-title">
                <GoodCounselIcon size={20} className="ui-icon" />
                <span className="ml-1">GoodCounsel</span>
              </h3>
            </div>
            <div className="widget-content">
              <div className="insight-card positive">
                <p className="insight-text">
                  <svg className="ui-icon"><use href="#icon-lightbulb"/></svg>
                  {' '}No contact with James Hartley in 18 days
                </p>
                <p className="insight-subtext gold">Probate hearing Dec 14</p>
              </div>
              <div className="insight-card positive">
                <p className="insight-text">
                  <svg className="ui-icon"><use href="#icon-lightbulb"/></svg>
                  {' '}Take 10 minutes - Step outside for fresh air
                </p>
                <p className="insight-subtext">You've been focused for 2.5 hours</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Third Row: Active WIP with All WIP label */}
        <div style={{ width: '100%', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem', alignItems: 'stretch' }}>
          <div className="tier-label tier-all-wip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>All WIP</div>
          <div>
        <ActiveWIPRow
          onItemClick={(item, type) => {
            if (type === 'intake') {
              expandPanel('intake');
            } else if (type === 'processing') {
              if (item.status === 'drafting') {
                expandPanel('draft-prep');
              } else {
                expandPanel('analysis');
              }
            } else if (type === 'ready') {
              expandPanel('attorney-review');
            }
          }}
          onSummaryCardOpen={(type, id, data) => {
            setSelectedSummaryCard({ type, id, data });
          }}
        />
          </div>
        </div>

        {/* Bottom Row: Chronometric, MAE, and Library (glass overlay only) */}
        <div style={{ width: '100%', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ width: '100%', height: '100%' }}></div>
          <div style={{ display: 'grid', width: '100%', maxWidth: '100%', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem', boxSizing: 'border-box' }}>
          <div className="widget background-widget" onClick={() => expandPanel('chronometric')>
            <div className="widget-header">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="widget-title flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
                    <Clock className="widget-icon" style={{ width: '18px', height: '18px' }} />
                    <span className="ml-1">Chronometric</span>
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Reconstruct past time and fill billing gaps using email, calendar, and document activity.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="widget-content">
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Time tracking and analytics</p>
            </div>
          </div>
          <div className="widget background-widget" onClick={() => expandPanel('mae')>
            <div className="widget-header">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="widget-title flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
                    <div className="multi-agent-icon-group" style={{ width: '18px', height: '18px', position: 'relative' }}>
                      <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '0px', left: '0px', opacity: 0.5 }} />
                      <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '4px', left: '4px', opacity: 0.7 }} />
                      <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '8px', left: '8px', opacity: 0.9 }} />
                    </div>
                    <span className="ml-1">MAE (Multi-Agent Engine)</span>
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Coordinate multiple AI agents to run complex workflows (analyze, draft, critique, compare).
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="widget-content">
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Agent coordination and execution</p>
            </div>
          </div>
          <div className="widget background-widget">
            <a href="/library" className="block">
              <div className="widget-header">
                <h3 className="widget-title flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
                  <svg className="widget-icon" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="ml-1">Library</span>
                </h3>
              </div>
              <div className="widget-content">
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Rules, orders, templates, playbooks</p>
              </div>
            </a>
          </div>
          </div>
        </div>
      </div>

      {/* Testing Sidebar */}
      <TestingSidebar isOpen={testingSidebarOpen onClose={() => setTestingSidebarOpen(false)} />
      
      {/* Footer Banner */
      <FooterBanner />

      {/* Tracking Card Overlay */}
      {trackingCardOpen && (
        <div className="tracking-card-overlay" id="tracking-card-overlay" style={{ display: 'flex' }}>
          <div className="tracking-card">
            <div className="tracking-card-header">
              <h2 className="tracking-card-title" id="tracking-card-title">
                {trackingCardData?.title || 'Item Tracking'}
              </h2>
              <button className="close-tracking-card" onClick={closeTrackingCard}>×</button>
            </div>
            <div className="tracking-card-content" id="tracking-card-content">
              {/* Content populated by data */}
            </div>
          </div>
        </div>
      )}

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
      <AdminPanel 
        isOpen={panelOverlayOpen && currentPanel === 'admin'} 
        onClose={closePanel}
      />
      <SettingsPanel 
        isOpen={panelOverlayOpen && currentPanel === 'settings'} 
        onClose={closePanel}
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

      {/* Summary Card for clicked items */}
      {selectedSummaryCard && (
        <SummaryCard
          type={selectedSummaryCard.type as 'client' | 'matter' | 'pleading' | 'event'}
          id={selectedSummaryCard.id}
          title={selectedSummaryCard.data.title || selectedSummaryCard.data.case_name || selectedSummaryCard.data.name || 'Item'}
          subtitle={selectedSummaryCard.data.court || selectedSummaryCard.data.subtitle}
          description={selectedSummaryCard.data.description}
          metadata={{
            ...selectedSummaryCard.data,
            client: selectedSummaryCard.data.client,
            matter: selectedSummaryCard.data.matter || selectedSummaryCard.data.case_name,
            item: selectedSummaryCard.data.item,
            jurisdiction: selectedSummaryCard.data.jurisdiction,
            status: selectedSummaryCard.data.status,
            priority: selectedSummaryCard.data.priority,
            deadline: selectedSummaryCard.data.deadline,
            date: selectedSummaryCard.data.date,
          }}
          onClose={() => setSelectedSummaryCard(null)}
          onOpenInClio={() => {
            const matterId = selectedSummaryCard.data.matter || selectedSummaryCard.data.case_name || selectedSummaryCard.id;
            openInClio(matterId);
          }}
          onOpenInOutlook={() => {
            const messageId = selectedSummaryCard.id;
            openInEmail(messageId, 'outlook');
          }}
          onOpenInCalendar={() => {
            const eventId = selectedSummaryCard.id;
            openInCalendar(eventId, 'google');
          }}
        />
      )}
    </>
  );
}
