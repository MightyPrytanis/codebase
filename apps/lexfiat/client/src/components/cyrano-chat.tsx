/**
 * Cyrano Chat Component
 * Unified chat interface for the Cyrano Pathfinder
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, X, Minimize2, Maximize2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { executeCyranoTool } from '../lib/cyrano-api';
import type { CyranoToolResult } from '../lib/cyrano-api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    app?: string;
    mode?: string;
    toolsCalled?: string[];
    executionTimeMs?: number;
  };
  error?: boolean;
}

interface CyranoChatProps {
  app?: 'lexfiat' | 'arkiver';
  context?: Record<string, any>;
  defaultModel?: 'perplexity' | 'anthropic' | 'openai' | 'google' | 'xai' | 'deepseek';
  onClose?: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
}

export function CyranoChat({
  app = 'lexfiat',
  context,
  defaultModel = 'perplexity',
  onClose,
  minimized = false,
  onMinimize,
}: CyranoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I'm the Cyrano Pathfinder, your autonomous assistant for navigating ${app === 'lexfiat' ? 'LexFiat' : 'Arkiver'}.\n\nI can help you with:\n• Guided Q&A and workflow navigation\n• Document searches and retrieval\n• Tool orchestration and automation\n• General assistance\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<string>(defaultModel);
  const [mode, setMode] = useState<'guide' | 'execute'>('guide');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not minimized
  useEffect(() => {
    if (!minimized) {
      inputRef.current?.focus();
    }
  }, [minimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the cyrano_pathfinder tool
      const result = await executeCyranoTool('cyrano_pathfinder', {
        message: userMessage.content,
        context: context || {},
        model: model as any,
        app,
        mode,
      });

      // Parse the response
      let assistantMessage: Message;
      
      if (result.isError) {
        assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.content[0]?.text || 'An error occurred',
          timestamp: new Date(),
          error: true,
        };
      } else {
        // Try to parse JSON response
        try {
          const parsed = JSON.parse(result.content[0]?.text || '{}');
          assistantMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: parsed.response || result.content[0]?.text || 'No response',
            timestamp: new Date(),
            metadata: parsed.metadata,
          };
        } catch {
          // If not JSON, use the raw text
          assistantMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.content[0]?.text || 'No response',
            timestamp: new Date(),
          };
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (minimized) {
    return (
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-medium">Cyrano</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onMinimize}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-600/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
            C
          </div>
          <div>
            <h3 className="font-semibold text-lg">Cyrano Pathfinder</h3>
            <p className="text-xs text-muted-foreground">
              {app === 'lexfiat' ? 'LexFiat' : 'Arkiver'} Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? 'bg-accent' : ''}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onMinimize && (
            <Button size="icon" variant="ghost" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-accent/50 space-y-4">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perplexity">Perplexity (Default)</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                <SelectItem value="google">Google Gemini</SelectItem>
                <SelectItem value="xai">xAI Grok</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Tool Execution</Label>
              <p className="text-xs text-muted-foreground">
                Allow Cyrano to call MCP tools for actions
              </p>
            </div>
            <Switch
              checked={mode === 'execute'}
              onCheckedChange={(checked) => setMode(checked ? 'execute' : 'guide')}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.error
                    ? 'bg-destructive/10 text-destructive border border-destructive'
                    : 'bg-muted'
                }`}
              >
                {message.error && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">Error</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.metadata && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.metadata.model && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.model}
                      </Badge>
                    )}
                    {message.metadata.mode && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.mode}
                      </Badge>
                    )}
                    {message.metadata.toolsCalled && message.metadata.toolsCalled.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🔧 {message.metadata.toolsCalled.length} tool{message.metadata.toolsCalled.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {message.metadata.executionTimeMs && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.executionTimeMs}ms
                      </Badge>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cyrano is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Cyrano anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Cyrano MCP Server • {mode === 'execute' ? '🔧 Tools Enabled' : '💬 Guide Mode'}
        </p>
      </div>
    </div>
  );
