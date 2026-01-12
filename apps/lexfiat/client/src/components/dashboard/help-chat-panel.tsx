/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, RefreshCw } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";

interface HelpChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function HelpChatPanel({ isOpen, onClose }: HelpChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your LexFiat AI assistant. How can I help you today? I can assist with:\n\n• Using LexFiat features and workflows\n• Legal research and document analysis\n• Troubleshooting technical issues\n• Understanding GoodCounsel insights\n• Setting up integrations",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call AI assistant via Cyrano
      const result = await executeCyranoTool('ai_orchestrator', {
        prompt: `You are a helpful assistant for LexFiat, a legal practice management system. The user is asking: "${userMessage.content}". Provide a helpful, clear response.`,
        context: 'help-chat',
      });

      if (result.isError) {
        showAIOfflineError();
        throw new Error('AI service unavailable');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content?.[0]?.text || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Persistent Tab - slides out when mouse approaches left edge */}
      <div
        className="help-chat-tab"
        onMouseEnter={() => {
          const event = new Event('open-help-chat');
          window.dispatchEvent(event);
        }}
      >
        <div className="help-chat-tab-content">
          <MessageSquare className="w-5 h-5" />
          <span>Help</span>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`help-chat-sidebar ${isOpen ? 'open' : ''}`}
        onMouseLeave={() => isOpen && onClose()}
      >
        <div className="help-chat-header">
          <h3 className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            LexFiat Help Assistant
          </h3>
          <button className="close-help-chat" onClick={onClose}>×</button>
        </div>

        <div className="help-chat-content">
          <div className="help-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`help-chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="help-chat-message-avatar">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className="help-chat-message-content">
                  <div className="help-chat-message-text">{message.content}</div>
                  <div className="help-chat-message-time">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="help-chat-message assistant">
                <div className="help-chat-message-avatar">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="help-chat-message-content">
                  <div className="help-chat-message-text">
                    <RefreshCw className="w-4 h-4 animate-spin inline" /> Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="help-chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about LexFiat..."
              className="help-chat-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="help-chat-send-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

}
}
}
)
}