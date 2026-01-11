/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import { AIIcon as SharedAIIcon } from '@cyrano/shared-assets/ai-icon';

interface AIIconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /**
   * Color for the outer rectangle and circle (defaults to currentColor)
   * The center dot will always be red to match HAL 9000
   */
  color?: string;
}

/**
 * HAL-inspired AI Icon
 * A rectangle taller than wide, with a circular "eye" and a red dot in the center
 * Based on HAL 9000's red eye from 2001: A Space Odyssey
 * 
 * This is a wrapper around the shared AI icon component to maintain consistency
 * across the Cyrano ecosystem.
 */
export function AIIcon({ className = '', size = 24, style, color }: AIIconProps) {
  // Extract color from style if provided
  const iconColor = color || (style?.color as string) || undefined;
  
  return (
    <SharedAIIcon 
      className={className}
      size={size}
      style={style}
      color={iconColor}
    />
  );
}


}
)
}
)