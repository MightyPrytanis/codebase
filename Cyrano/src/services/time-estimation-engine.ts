/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Time Estimation Engine
 * 
 * MRPC COMPLIANCE: This engine estimates time for LexFiat + tools + attorney review/verification.
 * Value billing is NOT compliant with MRPC - attorneys must bill only for time actually spent.
 * 
 * Time Estimation Components:
 * - LexFiat processing time (AI processing, document analysis, etc.)
 * - Tool execution time (external tool calls, API requests, etc.)
 * - Attorney review/verification time (required for all AI-generated work product)
 * 
 * This provides an ESTIMATE of total time likely required, not a billing recommendation.
 * Actual billing must be based on time actually spent, not estimated value.
 */

import { AIService } from './ai-service.js';

export interface WorkEvent {
  source: 'local' | 'email' | 'westlaw' | 'clio' | 'calendar' | 'other';
  start?: string; // ISO
  end?: string; // ISO
  date?: string; // ISO date
  minutes?: number; // direct minutes if available
  description?: string;
  clientId?: string;
  matterId?: string;
  matterName?: string;
  userId?: string;
  evidence?: { type: string; uri?: string; meta?: any }[];
  tags?: string[];
}

export interface NormativeRule {
  task: string; // e.g., 'draft_notice_of_hearing'
  baselineMinutes: number; // Estimated baseline time for task
  modifiers?: { key: string; factor: number }[]; // e.g., complexity:1.5
  appliesTo?: { practiceArea?: string; court?: string; matterType?: string };
}

export interface TimeEstimationPolicy {
  mode: 'actual' | 'estimated' | 'blended';
  blendRatio?: number; // for blended: 0..1 (weight of estimated)
  normativeRules?: NormativeRule[];
  aiNormative?: boolean; // allow AI to infer normative times
  minIncrementMinutes?: number; // e.g., 6 minutes
  roundUp?: boolean; // round up to increment
  capMultiplier?: number; // optional cap: estimated <= cap * actual
  // Time estimation components
  includeLexFiatTime?: boolean; // Include LexFiat processing time
  includeToolTime?: boolean; // Include tool execution time
  includeReviewTime?: boolean; // Include attorney review/verification time
  reviewTimeMultiplier?: number; // Multiplier for review time (default: 0.3 = 30% of processing time)
}

export interface EstimatedEntry {
  matterId: string;
  clientId?: string;
  date: string; // YYYY-MM-DD
  minutes: number; // Estimated total minutes
  actualMinutes?: number; // Actual time spent (if available)
  lexFiatMinutes?: number; // LexFiat processing time
  toolMinutes?: number; // Tool execution time
  reviewMinutes?: number; // Attorney review/verification time
  description: string;
  sourceEvents: WorkEvent[];
  // MRPC Compliance Warning
  complianceWarning: string;
}

function minutesBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!isFinite(s) || !isFinite(e) || e <= s) return 0;
  return Math.round((e - s) / (1000 * 60));
}

function roundToIncrement(mins: number, inc: number, up: boolean): number {
  if (inc <= 0) return mins;
  const r = mins % inc;
  if (r === 0) return mins;
  return up ? mins + (inc - r) : mins - r;
}

const MRPC_COMPLIANCE_WARNING = 
  'IMPORTANT: MRPC Compliance - This is a TIME ESTIMATE, not a billing recommendation. ' +
  'Attorneys must bill only for time ACTUALLY SPENT on tasks. Value billing (billing based on ' +
  'estimated value rather than actual time) is NOT compliant with MRPC. Use this estimate as ' +
  'a planning tool, but bill only for actual time spent.';

export class TimeEstimationEngine {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async classifyEvents(events: WorkEvent[], context?: { matterNames?: Record<string, string> }): Promise<WorkEvent[]> {
    if (!events.length) return events;

