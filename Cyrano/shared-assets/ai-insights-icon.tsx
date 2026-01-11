/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import { Eye } from 'lucide-react';

interface AIInsightsIconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /**
   * Color for the eye (defaults to currentColor)
   * The pupil will always be red (#DC2626)
   */
  color?: string;
}

/**
 * AI Insights Icon - Single Eye with Always-Red Pupil
 * Based on material-symbols:eye-tracking-outline-sharp style
 * The pupil is always red to maintain consistency with HAL homage
 */
export function AIInsightsIcon({ 
  className = '', 
  size = 24, 
  style,
  color 
}: AIInsightsIconProps) {
  const iconColor = color || (style?.color as string) || 'currentColor';
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <Eye size={size} color={iconColor} strokeWidth={2} />
      {/* Red pupil - always red */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r={size * 0.15} fill="#DC2626" />
        </svg>
      </div>
    </div>
  );


}