/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { AIService } from '../services/ai-service.js';
import { TimeEstimationEngine, WorkEvent, TimeEstimationPolicy, EstimatedEntry } from '../services/time-estimation-engine.js';
import { LocalActivityService } from '../services/local-activity.js';
import { IMAPEmailService, IMAPConfig } from '../services/email-imap.js';
import { WestlawImportService } from '../services/westlaw-import.js';
import { ClioClient } from '../services/clio-client.js';
import { logAgentAction } from '../services/audit-logger.js';

const AnalyzeSchema = z.object({
  action: z.literal('analyze_period'),
  start: z.string().describe('Start ISO datetime'),
  end: z.string().describe('End ISO datetime'),
  sources: z.object({
    local_paths: z.array(z.string()).optional(),
    imap: z.object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      user: z.string(),
      pass: z.string(),
      mailbox: z.string().optional(),
    }).optional(),
    westlaw_csv: z.array(z.string()).optional(),
    clio: z.object({
      api_key: z.string(),
      base_url: z.string().optional(),
      query: z.record(z.string(), z.any()).optional(),
    }).optional(),
  }).default({}),
  policy: z.object({
    mode: z.enum(['actual','estimated','blended']).default('estimated'),
    blendRatio: z.number().optional(),
    normativeRules: z.array(z.object({
      task: z.string(),
      baselineMinutes: z.number(),
    })).optional(),
    aiNormative: z.boolean().optional(),
    minIncrementMinutes: z.number().optional(),
    roundUp: z.boolean().optional(),
    capMultiplier: z.number().optional(),
    includeLexFiatTime: z.boolean().optional(),
    includeToolTime: z.boolean().optional(),
    includeReviewTime: z.boolean().optional(),
    reviewTimeMultiplier: z.number().optional(),
  }).optional(),
}).strict();

const PushSchema = z.object({
  action: z.literal('push_entries'),
  entries: z.array(z.object({
    matterId: z.string(),
    date: z.string(),
    minutes: z.number(),
    description: z.string(),
  })),
  clio: z.object({ api_key: z.string(), base_url: z.string().optional() }),
  rate: z.number().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
}).strict();

const ConfigSchema = z.object({
  action: z.literal('get_config')
}).strict();

const InputSchema = z.discriminatedUnion('action', [AnalyzeSchema, PushSchema, ConfigSchema]);

