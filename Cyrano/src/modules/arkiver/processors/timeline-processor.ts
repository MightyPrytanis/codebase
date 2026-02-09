/**
 * Timeline Processor
 * Extracts and organizes temporal events from data
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';

export const TimelineProcessorSchema = z.object({
  data: z.any(),
  source: z.string().optional(),
  sortOrder: z.enum(['chronological', 'reverse-chronological']).default('chronological'),
  includeRelative: z.boolean().default(true), // Include relative dates like "yesterday", "3 days ago"
});

export type TimelineProcessorInput = z.infer<typeof TimelineProcessorSchema>;

export interface TimelineEvent {
  id: string;
  date: Date;
  dateString: string; // Original date string
  dateType: 'absolute' | 'relative' | 'inferred';
  description: string;
  entities: string[]; // Related entities (people, places, etc.)
  confidence: number;
  source?: string;
  context: string; // Surrounding text
  metadata?: Record<string, any>;
}

export interface TimelineProcessorOutput {
  events: TimelineEvent[];
  timeline: {
    earliest: Date | null;
    latest: Date | null;
    duration?: string; // Human-readable duration
    eventCount: number;
  };
  gaps: Array<{
    start: Date;
    end: Date;
    duration: string;
  }>;
  metadata: {
    processingTime: number;
    dataSize: number;
  };
}

export class TimelineProcessor {
  private eventCounter = 0;

  /**
   * Process data and extract timeline
   */
  async process(input: TimelineProcessorInput): Promise<TimelineProcessorOutput> {
    const startTime = Date.now();
    const validated = TimelineProcessorSchema.parse(input);

    // Extract events from different data types
    let events: TimelineEvent[] = [];
    
    if (typeof validated.data === 'string') {
      events = this.extractFromText(validated.data, validated.source);
    } else if (Array.isArray(validated.data)) {
      events = this.extractFromArray(validated.data, validated.source);
    } else if (typeof validated.data === 'object') {
      events = this.extractFromObject(validated.data, validated.source);
    }

    // Filter out relative dates if not requested
    if (!validated.includeRelative) {
      events = events.filter(e => e.dateType !== 'relative');
    }

    // Sort events
    events.sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();
      return validated.sortOrder === 'chronological' ? dateA - dateB : dateB - dateA;
    });

    // Calculate timeline bounds
    const dates = events.map(e => e.date);
    const earliest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const latest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
    
    const duration = earliest && latest 
      ? this.calculateDuration(earliest, latest)
      : undefined;

    // Find gaps in timeline
    const gaps = this.findGaps(events);

    const processingTime = Date.now() - startTime;

    return {
      events,
      timeline: {
        earliest,
        latest,
        duration,
        eventCount: events.length,
      },
      gaps,
      metadata: {
        processingTime,
        dataSize: JSON.stringify(validated.data).length,
      },
    };
  }

  /**
   * Extract events from text
   */
  private extractFromText(text: string, source?: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // Extract absolute dates
    events.push(...this.extractAbsoluteDates(text, source));

    // Extract relative dates
    events.push(...this.extractRelativeDates(text, source));

    // Extract temporal expressions
    events.push(...this.extractTemporalExpressions(text, source));

    return events;
  }

  /**
   * Extract absolute dates (MM/DD/YYYY, Month DD YYYY, etc.)
   */
  private extractAbsoluteDates(text: string, source?: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // MM/DD/YYYY format
    const slashDatePattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
    const slashMatches = Array.from(text.matchAll(slashDatePattern));
    
    for (const match of slashMatches) {
      const dateStr = match[0];
      const date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      
      if (!isNaN(date.getTime())) {
        const context = this.extractContext(text, match.index || 0, 100);
        const description = this.extractEventDescription(context);
        const entities = this.extractEntitiesFromContext(context);
        
        events.push({
          id: this.generateId(),
          date,
          dateString: dateStr,
          dateType: 'absolute',
          description,
          entities,
          confidence: 0.95,
          source,
          context,
        });
      }
    }

    // YYYY-MM-DD format
    const isoDatePattern = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    const isoMatches = Array.from(text.matchAll(isoDatePattern));
    
    for (const match of isoMatches) {
      const dateStr = match[0];
      const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      
      if (!isNaN(date.getTime())) {
        const context = this.extractContext(text, match.index || 0, 100);
        const description = this.extractEventDescription(context);
        const entities = this.extractEntitiesFromContext(context);
        
        events.push({
          id: this.generateId(),
          date,
          dateString: dateStr,
          dateType: 'absolute',
          description,
          entities,
          confidence: 0.95,
          source,
          context,
        });
      }
    }

    // Month DD, YYYY format
    const writtenDatePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
    const writtenMatches = Array.from(text.matchAll(writtenDatePattern));
    
    for (const match of writtenMatches) {
      const dateStr = match[0];
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const month = monthNames.indexOf(match[1].toLowerCase());
      const date = new Date(parseInt(match[3]), month, parseInt(match[2]));
      
      if (!isNaN(date.getTime())) {
        const context = this.extractContext(text, match.index || 0, 100);
        const description = this.extractEventDescription(context);
        const entities = this.extractEntitiesFromContext(context);
        
        events.push({
          id: this.generateId(),
          date,
          dateString: dateStr,
          dateType: 'absolute',
          description,
          entities,
          confidence: 0.95,
          source,
          context,
        });
      }
    }

    return events;
  }

  /**
   * Extract relative dates (yesterday, last week, 3 days ago, etc.)
   */
  private extractRelativeDates(text: string, source?: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const now = new Date();

    // Yesterday, today, tomorrow
    const simpleRelativePattern = /\b(yesterday|today|tomorrow)\b/gi;
    const simpleMatches = Array.from(text.matchAll(simpleRelativePattern));
    
    for (const match of simpleMatches) {
      const term = match[1].toLowerCase();
      const date = new Date(now);
      
      if (term === 'yesterday') {
        date.setDate(date.getDate() - 1);
      } else if (term === 'tomorrow') {
        date.setDate(date.getDate() + 1);
      }
      
      const context = this.extractContext(text, match.index || 0, 100);
      const description = this.extractEventDescription(context);
      const entities = this.extractEntitiesFromContext(context);
      
      events.push({
        id: this.generateId(),
        date,
        dateString: match[0],
        dateType: 'relative',
        description,
        entities,
        confidence: 0.8,
        source,
        context,
      });
    }

    // X days/weeks/months/years ago
    const agoPattern = /\b(\d+)\s+(days?|weeks?|months?|years?)\s+ago\b/gi;
    const agoMatches = Array.from(text.matchAll(agoPattern));
    
    for (const match of agoMatches) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const date = new Date(now);
      
      if (unit.startsWith('day')) {
        date.setDate(date.getDate() - amount);
      } else if (unit.startsWith('week')) {
        date.setDate(date.getDate() - (amount * 7));
      } else if (unit.startsWith('month')) {
        date.setMonth(date.getMonth() - amount);
      } else if (unit.startsWith('year')) {
        date.setFullYear(date.getFullYear() - amount);
      }
      
      const context = this.extractContext(text, match.index || 0, 100);
      const description = this.extractEventDescription(context);
      const entities = this.extractEntitiesFromContext(context);
      
      events.push({
        id: this.generateId(),
        date,
        dateString: match[0],
        dateType: 'relative',
        description,
        entities,
        confidence: 0.75,
        source,
        context,
      });
    }

    // Last/next week/month/year
    const lastNextPattern = /\b(last|next)\s+(week|month|year)\b/gi;
    const lastNextMatches = Array.from(text.matchAll(lastNextPattern));
    
    for (const match of lastNextMatches) {
      const direction = match[1].toLowerCase();
      const unit = match[2].toLowerCase();
      const date = new Date(now);
      const multiplier = direction === 'last' ? -1 : 1;
      
      if (unit === 'week') {
        date.setDate(date.getDate() + (7 * multiplier));
      } else if (unit === 'month') {
        date.setMonth(date.getMonth() + multiplier);
      } else if (unit === 'year') {
        date.setFullYear(date.getFullYear() + multiplier);
      }
      
      const context = this.extractContext(text, match.index || 0, 100);
      const description = this.extractEventDescription(context);
      const entities = this.extractEntitiesFromContext(context);
      
      events.push({
        id: this.generateId(),
        date,
        dateString: match[0],
        dateType: 'relative',
        description,
        entities,
        confidence: 0.7,
        source,
        context,
      });
    }

    return events;
  }

  /**
   * Extract temporal expressions (on, before, after, during, etc.)
   */
  private extractTemporalExpressions(text: string, source?: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // "on [date]", "before [date]", "after [date]"
    const temporalPattern = /\b(on|before|after|during|by)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi;
    const matches = Array.from(text.matchAll(temporalPattern));
    
    for (const match of matches) {
      const preposition = match[1].toLowerCase();
      const dateStr = match[2];
      
      // Parse date
      const dateParts = dateStr.match(/([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
      if (!dateParts) continue;
      
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const month = monthNames.indexOf(dateParts[1].toLowerCase());
      const date = new Date(parseInt(dateParts[3]), month, parseInt(dateParts[2]));
      
      if (isNaN(date.getTime())) continue;
      
      const context = this.extractContext(text, match.index || 0, 100);
      const description = `${preposition} ${this.extractEventDescription(context)}`;
      const entities = this.extractEntitiesFromContext(context);
      
      events.push({
        id: this.generateId(),
        date,
        dateString: match[0],
        dateType: 'absolute',
        description,
        entities,
        confidence: 0.85,
        source,
        context,
        metadata: { temporalPreposition: preposition },
      });
    }

    return events;
  }

  /**
   * Extract events from array of data
   */
  private extractFromArray(data: any[], source?: string): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        // Look for date fields
        const dateFields = ['date', 'timestamp', 'created', 'updated', 'occurred', 'datetime'];
        
        for (const field of dateFields) {
          if (item[field]) {
            const date = new Date(item[field]);
            if (!isNaN(date.getTime())) {
              events.push({
                id: this.generateId(),
                date,
                dateString: item[field].toString(),
                dateType: 'absolute',
                description: item.description || item.text || item.title || 'Event',
                entities: this.extractEntitiesFromObject(item),
                confidence: 0.9,
                source: source || item.source,
                context: JSON.stringify(item).slice(0, 200),
                metadata: item,
              });
              break; // Only use first date field found
            }
          }
        }
      }
    }

    return events;
  }

  /**
   * Extract events from object
   */
  private extractFromObject(data: any, source?: string): TimelineEvent[] {
    // Convert object to array and process
    return this.extractFromArray([data], source);
  }

  /**
   * Extract context around position
   */
  private extractContext(text: string, position: number, length: number): string {
    const start = Math.max(0, position - length);
    const end = Math.min(text.length, position + length);
    return text.slice(start, end).trim();
  }

  /**
   * Extract event description from context
   */
  private extractEventDescription(context: string): string {
    // Extract sentence containing the date
    const sentences = context.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.trim().length > 10) {
        return sentence.trim();
      }
    }
    
    return context.slice(0, 100).trim();
  }

  /**
   * Extract entities from context
   */
  private extractEntitiesFromContext(context: string): string[] {
    const entities: string[] = [];
    
    // Extract capitalized names (simple approach)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g;
    const matches = Array.from(context.matchAll(namePattern));
    
    for (const match of matches) {
      entities.push(match[0]);
    }
    
    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Extract entities from object
   */
  private extractEntitiesFromObject(obj: any): string[] {
    const entities: string[] = [];
    const fields = ['person', 'people', 'entity', 'entities', 'parties', 'name', 'names'];
    
    for (const field of fields) {
      if (obj[field]) {
        if (Array.isArray(obj[field])) {
          entities.push(...obj[field].map(String));
        } else {
          entities.push(String(obj[field]));
        }
      }
    }
    
    return entities;
  }

  /**
   * Find gaps in timeline (periods with no events)
   */
  private findGaps(events: TimelineEvent[]): Array<{
    start: Date;
    end: Date;
    duration: string;
  }> {
    if (events.length < 2) return [];

    const gaps: Array<{ start: Date; end: Date; duration: string }> = [];
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      const gapMs = next.date.getTime() - current.date.getTime();
      const gapDays = gapMs / (1000 * 60 * 60 * 24);
      
      // Only report gaps of 7+ days
      if (gapDays >= 7) {
        gaps.push({
          start: current.date,
          end: next.date,
          duration: this.calculateDuration(current.date, next.date),
        });
      }
    }

    return gaps;
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 || parts.length === 0) {
      parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return `event-${Date.now()}-${++this.eventCounter}`;
  }
}

export const timelineProcessor = new TimelineProcessor();

