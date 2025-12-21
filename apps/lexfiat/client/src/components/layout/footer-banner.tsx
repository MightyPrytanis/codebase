/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Info, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FooterBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Auto-hide after 5 seconds if not hovering
    if (isOpen && !isHovering) {
      const timer = setTimeout(() => setIsOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isHovering]);

  return (
    <>
      {/* Persistent Tab */}
      {!isOpen && (
        <div 
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 cursor-pointer"
          onMouseEnter={() => setIsOpen(true)}
        >
          <div className="bg-primary-dark/90 hover:bg-primary-dark border-t-2 border-accent-gold px-4 py-2 rounded-t-lg shadow-lg transition-all flex items-center gap-2">
            <Info className="w-4 h-4 text-accent-gold" />
            <span className="text-xs text-secondary font-medium">Legal Notice</span>
            <ChevronUp className="w-3 h-3 text-secondary" />
          </div>
        </div>
      )}

      {/* Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-primary-dark/95 backdrop-blur-sm border-t-2 border-accent-gold shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        onMouseEnter={() => {
          setIsOpen(true);
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          // Will auto-hide after 5 seconds
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-xs text-secondary text-center">
              <p className="leading-tight">
                <strong className="text-primary">AI-generated content is subject to error</strong> and may be incomplete or inaccurate. 
                Always verify all information before use. 
                <span className="text-accent-gold"> Copyright 2025 Cognisint LLC</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 flex-shrink-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

