/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Drafting Mode Registry
 * Manages all supported drafting modes and their configurations
 */

export type DraftingModeId = 
  | 'auto-draft'
  | 'summarize-discuss-draft'
  | 'competitive'
  | 'collaborative';

export interface DraftingMode {
  id: DraftingModeId;
  name: string;
  description: string;
  enabled: boolean;
}

export const DRAFTING_MODES: Record<DraftingModeId, DraftingMode> = {
  'auto-draft': {
    id: 'auto-draft',
    name: 'Auto-Draft for Review',
    description: 'Automatically generate draft responses for attorney review',
    enabled: true,
  },
  'summarize-discuss-draft': {
    id: 'summarize-discuss-draft',
    name: 'Summarize → Discuss → Draft',
    description: 'Generate summary, allow Q&A, then draft on command',
    enabled: true,
  },
  'competitive': {
    id: 'competitive',
    name: 'Competitive Drafting',
    description: 'Generate multiple strategies/providers and compare outputs',
    enabled: false, // Placeholder for future implementation
  },
  'collaborative': {
    id: 'collaborative',
    name: 'Collaborative Drafting',
    description: 'Stepwise drafting with user checkpoints',
    enabled: false, // Placeholder for future implementation
  },
};

/**
 * Get all enabled drafting modes
 */
export function getEnabledModes(): DraftingMode[] {
  return Object.values(DRAFTING_MODES).filter(mode => mode.enabled);
}

/**
 * Get a specific drafting mode by ID
 */
export function getDraftingMode(id: DraftingModeId): DraftingMode | undefined {
  return DRAFTING_MODES[id];
}

/**
 * Check if a drafting mode is available
 */
export function isModeAvailable(id: DraftingModeId): boolean {
  const mode = DRAFTING_MODES[id];
  return mode?.enabled ?? false;
