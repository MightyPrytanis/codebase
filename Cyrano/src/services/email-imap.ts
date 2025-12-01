/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { ImapFlow, FetchMessageObject } from 'imapflow';

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  mailbox?: string; // default INBOX
}

export interface EmailEvent {
  source: 'email';
  id: string;
  subject: string;
  from: string;
  to: string[];
  date: string; // ISO
  size?: number;
  matterHint?: string;
}

export class IMAPEmailService {
  private config: IMAPConfig;

  constructor(config: IMAPConfig) {
    this.config = config;
  }

  async fetchEvents(startISO: string, endISO: string): Promise<EmailEvent[]> {
    const client = new ImapFlow({ ...this.config });
    await client.connect();
    try {
      const mailbox = this.config.mailbox || 'INBOX';
      await client.mailboxOpen(mailbox);

      const startDate = new Date(startISO);
      const endDate = new Date(endISO);

      // IMAP SEARCH since/before (dates are in UTC midnight granularity)
      const query = {
        since: startDate,
        before: new Date(endDate.getTime() + 24*60*60*1000) // exclusive upper bound
      } as any;

      const events: EmailEvent[] = [];
      const uids = (await client.search(query)) || [];
      for await (const message of client.fetch(uids, { envelope: true, size: true })) {
        const env = (message as FetchMessageObject).envelope!;
        const subj = env.subject || '';
        const from = env.from?.map(a => a.address || '').filter(Boolean).join(', ') || '';
        const to = env.to?.map(a => a.address || '').filter(Boolean) || [];
        const date = env.date instanceof Date ? env.date.toISOString() : (env.date ? String(env.date) : new Date().toISOString());
        events.push({
          source: 'email',
          id: String(message.uid),
          subject: subj,
          from,
          to,
          date,
          size: (message as any).size,
          matterHint: subj
        });
      }
      return events;
    } finally {
      await client.logout();
    }
  }
}
