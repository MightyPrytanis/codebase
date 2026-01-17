/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

export interface WestlawEvent {
  source: 'westlaw';
  date: string; // ISO date
  minutes: number;
  description?: string;
  clientMatter?: string;
  cost?: number;
}

export interface WestlawImportOptions {
  files: string[];
  columnMap?: {
    date?: string;
    minutes?: string;
    description?: string;
    clientMatter?: string;
    cost?: string;
  };
}

export class WestlawImportService {
  async import(options: WestlawImportOptions): Promise<WestlawEvent[]> {
    const events: WestlawEvent[] = [];

    for (const filePath of options.files) {
      const content = await fs.readFile(filePath, 'utf8');
      const rows: any[] = parse(content, { columns: true, skip_empty_lines: true });
      for (const row of rows) {
        const dateKey = options.columnMap?.date || this.findKey(row, ['Date', 'date']);
        const minutesKey = options.columnMap?.minutes || this.findKey(row, ['Minutes', 'Time (min)', 'Duration (min)']);
        const descKey = options.columnMap?.description || this.findKey(row, ['Description', 'Query', 'Issue', 'Task']);
        const cmKey = options.columnMap?.clientMatter || this.findKey(row, ['Client/Matter', 'Matter', 'Client']);
        const costKey = options.columnMap?.cost || this.findKey(row, ['Cost', 'Charge', 'Amount']);

        const dateVal = dateKey ? row[dateKey] : undefined;
        const minutesVal = minutesKey ? row[minutesKey] : undefined;
        if (!dateVal || !minutesVal) continue;

        const minutes = Number(String(minutesVal).replace(/[^0-9.]/g, ''));
        const isoDate = new Date(dateVal).toISOString().slice(0,10);

        events.push({
          source: 'westlaw',
          date: isoDate,
          minutes: isNaN(minutes) ? 0 : minutes,
          description: descKey && row[descKey] ? row[descKey] : undefined,
          clientMatter: cmKey && row[cmKey] ? row[cmKey] : undefined,
          cost: costKey && row[costKey] ? Number(String(row[costKey]).replace(/[^0-9.]/g, '')) : undefined,
        });
      }
    }

    return events;
  }

  private findKey(obj: any, candidates: string[]): string | undefined {
    const keys = Object.keys(obj);
    for (const c of candidates) {
      const k = keys.find((k) => k.toLowerCase() === c.toLowerCase());
      if (k) return k;
    }
    return undefined;
