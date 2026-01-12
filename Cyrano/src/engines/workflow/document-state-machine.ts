/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Document Workflow State Machine
 * Shared state machine for all document workflow processes
 */

export type DocumentState =
  | 'ingested'
  | 'classified'
  | 'analysis_pending'
  | 'analysis_complete'
  | 'mode_selected'
  | 'draft_pending'
  | 'draft_ready'
  | 'attorney_review_pending'
  | 'complete';

export interface StateTransition {
  from: DocumentState;
  to: DocumentState;
  timestamp: string;
  userId?: string;
  reason?: string;
}

export interface DocumentWorkflowState {
  documentId: string;
  currentState: DocumentState;
  history: StateTransition[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<DocumentState, DocumentState[]> = {
  ingested: ['classified'],
  classified: ['analysis_pending'],
  analysis_pending: ['analysis_complete'],
  analysis_complete: ['mode_selected'],
  mode_selected: ['draft_pending'],
  draft_pending: ['draft_ready'],
  draft_ready: ['attorney_review_pending'],
  attorney_review_pending: ['complete'],
  complete: [], // Terminal state
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: DocumentState, to: DocumentState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get next possible states from current state
 */
export function getNextStates(current: DocumentState): DocumentState[] {
  return VALID_TRANSITIONS[current] || [];
}

/**
 * Create a state transition
 */
export function createTransition(
  from: DocumentState,
  to: DocumentState,
  userId?: string,
  reason?: string
): StateTransition {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid state transition: ${from} -> ${to}`);
  }

  return {
    from,
    to,
    timestamp: new Date().toISOString(),
    userId,
    reason,
  };
}

/**
 * Map state to dashboard count category
 */
export function getStateCategory(state: DocumentState): string | null {
  const categoryMap: Record<DocumentState, string | null> = {
    ingested: 'intake',
    classified: 'intake',
    analysis_pending: 'analysis',
    analysis_complete: 'analysis',
    mode_selected: null,
    draft_pending: 'draft-prep',
    draft_ready: 'draft-prep',
    attorney_review_pending: 'attorney-review',
    complete: null,
  };

  return categoryMap[state] || null;

}
}
}