/**
 * Conversation Extractor for Arkiver
 * 
 * Extracts structured conversation data from LLM chat exports (JSON, MD, TXT formats)
 * Supports ChatGPT, Claude, and other LLM conversation formats
 * 
 * Created: 2025-11-28
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { readFile } from 'fs/promises';
import { z } from 'zod';

// ChatGPT conversation JSON schema
const ChatGPTConversationSchema = z.object({
  title: z.string().optional(),
  create_time: z.number().optional(),
  update_time: z.number().optional(),
  mapping: z.record(z.string(), z.any()).optional(),
  moderation_results: z.array(z.any()).optional(),
});

const ChatGPTConversationArraySchema = z.array(ChatGPTConversationSchema);

// Extraction settings
export interface ConversationExtractionSettings {
  format?: 'chatgpt' | 'claude' | 'auto-detect';
  extractMetadata?: boolean;
  extractFullText?: boolean;
  filterByTitle?: string;
}

// Extracted conversation structure
export interface ExtractedConversation {
  type: 'conversation';
  title: string;
  createTime?: number;
  updateTime?: number;
  messages: ExtractedMessage[];
  sourceLLM?: string;
  metadata?: Record<string, any>;
  fullText?: string;
}

export interface ExtractedMessage {
  nodeId: string;
  role?: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Conversation Extractor
 * Handles JSON, MD, and TXT conversation formats
 */
export class ConversationExtractor {
  /**
   * Extract conversations from a file
   */
  async extract(
    filePath: string,
    settings: ConversationExtractionSettings = {}
  ): Promise<ExtractedConversation[]> {
    const fileContent = await readFile(filePath, 'utf-8');
    const fileExt = filePath.split('.').pop()?.toLowerCase();

    // Auto-detect format if not specified
    const format = settings.format || this.detectFormat(fileContent, fileExt);

    switch (format) {
      case 'chatgpt':
        return this.extractChatGPT(fileContent, settings);
      case 'claude':
        return this.extractClaude(fileContent, settings);
      default:
        // Try JSON first, then fall back to text/markdown
        try {
          return this.extractChatGPT(fileContent, settings);
        } catch {
          return this.extractTextFormat(fileContent, filePath, settings);
        }
    }
  }

