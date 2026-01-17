/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import "@/styles/dashboard-html.css";

interface ExpandedPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function ExpandedPanel({ 
  title, 
  isOpen, 
  onClose, 
  children,
  className = "" 
}: ExpandedPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="panel-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`expanded-panel ${className}`}>
        <div className="expanded-panel-header">
          <h2 className="expanded-panel-title">{title}</h2>
          <button className="close-btn" onClick={onClose}>✕ Close</button>
        </div>
        <div className="expanded-panel-content">
          {children}
        </div>
      </div>
    </div>
  );
