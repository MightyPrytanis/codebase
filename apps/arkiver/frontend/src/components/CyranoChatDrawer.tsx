/**
 * Cyrano Chat Drawer for Arkiver
 * Floating, expandable chat interface
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CyranoChat } from './CyranoChat';

interface CyranoChatDrawerProps {
  app?: 'lexfiat' | 'arkiver';
  context?: Record<string, any>;
  defaultModel?: 'perplexity' | 'anthropic' | 'openai' | 'google' | 'xai' | 'deepseek';
}

export function CyranoChatDrawer({
  app = 'arkiver',
  context,
  defaultModel = 'perplexity',
}: CyranoChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed ${
        isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'
      } z-50 transition-all duration-300 ease-in-out`}
      style={
        isMinimized
          ? {}
          : { width: '400px', height: '600px' }
      }
    >
      <CyranoChat
        app={app}
        context={context}
        defaultModel={defaultModel}
        onClose={() => setIsOpen(false)}
        minimized={isMinimized}
        onMinimize={() => setIsMinimized(!isMinimized)}
      />
    </div>
  );
}
