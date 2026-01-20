/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface DemoBadgeProps {
  className?: string;
  variant?: "default" | "outline" | "destructive" | "secondary";
}

export function DemoBadge({ className = "", variant = "destructive" }: DemoBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={`bg-yellow-600 hover:bg-yellow-700 text-yellow-900 border-yellow-700 ${className}`}
    >
      <AlertTriangle className="w-3 h-3 mr-1" />
      DEMO
    </Badge>
  );
