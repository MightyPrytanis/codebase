/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { Mail, Briefcase, Calendar, BookOpen, Settings, HelpCircle, User, CheckCircle2, AlertTriangle, X, Clock, Network, Menu } from "lucide-react";
import { LiaSwimmerSolid } from "react-icons/lia";
import { AIIcon } from "@/components/ui/ai-icon";
import { isDemoMode } from "@/lib/demo-service";
import { ThemeSelector } from "@/components/theme/theme-selector";
import HelpMenu from "@/components/dashboard/help-menu";
import "@/styles/dashboard-html.css";

interface HeaderProps {
  attorney?: {
    name: string;
    specialization?: string;
  };
  onAdminClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

export default function Header({ attorney, onAdminClick, onSettingsClick, onProfileClick }: HeaderProps) {
  const [currentSlogan, setCurrentSlogan] = useState("The Power of Clarity");
  const [demoMode, setDemoMode] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [menuPanelOpen, setMenuPanelOpen] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const slogans = [
    'The Power of Clarity',
    'See the Things that Matter', 
    'Intelligence + Insight = Illumination'
  ];

  useEffect(() => {
    let sloganIndex = 0;
    const interval = setInterval(() => {
      sloganIndex = (sloganIndex + 1) % slogans.length;
      setCurrentSlogan(slogans[sloganIndex]);
    }, 90000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDemoMode(isDemoMode());
    const handleStorageChange = () => {
      setDemoMode(isDemoMode());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const expandPanel = (panelType: string) => {
    const event = new CustomEvent('expand-panel', { detail: { panelType } });
    window.dispatchEvent(event);
  };

  const toggleDemoMode = () => {
    // This will be handled by the demo mode button/dialog
    const event = new CustomEvent('open-demo-mode-dialog');
    window.dispatchEvent(event);
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-container">
            <img 
              src="/assets/logo/lexfiat-logo-alt-b.png" 
              alt="LexFiat Logo" 
              className="logo-image"
            />
          </div>
          <div className="logo-text-container">
            <div className="logo-text">LexFiat</div>
            <div id="rotating-slogan" style={{ opacity: 1 }}>{currentSlogan}</div>
          </div>
        </div>
        
        <div className="header-right">
          {/* Status Indicators - Always Visible */}
          <div className="status-indicators-bar">
            <div className="status-indicator" onClick={() => expandPanel('gmail')}>
              <Mail className="status-icon" style={{ width: '18px', height: '18px' }} />
              <div className="status-name">Gmail</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <CheckCircle2 className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#10B981' }} />
              )}
            </div>
            <div className="status-indicator" onClick={() => expandPanel('ai-status')}>
              <AIIcon size={18} className="status-icon" color="rgba(255, 255, 255, 0.9)" />
              <div className="status-name">AI</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              )}
            </div>
            <div className="status-indicator" onClick={() => expandPanel('multi-agent')>
              <div className="multi-agent-icon-group">
                <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '0px', left: '0px', opacity: 0.5 }} />
                <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '4px', left: '4px', opacity: 0.7 }} />
                <LiaSwimmerSolid style={{ width: '14px', height: '14px', position: 'absolute', top: '8px', left: '8px', opacity: 0.9 }} />
              </div>
              <div className="status-name">Multi-agent</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <CheckCircle2 className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#10B981' }} />
              )}
            </div>
            <div className="status-indicator" onClick={() => expandPanel('clio')>
              <Briefcase className="status-icon" style={{ width: '18px', height: '18px' }} />
              <div className="status-name">Clio</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              )}
            </div>
            <div className="status-indicator" onClick={() => expandPanel('calendar')>
              <Calendar className="status-icon" style={{ width: '18px', height: '18px' }} />
              <div className="status-name">Calendar</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <CheckCircle2 className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#10B981' }} />
              )}
            </div>
            <div className="status-indicator" onClick={() => expandPanel('research')>
              <BookOpen className="status-icon" style={{ width: '18px', height: '18px' }} />
              <div className="status-name">Research</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              )}
            </div>
            <div className="status-indicator demo-status" onClick={toggleDemoMode}>
              <span className="demo-label">{demoMode ? 'DEMO' : 'Demo'}</span>
              <div className="status-name">Mode</div>
              {demoMode ? (
                <AlertTriangle className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              ) : (
                <CheckCircle2 className="status-indicator-icon" style={{ width: '12px', height: '12px', color: '#10B981' }} />
              )}
            </div>
          </div>

          {/* Menu Panel - Hamburger button with slide-out */}
          <div className="menu-panel-container">
            <button 
              className="menu-panel-toggle"
              onMouseEnter={() => setMenuPanelOpen(true)}
              onMouseLeave={() => setMenuPanelOpen(false)}
              onClick={() => setMenuPanelOpen(!menuPanelOpen)}
            >
              <Menu size={18} />
            </button>
            <div 
              className={`menu-panel-slideout ${menuPanelOpen ? 'open' : ''}`}
              onMouseEnter={() => setMenuPanelOpen(true)}
              onMouseLeave={() => setMenuPanelOpen(false)}
            >
              <div className="menu-panel-item" onClick={() => setShowHelpMenu(true)}>
                <HelpCircle size={18} />
                <span>Help</span>
              </div>
              {isAdminSync() && (
                <div className="menu-panel-item admin" onClick={() => { if (onAdminClick) onAdminClick(); else expandPanel('admin'); }}>
                  <Settings size={18} />
                  <span>Admin</span>
                </div>
              )
              <div className="menu-panel-item" onClick={() => { if (onSettingsClick) onSettingsClick(); else expandPanel('settings'); }>
                <Settings size={18} />
                <span>Settings</span>
              </div>
              <div className="menu-panel-item" onClick={() => { if (onProfileClick) onProfileClick(); else expandPanel('profile'); }>
                <User size={18} />
                <span>Profile</span>
              </div>
              <div className="menu-panel-divider"></div>
              <div className="menu-panel-item">
                <ThemeSelector />
              </div>
            </div>
          </div>

          <div className="avatar-section">
            <div className="avatar" onClick={() => { if (onProfileClick) onProfileClick(); else expandPanel('profile'); } title="Click to edit profile">
              <img 
                src="/assets/avatars/mekel-miller.jpg" 
                alt={attorney?.name || "Mekel S. Miller"}
              />
            </div>
            <div className="attorney-info">
              <div className="attorney-name">{attorney?.name || "Mekel S. Miller"}</div>
              <div className="attorney-title">{attorney?.specialization || "Family Law"}</div>
            </div>
          </div>
        </div>
      </div>
      {showHelpMenu && <HelpMenu onClose={() => setShowHelpMenu(false)} />}
    </div>
  ;
