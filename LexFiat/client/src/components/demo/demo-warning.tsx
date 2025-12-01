/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DemoWarningProps {
  message?: string;
  toolName?: string;
  className?: string;
}

export function DemoWarning({ message, toolName, className = "" }: DemoWarningProps) {
  const displayMessage = message || 
    (toolName ? `${toolName} is operating in DEMO MODE. Responses are simulated for demonstration purposes only.` : 
     "This feature is operating in DEMO MODE. Responses are simulated for demonstration purposes only.");

  return (
    <Alert className={`bg-yellow-950/50 border-yellow-700 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-600">Demo Mode Active</AlertTitle>
      <AlertDescription className="text-yellow-200 text-sm">
        {displayMessage}
      </AlertDescription>
    </Alert>
  );
}


