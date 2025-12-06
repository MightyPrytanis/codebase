/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect, useRef } from "react";
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
import HelpChatPanel from "@/components/dashboard/help-chat-panel";
import WorkflowStageItem from "@/components/dashboard/workflow-stage-item";
import { WorkflowStatusPanels } from "@/components/dashboard/workflow-status-panels";
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

export default function Dashboard() {
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false);
  const [panelOverlayOpen, setPanelOverlayOpen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<string | null>(null);
  const [trackingCardOpen, setTrackingCardOpen] = useState(false);
  const [trackingCardData, setTrackingCardData] = useState<any>(null);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
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

  const openHelpChat = () => {
    setHelpChatOpen(true);
  };

  useEffect(() => {
    const handleOpenHelpChat = () => setHelpChatOpen(true);
    window.addEventListener('open-help-chat', handleOpenHelpChat);
    return () => window.removeEventListener('open-help-chat', handleOpenHelpChat);
  }, []);

  const closeHelpChat = () => {
    setHelpChatOpen(false);
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
      <Header attorney={{ name: "Mekel S. Miller", specialization: "Family Law" }} />
      
      <div className="main-content">
        {/* Priority Status Ticker Widget */}
        <div className="widget priority-ticker" id="priority-ticker-widget">
          <div className="widget-header">
            <div className="widget-indicator" style={{ background: '#ef4444' }}></div>
            <h3 className="widget-title">
              <svg className="ui-icon"><use href="#icon-priority"/></svg>
              Priority Alerts
            </h3>
            <div className="widget-controls">
              <button className="widget-toggle" title="Toggle widget">−</button>
              <button className="widget-resize" title="Resize widget">⤢</button>
            </div>
          </div>
          <div className="widget-content">
            <div className="ticker-content" id="ticker-content">
              {tickerItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`ticker-item ${item.priority} ${index === currentTickerIndex ? 'active' : ''}`}
                  onClick={() => openTrackingCard(item.id)}
                >
                  <span className="alert-icon">
                    <svg className="ui-icon"><use href="#icon-alert"/></svg>
                  </span>
                  <span className="alert-text">{item.text}</span>
                  <span className="alert-time">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Widgets - Above Workflow */}
        <div className="widgets-grid">
          {/* Today's Focus Widget - Left (wider) */}
          <div className="widget focus" onClick={() => expandPanel('focus')}>
            <div className="widget-header">
              <div className="widget-indicator" style={{ background: 'var(--electric-purple)' }}></div>
              <h3 className="widget-title">
                <svg className="ui-icon"><use href="#icon-focus"/></svg>
                Today's Focus
              </h3>
            </div>
            <div className="widget-content">
              <div className="insight-card critical">
                <p className="insight-text"><strong>TRO Response - Johnson v Johnson</strong></p>
                <p className="insight-subtext">Wayne County • Due 5 PM tomorrow</p>
              </div>
              <div className="insight-card info">
                <p className="insight-text">Discovery Response - Hartley Estate</p>
                <p className="insight-subtext">Oakland County • Due Friday</p>
              </div>
            </div>
          </div>

          {/* GoodCounsel Widget - Center (wider) - METALLIC GOLD */}
          <div className="widget goodcounsel" onClick={() => expandPanel('goodcounsel')}>
            <div className="widget-header">
              <div className="widget-indicator" style={{ background: '#FFD700' }}></div>
              <h3 className="widget-title">
                <GoodCounselIcon size={20} className="ui-icon" />
                GoodCounsel
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

          {/* Beta Testing Widget removed - now using slide-out sidebar */}
        </div>

        {/* Workflow Status Panels - Three Large Panels */}
        <WorkflowStatusPanels
          onActionClick={(action, type) => {
            // Handle panel clicks - can expand to specific panels or filter views
            if (type === "incoming") {
              if (action === "respond") expandPanel("intake");
              else if (action === "review_for_response" || action === "review_and_fwd") expandPanel("analysis");
              else if (action === "read_fyi") expandPanel("intake");
              else expandPanel("intake");
            } else if (type === "in_progress") {
              if (action === "drafts_in_progress") expandPanel("draft-prep");
              else if (action === "items_waiting_review") expandPanel("attorney-review");
              else expandPanel("draft-prep");
            } else if (type === "ready") {
              if (action === "drafts_ready") expandPanel("draft-prep");
              else if (action === "reviews_pending") expandPanel("attorney-review");
              else expandPanel("draft-prep");
            }
          }}
        />
      </div>

      {/* Testing Sidebar */}
      <TestingSidebar isOpen={testingSidebarOpen} onClose={() => setTestingSidebarOpen(false)} />
      
      {/* Footer Banner */}
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

      {/* Help Chat Panel - Slide out from left */}
      <HelpChatPanel isOpen={helpChatOpen} onClose={closeHelpChat} />

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
    </>
  );
}
