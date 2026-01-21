/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { ReactNode } from "react";
import { DemoBadge } from "./demo-badge";
import { DemoWarning } from "./demo-warning";

interface DemoDataWrapperProps {
  children: ReactNode;
  isDemo?: boolean;
  demoWarning?: string;
  showBadge?: boolean;
  showWarning?: boolean;
  className?: string;
}

export function DemoDataWrapper({
  children,
  isDemo = false,
  demoWarning,
  showBadge = true,
  showWarning = false,
  className = "",
}: DemoDataWrapperProps) {
  if (!isDemo) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {showBadge && (
        <div className="absolute top-2 right-2 z-10">
          <DemoBadge />
        </div>
      )}
      <div className={isDemo ? "bg-yellow-950/10 border border-yellow-800/30 rounded-lg p-2" : ""}>
        {showWarning && demoWarning && (
          <div className="mb-2">
            <DemoWarning message={demoWarning} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
