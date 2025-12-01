/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Drafting Mode Configuration System
 * Manages user preferences for drafting modes at different levels
 */

import { DraftingModeId } from './drafting-mode-registry';

export interface DraftingModeConfig {
  global?: DraftingModeId;
  perMatter?: Record<string, DraftingModeId>;
  perDocumentType?: Record<string, DraftingModeId>;
}

/**
 * Get selected drafting mode for a given context
 * Priority: per-document-type > per-matter > global > default
 */
export function getDraftingMode(
  config: DraftingModeConfig,
  matterId?: string,
  documentType?: string
): DraftingModeId {
  // Check per-document-type override
  if (documentType && config.perDocumentType?.[documentType]) {
    return config.perDocumentType[documentType];
  }

  // Check per-matter override
  if (matterId && config.perMatter?.[matterId]) {
    return config.perMatter[matterId];
  }

  // Use global default
  if (config.global) {
    return config.global;
  }

  // Fallback to auto-draft
  return 'auto-draft';
}

/**
 * Set global drafting mode
 */
export function setGlobalDraftingMode(
  config: DraftingModeConfig,
  mode: DraftingModeId
): DraftingModeConfig {
  return {
    ...config,
    global: mode,
  };
}

/**
 * Set per-matter drafting mode
 */
export function setMatterDraftingMode(
  config: DraftingModeConfig,
  matterId: string,
  mode: DraftingModeId
): DraftingModeConfig {
  return {
    ...config,
    perMatter: {
      ...config.perMatter,
      [matterId]: mode,
    },
  };
}

/**
 * Set per-document-type drafting mode
 */
export function setDocumentTypeDraftingMode(
  config: DraftingModeConfig,
  documentType: string,
  mode: DraftingModeId
): DraftingModeConfig {
  return {
    ...config,
    perDocumentType: {
      ...config.perDocumentType,
      [documentType]: mode,
    },
  };
}