  /**
   * Detect conversation format from content
   */
  private detectFormat(content: string, fileExt?: string): 'chatgpt' | 'claude' | 'auto-detect' {
    // Check for ChatGPT JSON structure
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first.mapping || first.create_time !== undefined) {
          return 'chatgpt';
        }
      }
    } catch {
      // Not JSON
    }

    // Check for Claude format markers
    if (content.includes('Human:') && content.includes('Assistant:')) {
      return 'claude';
    }

    return 'auto-detect';
  }

  /**
   * Extract ChatGPT conversation JSON
   */
  private async extractChatGPT(
    content: string,
    settings: ConversationExtractionSettings
  ): Promise<ExtractedConversation[]> {
    const parsed = JSON.parse(content);
    const conversations = ChatGPTConversationArraySchema.parse(parsed);

    const results: ExtractedConversation[] = [];

    for (const conv of conversations) {
      // Apply title filter if specified
      if (settings.filterByTitle && conv.title) {
        if (!conv.title.toLowerCase().includes(settings.filterByTitle.toLowerCase())) {
          continue;
        }
      }

      const messages = this.extractChatGPTMessages(conv.mapping || {});

      const extracted: ExtractedConversation = {
        type: 'conversation',
        title: conv.title || 'Untitled Conversation',
        createTime: conv.create_time,
        updateTime: conv.update_time,
        messages,
        sourceLLM: 'ChatGPT',
        metadata: settings.extractMetadata ? {
          moderationResults: conv.moderation_results,
          rawData: conv,
        } : undefined,
      };

      // Extract full text if requested
      if (settings.extractFullText) {
        extracted.fullText = messages.map(m => m.text).join('\n\n');
      }

      results.push(extracted);
    }

    return results;
  }

  /**
   * Extract messages from ChatGPT conversation mapping
   */
  private extractChatGPTMessages(mapping: Record<string, any>): ExtractedMessage[] {
    const messages: ExtractedMessage[] = [];

    for (const [nodeId, nodeData] of Object.entries(mapping)) {
      if (!nodeData?.message) continue;

      const message = nodeData.message;
      const content = message.content;

      if (!content) continue;

      let text = '';
      if (content.content_type === 'text') {
        const parts = content.parts || [];
        text = parts.map((p: any) => String(p)).join(' ');
      } else if (typeof content === 'string') {
        text = content;
      }

      if (text.trim()) {
        messages.push({
          nodeId,
          role: message.author?.role || 'assistant',
          text: text.trim(),
          timestamp: message.create_time,
          metadata: {
            model: message.metadata?.model_slug,
            finishDetails: message.metadata?.finish_details,
          },
        });
      }
    }

    return messages;
  }

  /**
   * Extract Claude conversation format
   */
  private async extractClaude(
    content: string,
    settings: ConversationExtractionSettings
  ): Promise<ExtractedConversation[]> {
    // Claude format: "Human: ...\n\nAssistant: ..."
    const messages: ExtractedMessage[] = [];
    const lines = content.split('\n');
    let currentRole: 'user' | 'assistant' = 'user';
    let currentText: string[] = [];

    for (const line of lines) {
      if (line.startsWith('Human:')) {
        if (currentText.length > 0) {
          messages.push({
            nodeId: `msg-${messages.length}`,
            role: currentRole,
            text: currentText.join('\n').trim(),
          });
        }
        currentRole = 'user';
        currentText = [line.replace(/^Human:\s*/, '')];
      } else if (line.startsWith('Assistant:')) {
        if (currentText.length > 0) {
          messages.push({
            nodeId: `msg-${messages.length}`,
            role: currentRole,
            text: currentText.join('\n').trim(),
          });
        }
        currentRole = 'assistant';
        currentText = [line.replace(/^Assistant:\s*/, '')];
      } else {
        currentText.push(line);
      }
    }

    // Add last message
    if (currentText.length > 0) {
      messages.push({
        nodeId: `msg-${messages.length}`,
        role: currentRole,
        text: currentText.join('\n').trim(),
      });
    }

    return [{
      type: 'conversation',
      title: 'Claude Conversation',
      messages,
      sourceLLM: 'Claude',
      fullText: settings.extractFullText ? messages.map(m => m.text).join('\n\n') : undefined,
    }];
  }

  /**
   * Extract from plain text or markdown format
   */
  private async extractTextFormat(
    content: string,
    filePath: string,
    settings: ConversationExtractionSettings
  ): Promise<ExtractedConversation[]> {
    // Try to parse as markdown conversation
    const isMarkdown = filePath.endsWith('.md') || filePath.endsWith('.markdown');
    
    const messages: ExtractedMessage[] = [];
    
    if (isMarkdown) {
      // Try to extract from markdown format
      const lines = content.split('\n');
      let currentRole: 'user' | 'assistant' | undefined;
      let currentText: string[] = [];

      for (const line of lines) {
        // Check for role markers
        if (line.match(/^#+\s*(User|Human|You):/i)) {
          if (currentText.length > 0 && currentRole) {
            messages.push({
              nodeId: `msg-${messages.length}`,
              role: currentRole,
              text: currentText.join('\n').trim(),
            });
          }
          currentRole = 'user';
          currentText = [];
        } else if (line.match(/^#+\s*(Assistant|AI|Bot|Claude|GPT):/i)) {
          if (currentText.length > 0 && currentRole) {
            messages.push({
              nodeId: `msg-${messages.length}`,
              role: currentRole,
              text: currentText.join('\n').trim(),
            });
          }
          currentRole = 'assistant';
          currentText = [];
        } else if (currentRole) {
          currentText.push(line);
        }
      }

      // Add last message
      if (currentText.length > 0 && currentRole) {
        messages.push({
          nodeId: `msg-${messages.length}`,
          role: currentRole,
          text: currentText.join('\n').trim(),
        });
      }
    }

    // If no structured messages found, treat entire content as single message
    if (messages.length === 0) {
      messages.push({
        nodeId: 'msg-0',
        role: 'user',
        text: content.trim(),
      });
    }

    const filename = filePath.split('/').pop() || 'conversation';
    return [{
      type: 'conversation',
      title: filename.replace(/\.(txt|md|json)$/i, ''),
      messages,
      sourceLLM: 'Unknown',
      fullText: settings.extractFullText ? content : undefined,
    }];
  }

  /**
   * Get text content from extracted conversation
   */
  getTextContent(conversation: ExtractedConversation): string {
    if (conversation.fullText) {
      return conversation.fullText;
    }
    return conversation.messages.map(m => m.text).join('\n\n');
}
}

}
}
}
}
}
}