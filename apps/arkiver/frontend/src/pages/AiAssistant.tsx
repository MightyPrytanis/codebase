/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, FileText, X } from 'lucide-react';
import { AIIcon } from '../components/AIIcon';
import { useQuery } from '@tanstack/react-query';
import { executeTool } from '../lib/arkiver-api';
import { queryInsights } from '../lib/arkiver-api';
import { useAIOfflineError } from '../lib/ai-error-helper';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type Mode = 'analyze' | 'evaluate' | 'create';

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('analyze');
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showAIOfflineError = useAIOfflineError();

  const { data: insightsData } = useQuery({
    queryKey: ['insights-for-assistant'],
    queryFn: () => queryInsights({ pagination: { limit: 50, offset: 0 } }),
  });

  const insights = insightsData?.insights || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextInsights = insights.filter(i => selectedInsights.includes(i.insightId));
      const context = contextInsights.length > 0
        ? `Context from selected insights:\n${contextInsights.map(i => `- ${i.title}: ${i.content}`).join('\n')}\n\n`
        : '';

      const modePrompts = {
        analyze: 'Analyze the following question and provide insights:',
        evaluate: 'Evaluate the following and provide a critical assessment:',
        create: 'Create or generate content based on the following request:',
      };

      const prompt = `${modePrompts[mode]}\n\n${context}User: ${input}\n\nAssistant:`;

      const response = await executeTool('ai_orchestrator', {
        action: 'generate_response',
        prompt,
        mode,
        context: contextInsights,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof response === 'string' ? response : response.content?.[0]?.text || 'No response generated',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Check if it's a network error, timeout, or AI unavailable error
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const isTimeout = error instanceof Error && (error.message.includes('timeout') || error.message.includes('Timeout'));
      const isAIServiceError = error instanceof Error && (
        error.message.includes('unavailable') || 
        error.message.includes('not configured') ||
        error.message.includes('API error')
      );

      if (isNetworkError || isTimeout || isAIServiceError) {
        // Show HAL-inspired error message
        // TODO: Get firstName from user context when available
        showAIOfflineError();
      } else {
        // For other errors, show in chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInsight = (insightId: string) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>AI Assistant</h1>
          <p style={{ color: '#5B8FA3' }}>Interact with AI to analyze, evaluate, and create content</p>
        </div>

        <div className="flex-1 flex gap-6">
          <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                {(['analyze', 'evaluate', 'create'] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mode === m
                        ? 'text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={mode === m ? { backgroundColor: '#D89B6A' } : { color: '#2C3E50' }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12" style={{ color: '#5B8FA3' }}>
                  <div className="mx-auto mb-4 flex justify-center">
                    <AIIcon size={32} style={{ color: '#D89B6A' }} />
                  </div>
                  <p>Start a conversation by typing a message below</p>
                  <p className="text-sm mt-2">Select insights from the sidebar to include as context</p>
                </div>
              )}

              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <AIIcon size={20} style={{ color: '#D89B6A' }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'bg-gray-50'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: '#D89B6A' } : { color: '#2C3E50' }}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-700" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <AIIcon size={20} style={{ color: '#D89B6A' }} />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#D89B6A' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Type your ${mode} request...`}
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: '#D89B6A' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#2C3E50' }}>
              <FileText className="w-5 h-5" style={{ color: '#D89B6A' }} />
              Context Insights
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {insights.length === 0 ? (
                <p className="text-sm" style={{ color: '#5B8FA3' }}>No insights available</p>
              ) : (
                insights.slice(0, 20).map(insight => (
                  <div
                    key={insight.insightId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedInsights.includes(insight.insightId)
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => toggleInsight(insight.insightId)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{insight.title}</p>
                      {selectedInsights.includes(insight.insightId) && (
                        <X className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{insight.content}</p>
                  </div>
                ))
              )}
            </div>
            {selectedInsights.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm mb-2" style={{ color: '#5B8FA3' }}>
                  {selectedInsights.length} insight{selectedInsights.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={() => setSelectedInsights([])}
                  className="text-sm"
                  style={{ color: '#5B8FA3' }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}
}
}
)
}
}
)
}
}
)