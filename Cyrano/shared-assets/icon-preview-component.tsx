/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import {
  AIIcon,
  AIAnalysisIcon,
  AIInsightsIcon,
  CyranoIcon,
  ResearchIcon,
  GoodCounselIcon,
  BetaTestingIcon,
  LexFiatBrandIcon,
  ArkiverBrandIcon,
  PotemkinBrandIcon,
  MAEBrandIcon,
  AttorneyReviewIcon,
  FinalReviewIcon,
  FileAndServeIcon,
  ClientUpdateIcon,
  ProgressSummaryIcon,
  BillingTimeIcon,
  DocumentIntakeIcon,
  DraftPreparationIcon,
} from './icon-components';

interface IconPreviewItemProps {
  name: string;
  description: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  defaultColor?: string;
}

function IconPreviewItem({ name, description, IconComponent, defaultColor = '#D89B6A' }: IconPreviewItemProps) {
  return (
    <div className="icon-item">
      <div className="icon-display">
        <IconComponent size={64} color={defaultColor} />
        <div className="size-row">
          <span className="size-label">24px:</span>
          <IconComponent size={24} color={defaultColor} />
        </div>
        <div className="size-row">
          <span className="size-label">16px:</span>
          <IconComponent size={16} color={defaultColor} />
        </div>
      </div>
      <div className="icon-name">{name}</div>
      <div className="icon-description">{description}</div>
    </div>
  );
}

export default function IconPreview() {
  return (
    <div className="container">
      <h1>Cyrano Ecosystem Icons</h1>
      <p className="subtitle">Icon System Preview - Live Components</p>
      
      <div className="info-box">
        <strong>Note:</strong> Icons use lucide-react as the primary library, with other libraries (react-icons) used when specifically directed. This ensures consistency, scalability, and clarity at all sizes.
      </div>
      
      {/* Functional Icons */}
      <div className="section">
        <h2>Functional Icons</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>Shared icons used across all Cyrano apps</p>
        
        <div className="icon-grid">
          <IconPreviewItem
            name="Cyrano Copilot"
            description="Technorganic C-ring with HAL-inspired red eye (copilot/assistant)"
            IconComponent={CyranoIcon}
          />
          <IconPreviewItem
            name="AI Icon"
            description="HAL-inspired (red dot always red)"
            IconComponent={AIIcon}
          />
          <IconPreviewItem
            name="AI Analysis"
            description="Single Eye with always-red pupil (same as AI Insights)"
            IconComponent={AIAnalysisIcon}
          />
          <IconPreviewItem
            name="AI Insights"
            description="Single Eye with always-red pupil"
            IconComponent={AIInsightsIcon}
          />
          <IconPreviewItem
            name="GoodCounsel"
            description="Scale + Heart (both lucide-react)"
            IconComponent={GoodCounselIcon}
          />
          <IconPreviewItem
            name="Research"
            description="Archive + Search (game-icons:archive-research style, both lucide-react)"
            IconComponent={ResearchIcon}
          />
          <IconPreviewItem
            name="Beta Testing"
            description="Bug + β overlay"
            IconComponent={BetaTestingIcon}
          />
        </div>
      </div>
      
      {/* Brand Icons */}
      <div className="section">
        <h2>Brand Icons (Simplified for Menus/Navigation)</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>Based on lucide-react icons - simplified versions of app logos</p>
        
        <div className="icon-grid">
          <IconPreviewItem
            name="LexFiat"
            description="Lightbulb (filled) + Scale (negative space)"
            IconComponent={LexFiatBrandIcon}
          />
          <IconPreviewItem
            name="Arkiver"
            description="Moon (line-md:moon-alt-loop) + Feather (mdi:feather style, both lucide-react)"
            IconComponent={ArkiverBrandIcon}
          />
          <IconPreviewItem
            name="Potemkin"
            description="Layers (lucide-react only)"
            IconComponent={PotemkinBrandIcon}
            defaultColor="#5B8FA3"
          />
          <IconPreviewItem
            name="MAE"
            description="bx:swim ONLY (react-icons)"
            IconComponent={MAEBrandIcon}
            defaultColor="#60A5FA"
          />
        </div>
      </div>
      
      {/* Standard Lucide Icons */}
      <div className="section">
        <h2>Standard Icons (Direct from lucide-react)</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>These are used directly from lucide-react with no modifications</p>
        
        <div className="icon-grid">
          <IconPreviewItem
            name="Attorney Review"
            description="ClipboardCheck"
            IconComponent={AttorneyReviewIcon}
          />
          <IconPreviewItem
            name="Final Review"
            description="SearchCheck"
            IconComponent={FinalReviewIcon}
          />
          <IconPreviewItem
            name="File and Serve"
            description="Send"
            IconComponent={FileAndServeIcon}
          />
          <IconPreviewItem
            name="Client Update"
            description="MessageSquare"
            IconComponent={ClientUpdateIcon}
          />
          <IconPreviewItem
            name="Progress Summary"
            description="TrendingUp"
            IconComponent={ProgressSummaryIcon}
          />
          <IconPreviewItem
            name="Billing/Time"
            description="Clock + DollarSign"
            IconComponent={BillingTimeIcon}
          />
          <IconPreviewItem
            name="Document Intake"
            description="Inbox"
            IconComponent={DocumentIntakeIcon}
          />
          <IconPreviewItem
            name="Draft Preparation"
            description="PenTool"
            IconComponent={DraftPreparationIcon}
          />
        </div>
      </div>
      
      <div className="section">
        <h2>Implementation Notes</h2>
        <div style={{ color: '#888' }}>
          <p><strong>Icon system implementation:</strong></p>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Simple, scalable, and consistent design</li>
            <li>Works perfectly at 16px, 24px, 32px, and larger</li>
            <li>Minimal custom overlays only where needed (heart, β, sparkles, etc.)</li>
            <li>MAE icon is bx:swim (BiSwim from react-icons) - swim icon only</li>
            <li>Brand icons use appropriate icon libraries as specified</li>
          </ul>
          <p style={{ marginTop: '15px' }}><strong>AI Icon Red Dot:</strong> Always #DC2626 (red) regardless of outer color</p>
        </div>
      </div>
    </div>
  );
}