    const userPrompt = `Classify these legal work events into task categories helpful for time estimation (e.g., research, drafting_notice_of_hearing, drafting_brief, revision, filing_service, client_communication, scheduling, email_correspondence, review_caselaw, review_facts, professional_development). Return JSON array with for each event: { index, suggestedTask, suggestedDescription }.

Events (indexed):\n${events.map((e, i) => `${i}. [${e.source}] ${e.description || ''} ${e.matterName || e.matterId || ''}`).join('\n')}`;

    const systemPrompt = 'You are a legal operations assistant focused on accurate time classification for time estimation. Output strictly valid JSON.';
    
    let completion: string;
    try {
      completion = await this.aiService.call('anthropic', `${systemPrompt}\n\n${userPrompt}`, { maxTokens: 1200, temperature: 0.2 });
    } catch {
      try {
        completion = await this.aiService.call('openai', `${systemPrompt}\n\n${userPrompt}`, { maxTokens: 1200, temperature: 0.2 });
      } catch {
        return events; // classification optional if no AI available
      }
    }

    try {
      const parsed = JSON.parse(completion);
      for (const item of parsed) {
        const idx = item.index;
        if (typeof idx === 'number' && events[idx]) {
          events[idx].tags = [...(events[idx].tags || []), item.suggestedTask].filter(Boolean);
          if (item.suggestedDescription) {
            events[idx].description = item.suggestedDescription;
          }
        }
      }
    } catch (_) {
      // On JSON parse error, skip updates
    }

    return events;
  }

  private findNormative(ruleSet: NormativeRule[] | undefined, task: string): number | undefined {
    if (!ruleSet) return undefined;
    const direct = ruleSet.find(r => r.task === task);
    return direct?.baselineMinutes;
  }

  private async inferNormativeWithAI(task: string, eventsForTask: WorkEvent[]): Promise<number | undefined> {
    const systemPrompt = 'You are a legal billing expert. Provide a conservative baseline minutes ESTIMATE for the described legal task, including LexFiat processing, tool execution, and attorney review/verification time. Output ONLY a number (minutes).';
    const userPrompt = `Task: ${task}\nExamples (${eventsForTask.length}):\n${eventsForTask.slice(0,5).map(e => `- ${e.description || ''}`).join('\n')}\nOutput: numeric minutes only (estimate for LexFiat + tools + attorney review).`;
    
    let text: string;
    try {
      text = await this.aiService.call('anthropic', `${systemPrompt}\n\n${userPrompt}`, { maxTokens: 20, temperature: 0.1 });
    } catch {
      try {
        text = await this.aiService.call('openai', `${systemPrompt}\n\n${userPrompt}`, { maxTokens: 20, temperature: 0.1 });
      } catch {
        return undefined;
      }
    }
    const n = Number(String(text).trim().replace(/[^0-9.]/g, ''));
    return isFinite(n) && n > 0 ? Math.round(n) : undefined;
  }

  /**
   * Estimate time for LexFiat processing
   */
  private estimateLexFiatTime(events: WorkEvent[]): number {
    // Estimate based on number and complexity of events
    // Simple heuristic: 2-5 minutes per event depending on complexity
    let total = 0;
    for (const event of events) {
      const baseTime = 2; // Base 2 minutes per event
      const complexityMultiplier = event.tags?.length || 1;
      total += baseTime * complexityMultiplier;
    }
    return Math.min(total, 60); // Cap at 60 minutes per day
  }

  /**
   * Estimate time for tool execution
   */
  private estimateToolTime(events: WorkEvent[]): number {
    // Estimate based on sources that require tool execution
    let total = 0;
    for (const event of events) {
      if (event.source === 'westlaw' || event.source === 'clio' || event.source === 'email') {
        total += 1; // 1 minute per tool call
      }
    }
    return total;
  }

  /**
   * Estimate time for attorney review/verification
   */
  private estimateReviewTime(processingTime: number, reviewMultiplier: number = 0.3): number {
    // Review time is typically 20-40% of processing time
    return Math.round(processingTime * reviewMultiplier);
  }

