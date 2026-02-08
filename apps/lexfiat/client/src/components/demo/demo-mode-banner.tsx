/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoMode, clearDemoData } from "@/lib/demo-service";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function DemoModeBanner() {
  const [isActive, setIsActive] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setIsActive(isDemoMode());
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('demo_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Re-check demo mode when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsActive(isDemoMode());
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check on focus in case demo mode was toggled in another tab
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('demo_banner_dismissed', 'true');
  };

  const handleClearDemo = () => {
    clearDemoData();
    setIsActive(false);
    queryClient.invalidateQueries();
    toast({
      title: "Demo Data Cleared",
      description: "All demo data has been removed successfully.",
    });
  };

  if (!isActive || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-600 border-b-2 border-yellow-700 shadow-lg" style={{ marginTop: '64px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-yellow-900 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">
                ⚠️ DEMO MODE ACTIVE
              </p>
              <p className="text-xs text-yellow-800">
                You are viewing simulated data for demonstration purposes. This is not real case information.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDemo}
              className="bg-yellow-700 hover:bg-yellow-800 text-yellow-50 border-yellow-600"
            >
              Clear Demo Data
            </Button>
            <button
              onClick={handleDismiss}
              className="text-yellow-900 hover:text-yellow-950 p-1 rounded"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}