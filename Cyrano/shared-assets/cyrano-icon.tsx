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
   * Interaction state of the icon
   * - idle: static display
   * - active: thinking/executing animation
   * - alert: attention/error state
   */
  state?: 'idle' | 'active' | 'alert';
}

/**
 * Cyrano Copilot Icon - Technorganic "C" Ring
 * 
 * A HAL-style icon with a central red eye surrounded by a C-shaped technorganic ring.
 * The ring combines organic (neural) elements on the left with tech (circuit) elements on the right,
 * echoing the Cognisint logo's dual nature.
 * 
 * Usage: Copilot/assistant/chat entry points in LexFiat and Arkiver
 */
export function CyranoIcon({ 
  className = '', 
  size = 24, 
  style,
  state = 'idle'
}: CyranoIconProps) {
  // Calculate dimensions based on size
  const panelWidth = size;
  const panelHeight = size * 1.5; // Tall rounded rectangle
  const cornerRadius = panelWidth * 0.22; // ~20-25% of panel width
  
  const eyeRadius = panelWidth * 0.20; // ~18-22% of panel width
  const eyeCenterX = panelWidth / 2;
  const eyeCenterY = panelHeight * 0.48; // Slightly above vertical midpoint
  
  const glowRadius = eyeRadius * 1.5;
  
  const ringOuterRadius = eyeRadius * 1.8;
  const ringThickness = eyeRadius * 0.4;
  const ringInnerRadius = ringOuterRadius - ringThickness;
  
  // C-ring opening: 60-90° gap on the right
  const openingAngle = 75; // degrees
  const startAngle = -180 + openingAngle / 2; // Start angle (left side)
  const endAngle = 180 - openingAngle / 2; // End angle (right side)
  
  // Helper function to convert polar to cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleDegrees: number) => {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleRadians)),
      y: centerY + (radius * Math.sin(angleRadians))
    };
  };
  
  // Helper function to create arc path
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };
  
  // Create C-ring path (donut with opening)
  const outerArc = describeArc(eyeCenterX, eyeCenterY, ringOuterRadius, startAngle, endAngle);
  const innerArc = describeArc(eyeCenterX, eyeCenterY, ringInnerRadius, startAngle, endAngle);
  
  // Split point (approximately 330° for left half, remaining for right half)
  const splitAngle = -30; // degrees
  
  // Organic branches (left half)
  const organicBranches = [
    { angle: -150, length: ringThickness * 0.7 },
    { angle: -120, length: ringThickness * 0.6 },
    { angle: -90, length: ringThickness * 0.8 },
    { angle: -60, length: ringThickness * 0.65 },
    { angle: -30, length: ringThickness * 0.7 },
  ];
  
  // Circuit traces (right half)
  const circuitTraces = [
    { angle: 30, length: ringThickness * 0.5 },
    { angle: 60, length: ringThickness * 0.6 },
    { angle: 90, length: ringThickness * 0.55 },
    { angle: 120, length: ringThickness * 0.5 },
  ];
  
  const padRadius = Math.max(1.5, size * 0.06);
  
  // Animation styles
  const glowAnimation = state === 'idle' ? {
    animation: 'cyrano-pulse 2.5s ease-in-out infinite'
  } : {};
  
  const alertColor = state === 'alert' ? 'var(--cyrano-alert-amber)' : undefined;
  
  return (
    <>
      <style>
        {`
          :root {
            --cyrano-panel-bg: #0D1117;
            --cyrano-panel-border: #1A1F24;
            --cyrano-eye-core: #D62323;
            --cyrano-eye-glow: #FF5555;
            --cyrano-organic-base: #0D1A1A;
            --cyrano-organic-branch: #9BD3C7;
            --cyrano-tech-base: #96B9AE;
            --cyrano-tech-trace: #CFE7DF;
            --cyrano-tech-pad: #E5F3EE;
            --cyrano-alert-amber: #FFB347;
          }
          
          @keyframes cyrano-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.85; }
          }
        `}
      </style>
      <svg
        width={panelWidth}
        height={panelHeight}
        viewBox={`0 0 ${panelWidth} ${panelHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>
          {/* Glow gradient for eye */}
          <radialGradient id={`cyrano-eye-glow-${size}`}>
            <stop offset="0%" stopColor="var(--cyrano-eye-glow)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--cyrano-eye-glow)" stopOpacity="0" />
          </radialGradient>
          
          {/* Clip path for left half (organic) */}
          <clipPath id={`cyrano-left-clip-${size}`}>
            <path d={`
              M ${eyeCenterX} ${eyeCenterY}
              L ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, startAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, startAngle).y}
              A ${ringOuterRadius * 2} ${ringOuterRadius * 2} 0 0 1 ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, splitAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, splitAngle).y}
              Z
            `} />
          </clipPath>
          
          {/* Clip path for right half (tech) */}
          <clipPath id={`cyrano-right-clip-${size}`}>
            <path d={`
              M ${eyeCenterX} ${eyeCenterY}
              L ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, splitAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, splitAngle).y}
              A ${ringOuterRadius * 2} ${ringOuterRadius * 2} 0 0 1 ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, endAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius * 2, endAngle).y}
              Z
            `} />
          </clipPath>
        </defs>
        
        {/* Base panel */}
        <rect
          x="0"
          y="0"
          width={panelWidth}
          height={panelHeight}
          rx={cornerRadius}
          fill="var(--cyrano-panel-bg)"
          stroke="var(--cyrano-panel-border)"
          strokeWidth={Math.max(1, panelWidth * 0.04)}
        />
        
        {/* Eye glow */}
        <circle
          cx={eyeCenterX}
          cy={eyeCenterY}
          r={glowRadius}
          fill={`url(#cyrano-eye-glow-${size})`}
          style={glowAnimation}
        />
        
        {/* C-ring base - left half (organic) */}
        <g clipPath={`url(#cyrano-left-clip-${size})`}>
          <path
            d={`
              ${outerArc}
              L ${polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius, startAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius, startAngle).y}
              ${innerArc.replace('M', 'L')}
              Z
            `}
            fill={alertColor || "var(--cyrano-organic-base)"}
          />
        </g>
        
        {/* C-ring base - right half (tech) */}
        <g clipPath={`url(#cyrano-right-clip-${size})`}>
          <path
            d={`
              ${outerArc}
              L ${polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius, startAngle).x} ${polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius, startAngle).y}
              ${innerArc.replace('M', 'L')}
              Z
            `}
            fill={alertColor || "var(--cyrano-tech-base)"}
          />
        </g>
        
        {/* Organic branches (left half) */}
        {organicBranches.map((branch, i) => {
          const startPoint = polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius, branch.angle);
          const endPoint = polarToCartesian(eyeCenterX, eyeCenterY, ringInnerRadius - branch.length, branch.angle);
          return (
            <line
              key={`branch-${i}`}
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="var(--cyrano-organic-branch)"
              strokeWidth={Math.max(0.5, size * 0.02)}
              strokeLinecap="round"
              opacity={state === 'active' ? 0.9 : 0.75}
            />
          );
        })}
        
        {/* Circuit traces (right half) */}
        {circuitTraces.map((trace, i) => {
          const startPoint = polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius, trace.angle);
          const endPoint = polarToCartesian(eyeCenterX, eyeCenterY, ringOuterRadius + trace.length, trace.angle);
          return (
            <g key={`trace-${i}`}>
              <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="var(--cyrano-tech-trace)"
                strokeWidth={Math.max(0.5, size * 0.02)}
                strokeLinecap="round"
                opacity={state === 'active' ? 0.9 : 0.8}
              />
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r={padRadius}
                fill="var(--cyrano-tech-pad)"
                opacity={state === 'active' ? 1 : 0.9}
              />
            </g>
          );
        })}
        
        {/* Central eye core (always red) */}
        <circle
          cx={eyeCenterX}
          cy={eyeCenterY}
          r={eyeRadius}
          fill="var(--cyrano-eye-core)"
        />
      </svg>
    </>
  );
}
