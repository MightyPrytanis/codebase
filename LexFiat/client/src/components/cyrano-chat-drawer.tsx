/**
 * Cyrano Chat Drawer
 * Floating, draggable, and expandable chat interface
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { CyranoChat } from './cyrano-chat';

interface CyranoChatDrawerProps {
  app?: 'lexfiat' | 'arkiver';
  context?: Record<string, any>;
  defaultModel?: 'perplexity' | 'anthropic' | 'openai' | 'google' | 'xai' | 'deepseek';
}

export function CyranoChatDrawer({
  app = 'lexfiat',
  context,
  defaultModel = 'perplexity',
}: CyranoChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`fixed ${
        isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6 w-[400px] h-[600px]'
      } z-50 transition-all duration-300 ease-in-out`}
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
