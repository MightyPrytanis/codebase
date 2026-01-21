/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GoodCounselWidget } from "./good-counsel-widget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface StandardPanelLayoutProps {
  /** Left column content: entity overview and timeline */
  leftColumn?: React.ReactNode;
  /** Center column content: current work surface (AI suggestions, actions, history, controls) */
  centerColumn: React.ReactNode;
  /** Right column content: GoodCounsel card + red-flag/ethics alerts */
  rightColumn?: React.ReactNode;
  /** Optional title for the panel */
  title?: string;
  /** Additional className for the container */
  className?: string;
  /** Red flag alerts to display in right column */
  redFlagAlerts?: Array<{
    id: string;
    title: string;
    description: string;
    severity?: "low" | "medium" | "high";
  }>;
  /** Whether to show GoodCounsel widget in right column */
  showGoodCounsel?: boolean;
}

/**
 * Standard 3-column panel layout template
 * 
 * Layout:
 * - Left column: Entity overview and timeline
 * - Center: Current work surface (AI suggestions, actions, history, controls)
 * - Right column: GoodCounsel card + red-flag/ethics alerts
 */
export function StandardPanelLayout({
  leftColumn,
  centerColumn,
  rightColumn,
  title,
  className,
  redFlagAlerts = [],
  showGoodCounsel = true,
}: StandardPanelLayoutProps) {
  return (
    <div className={cn("standard-panel-layout", className)}>
      {title && (
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Entity Overview & Timeline */}
        {leftColumn && (
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
              <CardContent className="p-4">
                {leftColumn}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Center Column: Current Work Surface */}
        <div className={cn(
          "lg:col-span-6",
          !leftColumn && !rightColumn && "lg:col-span-12",
          leftColumn && !rightColumn && "lg:col-span-9",
          !leftColumn && rightColumn && "lg:col-span-9"
        )}>
          <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
            <CardContent className="p-6">
              {centerColumn}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GoodCounsel + Red Flags */}
        {(rightColumn || showGoodCounsel || redFlagAlerts.length > 0) && (
          <div className="lg:col-span-3 space-y-4">
            {/* Red Flag Alerts */}
            {redFlagAlerts.length > 0 && (
              <div className="space-y-3">
                {redFlagAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.severity === "high" ? "destructive" : "default"}
                    className="border-0 shadow-none bg-panel-glass backdrop-blur-md"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* GoodCounsel Widget */}
            {showGoodCounsel && (
              <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg">GoodCounsel</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoodCounselWidget />
                </CardContent>
              </Card>
            )}

            {/* Custom Right Column Content */}
            {rightColumn && (
              <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
                <CardContent className="p-4">
                  {rightColumn}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
