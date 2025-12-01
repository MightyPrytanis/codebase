/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, ThemeTokens, getTheme, getThemeCSSVariables } from '@/lib/theme';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'control-room' }: { children: React.ReactNode; defaultTheme?: ThemeName }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('lexfiat-theme') as ThemeName;
    return saved || defaultTheme;
  });

  const tokens = getTheme(theme);

  useEffect(() => {
    localStorage.setItem('lexfiat-theme', theme);
    const cssVars = getThemeCSSVariables(tokens);
    const style = document.createElement('style');
    style.id = 'theme-variables';
    style.textContent = `:root { ${cssVars} }`;
    
    // Remove existing theme style if present
    const existing = document.getElementById('theme-variables');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(style);
  }, [theme, tokens]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

