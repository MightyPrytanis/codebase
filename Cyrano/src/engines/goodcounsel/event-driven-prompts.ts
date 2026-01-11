/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Event-Driven GoodCounsel Prompts
 * Wires GoodCounsel to workflow event stream and implements prompt rules
 */

import { logStateTransition } from '../../engines/workflow/state-transition-log.js';
import { DocumentState } from '../../engines/workflow/document-state-machine.js';

export type PromptType =
  | 'long_focus_session'
  | 'client_contact_gap'
  | 'frequent_emergency_filings'
  | 'red_flag_alerts'
  | 'wellness_check'
  | 'ethics_reminder';

export interface GoodCounselPrompt {
  id: string;
  type: PromptType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  snoozedUntil?: string;
  dismissed?: boolean;
  userId: string;
}

export interface PromptRule {
  type: PromptType;
  condition: (context: PromptContext) => boolean;
  generatePrompt: (context: PromptContext) => Omit<GoodCounselPrompt, 'id' | 'timestamp'>;
}

export interface PromptContext {
  userId: string;
  focusSessionDuration?: number; // minutes
  lastClientContact?: Date;
  activeMatters?: string[];
  emergencyFilingsCount?: number;
  redFlagAlertsCount?: number;
  timeSinceLastPrompt?: number; // minutes
}

class EventDrivenGoodCounsel {
  private prompts: Map<string, GoodCounselPrompt> = new Map();
  private rules: PromptRule[] = [];
  private userSnoozeSettings: Map<string, Map<PromptType, number>> = new Map(); // userId -> promptType -> snoozeUntil timestamp

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize prompt rules
   */
  private initializeRules() {
    // Rule 1: Long uninterrupted focus sessions (> 2 hours)
    this.rules.push({
      type: 'long_focus_session',
      condition: (context) => {
        return (context.focusSessionDuration || 0) > 120; // 2 hours
      },
      generatePrompt: (context) => ({
        type: 'long_focus_session',
        title: 'Take a Break',
        message: `You've been working for ${Math.floor((context.focusSessionDuration || 0) / 60)} hours without a break. Consider taking a short rest to maintain focus and well-being.`,
        severity: 'medium',
        userId: context.userId,
      }),
    });

    // Rule 2: Long gaps in client contact on active matters (> 7 days)
    this.rules.push({
      type: 'client_contact_gap',
      condition: (context) => {
        if (!context.lastClientContact || !context.activeMatters || context.activeMatters.length === 0) {
          return false;
        }
        const daysSinceContact = (Date.now() - context.lastClientContact.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceContact > 7;
      },
      generatePrompt: (context) => {
        const daysSince = Math.floor(
          (Date.now() - (context.lastClientContact?.getTime() || 0)) / (1000 * 60 * 60 * 24)
        );
        return {
          type: 'client_contact_gap',
          title: 'Client Communication Reminder',
          message: `It's been ${daysSince} days since your last client contact. Consider reaching out to maintain strong client relationships.`,
          severity: 'low',
          userId: context.userId,
        };
      },
    });

    // Rule 3: Frequent emergency filings (> 3 in a week)
    this.rules.push({
      type: 'frequent_emergency_filings',
      condition: (context) => {
        return (context.emergencyFilingsCount || 0) > 3;
      },
      generatePrompt: (context) => ({
        type: 'frequent_emergency_filings',
        title: 'Workload Balance',
        message: `You've had ${context.emergencyFilingsCount} emergency filings recently. Consider reviewing your workload and scheduling to prevent burnout.`,
        severity: 'high',
        userId: context.userId,
      }),
    });

    // Rule 4: Red flag alerts (> 5 in a day)
    this.rules.push({
      type: 'red_flag_alerts',
      condition: (context) => {
        return (context.redFlagAlertsCount || 0) > 5;
      },
      generatePrompt: (context) => ({
        type: 'red_flag_alerts',
        title: 'Ethics Review Suggested',
        message: `You've encountered ${context.redFlagAlertsCount} red flag alerts today. Consider a comprehensive ethics review.`,
        severity: 'high',
        userId: context.userId,
      }),
    });

    // Rule 5: Wellness check (no prompt in last 24 hours)
    this.rules.push({
      type: 'wellness_check',
      condition: (context) => {
        return (context.timeSinceLastPrompt || Infinity) > 24 * 60; // 24 hours in minutes
      },
      generatePrompt: (context) => ({
        type: 'wellness_check',
        title: 'Wellness Check',
        message: 'How are you feeling today? Take a moment to reflect on your well-being and work-life balance.',
        severity: 'low',
        userId: context.userId,
      }),
    });
  }

  /**
   * Evaluate context and generate prompts
   */
  evaluateContext(context: PromptContext): GoodCounselPrompt[] {
    const newPrompts: GoodCounselPrompt[] = [];

    for (const rule of this.rules) {
      // Check if prompt type is snoozed
      const snoozeUntil = this.userSnoozeSettings.get(context.userId)?.get(rule.type);
      if (snoozeUntil && Date.now() < snoozeUntil) {
        continue; // Skip snoozed prompt types
      }

      // Check condition
      if (rule.condition(context)) {
        // Check if we already have an active prompt of this type
        const existingPrompt = Array.from(this.prompts.values()).find(
          (p) => p.type === rule.type && p.userId === context.userId && !p.dismissed && !p.snoozedUntil
        );

        if (!existingPrompt) {
          const promptData = rule.generatePrompt(context);
          const prompt: GoodCounselPrompt = {
            ...promptData,
            id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          this.prompts.set(prompt.id, prompt);
          newPrompts.push(prompt);
        }
      }
    }

    return newPrompts;
  }

  /**
   * Get active prompts for a user
   */
  getActivePrompts(userId: string): GoodCounselPrompt[] {
    const now = Date.now();
    return Array.from(this.prompts.values()).filter(
      (p) =>
        p.userId === userId &&
        !p.dismissed &&
        (!p.snoozedUntil || new Date(p.snoozedUntil).getTime() > now)
    );
  }

  /**
   * Snooze a prompt type
   */
  snoozePromptType(userId: string, promptType: PromptType, hours: number): void {
    if (!this.userSnoozeSettings.has(userId)) {
      this.userSnoozeSettings.set(userId, new Map());
    }
    const userSettings = this.userSnoozeSettings.get(userId)!;
    const snoozeUntil = Date.now() + hours * 60 * 60 * 1000;
    userSettings.set(promptType, snoozeUntil);
  }

  /**
   * Dismiss a prompt
   */
  dismissPrompt(promptId: string): void {
    const prompt = this.prompts.get(promptId);
    if (prompt) {
      prompt.dismissed = true;
      this.prompts.set(promptId, prompt);
    }
  }

  /**
   * Get prompt history for a user
   */
  getPromptHistory(userId: string, limit = 50): GoodCounselPrompt[] {
    return Array.from(this.prompts.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Listen to workflow events and generate prompts
   */
  onWorkflowEvent(event: {
    type: string;
    documentId: string;
    userId: string;
    state?: DocumentState;
    metadata?: any;
  }): GoodCounselPrompt[] {
    // This would be called by the workflow engine when events occur
    // For now, return empty array - will be integrated with workflow event stream
    return [];
  }
}

export const eventDrivenGoodCounsel = new EventDrivenGoodCounsel();





}
}
)
)