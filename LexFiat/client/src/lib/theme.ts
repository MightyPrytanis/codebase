/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Theme System for LexFiat
 * Supports multiple themes with consistent token-based styling
 */

export type ThemeName = 'light' | 'control-room' | 'ad-astra';

export interface ThemeTokens {
  // Colors
  colors: {
    primary: {
      light: string;
      dark: string;
      mid: string;
    };
    secondary: string;
    accent: {
      gold: string;
      blue: string;
      green: string;
      orange: string;
      purple: string;
    };
    status: {
      success: string;
      warning: string;
      critical: string;
      processing: string;
    };
    background: {
      base: string;
      panel: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: {
      default: string;
      panel: string;
      accent: string;
    };
  };
  
  // Glass effects
  glass: {
    blur: string;
    saturation: string;
    opacity: {
      panel: string;
      overlay: string;
    };
  };
  
  // Typography
  typography: {
    fontFamily: {
      primary: string;
      heading: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  // Border radius (always 0 for primary panels)
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
  };
  
  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

/**
 * Light Theme - Modern, lighter aesthetic
 */
export const lightTheme: ThemeTokens = {
  colors: {
    primary: {
      light: '#F8FAFC',
      dark: '#1E293B',
      mid: '#475569',
    },
    secondary: '#64748B',
    accent: {
      gold: '#D4AF37',
      blue: '#3B82F6',
      green: '#10B981',
      orange: '#F59E0B',
      purple: '#A855F7',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444',
      processing: '#3B82F6',
    },
    background: {
      base: '#F8FAFC',
      panel: 'rgba(255, 255, 255, 0.7)',
      overlay: 'rgba(0, 0, 0, 0.3)',
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
      muted: '#94A3B8',
    },
    border: {
      default: 'rgba(148, 163, 184, 0.3)',
      panel: 'rgba(148, 163, 184, 0.2)',
      accent: 'rgba(212, 175, 55, 0.4)',
    },
  },
  glass: {
    blur: 'blur(20px) saturate(120%)',
    saturation: '120%',
    opacity: {
      panel: '0.7',
      overlay: '0.3',
    },
  },
  typography: {
    fontFamily: {
      primary: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      heading: "'DIN Next', 'DINNext LT Pro', 'DINNextLTPro', 'DIN 2014', 'D-DIN', 'DIN', 'Helvetica Neue', Arial, sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
};

/**
 * Control Room Theme - Dark, saturated aesthetic (current default)
 */
export const controlRoomTheme: ThemeTokens = {
  colors: {
    primary: {
      light: '#1E3A5F',
      dark: '#0A1A2A',
      mid: '#2C5282',
    },
    secondary: '#94A3B8',
    accent: {
      gold: '#D4AF37',
      blue: '#3B82F6',
      green: '#10B981',
      orange: '#F59E0B',
      purple: '#A855F7',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444',
      processing: '#3B82F6',
    },
    background: {
      base: '#2a2e35',
      panel: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.6)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      muted: '#64748B',
    },
    border: {
      default: 'rgba(148, 163, 184, 0.2)',
      panel: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(212, 175, 55, 0.4)',
    },
  },
  glass: {
    blur: 'blur(20px) saturate(120%)',
    saturation: '120%',
    opacity: {
      panel: '0.08',
      overlay: '0.6',
    },
  },
  typography: {
    fontFamily: {
      primary: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      heading: "'DIN Next', 'DINNext LT Pro', 'DINNextLTPro', 'DIN 2014', 'D-DIN', 'DIN', 'Helvetica Neue', Arial, sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 20px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 30px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
  },
};

/**
 * Ad Astra Theme - LCARS-inspired Star Trek aesthetic
 * Black backgrounds, orange accents, distinctive rounded panels
 */
export const adAstraTheme: ThemeTokens = {
  colors: {
    primary: {
      light: '#1a1a1a',
      dark: '#000000',
      mid: '#333333',
    },
    secondary: '#666666',
    accent: {
      gold: '#FFCC00',
      blue: '#0099FF',
      green: '#00FF99',
      orange: '#FF9900',
      purple: '#9966FF',
    },
    status: {
      success: '#00FF99',
      warning: '#FFCC00',
      critical: '#FF3300',
      processing: '#0099FF',
    },
    background: {
      base: '#000000',
      panel: 'rgba(255, 153, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.9)',
    },
    text: {
      primary: '#FFCC00',
      secondary: '#FF9900',
      muted: '#996633',
    },
    border: {
      default: '#FF9900',
      panel: '#FFCC00',
      accent: '#FFCC00',
    },
  },
  glass: {
    blur: 'blur(10px) saturate(100%)',
    saturation: '100%',
    opacity: {
      panel: '0.1',
      overlay: '0.9',
    },
  },
  typography: {
    fontFamily: {
      primary: "'Helvetica Neue', 'Arial Narrow', 'Arial', sans-serif",
      heading: "'Helvetica Neue Condensed', 'Arial Narrow', 'Helvetica', sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
  },
  shadows: {
    sm: '0 2px 4px rgba(255, 153, 0, 0.3)',
    md: '0 4px 20px rgba(255, 153, 0, 0.4)',
    lg: '0 10px 30px rgba(255, 153, 0, 0.5)',
    xl: '0 20px 40px rgba(255, 153, 0, 0.6)',
  },
};

/**
 * Theme registry
 */
export const themes: Record<ThemeName, ThemeTokens> = {
  light: lightTheme,
  'control-room': controlRoomTheme,
  'ad-astra': adAstraTheme,
};

/**
 * Get current theme
 */
export function getTheme(name: ThemeName = 'control-room'): ThemeTokens {
  return themes[name] || controlRoomTheme;
}

/**
 * Get theme CSS variables
 */
export function getThemeCSSVariables(theme: ThemeTokens): string {
  return `
    --theme-primary-light: ${theme.colors.primary.light};
    --theme-primary-dark: ${theme.colors.primary.dark};
    --theme-primary-mid: ${theme.colors.primary.mid};
    --theme-secondary: ${theme.colors.secondary};
    --theme-accent-gold: ${theme.colors.accent.gold};
    --theme-accent-blue: ${theme.colors.accent.blue};
    --theme-accent-green: ${theme.colors.accent.green};
    --theme-accent-orange: ${theme.colors.accent.orange};
    --theme-accent-purple: ${theme.colors.accent.purple};
    --theme-status-success: ${theme.colors.status.success};
    --theme-status-warning: ${theme.colors.status.warning};
    --theme-status-critical: ${theme.colors.status.critical};
    --theme-status-processing: ${theme.colors.status.processing};
    --theme-bg-base: ${theme.colors.background.base};
    --theme-bg-panel: ${theme.colors.background.panel};
    --theme-bg-overlay: ${theme.colors.background.overlay};
    --theme-text-primary: ${theme.colors.text.primary};
    --theme-text-secondary: ${theme.colors.text.secondary};
    --theme-text-muted: ${theme.colors.text.muted};
    --theme-border-default: ${theme.colors.border.default};
    --theme-border-panel: ${theme.colors.border.panel};
    --theme-border-accent: ${theme.colors.border.accent};
    --theme-glass-blur: ${theme.glass.blur};
    --theme-glass-saturation: ${theme.glass.saturation};
    --theme-glass-panel-opacity: ${theme.glass.opacity.panel};
    --theme-glass-overlay-opacity: ${theme.glass.opacity.overlay};
    --theme-font-primary: ${theme.typography.fontFamily.primary};
    --theme-font-heading: ${theme.typography.fontFamily.heading};
    --theme-radius-none: ${theme.borderRadius.none};
    --theme-radius-sm: ${theme.borderRadius.sm};
    --theme-radius-md: ${theme.borderRadius.md};
    --theme-radius-lg: ${theme.borderRadius.lg};
  `.trim();
}




