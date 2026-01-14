/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import {
  BookOpen,
  Scale,
  Search,
  Bug,
  Sparkles,
  Lightbulb,
  Moon,
  Star,
  Feather,
  Waves,
  Layers,
  ClipboardCheck,
  SearchCheck,
  Send,
  MessageSquare,
  TrendingUp,
  Clock,
  DollarSign,
  Eye,
  Archive,
  FileText,
  Inbox,
  PenTool,
  CheckCircle,
  Heart,
  Square,
} from 'lucide-react';
import { BiSwim } from 'react-icons/bi';
import { Icon } from '@iconify/react';
import { AIIcon } from './ai-icon';
import { AIInsightsIcon } from './ai-insights-icon';
import { AIAnalysisIcon } from './ai-analysis-icon';
import { CyranoIcon } from './cyrano-icon';

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  color?: string;
}

/**
 * Research Icon - Archive + Search (game-icons:archive-research style)
 * Uses Archive as base with Search overlay - both from lucide-react
 */
export function ResearchIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <Archive size={size} color={iconColor} strokeWidth={2} fill={iconColor} fillOpacity={0.1} />
      <div style={{ position: 'absolute', right: -2, top: -2 }}>
        <Search size={size * 0.6} color={iconColor} strokeWidth={2.5} />
      </div>
    </div>
  );
}

/**
 * GoodCounsel Icon - TEMPORARY: Using mdi:hand-heart-outline from Material Design Icons
 * TODO: Replace with permanent icon design
 */
export function GoodCounselIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <Icon
      icon="mdi:hand-heart-outline"
      className={className}
      width={size}
      height={size}
      style={{ color: iconColor, ...style }}
    />
  );
}

/**
 * Beta Testing Icon - Bug with β overlay
 */
export function BetaTestingIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <Bug size={size} color={iconColor} strokeWidth={2} />
      {/* β symbol overlay */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: iconColor,
          pointerEvents: 'none',
        }}
      >
        β
      </div>
    </div>
  );
}

/**
 * AI Analysis Icon - Same as AI Insights (single eye with red pupil)
 * Re-exported from ai-analysis-icon.tsx
 */
export { AIAnalysisIcon } from './ai-analysis-icon';

/**
 * LexFiat Brand Icon - Fusion of Lightbulb (filled) + Scale (negative space overlay)
 * Lightbulb filled with Scale as negative space overlay for better legibility
 */
export function LexFiatBrandIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Lightbulb - filled */}
      <Lightbulb size={size} color={iconColor} strokeWidth={2} fill={iconColor} fillOpacity={0.2} />
      {/* Scale - negative space overlay */}
      <div style={{ 
        position: 'absolute', 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)',
        opacity: 0.8
      }}>
        <Scale size={size * 0.7} color={iconColor} strokeWidth={1.5} />
      </div>
    </div>
  );
}

/**
 * Arkiver Brand Icon - Moon (line-md:moon-alt-loop style) + Feather (mdi:feather style)
 * Moon with filled background for loop effect, combined with Feather overlay
 * Both from lucide-react, using filled + outline technique for negative space effect
 */
export function ArkiverBrandIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', width: size, height: size, ...style }}>
      {/* Moon (line-md:moon-alt-loop style) - filled for loop effect */}
      <Moon 
        size={size * 0.8} 
        color={iconColor} 
        strokeWidth={2} 
        fill={iconColor} 
        fillOpacity={0.3}
        style={{ position: 'absolute', left: 0, top: size * 0.1 }} 
      />
      {/* Feather (mdi:feather style) - using filled in background color for negative space effect */}
      <Feather 
        size={size * 0.7} 
        color={iconColor} 
        strokeWidth={2}
        fill={iconColor}
        fillOpacity={0.15}
        style={{ position: 'absolute', right: 0, top: size * 0.15 }} 
      />
    </div>
  );

/**
 * MAE Brand Icon - bx:swim ONLY (BiSwim from react-icons)
 */
export function MAEBrandIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <BiSwim 
      className={className}
      size={size}
      style={{ color: iconColor, ...style }}
    />
  );
}

/**
 * Potemkin Brand Icon - Layers (lucide-react only)
 * Using Layers icon from lucide-react
 */
export function PotemkinBrandIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return <Layers className={className} size={size} color={iconColor} strokeWidth={2} style={style} />;
}

/**
 * Standard icons - direct exports from lucide-react
 */
export {
  ClipboardCheck as AttorneyReviewIcon,
  SearchCheck as FinalReviewIcon,
  Send as FileAndServeIcon,
  MessageSquare as ClientUpdateIcon,
  TrendingUp as ProgressSummaryIcon,
};

/**
 * AI Icon - HAL-inspired
 */
export { AIIcon };

/**
 * AI Insights Icon - Single Eye with Always-Red Pupil
 */
export { AIInsightsIcon };

/**
 * Cyrano Icon - Technorganic "C" Ring with HAL-inspired red eye
 */
export { CyranoIcon };

/**
 * Workflow Stage Icons
 */
export {
  Inbox as DocumentIntakeIcon,
  PenTool as DraftPreparationIcon,
};

/**
 * Billing/Time Icon - Clock with DollarSign overlay
 */
export function BillingTimeIcon({ className = '', size = 24, style, color }: IconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <Clock size={size} color={iconColor} strokeWidth={2} />
      <div style={{ position: 'absolute', right: -2, bottom: -2 }}>
        <DollarSign size={size * 0.5} color={iconColor} strokeWidth={2.5} />
      </div>
    </div>
  );
}


}
)
}
}