/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import { useTheme } from "./theme-provider";
import { ThemeName } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Sun, Moon, Rocket } from "lucide-react";

const themeLabels: Record<ThemeName, { label: string; icon: React.ReactNode; available?: boolean }> = {
  light: {
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
    available: true,
  },
  "control-room": {
    label: "Control Room",
    icon: <Moon className="h-4 w-4" />,
    available: true,
  },
  "ad-astra": {
    label: "Ad Astra (Coming Soon)",
    icon: <Rocket className="h-4 w-4" />,
    available: false,
  },
};

/**
 * Theme Selector Component
 * Allows users to switch between available themes
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(themeLabels) as ThemeName[]).map((themeName) => {
          const themeInfo = themeLabels[themeName];
          if (!themeInfo.available) {
            return (
              <DropdownMenuItem
                key={themeName}
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 w-full">
                  {themeInfo.icon}
                  <span>{themeInfo.label}</span>
                </div>
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem
              key={themeName}
              onClick={() => setTheme(themeName)}
              className={theme === themeName ? "bg-muted" : ""}
            >
              <div className="flex items-center gap-2 w-full">
                {themeInfo.icon}
                <span>{themeInfo.label}</span>
                {theme === themeName && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

