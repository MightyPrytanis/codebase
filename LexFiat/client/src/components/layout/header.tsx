/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { Mail, Scale, Calendar, BookOpen, Settings, HelpCircle, User } from "lucide-react";
import { AIIcon } from "@/components/ui/ai-icon";
import { isDemoMode } from "@/lib/demo-service";
import "@/styles/dashboard-html.css";

interface HeaderProps {
  attorney?: {
    name: string;
    specialization?: string;
  };
}

export default function Header({ attorney }: HeaderProps) {
  const [currentSlogan, setCurrentSlogan] = useState("The Power of Clarity");
  const [demoMode, setDemoMode] = useState(false);
  
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
    // TODO: Implement panel expansion
    console.log('Expand panel:', panelType);
  };

  const openHelpChat = () => {
    // TODO: Implement help chat
    console.log('Open help chat');
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
          {/* Compact Status Strip - Centered */}
          <div className="status-strip">
            <div className="status-item" onClick={() => expandPanel('gmail')} title="Gmail">
              <div className="status-dot success"></div>
              <Mail className="status-icon" size={14} />
            </div>
            <div className="status-item" onClick={() => expandPanel('ai-status')} title="AI Status">
              <div className="status-dot processing"></div>
              <AIIcon size={14} className="status-icon" color="rgba(255, 255, 255, 0.8)" />
            </div>
            <div className="status-item" onClick={() => expandPanel('clio')} title="Clio">
              <div className="status-dot warning"></div>
              <Scale className="status-icon" size={14} />
            </div>
            <div className="status-item" onClick={() => expandPanel('calendar')} title="Calendar">
              <div className="status-dot success"></div>
              <Calendar className="status-icon" size={14} />
            </div>
            <div className="status-item" onClick={() => expandPanel('research')} title="Research">
              <div className="status-dot warning"></div>
              <BookOpen className="status-icon" size={14} />
            </div>
            <div className="status-item demo-status" onClick={toggleDemoMode} title={demoMode ? "Demo Mode Active" : "Demo Mode"}>
              <div className={`status-dot ${demoMode ? 'processing' : ''}`}></div>
              <span className="demo-label">{demoMode ? 'DEMO' : 'Demo'}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn" onClick={openHelpChat}>
              <HelpCircle size={16} />
              <span>Help</span>
            </button>
            <button className="action-btn admin" onClick={() => expandPanel('admin')}>
              <Settings size={16} />
              <span>Admin</span>
            </button>
            <button className="action-btn" onClick={() => expandPanel('settings')}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>

          <div className="avatar-section">
            <div className="avatar" onClick={() => expandPanel('profile')} title="Click to edit profile">
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
    </div>
  );
}
