/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Pattern Learning Service
 * 
 * Learns from historical time entries (30+ days) to identify patterns:
 * - Average hours per day/week
 * - Day-of-week patterns
 * - Standard deviation
 * - Typical work patterns
 * 
 * Provides pattern data to gap detection for more accurate gap identification.
 */

export interface TimeEntry {
  date: string; // YYYY-MM-DD
  hours: number;
  matterId?: string;
  userId: string;
}

export interface LearnedPattern {
  userId: string;
  averageHoursPerDay: number;
  averageHoursPerWeek: number;
  dayOfWeekPatterns: {
    [dayOfWeek: string]: {
      average: number;
      standardDeviation: number;
      count: number;
    };
  };
  standardDeviation: number;
  totalDaysAnalyzed: number;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
}

// In-memory storage (TODO: Replace with database persistence)
const learnedPatterns = new Map<string, LearnedPattern>();
const timeEntryHistory = new Map<string, TimeEntry[]>(); // userId -> entries

/**
 * Add time entries to history for pattern learning
 */
export async function addTimeEntries(userId: string, entries: TimeEntry[]): Promise<void> {
  const existing = timeEntryHistory.get(userId) || [];
  const combined = [...existing, ...entries];
  
  // Sort by date
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  // Remove duplicates (same date)
  const unique = combined.reduce((acc, entry) => {
    const existingIndex = acc.findIndex(e => e.date === entry.date);
    if (existingIndex >= 0) {
      acc[existingIndex] = entry; // Update existing
    } else {
      acc.push(entry);
    }
    return acc;
  }, [] as TimeEntry[]);
  
  timeEntryHistory.set(userId, unique);
  
  // Trigger pattern learning if we have 30+ days of data
  if (unique.length >= 30) {
    await learnPatterns(userId);
  }
}

/**
 * Learn patterns from historical time entries (requires 30+ days)
 */
export async function learnPatterns(userId: string): Promise<LearnedPattern | null> {
  const entries = timeEntryHistory.get(userId) || [];
  
  if (entries.length < 30) {
    return null; // Not enough data
  }
  
  // Calculate averages
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const averageHoursPerDay = totalHours / entries.length;
  const averageHoursPerWeek = averageHoursPerDay * 7;
  
  // Calculate standard deviation
  const variance = entries.reduce((sum, e) => {
    const diff = e.hours - averageHoursPerDay;
    return sum + (diff * diff);
  }, 0) / entries.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate day-of-week patterns
  const dayOfWeekPatterns: { [key: string]: { hours: number[]; count: number } } = {};
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayName = dayNames[date.getDay()];
    
    if (!dayOfWeekPatterns[dayName]) {
      dayOfWeekPatterns[dayName] = { hours: [], count: 0 };
    }
    
    dayOfWeekPatterns[dayName].hours.push(entry.hours);
    dayOfWeekPatterns[dayName].count++;
  });
  
  // Calculate averages and standard deviations for each day
  const dayPatterns: LearnedPattern['dayOfWeekPatterns'] = {};
  dayNames.forEach(dayName => {
    const data = dayOfWeekPatterns[dayName];
    if (data && data.hours.length > 0) {
      const avg = data.hours.reduce((sum, h) => sum + h, 0) / data.hours.length;
      const dayVariance = data.hours.reduce((sum, h) => {
        const diff = h - avg;
        return sum + (diff * diff);
      }, 0) / data.hours.length;
      const dayStdDev = Math.sqrt(dayVariance);
      
      dayPatterns[dayName] = {
        average: avg,
        standardDeviation: dayStdDev,
        count: data.count,
      };
    }
  });
  
  // Get date range
  const dates = entries.map(e => e.date).sort();
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const pattern: LearnedPattern = {
    userId,
    averageHoursPerDay,
    averageHoursPerWeek,
    dayOfWeekPatterns: dayPatterns,
    standardDeviation,
    totalDaysAnalyzed: entries.length,
    dateRange: { start, end },
    lastUpdated: new Date().toISOString(),
  };
  
  learnedPatterns.set(userId, pattern);
  return pattern;
}

/**
 * Get learned patterns for a user
 */
export async function getLearnedPatterns(userId: string): Promise<LearnedPattern | null> {
  return learnedPatterns.get(userId) || null;
}

/**
 * Check if user has enough data for pattern learning (30+ days)
 */
export async function hasEnoughDataForLearning(userId: string): Promise<boolean> {
  const entries = timeEntryHistory.get(userId) || [];
  return entries.length >= 30;
}

/**
 * Get expected hours for a specific day based on learned patterns
 */
export async function getExpectedHoursForDay(userId: string, date: string): Promise<number | null> {
  const pattern = await getLearnedPatterns(userId);
  if (!pattern) {
    return null;
  }
  
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayPattern = pattern.dayOfWeekPatterns[dayOfWeek];
  
  if (dayPattern) {
    return dayPattern.average;
  }
  
  // Fall back to overall average
  return pattern.averageHoursPerDay;
}

/**
 * Get minimum expected hours for a day (average - 1 standard deviation)
 */
export async function getMinimumExpectedHoursForDay(userId: string, date: string): Promise<number | null> {
  const pattern = await getLearnedPatterns(userId);
  if (!pattern) {
    return null;
  }
  
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayPattern = pattern.dayOfWeekPatterns[dayOfWeek];
  
  if (dayPattern) {
    return Math.max(0, dayPattern.average - dayPattern.standardDeviation);
  }
  
  // Fall back to overall average - std dev
  return Math.max(0, pattern.averageHoursPerDay - pattern.standardDeviation);
}

/**
 * Schedule periodic pattern updates (called by background job)
 */
export async function schedulePatternUpdate(userId: string): Promise<void> {
  // This would be called by a cron job or background worker
  // For now, just trigger learning if enough data exists
  const entries = timeEntryHistory.get(userId) || [];
  if (entries.length >= 30) {
    await learnPatterns(userId);
  }
}

/**
 * Clear pattern data for a user (for testing or reset)
 */
export async function clearPatternData(userId: string): Promise<void> {
  learnedPatterns.delete(userId);
  timeEntryHistory.delete(userId);
}
