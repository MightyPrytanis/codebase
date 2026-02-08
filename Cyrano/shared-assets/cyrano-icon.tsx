/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';

interface CyranoIconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /**
   * Color for the outer rectangle and circle (defaults to currentColor)
   * The center dot will always be red (#DC2626) to match HAL 9000
   */
  color?: string;
}

/**
 * Cyrano Copilot Icon - HAL-style with "C" Opening
 * 
 * Based on the original HAL icon but with a break at the 3 o'clock position
 * in both the circle and the rectangle, creating a "C" shape that echoes
 * the Cognisint logo.
 * 
 * The break allows negative space to connect from inside (between red dot
 * and circle) to the outside of the icon.
 * 
 * Usage: Copilot/assistant/chat entry points in LexFiat and Arkiver
 */
export function CyranoIcon({ 
  className = '', 
  size = 24, 
  style,
  color
}: CyranoIconProps) {
  const outerColor = color || 'currentColor';
  
  // Using the same proportions as the original HAL icon
  // Rectangle: 10×18 units in a 24×24 viewBox
  // Circle: radius 4, centered at (12, 12)
  // Red dot: radius 1.6
  
  // Helper to describe an arc path with a gap
  // Circle will have a break at 3 o'clock position (right side)
  // This creates the "C" shape opening on the right
  const describeCircleWithGap = () => {
    const cx = 12;
    const cy = 12;
    const r = 4;
    
    // Gap centered at 3 o'clock (0° in standard math, right side)
    // Gap from -30° to +30° (or 330° to 30°)
    // This means the arc goes from 30° all the way around to 330° (the long way - forming the C)
    const startAngle = 30;   // Bottom of gap (4 o'clock position) 
    const endAngle = 330;     // Top of gap (2 o'clock position)
    
    // Convert angles to radians and calculate points
    // Note: In SVG, Y increases downward, so we adjust accordingly
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    // Create arc going the long way (forming the C - left side of circle)
    // Large arc flag = 1 means take the longer arc
    return `M ${x1},${y1} A ${r},${r} 0 1,1 ${x2},${y2}`;
  };
  
  // Helper to describe rectangle with gap on right side
  const describeRectWithGap = () => {
    const rectX = 7;
    const rectY = 3;
    const rectWidth = 10;
    const rectHeight = 18;
    const rx = 2.5; // corner radius
    
    // Rectangle center is at (12, 12)
    // Gap should be at 3 o'clock position (right side, middle)
    // Let's create a gap from y=10 to y=14 (approximately)
    const gapTop = 10;
    const gapBottom = 14;
    const rightX = rectX + rectWidth;
    
    // Start from top-left, go clockwise, but skip the gap on the right side
    // Note: No Z (close path) command at the end - we want an open path with the gap
    return `
      M ${rectX + rx},${rectY}
      L ${rightX - rx},${rectY}
      Q ${rightX},${rectY} ${rightX},${rectY + rx}
      L ${rightX},${gapTop}
      M ${rightX},${gapBottom}
      L ${rightX},${rectY + rectHeight - rx}
      Q ${rightX},${rectY + rectHeight} ${rightX - rx},${rectY + rectHeight}
      L ${rectX + rx},${rectY + rectHeight}
      Q ${rectX},${rectY + rectHeight} ${rectX},${rectY + rectHeight - rx}
      L ${rectX},${rectY + rx}
      Q ${rectX},${rectY} ${rectX + rx},${rectY}
    `;
  };
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* HAL-inspired icon with C-shaped opening at 3 o'clock position */}
      
      {/* Rectangle with gap on right side */}
      <path
        d={describeRectWithGap()}
        fill="none"
        stroke={outerColor}
        strokeWidth="2"
      />
      
      {/* Circle with gap on right side (3 o'clock position) */}
      <path
        d={describeCircleWithGap()}
        fill="none"
        stroke={outerColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Red dot - always red to match HAL 9000, same small size as original */}
      <circle
        cx="12"
        cy="12"
        r="1.6"
        fill="#DC2626"
      />
    </svg>
  );
}

export default CyranoIcon;