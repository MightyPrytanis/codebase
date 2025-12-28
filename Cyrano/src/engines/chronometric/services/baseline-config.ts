/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Baseline Configuration Service
 * 
 * Stores and retrieves user baseline configuration for time tracking:
 * - Minimum hours per week/day
 * - Typical schedule (day-of-week patterns)
 * - Off-days management
 * 
 * Note: Currently uses in-memory storage. Database persistence will be added
 * when Chronometric Engine database migration is completed.
 */

export interface BaselineConfig {
  userId: string;
  minimumHoursPerWeek: number;
  minimumHoursPerDay?: number; // Optional, can be calculated from weekly
  typicalSchedule?: {
    [dayOfWeek: string]: number; // e.g., { 'monday': 8, 'tuesday': 8, ... }
  };
  offDays?: string[]; // Array of dates (YYYY-MM-DD) when user is off
  useBaselineUntilDataAvailable: boolean; // Use baseline until enough historical data (30+ days)
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (TODO: Replace with database persistence)
const baselineConfigs = new Map<string, BaselineConfig>();

/**
 * Get baseline configuration for a user
 */
export async function getBaselineConfig(userId: string): Promise<BaselineConfig | null> {
  return baselineConfigs.get(userId) || null;
}

/**
 * Save or update baseline configuration for a user
 */
export async function saveBaselineConfig(config: Omit<BaselineConfig, 'createdAt' | 'updatedAt'>): Promise<BaselineConfig> {
  const existing = baselineConfigs.get(config.userId);
  const now = new Date().toISOString();
  
  const baselineConfig: BaselineConfig = {
    ...config,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  
  // Calculate minimumHoursPerDay if not provided
  if (!baselineConfig.minimumHoursPerDay) {
    baselineConfig.minimumHoursPerDay = baselineConfig.minimumHoursPerWeek / 5; // Assume 5-day work week
  }
  
  baselineConfigs.set(config.userId, baselineConfig);
  return baselineConfig;
}

/**
 * Delete baseline configuration for a user
 */
export async function deleteBaselineConfig(userId: string): Promise<boolean> {
  return baselineConfigs.delete(userId);
}

/**
 * Check if user has baseline configured
 */
export async function hasBaselineConfig(userId: string): Promise<boolean> {
  return baselineConfigs.has(userId);
}

/**
 * Get minimum hours for a specific day based on baseline
 */
export async function getMinimumHoursForDay(userId: string, dayOfWeek: string): Promise<number> {
  const config = await getBaselineConfig(userId);
  if (!config) {
    return 0; // No baseline, no minimum
  }
  
  // Check if day has specific hours in typical schedule
  if (config.typicalSchedule && config.typicalSchedule[dayOfWeek.toLowerCase()]) {
    return config.typicalSchedule[dayOfWeek.toLowerCase()];
  }
  
  // Fall back to calculated daily minimum
  return config.minimumHoursPerDay || config.minimumHoursPerWeek / 5;
}

/**
 * Check if a date is an off-day
 */
export async function isOffDay(userId: string, date: string): Promise<boolean> {
  const config = await getBaselineConfig(userId);
  if (!config || !config.offDays) {
    return false;
  }
  
  return config.offDays.includes(date);
}

/**
 * Add an off-day
 */
export async function addOffDay(userId: string, date: string): Promise<BaselineConfig | null> {
  const config = await getBaselineConfig(userId);
  if (!config) {
    return null;
  }
  
  const offDays = config.offDays || [];
  if (!offDays.includes(date)) {
    offDays.push(date);
  }
  
  return await saveBaselineConfig({
    ...config,
    offDays,
  });
}

/**
 * Remove an off-day
 */
export async function removeOffDay(userId: string, date: string): Promise<BaselineConfig | null> {
  const config = await getBaselineConfig(userId);
  if (!config || !config.offDays) {
    return config;
  }
  
  const offDays = config.offDays.filter(d => d !== date);
  
  return await saveBaselineConfig({
    ...config,
    offDays,
  });
}