export const timeValueBilling = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'time_value_billing',
      description: 'Aggregate attorney work across sources and compute TIME ESTIMATES (LexFiat + tools + attorney review/verification). ' +
        'MRPC COMPLIANCE: This provides TIME ESTIMATES, not billing recommendations. Attorneys must bill only for time ACTUALLY SPENT. ' +
        'Value billing (billing based on estimated value rather than actual time) is NOT compliant with MRPC. ' +
        'Optionally push time entries to Clio.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: { type: 'string', enum: ['analyze_period','push_entries','get_config'] },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = InputSchema.parse(args);
      switch (parsed.action) {
        case 'analyze_period':
          return await this.handleAnalyze(parsed);
        case 'push_entries':
          return await this.handlePush(parsed);
        case 'get_config':
          return this.createSuccessResult(JSON.stringify({ status: 'ok' }));
        default:
          return this.createErrorResult('Unsupported action');
      }
    } catch (err) {
      return this.createErrorResult(err instanceof Error ? err.message : String(err));
    }
  }

  public async handleAnalyze(input: z.infer<typeof AnalyzeSchema>) {
    const aiService = new AIService();
    const engine = new TimeEstimationEngine(aiService);

    logAgentAction(
      'time-estimation-tool',
      'analyze_period',
      `Analyzing time period ${input.start} to ${input.end}`,
      undefined,
      { start: input.start, end: input.end, sources: Object.keys(input.sources) }
    );

    const events: WorkEvent[] = [];

    // Local files
    if (input.sources.local_paths && input.sources.local_paths.length) {
      const local = new LocalActivityService(input.sources.local_paths);
      const res = await local.scan(input.start, input.end);
      for (const e of res) {
        events.push({
          source: 'local',
          start: e.mtime,
          end: e.mtime,
          minutes: 0,
          description: `Edited ${e.filePath}`,
        });
      }
    }

    // IMAP
    if (input.sources.imap) {
      const imapConf: IMAPConfig = {
        host: input.sources.imap.host,
        port: input.sources.imap.port,
        secure: input.sources.imap.secure,
        auth: { user: input.sources.imap.user, pass: input.sources.imap.pass },
        mailbox: input.sources.imap.mailbox,
      };
      const imap = new IMAPEmailService(imapConf);
      const emails = await imap.fetchEvents(input.start, input.end);
      for (const m of emails) {
        events.push({
          source: 'email',
          date: m.date.slice(0,10),
          minutes: 6, // minimal reading/compose quantum; policy rounding will adjust
          description: `Email: ${m.subject}`,
        });
      }
    }

    // Westlaw CSV
    if (input.sources.westlaw_csv && input.sources.westlaw_csv.length) {
      const westlaw = new WestlawImportService();
      const logs = await westlaw.import({ files: input.sources.westlaw_csv });
      for (const w of logs) {
        events.push({
          source: 'westlaw',
          date: w.date,
          minutes: w.minutes,
          description: `Westlaw research${w.description ? ': ' + w.description : ''}`,
        });
      }
    }

    // Clio (optional for evidence)
    if (input.sources.clio) {
      const clio = new ClioClient({ apiKey: input.sources.clio.api_key, baseUrl: input.sources.clio.base_url });
      // If query provided, fetch activities
      if (input.sources.clio.query) {
        const data = await clio.list<any>('/activities', input.sources.clio.query);
        // Map a subset if present
        const items = Array.isArray((data as any).data) ? (data as any).data : [];
        for (const a of items) {
          const d = a.date || a.created_at || a.updated_at;
          const qtyHrs = a.quantity || 0; // hours decimal
          const mins = Math.round(Number(qtyHrs) * 60);
          events.push({
            source: 'clio',
            date: d ? new Date(d).toISOString().slice(0,10) : undefined,
            minutes: isFinite(mins) ? mins : 0,
            description: a.description || 'Clio activity',
            matterId: a.matter_id ? String(a.matter_id) : undefined,
            clientId: a.client_id ? String(a.client_id) : undefined,
          });
        }
      }
    }

    const policy: TimeEstimationPolicy = input.policy || {
      mode: 'estimated',
      aiNormative: true,
      minIncrementMinutes: 6,
      roundUp: true,
      includeLexFiatTime: true,
      includeToolTime: true,
      includeReviewTime: true,
      reviewTimeMultiplier: 0.3
    };
    const estimates: EstimatedEntry[] = await engine.estimate(events, policy);

    logAgentAction(
      'time-estimation-tool',
      'analyze_period_complete',
      `Time estimation complete: ${estimates.length} estimates generated`,
      undefined,
      { eventCount: events.length, estimateCount: estimates.length }
    );

    return this.createSuccessResult(JSON.stringify({
      period: { start: input.start, end: input.end },
      counts: { events: events.length, estimates: estimates.length },
      estimates: estimates,
      complianceWarning: 'IMPORTANT: MRPC Compliance - These are TIME ESTIMATES, not billing recommendations. ' +
        'Attorneys must bill only for time ACTUALLY SPENT on tasks. Value billing is NOT compliant with MRPC.',
    }, null, 2));
  }

  public async handlePush(input: z.infer<typeof PushSchema>) {
    const clio = new ClioClient({ apiKey: input.clio.api_key, baseUrl: input.clio.base_url });
    const pushed: any[] = [];
    for (const e of input.entries) {
      const hours = e.minutes / 60;
      const body = {
        matter_id: e.matterId,
        date: e.date,
        quantity: Number(hours.toFixed(2)),
        description: e.description,
        rate: input.rate,
        user_id: input.user_id,
      };
      const resp = await clio.createTimeEntry(body as any);
      pushed.push({ id: resp?.data?.id || null, matter_id: e.matterId, status: 'ok' });
    }
    return this.createSuccessResult(JSON.stringify({ pushed }, null, 2));
  }
})();