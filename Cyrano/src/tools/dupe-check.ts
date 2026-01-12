/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const DupeCheckSchema = z.object({
  new_entries: z.array(z.any()).describe('New time entries to check'),
  existing_entries: z.array(z.any()).describe('Existing time entries to compare against'),
  similarity_threshold: z.number().default(0.8).describe('Similarity threshold (0-1) for duplicate detection'),
  allow_repeated_tasks: z.boolean().default(true).describe('Allow naturally repeated tasks (calls, research)'),
});

export const dupeCheck = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'dupe_check',
      description: 'Check for potential duplicate time entries to prevent overbilling while recognizing legitimate repeated tasks',
      inputSchema: {
        type: 'object' as const,
        properties: {
          new_entries: {
            type: 'array',
            items: { type: 'object' },
            description: 'New time entries to check',
          },
          existing_entries: {
            type: 'array',
            items: { type: 'object' },
            description: 'Existing time entries to compare against',
          },
          similarity_threshold: {
            type: 'number',
            default: 0.8,
            description: 'Similarity threshold (0-1) for duplicate detection',
          },
          allow_repeated_tasks: {
            type: 'boolean',
            default: true,
            description: 'Allow naturally repeated tasks (calls, research)',
          },
        },
        required: ['new_entries', 'existing_entries'],
      },
    };
  }

  public calculateSimilarity(entry1: any, entry2: any): number {
    // Simple similarity calculation based on description and date
    let similarity = 0;
    const factors = 0;
    
    // Date similarity (exact match = 1.0, same day = 0.5)
    if (entry1.date === entry2.date) {
      similarity += 0.4;
    } else {
      const date1 = new Date(entry1.date);
      const date2 = new Date(entry2.date);
      const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        similarity += 0.2; // Same or adjacent day
      }
    }
    
    // Description similarity (simple string matching)
    const desc1 = (entry1.description || '').toLowerCase();
    const desc2 = (entry2.description || '').toLowerCase();
    if (desc1 === desc2) {
      similarity += 0.6;
    } else if (desc1.includes(desc2) || desc2.includes(desc1)) {
      similarity += 0.4;
    } else {
      // Word overlap
      const words1 = desc1.split(/\s+/);
      const words2 = desc2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      if (words1.length > 0) {
        similarity += (commonWords.length / Math.max(words1.length, words2.length)) * 0.3;
      }
    }
    
    // Hours similarity
    const hours1 = entry1.hours || 0;
    const hours2 = entry2.hours || 0;
    if (hours1 > 0 && hours2 > 0) {
      const hoursDiff = Math.abs(hours1 - hours2) / Math.max(hours1, hours2);
      similarity += (1 - hoursDiff) * 0.1;
    }
    
    return Math.min(similarity, 1.0);
  }

  public isRepeatedTask(description: string): boolean {
    const repeatedKeywords = ['call', 'phone', 'research', 'review', 'draft', 'email'];
    const desc = description.toLowerCase();
    return repeatedKeywords.some(keyword => desc.includes(keyword));
  }

  async execute(args: any) {
    try {
      const { new_entries, existing_entries, similarity_threshold, allow_repeated_tasks } = DupeCheckSchema.parse(args);
      
      const potentialDuplicates: any[] = [];
      const warnings: any[] = [];
      
      new_entries.forEach((newEntry: any, newIndex: number) => {
        existing_entries.forEach((existingEntry: any, existingIndex: number) => {
          const similarity = this.calculateSimilarity(newEntry, existingEntry);
          
          if (similarity >= similarity_threshold) {
            // Check if it's a naturally repeated task
            const isRepeated = allow_repeated_tasks && 
              (this.isRepeatedTask(newEntry.description || '') || 
               this.isRepeatedTask(existingEntry.description || ''));
            
            if (!isRepeated) {
              potentialDuplicates.push({
                new_entry_index: newIndex,
                existing_entry_index: existingIndex,
                similarity,
                new_entry: newEntry,
                existing_entry: existingEntry,
                reason: 'High similarity in description, date, and hours',
              });
            } else {
              warnings.push({
                new_entry_index: newIndex,
                existing_entry_index: existingIndex,
                similarity,
                note: 'Similar entry found, but appears to be a naturally repeated task (calls, research, etc.)',
              });
            }
          }
        });
      });
      
      // Check for same-day duplicates
      const sameDayEntries = new Map<string, any[]>();
      new_entries.forEach((entry: any) => {
        const date = entry.date;
        if (!sameDayEntries.has(date)) {
          sameDayEntries.set(date, []);
        }
        sameDayEntries.get(date)!.push(entry);
      });
      
      sameDayEntries.forEach((entries, date) => {
        if (entries.length > 1) {
          // Check for duplicates within new entries
          for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
              const similarity = this.calculateSimilarity(entries[i], entries[j]);
              if (similarity >= similarity_threshold) {
                const isRepeated = allow_repeated_tasks && 
                  (this.isRepeatedTask(entries[i].description || '') || 
                   this.isRepeatedTask(entries[j].description || ''));
                
                if (!isRepeated) {
                  potentialDuplicates.push({
                    new_entry_index: i,
                    new_entry_index_2: j,
                    similarity,
                    new_entry: entries[i],
                    duplicate_entry: entries[j],
                    reason: 'Duplicate within new entries for same day',
                  });
                }
              }
            }
          }
        }
      });
      
      const result = {
        duplicates_found: potentialDuplicates.length,
        potential_duplicates: potentialDuplicates,
        warnings: warnings.length > 0 ? warnings : undefined,
        summary: {
          total_new_entries: new_entries.length,
          total_existing_entries: existing_entries.length,
          high_risk_duplicates: potentialDuplicates.filter(d => d.similarity >= 0.9).length,
          medium_risk_duplicates: potentialDuplicates.filter(d => d.similarity >= 0.8 && d.similarity < 0.9).length,
        },
        note: 'Review potential duplicates before finalizing entries. Some tasks (calls, research) may legitimately repeat.',
      };
      
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Error in dupe_check: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
})();

)
}
}
}
}
)
}