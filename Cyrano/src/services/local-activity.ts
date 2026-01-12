/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface LocalActivityEvent {
  source: 'local';
  filePath: string;
  action: 'created' | 'modified';
  mtime: string; // ISO
  size: number;
}

export class LocalActivityService {
  constructor(private roots: string[]) {}

  async scan(startISO: string, endISO: string): Promise<LocalActivityEvent[]> {
    const events: LocalActivityEvent[] = [];
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();

    for (const root of this.roots) {
      await this.walk(root, async (file, stat) => {
        const mtimeMs = stat.mtimeMs;
        if (mtimeMs >= start && mtimeMs <= end) {
          events.push({
            source: 'local',
            filePath: file,
            action: 'modified',
            mtime: new Date(mtimeMs).toISOString(),
            size: stat.size,
          });
        }
      });
    }

    return events;
  }

  private async walk(dir: string, onFile: (filePath: string, stat: any) => Promise<void>): Promise<void> {
    let entries: any[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walk(full, onFile);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(full);
          await onFile(full, stat);
        } catch (_) {
          // ignore

}
}
}
}
}