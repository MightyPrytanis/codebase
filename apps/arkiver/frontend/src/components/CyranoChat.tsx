/**
 * Cyrano Chat Component for Arkiver
 * Unified chat interface for the Cyrano Pathfinder
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, X, Minimize2, Maximize2, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';

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

async function executeCyranoTool(tool: string, args: Record<string, any>) {
  const response = await fetch(`${API_URL}/mcp/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool,
      arguments: args,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

export function CyranoChat({
  app = 'arkiver',
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
      <div className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-medium">Cyrano</span>
        </div>
        <button
          onClick={onMinimize}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
            C
          </div>
          <div>
            <h3 className="font-semibold text-lg">Cyrano Pathfinder</h3>
            <p className="text-xs text-gray-600">
              {app === 'lexfiat' ? 'LexFiat' : 'Arkiver'} Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded hover:bg-gray-100 ${showSettings ? 'bg-gray-200' : ''}`}
          >
            <Settings className="h-4 w-4" />
          </button>
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 rounded hover:bg-gray-100"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="perplexity">Perplexity (Default)</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="google">Google Gemini</option>
              <option value="xai">xAI Grok</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Tool Execution</label>
              <p className="text-xs text-gray-600">
                Allow Cyrano to call MCP tools for actions
              </p>
            </div>
            <input
              type="checkbox"
              checked={mode === 'execute'}
              onChange={(e) => setMode(e.target.checked ? 'execute' : 'guide')}
              className="w-10 h-6"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.error
                    ? 'bg-red-50 text-red-800 border border-red-300'
                    : 'bg-gray-100'
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
                      <span className="px-2 py-1 text-xs bg-white/20 rounded">
                        {message.metadata.model}
                      </span>
                    )}
                    {message.metadata.toolsCalled && message.metadata.toolsCalled.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-white/20 rounded">
                        🔧 {message.metadata.toolsCalled.length} tool{message.metadata.toolsCalled.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Cyrano is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Cyrano anything..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Powered by Cyrano MCP Server • {mode === 'execute' ? '🔧 Tools Enabled' : '💬 Guide Mode'}
        </p>
      </div>
    </div>
  );
