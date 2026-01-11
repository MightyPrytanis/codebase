/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
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
  baselineMinutes: number; // e.g., 15
  modifiers?: { key: string; factor: number }[]; // e.g., complexity:1.5
  appliesTo?: { practiceArea?: string; court?: string; matterType?: string };
}

export interface BillingPolicy {
  mode: 'value' | 'actual' | 'blended';
  blendRatio?: number; // for blended: 0..1 (weight of value)
  normativeRules?: NormativeRule[];
  aiNormative?: boolean; // allow AI to infer normative times
  minIncrementMinutes?: number; // e.g., 6 minutes
  roundUp?: boolean; // round up to increment
  capMultiplier?: number; // optional cap: value <= cap * actual
}

export interface RecommendedEntry {
  matterId: string;
  clientId?: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  description: string;
  sourceEvents: WorkEvent[];
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

export class ValueBillingEngine {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async classifyEvents(events: WorkEvent[], context?: { matterNames?: Record<string, string> }): Promise<WorkEvent[]> {
    if (!events.length) return events;

    const userPrompt = `Classify these legal work events into task categories helpful for billing (e.g., research, drafting_notice_of_hearing, drafting_brief, revision, filing_service, client_communication, scheduling, email_correspondence, review_caselaw, review_facts, professional_development). Return JSON array with for each event: { index, suggestedTask, suggestedDescription }.

Events (indexed):\n${events.map((e, i) => `${i}. [${e.source}] ${e.description || ''} ${e.matterName || e.matterId || ''}`).join('\n')}`;

    const systemPrompt = 'You are a legal operations assistant focused on accurate time classification for value billing. Output strictly valid JSON.';
    
    let completion: string;
    try {
      // Try Anthropic first (best for structured output), fallback to OpenAI
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
    const systemPrompt = 'You are a legal billing expert. Provide a conservative baseline minutes estimate for the described legal drafting task. Output ONLY a number (minutes).';
    const userPrompt = `Task: ${task}\nExamples (${eventsForTask.length}):\n${eventsForTask.slice(0,5).map(e => `- ${e.description || ''}`).join('\n')}\nOutput: numeric minutes only.`;
    
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

  async recommend(entries: WorkEvent[], policy: BillingPolicy): Promise<RecommendedEntry[]> {
    const events = await this.classifyEvents(entries);

    const byMatter: Record<string, WorkEvent[]> = {};
    for (const e of events) {
      const matterKey = e.matterId || e.matterName || 'INTERNAL_FIRM';
      if (!byMatter[matterKey]) byMatter[matterKey] = [];
      byMatter[matterKey].push(e);
    }

    const results: RecommendedEntry[] = [];

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

        // Compute value minutes: sum over tasks using normative
        let valueMins = 0;
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
            valueMins += mins;
          } else {
            // bill baseline per distinct artifact/session
            // approximate distinct outputs by counting unique descriptions
            const uniqueDesc = new Set(taskEvents.map(e => (e.description || '').trim()).filter(Boolean));
            const count = Math.max(1, uniqueDesc.size);
            valueMins += baseline * count;
          }
        }

        let recommended = 0;
        switch (policy.mode) {
          case 'actual':
            recommended = actualMins;
            break;
          case 'value':
            recommended = valueMins;
            break;
          case 'blended':
            recommended = Math.round((policy.blendRatio ?? 0.5) * valueMins + (1 - (policy.blendRatio ?? 0.5)) * actualMins);
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
          description: `Value billing for ${matterKey} on ${date}`,
          sourceEvents: dayEvents,
        });
      }
    }

    return results;
  }
}

}
)
)
}
}
}
)
}