  async estimate(entries: WorkEvent[], policy: TimeEstimationPolicy): Promise<EstimatedEntry[]> {
    const events = await this.classifyEvents(entries);

    const byMatter: Record<string, WorkEvent[]> = {};
    for (const e of events) {
      const matterKey = e.matterId || e.matterName || 'INTERNAL_FIRM';
      if (!byMatter[matterKey]) byMatter[matterKey] = [];
      byMatter[matterKey].push(e);
    }

    const results: EstimatedEntry[] = [];

    for (const [matterKey, list] of Object.entries(byMatter)) {
      // Group by date
      const byDate: Record<string, WorkEvent[]> = {};
      for (const e of list) {
        const d = e.date || (e.start ? new Date(e.start).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(e);
      }

      for (const [date, dayEvents] of Object.entries(byDate)) {
        // Compute actual minutes
        const actualMins = dayEvents.reduce((sum, e) => sum + (e.minutes || minutesBetween(e.start, e.end)), 0);

        // Compute estimated minutes: sum over tasks using normative rules
        let estimatedMins = 0;
        const tasks: Record<string, WorkEvent[]> = {};
        for (const e of dayEvents) {
          const task = (e.tags && e.tags[0]) || 'general';
          if (!tasks[task]) tasks[task] = [];
          tasks[task].push(e);
        }

        for (const [task, taskEvents] of Object.entries(tasks)) {
          let baseline = this.findNormative(policy.normativeRules, task);
          if (!baseline && policy.aiNormative) {
            baseline = await this.inferNormativeWithAI(task, taskEvents);
          }
          if (!baseline) {
            // fallback to actual for this task
            const mins = taskEvents.reduce((s, e) => s + (e.minutes || minutesBetween(e.start, e.end)), 0);
            estimatedMins += mins;
          } else {
            // estimate baseline per distinct artifact/session
            const uniqueDesc = new Set(taskEvents.map(e => (e.description || '').trim()).filter(Boolean));
            const count = Math.max(1, uniqueDesc.size);
            estimatedMins += baseline * count;
          }
        }

        // Add time estimation components
        let lexFiatMins = 0;
        let toolMins = 0;
        let reviewMins = 0;

        if (policy.includeLexFiatTime !== false) {
          lexFiatMins = this.estimateLexFiatTime(dayEvents);
          estimatedMins += lexFiatMins;
        }

        if (policy.includeToolTime !== false) {
          toolMins = this.estimateToolTime(dayEvents);
          estimatedMins += toolMins;
        }

        if (policy.includeReviewTime !== false) {
          const processingTime = estimatedMins;
          reviewMins = this.estimateReviewTime(processingTime, policy.reviewTimeMultiplier || 0.3);
          estimatedMins += reviewMins;
        }

        let recommended = 0;
        switch (policy.mode) {
          case 'actual':
            recommended = actualMins;
            break;
          case 'estimated':
            recommended = estimatedMins;
            break;
          case 'blended':
            recommended = Math.round((policy.blendRatio ?? 0.5) * estimatedMins + (1 - (policy.blendRatio ?? 0.5)) * actualMins);
            break;
        }

        if (policy.capMultiplier && actualMins > 0) {
          recommended = Math.min(recommended, Math.round(actualMins * policy.capMultiplier));
        }
        if (policy.minIncrementMinutes) {
          recommended = roundToIncrement(recommended, policy.minIncrementMinutes, policy.roundUp ?? true);
        }

        results.push({
          matterId: matterKey,
          date,
          minutes: Math.max(0, recommended),
          actualMinutes: actualMins,
          lexFiatMinutes: lexFiatMins,
          toolMinutes: toolMins,
          reviewMinutes: reviewMins,
          description: `Time estimate for ${matterKey} on ${date} (LexFiat: ${lexFiatMins}min, Tools: ${toolMins}min, Review: ${reviewMins}min)`,
          sourceEvents: dayEvents,
          complianceWarning: MRPC_COMPLIANCE_WARNING
        });
      }
    }

    return results;
  }
}
